import { generateId } from '../../utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
} from '../common';
import { buildSQLFromAST } from '../common';
import { DatabaseType } from '../../domain/database-type';
import { extractColumnName, extractTableReference, parserOpts } from './mysql-common';

interface ParsedStatement {
    type: 'table' | 'index' | 'alter' | 'other';
    sql: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed?: any;
}

/**
 * Preprocess SQL content to separate and categorize different statement types
 * Improved comment handling to avoid issues with strings containing comment markers
 */
function preprocessSQL(sqlContent: string): { statements: ParsedStatement[]; warnings: string[] } {
    const warnings: string[] = [];
    const statements: ParsedStatement[] = [];

    // Remove all comments before any processing to avoid formatting issues
    let cleanedSQL = sqlContent;

    // Remove multi-line comments /* ... */
    cleanedSQL = cleanedSQL.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove single-line comments -- ...
    // But be careful with strings that might contain --
    const lines = cleanedSQL.split('\n');
    const cleanedLines = lines.map((line) => {
        let result = '';
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1] || '';

            // Handle string boundaries (MySQL uses single quotes and backticks)
            if (!inString && (char === "'" || char === '`')) {
                inString = true;
                stringChar = char;
                result += char;
            } else if (inString && char === stringChar) {
                // Check for escaped quote
                if (nextChar === stringChar) {
                    result += char + nextChar;
                    i++; // Skip the next quote
                } else {
                    inString = false;
                    result += char;
                }
            } else if (!inString && char === '-' && nextChar === '-') {
                // Found comment start, skip rest of line
                break;
            } else {
                result += char;
            }
        }

        return result;
    });

    cleanedSQL = cleanedLines.join('\n');

    // Split by semicolons but keep track of quoted strings
    const sqlStatements = splitSQLStatements(cleanedSQL);

    for (const stmt of sqlStatements) {
        const trimmedStmt = stmt.trim();
        if (!trimmedStmt) continue;

        const upperStmt = trimmedStmt.toUpperCase();
        if (upperStmt.startsWith('CREATE TABLE')) {
            statements.push({ type: 'table', sql: trimmedStmt });
        } else if (upperStmt.startsWith('CREATE INDEX') || upperStmt.startsWith('CREATE UNIQUE INDEX')) {
            statements.push({ type: 'index', sql: trimmedStmt });
        } else if (upperStmt.startsWith('ALTER TABLE')) {
            statements.push({ type: 'alter', sql: trimmedStmt });
        } else {
            statements.push({ type: 'other', sql: trimmedStmt });
        }
    }

    return { statements, warnings };
}

/**
 * Split SQL statements by semicolons, accounting for quoted strings
 */
function splitSQLStatements(sql: string): string[] {
    const statements: string[] = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        const nextChar = sql[i + 1] || '';

        // Handle string boundaries (MySQL uses single quotes and backticks)
        if (!inString && (char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
            currentStatement += char;
        } else if (inString && char === stringChar) {
            // Check for escaped quote
            if (nextChar === stringChar) {
                currentStatement += char + nextChar;
                i++; // Skip the next quote
            } else {
                inString = false;
                currentStatement += char;
            }
        } else if (!inString && char === ';') {
            // End of statement
            statements.push(currentStatement.trim());
            currentStatement = '';
        } else {
            currentStatement += char;
        }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
    }

    return statements;
}

/**
 * Extract foreign keys from CREATE TABLE statement using regex
 */
