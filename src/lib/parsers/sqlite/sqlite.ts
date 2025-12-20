import { generateId } from '../../utils';
import type {
    SQLParserResult,
    SQLTable,
    SQLColumn,
    SQLIndex,
    SQLForeignKey,
} from '../common';
import { extractColumnName, extractTableReference, parserOpts } from './sqlite-common';

interface ParsedStatement {
    type: 'table' | 'index' | 'other';
    sql: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parsed?: any;
}

/**
 * Preprocess SQL content to separate and categorize different statement types
 * Improved comment handling for SQLite
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

            // Handle string boundaries (SQLite uses single and double quotes)
            if (!inString && (char === "'" || char === '"')) {
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

        // Handle string boundaries (SQLite uses single and double quotes)
        if (!inString && (char === "'" || char === '"')) {
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
    tableId: string,
    tableMap: Record<string, string>
): SQLForeignKey[] {
    const relationships: SQLForeignKey[] = [];
    const tableBodyMatch = sql.match(/\(([\s\S]+)\)/);
    if (!tableBodyMatch) return relationships;

    const tableBody = tableBodyMatch[1];

    // Pattern for FOREIGN KEY constraints in SQLite
    const fkPattern = /FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([^\s(]+)\s*\([^)]+\)/gi;
    let match;
    while ((match = fkPattern.exec(tableBody)) !== null) {
        const targetTable = match[1].trim().replace(/["`]/g, '');
        const targetTableId = tableMap[targetTable];

        if (targetTableId) {
            // Extract column names
            const fkMatch = sql.substring(match.index).match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES/);
            const refMatch = sql.substring(match.index).match(/REFERENCES[^(]+\(([^)]+)\)/);
            
            if (fkMatch && refMatch) {
                const sourceCols = fkMatch[1].split(',').map(c => c.trim().replace(/["`]/g, ''));
                const targetCols = refMatch[1].split(',').map(c => c.trim().replace(/["`]/g, ''));

                if (sourceCols.length > 0 && targetCols.length > 0) {
                    // Create one relationship per column pair
                    for (let i = 0; i < Math.min(sourceCols.length, targetCols.length); i++) {
                        relationships.push({
                            name: `fk_${tableName}_${sourceCols[i]}_${targetTable}`,
                            sourceTable: tableName,
                            sourceSchema: 'main',
                            sourceColumn: sourceCols[i],
                            targetTable,
                            targetSchema: 'main',
                            targetColumn: targetCols[i],
                            sourceTableId: tableId,
                            targetTableId,
                            sourceCardinality: 'many',
                            targetCardinality: 'one',
                        });
                    }
                }
            }
        }
    }

    return relationships;
}

/**
 * Parse SQLite CREATE TABLE statements directly to preserve exact type information
 * This is a fallback method that handles SQLite-specific syntax better than AST parsing
 */
