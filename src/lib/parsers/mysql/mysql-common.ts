export const parserOpts = { database: 'mysql' };

// Helper to extract column name from AST
export function extractColumnName(column: unknown): string | null {
    if (typeof column === 'string') {
        return column;
    }
    if (column && typeof column === 'object') {
        const colObj = column as Record<string, unknown>;
        if (colObj.column) {
            return extractColumnName(colObj.column);
        }
        if (colObj.value) {
            return String(colObj.value);
        }
        if (Array.isArray(colObj)) {
            return colObj.map((c) => extractColumnName(c)).filter(Boolean).join('.');
        }
    }
    return null;
}

// Helper to extract table reference
export function extractTableReference(table: unknown): { schema?: string; table: string } | null {
    if (typeof table === 'string') {
        return { table };
    }
    if (table && typeof table === 'object') {
        const tableObj = table as Record<string, unknown>;
        if (tableObj.table) {
            const tableName = typeof tableObj.table === 'string' ? tableObj.table : extractColumnName(tableObj.table);
            const schema = tableObj.schema || tableObj.db;
            return {
                schema: schema ? String(schema) : undefined,
                table: tableName || '',
            };
        }
        if (Array.isArray(tableObj)) {
            const first = tableObj[0];
            return extractTableReference(first);
        }
    }
    return null;
}