function extractForeignKeysFromSQL(
    sql: string,
    tableName: string,
    tableSchema: string | undefined,
    tableId: string,
    tableMap: Record<string, string>
): SQLForeignKey[] {
    const relationships: SQLForeignKey[] = [];
    const tableBodyMatch = sql.match(/\(([\s\S]+)\)/);
    if (!tableBodyMatch) return relationships;

    const tableBody = tableBodyMatch[1];

    // Pattern for FOREIGN KEY constraints in MySQL (supports backticks and ON DELETE/UPDATE)
    const fkPattern = /FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+(?:`?([^`.\s]+)`?\.)?`?([^`.\s(]+)`?\s*\([^)]+\)(?:\s+ON\s+(?:DELETE|UPDATE)\s+[^,)]+)*/gi;
    let match;
    while ((match = fkPattern.exec(tableBody)) !== null) {
        const targetSchema = match[1] || undefined;
        const targetTable = match[2];
        const targetTableKey = targetSchema ? `${targetSchema}.${targetTable}` : targetTable;
        const targetTableId = tableMap[targetTableKey];

        if (targetTableId) {
            // Extract column names
            const fkSection = tableBody.substring(match.index);
            const fkMatch = fkSection.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES/);
            const refMatch = fkSection.match(/REFERENCES[^(]+\(([^)]+)\)/);
            
            // Extract ON DELETE and ON UPDATE actions
            const deleteMatch = fkSection.match(/ON\s+DELETE\s+(\w+)/i);
            const updateMatch = fkSection.match(/ON\s+UPDATE\s+(\w+)/i);
            const deleteAction = deleteMatch ? deleteMatch[1].toUpperCase() : undefined;
            const updateAction = updateMatch ? updateMatch[1].toUpperCase() : undefined;
            
            if (fkMatch && refMatch) {
                const sourceCols = fkMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
                const targetCols = refMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));

                if (sourceCols.length > 0 && targetCols.length > 0) {
                    // Create one relationship per column pair
                    for (let i = 0; i < Math.min(sourceCols.length, targetCols.length); i++) {
                        relationships.push({
                            name: `fk_${tableName}_${sourceCols[i]}_${targetTable}`,
                            sourceTable: tableName,
                            sourceSchema: tableSchema,
                            sourceColumn: sourceCols[i],
                            targetTable,
                            targetSchema,
                            targetColumn: targetCols[i],
                            sourceTableId: tableId,
                            targetTableId,
                            sourceCardinality: 'many',
                            targetCardinality: 'one',
                            deleteAction,
                            updateAction,
                        });
                    }
                }
            }
        }
    }

    return relationships;
}

/**
 * Parse MySQL SQL statements
 */
