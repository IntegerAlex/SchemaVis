import { z } from 'zod';
import type { DBIndex } from './db-index';
import { dbIndexSchema } from './db-index';
import type { DBField } from './db-field';
import { dbFieldSchema } from './db-field';
import type { DBRelationship } from './db-relationship';
import { deepCopy } from '../utils';

export const MAX_TABLE_SIZE = 450;
export const MID_TABLE_SIZE = 337;
export const MIN_TABLE_SIZE = 224;
export const TABLE_MINIMIZED_FIELDS = 10;

export interface DBTable {
  id: string;
  name: string;
  schema?: string | null;
  x: number;
  y: number;
  fields: DBField[];
  indexes: DBIndex[];
  color: string;
  isView: boolean;
  isMaterializedView?: boolean | null;
  createdAt: number;
  width?: number | null;
  comments?: string | null;
  order?: number | null;
  expanded?: boolean | null;
  parentAreaId?: string | null;
}

export const dbTableSchema: z.ZodType<DBTable> = z.object({
  id: z.string(),
  name: z.string(),
  schema: z.string().or(z.null()).optional(),
  x: z.number(),
  y: z.number(),
  fields: z.array(dbFieldSchema),
  indexes: z.array(dbIndexSchema),
  color: z.string(),
  isView: z.boolean(),
  isMaterializedView: z.boolean().or(z.null()).optional(),
  createdAt: z.number(),
  width: z.number().or(z.null()).optional(),
  comments: z.string().or(z.null()).optional(),
  order: z.number().or(z.null()).optional(),
  expanded: z.boolean().or(z.null()).optional(),
  parentAreaId: z.string().or(z.null()).optional(),
});

