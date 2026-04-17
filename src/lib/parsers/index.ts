import { DatabaseType } from '../domain/database-type';
import type { Diagram } from '../domain/diagram';
import { fromPostgres } from './postgresql/postgresql';
import { fromPostgresDump } from './postgresql/postgresql-dump';
import { fromMySQL } from './mysql/mysql';
import { fromSQLite } from './sqlite/sqlite';
import { fromOracle } from './oracle/oracle';
import { fromSQLServer } from './sqlserver/sqlserver';
import type { SQLParserResult } from './common';
import { convertToChartDBDiagram } from './common';
import { adjustTablePositions } from '../domain/db-table';
import { isPgDumpFormat, detectDatabaseType } from './detect';
export { detectDatabaseType } from './detect';

/**
 * Parse SQL statements and convert to a Diagram object
 * @param sqlContent SQL content as string
 * @param sourceDatabaseType Source doatabase type
 * @param targetDatabaseType Target database type for the diagram
 * @returns Diagram object
 */
export async function sqlImportToDiagram({
    sqlContent,
    sourceDatabaseType,
    targetDatabaseType = DatabaseType.GENERIC,
}: {
    sqlContent: string;
    sourceDatabaseType: DatabaseType;
    targetDatabaseType?: DatabaseType;
}): Promise<Diagram> {
    // Normalize database type in case it comes as a string
    let dbType = sourceDatabaseType;
    if (typeof dbType === 'string') {
        // Try to match string value to enum
        const normalized = dbType.toLowerCase();
        const enumValue = Object.values(DatabaseType).find(
            (val) => val.toLowerCase() === normalized
        );
        if (enumValue) {
            dbType = enumValue as DatabaseType;
        }
    }

    // If source database type is GENERIC, try to auto-detect the type
    if (dbType === DatabaseType.GENERIC) {
        const detectedType = detectDatabaseType(sqlContent);
        if (detectedType) {
            dbType = detectedType;
        } else {
            dbType = DatabaseType.POSTGRESQL;
        }
    }

    let parserResult: SQLParserResult;

    // Route to appropriate parser based on database type
    console.log(`[sqlImportToDiagram] Processing with database type: ${dbType}`);
    
    try {
        if (dbType === DatabaseType.POSTGRESQL) {
            // Check if the SQL is from pg_dump and use the appropriate parser
            if (isPgDumpFormat(sqlContent)) {
                console.log('[sqlImportToDiagram] Using pg_dump parser');
                parserResult = await fromPostgresDump(sqlContent);
            } else {
                console.log('[sqlImportToDiagram] Using PostgreSQL parser');
                parserResult = await fromPostgres(sqlContent);
            }
        } else if (dbType === DatabaseType.MYSQL || dbType === DatabaseType.MARIADB) {
            console.log('[sqlImportToDiagram] Using MySQL parser');
            parserResult = await fromMySQL(sqlContent);
        } else if (dbType === DatabaseType.SQLITE) {
            console.log('[sqlImportToDiagram] Using SQLite parser');
            parserResult = await fromSQLite(sqlContent);
        } else if (dbType === DatabaseType.ORACLE) {
            console.log('[sqlImportToDiagram] Using Oracle parser');
            parserResult = await fromOracle(sqlContent);
        } else if (dbType === DatabaseType.SQL_SERVER) {
            console.log('[sqlImportToDiagram] Using SQL Server parser');
            parserResult = await fromSQLServer(sqlContent);
        } else {
            console.error(`[sqlImportToDiagram] Unsupported database type: ${dbType} (original: ${sourceDatabaseType})`);
            throw new Error(`Unsupported database type: ${dbType}`);
        }
    } catch (parseError) {
        console.error(`[sqlImportToDiagram] Parser error for ${dbType}:`, parseError);
        if (parseError instanceof Error) {
            throw parseError;
        }
        throw new Error(`Failed to parse SQL for ${dbType}: ${String(parseError)}`);
    }

    // Convert the parsed SQL to a diagram
    const diagram = convertToChartDBDiagram(
        parserResult,
        dbType,
        targetDatabaseType
    );

    const adjustedTables = adjustTablePositions({
        tables: diagram.tables ?? [],
        relationships: diagram.relationships ?? [],
    });

    const sortedTables = adjustedTables.sort((a, b) => {
        if (a.isView === b.isView) {
            // Both are either tables or views, so sort alphabetically by name
            return a.name.localeCompare(b.name);
        }
        // If one is a view and the other is not, put tables first
        return a.isView ? 1 : -1;
    });

    return {
        ...diagram,
        tables: sortedTables,
    };
}

/**
 * Parse SQL and identify any errors
 * @param sqlContent SQL content as string
 * @param sourceDatabaseType Source database type
 * @returns Object with success status and error information
 */
export async function parseSQLError({
    sqlContent,
    sourceDatabaseType,
}: {
    sqlContent: string;
    sourceDatabaseType: DatabaseType;
}): Promise<{
    success: boolean;
    error?: string;
    line?: number;
    column?: number;
}> {
    try {
        // Route to appropriate parser based on database type
        let result: SQLParserResult & { warnings?: string[] };
        if (sourceDatabaseType === DatabaseType.POSTGRESQL) {
            if (isPgDumpFormat(sqlContent)) {
                result = await fromPostgresDump(sqlContent);
            } else {
                result = await fromPostgres(sqlContent);
            }
        } else if (sourceDatabaseType === DatabaseType.MYSQL || sourceDatabaseType === DatabaseType.MARIADB) {
            result = await fromMySQL(sqlContent);
        } else if (sourceDatabaseType === DatabaseType.SQLITE) {
            result = await fromSQLite(sqlContent);
        } else if (sourceDatabaseType === DatabaseType.ORACLE) {
            result = await fromOracle(sqlContent);
        } else if (sourceDatabaseType === DatabaseType.SQL_SERVER) {
            result = await fromSQLServer(sqlContent);
        } else {
            throw new Error(`Unsupported database type: ${sourceDatabaseType}`);
        }

        // Check if there were any parsing failures reported as warnings
        if (result.warnings && result.warnings.length > 0) {
            const parseError = result.warnings.find(w => w.includes('Failed to parse statement'));
            if (parseError) {
                return {
                    success: false,
                    error: parseError
                };
            }
        }

        return { success: true };
    } catch (error: unknown) {
        // Extract line and column information from the error message
        let line: number | undefined;
        let column: number | undefined;
        let errorMessage: string;

        // Type guard to check if error is an object with a message property
        if (error instanceof Error) {
            errorMessage = error.message;

            // Parse error location if available
            const lineMatch = error.message.match(/line\s*(\d+)/i);
            if (lineMatch && lineMatch[1]) {
                line = parseInt(lineMatch[1], 10);
            }

            const columnMatch = error.message.match(/column\s*(\d+)/i);
            if (columnMatch && columnMatch[1]) {
                column = parseInt(columnMatch[1], 10);
            }

            // Clean up error message if needed
            if (error.message.includes('Error parsing')) {
                // Extract everything after the colon using regex
                const match = error.message.match(/Error parsing[^:]*:(.*)/);
                if (match && match[1]) {
                    errorMessage = match[1].trim();
                }
            }
        } else {
            // Fallback for non-Error objects
            errorMessage = String(error);
        }

        return {
            success: false,
            error: errorMessage,
            line,
            column,
        };
    }
}