function parseCreateTableStatementsDirectly(sqlContent: string): {
    name: string;
    columns: SQLColumn[];
}[] {
    const tables: {
        name: string;
        columns: SQLColumn[];
    }[] = [];

    // Remove comments before processing
    const cleanedSQL = sqlContent
        .split('\n')
        .map((line) => {
            const commentIndex = line.indexOf('--');
            return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        })
        .join('\n');

    // Match all CREATE TABLE statements including those without column definitions
    // Improved regex to handle quoted table names with spaces
    // Pattern matches: CREATE TABLE [IF NOT EXISTS] ["name"|name] (...)
    const createTableRegex =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(["'`])([^"'`]+)\1|(\w+))\s*\(([^;]+?)\)\s*;/gis;
    let match;

    while ((match = createTableRegex.exec(cleanedSQL)) !== null) {
        // match[1] = quote char (if quoted), match[2] = quoted name, match[3] = unquoted name, match[4] = table body
        const tableName = match[2] || match[3];
        const tableBody = match[4] ? match[4].trim() : '';

        const table: { name: string; columns: SQLColumn[] } = {
            name: tableName,
            columns: [],
        };

        // Special case: sqlite_sequence or tables with columns but no types
        if (tableName === 'sqlite_sequence' || !tableBody.includes(' ')) {
            // Parse simple column list without types (e.g., "name,seq")
            const simpleColumns = tableBody.split(',').map((col) => col.trim());
            for (const colName of simpleColumns) {
                if (
                    colName &&
                    !colName.toUpperCase().startsWith('FOREIGN KEY') &&
                    !colName.toUpperCase().startsWith('PRIMARY KEY') &&
                    !colName.toUpperCase().startsWith('UNIQUE') &&
                    !colName.toUpperCase().startsWith('CHECK') &&
                    !colName.toUpperCase().startsWith('CONSTRAINT')
                ) {
                    table.columns.push({
                        name: colName.replace(/["'`]/g, ''),
                        type: 'TEXT', // Default to TEXT for untyped columns
                        nullable: true,
                        primaryKey: false,
                        unique: false,
                        default: '',
                        increment: false,
                    });
                }
            }
        } else {
            // Parse normal table with typed columns
            // Split by commas not inside parentheses
            const columnDefs = [];
            let current = '';
            let parenDepth = 0;

            for (let i = 0; i < tableBody.length; i++) {
                const char = tableBody[i];
                if (char === '(') parenDepth++;
                else if (char === ')') parenDepth--;
                else if (char === ',' && parenDepth === 0) {
                    columnDefs.push(current.trim());
                    current = '';
                    continue;
                }
                current += char;
            }
            if (current.trim()) {
                columnDefs.push(current.trim());
            }

            for (const columnDef of columnDefs) {
                const line = columnDef.trim();
                
                // Skip empty lines
                if (!line) continue;

                // Skip constraints
                if (
                    line.toUpperCase().startsWith('FOREIGN KEY') ||
                    line.toUpperCase().startsWith('PRIMARY KEY') ||
                    line.toUpperCase().startsWith('UNIQUE') ||
                    line.toUpperCase().startsWith('CHECK') ||
                    line.toUpperCase().startsWith('CONSTRAINT')
                ) {
                    continue;
                }

                // Parse column: handle both quoted and unquoted identifiers
                // Pattern: [quotes]columnName[quotes] dataType [constraints]
                // Improved pattern to handle quoted identifiers with spaces and whitespace
                // First alternative: quoted identifier like "column name" TYPE ...
                // Second alternative: unquoted identifier like column TYPE ...
                const columnPattern = /^\s*(["'`])([^"'`]+)\1\s+(\w+)(.*)$|^\s*([\w]+)\s+(\w+)(.*)$/i;
                const columnMatch = columnPattern.exec(line);

                // If main pattern doesn't match, try a more lenient pattern
                let columnName: string | undefined;
                let rawType: string | undefined;
                let restOfLine: string | undefined;
                
                if (columnMatch) {
                    // Handle quoted identifiers: match[1]=quote, match[2]=name, match[3]=type, match[4]=rest
                    // or unquoted identifiers: match[5]=name, match[6]=type, match[7]=rest
                    columnName = columnMatch[2] || columnMatch[5];
                    rawType = (columnMatch[3] || columnMatch[6])?.toUpperCase();
                    restOfLine = (columnMatch[4] || columnMatch[7]) || '';
                } else {
                    // Try lenient pattern as fallback
                    const lenientPattern = /^\s*([^\s]+)\s+(\w+)(.*)$/i;
                    const lenientMatch = lenientPattern.exec(line);
                    if (lenientMatch) {
                        columnName = lenientMatch[1].replace(/["'`]/g, '');
                        rawType = lenientMatch[2].toUpperCase();
                        restOfLine = (lenientMatch[3] || '').trim();
                    }
                }

                if (columnName && rawType) {
                    const upperRest = (restOfLine ?? '').toUpperCase();

                    // Determine column properties
                    const isPrimaryKey = upperRest.includes('PRIMARY KEY');
                    const isAutoIncrement = upperRest.includes('AUTOINCREMENT');
                    // INTEGER PRIMARY KEY (even without AUTOINCREMENT) is auto-increment in SQLite
                    const isIntegerPrimaryKey = rawType === 'INTEGER' && isPrimaryKey;
                    const isNotNull =
                        upperRest.includes('NOT NULL') || isPrimaryKey;
                    const isUnique =
                        upperRest.includes('UNIQUE') || isPrimaryKey;

                    // Extract default value
                    let defaultValue = '';
                    const defaultMatch = /DEFAULT\s+([^,)]+)/i.exec(restOfLine ?? '');
                    if (defaultMatch) {
                        defaultValue = defaultMatch[1].trim();
                        // Remove quotes if present
                        if (
                            (defaultValue.startsWith("'") &&
                                defaultValue.endsWith("'")) ||
                            (defaultValue.startsWith('"') &&
                                defaultValue.endsWith('"'))
                        ) {
                            defaultValue = defaultValue.slice(1, -1);
                        }
                    }

                    // Map to appropriate SQLite storage class
                    let columnType = rawType;
                    if (rawType === 'INTEGER' || rawType === 'INT') {
                        columnType = 'INTEGER';
                    } else if (
                        [
                            'REAL',
                            'FLOAT',
                            'DOUBLE',
                            'NUMERIC',
                            'DECIMAL',
                        ].includes(rawType)
                    ) {
                        columnType = 'REAL';
                    } else if (rawType === 'BLOB' || rawType === 'BINARY') {
                        columnType = 'BLOB';
                    } else if (
                        ['TIMESTAMP', 'DATETIME', 'DATE', 'TIME'].includes(
                            rawType
                        )
                    ) {
                        columnType = 'TIMESTAMP';
                    } else if (
                        ['TEXT', 'VARCHAR', 'CHAR', 'CLOB', 'STRING'].includes(
                            rawType
                        ) ||
                        rawType.startsWith('VARCHAR') ||
                        rawType.startsWith('CHAR')
                    ) {
                        columnType = 'TEXT';
                    } else {
                        // Default to TEXT for unknown types
                        columnType = 'TEXT';
                    }

                    // Add column to the table
                    table.columns.push({
                        name: columnName,
                        type: columnType,
                        nullable: !isNotNull,
                        primaryKey: isPrimaryKey,
                        unique: isUnique,
                        default: defaultValue,
                        increment: isIntegerPrimaryKey || (isPrimaryKey && isAutoIncrement && columnType === 'INTEGER'),
                    });
                }
            }
        }

        if (table.columns.length > 0 || tableName === 'sqlite_sequence') {
            tables.push(table);
        }
    }

    return tables;
}

/**
 * Parse SQLite SQL statements
 * Uses direct regex parsing as primary method (more reliable for SQLite)
 * Falls back to AST parsing if needed
 */
export async function fromSQLite(
    sqlContent: string
): Promise<SQLParserResult & { warnings?: string[] }> {
    const tables: SQLTable[] = [];
    const relationships: SQLForeignKey[] = [];
    const tableMap: Record<string, string> = {};
    const warnings: string[] = [];

    // SPECIAL HANDLING: Direct regex-based parser for SQLite DDL
    // This ensures we handle all SQLite-specific syntax including tables without types
    const directlyParsedTables = parseCreateTableStatementsDirectly(sqlContent);

    // Always try direct parsing first as it's more reliable for SQLite
    if (directlyParsedTables.length > 0) {
        // Map the direct parsing results to the expected SQLParserResult format
        directlyParsedTables.forEach((table) => {
            const tableId = generateId();
            tableMap[table.name] = tableId;

            // Add the table with its columns
            tables.push({
                id: tableId,
                name: table.name,
                columns: table.columns,
                indexes: [],
                order: tables.length,
            });
        });

        // Process foreign keys using the regex approach
        findForeignKeysUsingRegex(sqlContent, tableMap, relationships);

        // Create placeholder tables for any missing referenced tables
        addPlaceholderTablesForFKReferences(
            tables,
            relationships,
            tableMap
        );

        // Filter out any invalid relationships
        const validRelationships = relationships.filter((rel) => {
            return isValidForeignKeyRelationship(rel, tables);
        });

        return { tables, relationships: validRelationships, warnings: warnings.length > 0 ? warnings : undefined };
    }

    // Fallback to AST parsing if direct parsing didn't find anything
    const { statements } = preprocessSQL(sqlContent);

    // Import parser
    const { Parser } = await import('node-sql-parser');
    const parser = new Parser();

    // First pass: collect all table names using regex
    for (const stmt of statements) {
        if (stmt.type === 'table') {
            // SQLite table names (may be quoted with " or ` or unquoted)
            const match = stmt.sql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:["`])?([^"`.\s(]+)(?:["`])?/i);
            if (match) {
                const tableName = match[1];
                tableMap[tableName] = generateId();
            }
        }
    }

    // Second pass: parse statements
    for (const stmt of statements) {
        if (stmt.type === 'table' || stmt.type === 'index') {
            try {
                const ast = parser.astify(
                    stmt.sql.endsWith(';') ? stmt.sql : stmt.sql + ';',
                    parserOpts
                );
                stmt.parsed = Array.isArray(ast) ? ast[0] : ast;
            } catch (error) {
                warnings.push(`Failed to parse statement: ${stmt.sql.substring(0, 50)}...`);
                if (stmt.type === 'table') {
                    stmt.parsed = null;
                }
            }
        }
    }

    // Third pass: extract table definitions
    for (const stmt of statements) {
        if (stmt.type === 'table') {
            const match = stmt.sql.match(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:["`])?([^"`.\s(]+)(?:["`])?/i);
            if (!match) continue;

            const tableName = match[1];
            const tableId = tableMap[tableName];
            if (!tableId) continue;

            const columns: SQLColumn[] = [];
            const indexes: SQLIndex[] = [];

            // Try to parse from AST if available
            if (stmt.parsed) {
                const createTableStmt = stmt.parsed as any;
                
                // Extract table reference
                const tableRef = extractTableReference(createTableStmt.table);
                if (!tableRef || tableRef !== tableName) continue;

                // Extract columns from AST
                if (createTableStmt.create_definitions && Array.isArray(createTableStmt.create_definitions)) {
                    for (const def of createTableStmt.create_definitions) {
                        if (def.resource === 'column' || def.column) {
                            const colName = extractColumnName(def.column || def);
                            const colDef = def.definition || def;
                            const dataType = colDef?.dataType || 'TEXT';
                            const typeLength = colDef?.length;

                            if (colName) {
                                columns.push({
                                    name: colName,
                                    type: typeLength ? `${dataType}(${typeLength})` : dataType.toLowerCase(),
                                    nullable: !colDef?.constraint?.some((c: any) => c.null === 'not null'),
                                    primaryKey: colDef?.constraint?.some((c: any) => c.key === 'primary key') || false,
                                    unique: colDef?.constraint?.some((c: any) => c.key === 'unique') || false,
                                    default: colDef?.default?.value ? String(colDef.default.value) : undefined,
                                });
                            }
                        }
                    }
                }
            }

            // Fallback to regex parsing if AST parsing failed or incomplete
            if (columns.length === 0) {
                const tableBodyMatch = stmt.sql.match(/\(([\s\S]+)\)/);
                if (tableBodyMatch) {
                    const tableBody = tableBodyMatch[1];
                    // Extract column definitions using regex
                    const columnPattern = /(?:["`])?([^"`,\s(]+)(?:["`])?\s+(\w+(?:\([^)]*\))?)([^,)]*)/g;
                    let colMatch;
                    while ((colMatch = columnPattern.exec(tableBody)) !== null) {
                        const colName = colMatch[1].trim();
                        const colType = colMatch[2].trim();
                        const colConstraints = colMatch[3].trim();

                        columns.push({
                            name: colName,
                            type: colType.toLowerCase(),
                            nullable: !colConstraints.toUpperCase().includes('NOT NULL'),
                            primaryKey: colConstraints.toUpperCase().includes('PRIMARY KEY') || colType.toUpperCase().includes('INTEGER PRIMARY KEY'),
                            unique: colConstraints.toUpperCase().includes('UNIQUE'),
                        });
                    }
                }
            }

            // Extract foreign keys
            const tableFKs = extractForeignKeysFromSQL(
                stmt.sql,
                tableName,
                tableId,
                tableMap
            );
            relationships.push(...tableFKs);

            tables.push({
                id: tableId,
                name: tableName,
                schema: 'main',
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
 * Uses regular expressions to find foreign key relationships in the SQL content
 */
function findForeignKeysUsingRegex(
    sqlContent: string,
    tableMap: Record<string, string>,
    relationships: SQLForeignKey[]
): void {
    // Define patterns to find foreign keys
    const foreignKeyPatterns = [
        // Pattern for inline column references - REFERENCES table_name(column_name)
        /\b(\w+)\b\s+\w+(?:\([^)]*\))?\s+(?:NOT\s+NULL\s+)?(?:REFERENCES)\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,

        // Pattern: FOREIGN KEY (column_name) REFERENCES table_name(column_name)
        /FOREIGN\s+KEY\s*\(\s*["'`]?(\w+)["'`]?\s*\)\s+REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)/gi,

        // Pattern for quoted column names with optional ON DELETE/UPDATE clauses
        /["'`](\w+)["'`]\s+\w+(?:\([^)]*\))?\s+(?:NOT\s+NULL\s+)?REFERENCES\s+["'`]?(\w+)["'`]?\s*\(\s*["'`]?(\w+)["'`]?\s*\)(?:\s+ON\s+(?:DELETE|UPDATE)\s+[^,)]+)?/gi,
    ];

    // First pass: identify all tables
    const tableNamePattern =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?/gi;
    let match;

    tableNamePattern.lastIndex = 0;
    while ((match = tableNamePattern.exec(sqlContent)) !== null) {
        const tableName = match[1];

        // Skip invalid table names
        if (!tableName || tableName === 'CREATE') continue;

        // Ensure the table is in our tableMap
        if (!tableMap[tableName]) {
            const tableId = generateId();
            tableMap[tableName] = tableId;
        }
    }

    // Track already added relationships to avoid duplicates
    const addedRelationships = new Set<string>();

    // Second pass: find foreign keys using regex
    for (const pattern of foreignKeyPatterns) {
        pattern.lastIndex = 0;
        while ((match = pattern.exec(sqlContent)) !== null) {
            const sourceColumn = match[1];
            const targetTable = match[2];
            const targetColumn = match[3];

            // Skip if any required component is missing
            if (!sourceColumn || !targetTable || !targetColumn) continue;

            // Skip invalid column names that might be SQL keywords
            if (
                sourceColumn.toUpperCase() === 'CREATE' ||
                sourceColumn.toUpperCase() === 'FOREIGN' ||
                sourceColumn.toUpperCase() === 'KEY'
            )
                continue;

            // Find the source table by examining the CREATE TABLE statement
            const tableSection = sqlContent.substring(0, match.index);
            const lastCreateTablePos = tableSection.lastIndexOf('CREATE TABLE');

            if (lastCreateTablePos === -1) continue; // Skip if not in a CREATE TABLE

            const tableSubstring = tableSection.substring(lastCreateTablePos);
            const tableMatch =
                /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?(\w+)["'`]?/i.exec(
                    tableSubstring
                );

            if (!tableMatch || !tableMatch[1]) continue; // Skip if we can't determine the table

            const sourceTable = tableMatch[1];

            // Create a unique key to track this relationship
            const relationshipKey = `${sourceTable}.${sourceColumn}-${targetTable}.${targetColumn}`;

            // Skip if we've already added this relationship
            if (addedRelationships.has(relationshipKey)) continue;
            addedRelationships.add(relationshipKey);

            // Get table IDs
            const sourceTableId =
                tableMap[sourceTable] || generateId();
            const targetTableId =
                tableMap[targetTable] || generateId();

            // Add the relationship
            relationships.push({
                name: `FK_${sourceTable}_${sourceColumn}_${targetTable}`,
                sourceTable,
                sourceSchema: 'main',
                sourceColumn,
                targetTable,
                targetSchema: 'main',
                targetColumn,
                sourceTableId,
                targetTableId,
            });
        }
    }
}

/**
 * Adds placeholder tables for tables referenced in foreign keys that don't exist in the schema
 */
function addPlaceholderTablesForFKReferences(
    tables: SQLTable[],
    relationships: SQLForeignKey[],
    tableMap: Record<string, string>
): void {
    // Get all existing table names
    const existingTableNames = new Set(tables.map((t) => t.name));

    // Find all target tables mentioned in relationships that don't exist
    const missingTableNames = new Set<string>();

    relationships.forEach((rel) => {
        if (rel.targetTable && !existingTableNames.has(rel.targetTable)) {
            missingTableNames.add(rel.targetTable);
        }
    });

    // Add placeholder tables for missing tables
    missingTableNames.forEach((tableName) => {
        // Generate a table ID
        const tableId = generateId();

        // Add to table map
        tableMap[tableName] = tableId;

        // Create minimal placeholder table with the target column as PK
        const targetColumns = new Set<string>();

        // Collect all referenced columns for this table
        relationships.forEach((rel) => {
            if (rel.targetTable === tableName) {
                targetColumns.add(rel.targetColumn);
            }
        });

        // Create columns for the placeholder table
        const columns: SQLColumn[] = Array.from(targetColumns).map(
            (colName) => ({
                name: colName,
                type: 'unknown',
                primaryKey: true, // Assume it's a primary key since it's referenced
                unique: true,
                nullable: false,
            })
        );

        // Add a generic ID column if no columns were found
        if (columns.length === 0) {
            columns.push({
                name: 'id',
                type: 'unknown',
                primaryKey: true,
                unique: true,
                nullable: false,
            });
        }

        // Add the placeholder table
        tables.push({
            id: tableId,
            name: tableName,
            columns,
            indexes: [],
            order: tables.length,
        });
    });
}

/**
 * Validates a foreign key relationship to ensure it refers to valid tables and columns
 */
function isValidForeignKeyRelationship(
    relationship: SQLForeignKey,
    tables: SQLTable[]
): boolean {
    // Check for empty values
    if (
        !relationship.sourceTable ||
        !relationship.sourceColumn ||
        !relationship.targetTable ||
        !relationship.targetColumn
    ) {
        return false;
    }

    // Check for SQL keywords that might have been mistakenly captured
    const invalidKeywords = [
        'CREATE',
        'TABLE',
        'FOREIGN',
        'KEY',
        'REFERENCES',
        'PRIMARY',
    ];
    if (
        invalidKeywords.includes(relationship.sourceColumn.toUpperCase()) ||
        invalidKeywords.includes(relationship.targetColumn.toUpperCase())
    ) {
        return false;
    }

    // Source table must exist in our schema
    const sourceTableExists = tables.some(
        (t) => t.name === relationship.sourceTable
    );
    if (!sourceTableExists) {
        return false;
    }

    return true;
}