export const adjustTablePositions = ({
  relationships: inputRelationships,
  tables: inputTables,
}: {
  tables: DBTable[];
  relationships: DBRelationship[];
}): DBTable[] => {
  const tables = deepCopy(inputTables);
  const relationships = deepCopy(inputRelationships);

  const defaultTableWidth = 200;
  const defaultTableHeight = 300;
  const gapX = 100;
  const gapY = 100;
  const startX = 100;
  const startY = 100;

  // Create a map of table connections
  const tableConnections = new Map<string, Set<string>>();
  relationships.forEach((rel) => {
    if (!tableConnections.has(rel.sourceTableId)) {
      tableConnections.set(rel.sourceTableId, new Set());
    }
    if (!tableConnections.has(rel.targetTableId)) {
      tableConnections.set(rel.targetTableId, new Set());
    }
    tableConnections.get(rel.sourceTableId)!.add(rel.targetTableId);
    tableConnections.get(rel.targetTableId)!.add(rel.sourceTableId);
  });

  // Separate tables into connected and isolated
  const connectedTables: DBTable[] = [];
  const isolatedTables: DBTable[] = [];

  tables.forEach((table) => {
    if (
      tableConnections.has(table.id) &&
      tableConnections.get(table.id)!.size > 0
    ) {
      connectedTables.push(table);
    } else {
      isolatedTables.push(table);
    }
  });

  // Sort connected tables by number of connections
  connectedTables.sort(
    (a, b) =>
      (tableConnections.get(b.id)?.size || 0) -
      (tableConnections.get(a.id)?.size || 0)
  );

  const positionedTables = new Set<string>();
  const tablePositions = new Map<string, { x: number; y: number }>();

  const getTableWidthAndHeight = (tableId: string): {
    width: number;
    height: number;
  } => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return { width: defaultTableWidth, height: defaultTableHeight };
    return { width: table.width || MIN_TABLE_SIZE, height: calcTableHeight(table) };
  };

  const isOverlapping = (
    x: number,
    y: number,
    currentTableId: string
  ): boolean => {
    for (const [tableId, pos] of tablePositions) {
      if (tableId === currentTableId) continue;
      const { width, height } = getTableWidthAndHeight(tableId);
      if (
        Math.abs(x - pos.x) < width + gapX &&
        Math.abs(y - pos.y) < height + gapY
      ) {
        return true;
      }
    }
    return false;
  };

  const findNonOverlappingPosition = (
    baseX: number,
    baseY: number,
    tableId: string
  ): { x: number; y: number } => {
    const { width, height } = getTableWidthAndHeight(tableId);
    const spiralStep = Math.max(width, height) / 2;
    let angle = 0;
    let radius = 0;
    let iterations = 0;
    const maxIterations = 1000;

    while (iterations < maxIterations) {
      const x = baseX + radius * Math.cos(angle);
      const y = baseY + radius * Math.sin(angle);
      if (!isOverlapping(x, y, tableId)) {
        return { x, y };
      }
      angle += Math.PI / 4;
      if (angle >= 2 * Math.PI) {
        angle = 0;
        radius += spiralStep;
      }
      iterations++;
    }

    return {
      x: baseX + radius * Math.cos(angle),
      y: baseY + radius * Math.sin(angle),
    };
  };

  const positionTable = (
    table: DBTable,
    baseX: number,
    baseY: number
  ) => {
    if (positionedTables.has(table.id)) return;

    const { x, y } = findNonOverlappingPosition(baseX, baseY, table.id);
    table.x = x;
    table.y = y;
    tablePositions.set(table.id, { x: table.x, y: table.y });
    positionedTables.add(table.id);

    // Position connected tables
    const connectedTableIds = tableConnections.get(table.id) || new Set();
    let angle = 0;
    const angleStep = (2 * Math.PI) / Math.max(connectedTableIds.size, 1);

    connectedTableIds.forEach((connectedTableId) => {
      if (!positionedTables.has(connectedTableId)) {
        const connectedTable = tables.find((t) => t.id === connectedTableId);
        if (connectedTable) {
          const { width: tableWidth, height: tableHeight } =
            getTableWidthAndHeight(table.id);
          const { width: connectedTableWidth, height: connectedTableHeight } =
            getTableWidthAndHeight(connectedTableId);
          const avgWidth = (tableWidth + connectedTableWidth) / 2;
          const avgHeight = (tableHeight + connectedTableHeight) / 2;

          const newX = x + Math.cos(angle) * (avgWidth + gapX * 2);
          const newY = y + Math.sin(angle) * (avgHeight + gapY * 2);
          positionTable(connectedTable, newX, newY);
          angle += angleStep;
        }
      }
    });
  };

  // Position connected tables
  if (connectedTables.length < 100) {
    connectedTables.forEach((table, index) => {
      if (!positionedTables.has(table.id)) {
        const row = Math.floor(index / 6);
        const col = index % 6;
        const { width: tableWidth, height: tableHeight } =
          getTableWidthAndHeight(table.id);
        const x = startX + col * (tableWidth + gapX * 2);
        const y = startY + row * (tableHeight + gapY * 2);
        positionTable(table, x, y);
      }
    });
  } else {
    connectedTables.forEach((table, index) => {
      if (!positionedTables.has(table.id)) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        const { width: tableWidth, height: tableHeight } =
          getTableWidthAndHeight(table.id);
        const x = startX + col * (tableWidth + gapX);
        const y = startY + row * (tableHeight + gapY);
        const finalPos = findNonOverlappingPosition(x, y, table.id);
        table.x = finalPos.x;
        table.y = finalPos.y;
        tablePositions.set(table.id, { x: table.x, y: table.y });
        positionedTables.add(table.id);
      }
    });
  }

  // Position isolated tables
  let maxY = startY;
  for (const pos of tablePositions.values()) {
    const tableId = [...tablePositions.entries()].find(
      ([, p]) => p === pos
    )?.[0];
    if (tableId) {
      const { height } = getTableWidthAndHeight(tableId);
      maxY = Math.max(maxY, pos.y + height);
    }
  }

  if (isolatedTables.length > 0) {
    const isolatedStartY = maxY + gapY * 2;
    const isolatedStartX = startX;

    isolatedTables.forEach((table, index) => {
      if (!positionedTables.has(table.id)) {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const { width: tableWidth, height: tableHeight } =
          getTableWidthAndHeight(table.id);
        const x = isolatedStartX + col * (tableWidth + gapX);
        const y = isolatedStartY + row * (tableHeight + gapY);
        const finalPos = findNonOverlappingPosition(x, y, table.id);
        table.x = finalPos.x;
        table.y = finalPos.y;
        tablePositions.set(table.id, { x: table.x, y: table.y });
        positionedTables.add(table.id);
      }
    });
  }

  return tables;
};

export const calcTableHeight = (table?: DBTable): number => {
  if (!table) {
    return 300;
  }

  const FIELD_HEIGHT = 32;
  const TABLE_FOOTER_HEIGHT = 32;
  const TABLE_HEADER_HEIGHT = 42;
  const fieldCount = table.fields.length;
  let visibleFieldCount = fieldCount;

  if (!table.expanded) {
    visibleFieldCount = Math.min(fieldCount, TABLE_MINIMIZED_FIELDS);
  }

  const fieldsHeight = visibleFieldCount * FIELD_HEIGHT;
  const showMoreButtonHeight =
    fieldCount > TABLE_MINIMIZED_FIELDS ? TABLE_FOOTER_HEIGHT : 0;

  return TABLE_HEADER_HEIGHT + fieldsHeight + showMoreButtonHeight;
};


