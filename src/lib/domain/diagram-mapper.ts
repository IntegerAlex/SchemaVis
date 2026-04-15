/**
 * This file is part of the SchemaVis project.
 * Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex)
 * Licensed under the GNU Affero General Public License v3.0 or later.
 */
import type { Diagram } from './diagram';
import type { DBTable } from './db-table';
import type { DBRelationship } from './db-relationship';
import type { DBDependency } from './db-dependency';
import type { Area } from './area';
import type { DBCustomType } from './db-custom-type';
import type { Note } from './note';
import { DatabaseType } from './database-type';

/** DB diagram row shape (from Drizzle schema or API response) */
export interface DbDiagramRow {
  id: string;
  ownerId: string;
  name: string;
  databaseType: string;
  content: Record<string, unknown>;
  isPublic?: boolean;
  shareToken?: string | null;
  linkPermission?: string;
  shareExpiresAt?: Date | null;
  version?: number;
  deletedAt?: Date | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Converts a DB diagram row to the domain Diagram type.
 * Content arrays are cast from stored JSON - runtime validation not enforced.
 */
export function dbDiagramToDomain(row: DbDiagramRow): Diagram {
  const content = row.content as {
    tables?: unknown[];
    relationships?: unknown[];
    dependencies?: unknown[];
    areas?: unknown[];
    customTypes?: unknown[];
    notes?: unknown[];
  };

  return {
    id: row.id,
    name: row.name,
    databaseType: (row.databaseType as DatabaseType) ?? DatabaseType.GENERIC,
    tables: (content?.tables ?? []) as DBTable[],
    relationships: (content?.relationships ?? []) as DBRelationship[],
    dependencies: (content?.dependencies ?? []) as DBDependency[],
    areas: (content?.areas ?? []) as Area[],
    customTypes: (content?.customTypes ?? []) as DBCustomType[],
    notes: (content?.notes ?? []) as Note[],
    createdAt: typeof row.createdAt === 'string' ? new Date(row.createdAt) : row.createdAt,
    updatedAt: typeof row.updatedAt === 'string' ? new Date(row.updatedAt) : row.updatedAt,
  };
}

/**
 * Converts a domain Diagram to the DB content shape for storage.
 */
export function domainToDbContent(diagram: Diagram): Record<string, unknown> {
  return {
    tables: diagram.tables ?? [],
    relationships: diagram.relationships ?? [],
    dependencies: diagram.dependencies ?? [],
    areas: diagram.areas ?? [],
    customTypes: diagram.customTypes ?? [],
    notes: diagram.notes ?? [],
  };
}