export async function fromMySQL(
    sqlContent: string
): Promise<SQLParserResult & { warnings?: string[] }> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {};
    const processedStatements: string[] = [];

    const { statements, warnings } = preprocessSQL(sqlContent);

    // Import parser
    const { Parser } = await import('node-sql-parser');
    const parser = new Parser();

    // First pass: collect all table names using regex
    for (const stmt of statements) {
        if (stmt.type === 'table') {
            // MySQL supports database.table format with backticks
            const match = stmt.sql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:`?([^`.\s]+)`?\.)?`?([^`.\s(]+)`?/i);
            if (match) {
                const schema = match[1] || undefined;
                const tableName = match[2];
                const tableKey = schema ? `${schema}.${tableName}` : tableName;
                tableMap[tableKey] = generateId();
            }
        }
    }

    // Second pass: parse statements
    for (const stmt of statements) {
        if (stmt.type === 'table' || stmt.type === 'index' || stmt.type === 'alter') {
            try {
                const ast = parser.astify(
                    stmt.sql.endsWith(';') ? stmt.sql : stmt.sql + ';',
                    parserOpts
                );
                stmt.parsed = Array.isArray(ast) ? ast[0] : ast;
                processedStatements.push(stmt.sql);
            } catch (error) {
                warnings.push(`Failed to parse statement: ${stmt.sql.substring(0, 50)}...`);
                if (stmt.type === 'table') {
                    stmt.parsed = null;
                }
            }
        }
    }

    // Third pass: parse CREATE INDEX statements and associate with tables
    const indexMap: Record<string, SQLIndex[]> = {};
    for (const stmt of statements) {
        if (stmt.type === 'index') {
            try {
                // Parse CREATE INDEX statement: CREATE INDEX idx_name ON table_name(column_name)
                const indexMatch = stmt.sql.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:`?([^`\s]+)`?)?\s+ON\s+`?([^`.\s(]+)`?\s*\(([^)]+)\)/i);
                if (indexMatch) {
                    const indexName = indexMatch[1] || `idx_${indexMatch[2]}_${indexMatch[3].split(',')[0].trim()}`;
                    const tableName = indexMatch[2];
                    const columnsStr = indexMatch[3];
                    const columns = columnsStr.split(',').map(c => c.trim().replace(/`/g, ''));
                    const isUnique = stmt.sql.toUpperCase().includes('UNIQUE');
                    
                    if (!indexMap[tableName]) {
                        indexMap[tableName] = [];
                    }
                    indexMap[tableName].push({
                        name: indexName,
                        columns,
                        unique: isUnique,
                    });
                }
            } catch (error) {
                warnings.push(`Failed to parse index statement: ${stmt.sql.substring(0, 50)}...`);
            }
        }
    }

    // Fourth pass: extract table definitions
    for (const stmt of statements) {
        if (stmt.type === 'table') {
            const match = stmt.sql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:`?([^`.\s]+)`?\.)?`?([^`.\s(]+)`?/i);
            if (!match) continue;

            const schema = match[1] || undefined;
            const tableName = match[2];
            const tableKey = schema ? `${schema}.${tableName}` : tableName;
            const tableId = tableMap[tableKey];
            if (!tableId) continue;

            const columns: SQLColumn[] = [];
            const indexes: SQLIndex[] = indexMap[tableName] || [];

            // Try to parse from AST if available
            if (stmt.parsed) {
                const createTableStmt = stmt.parsed as any;
                
                // Extract table reference
                const tableRef = extractTableReference(createTableStmt.table);
                if (!tableRef) continue;

                // Extract columns from AST
                if (createTableStmt.create_definitions && Array.isArray(createTableStmt.create_definitions)) {
                    for (const def of createTableStmt.create_definitions) {
                        if (def.resource === 'column' || def.column) {
                            const colName = extractColumnName(def.column || def);
                            if (!colName) continue;

                            const colDef = def.definition || def;
                            const dataType = colDef?.dataType || 'VARCHAR';
                            const typeLength = colDef?.length;
                            const typePrecision = colDef?.precision;
                            const typeScale = colDef?.scale;

                            // Build type string with proper formatting
                            let typeStr = dataType.toLowerCase();
                            if (typePrecision !== undefined && typeScale !== undefined) {
                                typeStr = `${typeStr}(${typePrecision},${typeScale})`;
                            } else if (typeLength !== undefined) {
                                typeStr = `${typeStr}(${typeLength})`;
                            }

                            // Check constraints
                            const constraints = colDef?.constraint || [];
                            const isNotNull = constraints.some((c: any) => c.null === 'not null');
                            const isPrimaryKey = constraints.some((c: any) => c.key === 'primary key') || def.primary_key;
                            const isUnique = constraints.some((c: any) => c.key === 'unique') || def.unique;
                            
                            // Check for AUTO_INCREMENT in multiple places
                            // Also check the SQL string directly for the column definition
                            const colDefUpper = stmt.sql.toUpperCase();
                            const colNameUpper = colName.toUpperCase();
                            const colDefStart = colDefUpper.indexOf(colNameUpper);
                            const colDefEnd = colDefUpper.indexOf(',', colDefStart);
                            const colDefStr = colDefEnd > colDefStart 
                                ? colDefUpper.substring(colDefStart, colDefEnd)
                                : colDefUpper.substring(colDefStart);
                            const isAutoIncrement = 
                                colDef?.auto_increment === true || 
                                def.auto_increment === true ||
                                constraints.some((c: any) => c.auto_increment === true) ||
                                colDefStr.includes('AUTO_INCREMENT');

                            // Extract default value - use buildSQLFromAST for proper string extraction
                            let defaultValue: string | undefined;
                            if (colDef?.default?.value !== undefined) {
                                const defaultAST = colDef.default.value;
                                if (typeof defaultAST === 'object' && defaultAST !== null) {
                                    defaultValue = buildSQLFromAST(defaultAST as any, DatabaseType.MYSQL);
                                } else {
                                    defaultValue = String(defaultAST);
                                }
                            } else if (def.default_val) {
                                if (typeof def.default_val === 'object' && def.default_val !== null) {
                                    defaultValue = buildSQLFromAST(def.default_val as any, DatabaseType.MYSQL);
                                } else {
                                    defaultValue = String(def.default_val);
                                }
                            }

                            columns.push({
                                name: colName,
                                type: typeStr,
                                nullable: !isNotNull,
                                primaryKey: !!isPrimaryKey,
                                unique: !!isUnique,
                                default: defaultValue,
                                increment: isAutoIncrement,
                            });
                        }
                    }
                }
            }

            // Fallback to regex parsing if AST parsing failed or incomplete
            if (columns.length === 0) {
                const tableBodyMatch = stmt.sql.match(/\(([\s\S]+)\)/);
                if (tableBodyMatch) {
                    const tableBody = tableBodyMatch[1];
                    // Extract column definitions using regex - improved to handle quoted names
                    const columnPattern = /`?([^`,\s(]+)`?\s+(\w+(?:\([^)]*\))?)([^,)]*)/g;
                    let colMatch;
                    while ((colMatch = columnPattern.exec(tableBody)) !== null) {
                        const colName = colMatch[1].trim().replace(/`/g, '');
                        const colType = colMatch[2].trim();
                        const colConstraints = colMatch[3].trim();
                        
                        // Check for AUTO_INCREMENT in the full column definition
                        const fullColDef = colMatch[0];
                        const hasAutoIncrement = fullColDef.toUpperCase().includes('AUTO_INCREMENT');

                        columns.push({
                            name: colName,
                            type: colType.toLowerCase(),
                            nullable: !colConstraints.toUpperCase().includes('NOT NULL'),
                            primaryKey: colConstraints.toUpperCase().includes('PRIMARY KEY'),
                            unique: colConstraints.toUpperCase().includes('UNIQUE'),
                            increment: hasAutoIncrement,
                        });
                    }
                }
            }

            // Extract foreign keys
            const tableFKs = extractForeignKeysFromSQL(
                stmt.sql,
                tableName,
                schema,
                tableId,
                tableMap
            );
            relationships.push(...tableFKs);

            tables.push({
                id: tableId,
                name: tableName,
                schema: schema || 'public',
                columns,
                indexes,
                order: tables.length,
            });
        }
    }

    return {
        tables,
        relationships,
        warnings: warnings.length > 0 ? warnings : undefined,
    };
}

/**
 * Detect if SQL content is from MySQL dump format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from MySQL
 */
export function isMySQLFormat(sqlContent: string): boolean {
    // Common patterns in MySQL dumps
    const mysqlDumpPatterns = [
        /START TRANSACTION/i,
        /CREATE TABLE.*IF NOT EXISTS/i,
        /ENGINE\s*=\s*(?:InnoDB|MyISAM|MEMORY|ARCHIVE)/i,
        /DEFAULT CHARSET\s*=\s*(?:utf8|latin1)/i,
        /COLLATE\s*=\s*(?:utf8_general_ci|latin1_swedish_ci)/i,
        /AUTO_INCREMENT\s*=\s*\d+/i,
        /ALTER TABLE.*ADD CONSTRAINT.*FOREIGN KEY/i,
        /-- (MySQL|MariaDB) dump/i,
    ];

    // Look for backticks around identifiers (common in MySQL)
    const hasBackticks = /`[^`]+`/.test(sqlContent);

    // Check for MySQL specific comments
    const hasMysqlComments =
        /-- MySQL dump|-- Host:|-- Server version:|-- Dump completed on/.test(
            sqlContent
        );

    // If there are MySQL specific comments, it's likely a MySQL dump
    if (hasMysqlComments) {
        return true;
    }

    // Count how many MySQL patterns are found
    let patternCount = 0;
    for (const pattern of mysqlDumpPatterns) {
        if (pattern.test(sqlContent)) {
            patternCount++;
        }
    }

    // If the SQL has backticks and at least a few MySQL patterns, it's likely MySQL
    const isLikelyMysql = hasBackticks && patternCount >= 2;

    return isLikelyMysql;
}
