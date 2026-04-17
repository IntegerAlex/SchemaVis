import { DatabaseType } from '../domain/database-type';

/**
 * Detect if SQL content is from pg_dump format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from pg_dump
 */
export function isPgDumpFormat(sqlContent: string): boolean {
    // pg_dump output often contains specific markers
    const pgDumpMarkers = [
        'SET statement_timeout',
        'SET lock_timeout',
        'SET client_encoding',
        'SET standard_conforming_strings',
        'SELECT pg_catalog.set_config',
        'ALTER TABLE ONLY',
        'COMMENT ON EXTENSION',
    ];

    // Check for specific pg_dump patterns
    for (const marker of pgDumpMarkers) {
        if (sqlContent.includes(marker)) {
            return true;
        }
    }

    // Check for other pg_dump patterns like COPY statements or specific comments
    if (
        (sqlContent.includes('COPY') && sqlContent.includes('FROM stdin')) ||
        sqlContent.match(/--\s+Name:.*Type:/i)
    ) {
        return true;
    }

    return false;
}

/**
 * Detect if SQL content is from SQL Server DDL format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from SQL Server
 */
function isSQLServerFormat(sqlContent: string): boolean {
    // SQL Server output often contains specific markers
    const sqlServerMarkers = [
        'SET ANSI_NULLS ON',
        'SET QUOTED_IDENTIFIER ON',
        'SET ANSI_PADDING ON',
        'CREATE PROCEDURE',
        'EXEC sys.sp_',
        'EXECUTE sys.sp_',
        '[dbo].',
        'IDENTITY(',
        'NVARCHAR',
        'UNIQUEIDENTIFIER',
        'ALTER TABLE [',
        'CREATE TABLE [dbo]',
        'CREATE INDEX [dbo_',
        'datetime2',
    ];

    // Check for specific SQL Server patterns
    for (const marker of sqlServerMarkers) {
        if (sqlContent.includes(marker)) {
            return true;
        }
    }

    // Also check for brackets used in SQL Server syntax - [dbo].[TableName]
    if (sqlContent.match(/\[[^\]]+\]\.\[[^\]]+\]/)) {
        return true;
    }

    return false;
}

/**
 * Detect if SQL content is from SQLite format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from SQLite
 */
function isSQLiteFormat(sqlContent: string): boolean {
    // SQLite output often contains specific markers
    // Use more specific markers to avoid false positives with PostgreSQL
    const sqliteMarkers = [
        'PRAGMA',
        'INTEGER PRIMARY KEY AUTOINCREMENT',
        'DEFAULT (datetime(',
        'sqlite_sequence',
    ];

    // Check for specific SQLite patterns
    for (const marker of sqliteMarkers) {
        if (sqlContent.includes(marker)) {
            return true;
        }
    }

    // Check for SQLite-specific CREATE TRIGGER pattern (more specific than just "CREATE TRIGGER")
    // SQLite triggers often have specific syntax
    if (sqlContent.includes('CREATE TRIGGER') &&
        (sqlContent.includes('sqlite_') || sqlContent.includes('INTEGER PRIMARY KEY'))) {
        return true;
    }

    return false;
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

/**
 * Detect if SQL content is from Oracle format
 * @param sqlContent SQL content as string
 * @returns boolean indicating if the SQL is likely from Oracle
 */
export function isOracleFormat(sqlContent: string): boolean {
    const oracleMarkers = [
        'VARCHAR2',
        'NUMBER(',
        'SYSDATE',
        'SYSTIMESTAMP',
        'SYS_GUID',
        'GENERATED ALWAYS AS IDENTITY',
        'GENERATED BY DEFAULT AS IDENTITY',
        '.NEXTVAL',
        'TABLESPACE',
        'PCTFREE',
        'STORAGE (',
        'NVARCHAR2',
        'CLOB',
        'NCLOB',
        'BLOB',
        'BFILE',
        'BINARY_FLOAT',
        'BINARY_DOUBLE',
        'ROWID',
        'XMLTYPE',
        'CREATE SEQUENCE',
        'CREATE OR REPLACE',
        'CONSTRAINT .* PRIMARY KEY.*ENABLE',
    ];

    // Check for specific Oracle patterns
    for (const marker of oracleMarkers) {
        if (marker.includes('.*')) {
            // Handle regex patterns
            const regex = new RegExp(marker, 'i');
            if (regex.test(sqlContent)) {
                return true;
            }
        } else if (sqlContent.toUpperCase().includes(marker.toUpperCase())) {
            return true;
        }
    }

    return false;
}

/**
 * Auto-detect database type from SQL content
 * @param sqlContent SQL content as string
 * @returns Detected database type or null if can't determine
 */
export function detectDatabaseType(sqlContent: string): DatabaseType | null {
    // First check for PostgreSQL dump format
    if (isPgDumpFormat(sqlContent)) {
        return DatabaseType.POSTGRESQL;
    }

    // Check for SQL Server format
    if (isSQLServerFormat(sqlContent)) {
        return DatabaseType.SQL_SERVER;
    }

    // Check for MySQL dump format
    if (isMySQLFormat(sqlContent)) {
        return DatabaseType.MYSQL;
    }

    // Look for database-specific keywords (check PostgreSQL before Oracle/SQLite to avoid false positives)
    if (
        sqlContent.includes('SERIAL PRIMARY KEY') ||
        sqlContent.includes('CREATE EXTENSION') ||
        sqlContent.includes('WITH (OIDS') ||
        sqlContent.includes('RETURNS SETOF') ||
        sqlContent.includes('DO $$') ||
        sqlContent.includes('::') ||
        sqlContent.includes('pg_catalog')
    ) {
        return DatabaseType.POSTGRESQL;
    }

    // Check for Oracle format
    if (isOracleFormat(sqlContent)) {
        return DatabaseType.ORACLE;
    }

    if (
        sqlContent.includes('AUTO_INCREMENT') ||
        sqlContent.includes('ENGINE=InnoDB') ||
        sqlContent.includes('DEFINER=')
    ) {
        return DatabaseType.MYSQL;
    }

    // Check for SQLite format (after PostgreSQL keywords to avoid false positives from generic markers)
    if (isSQLiteFormat(sqlContent)) {
        return DatabaseType.SQLITE;
    }

    // Could not determine the database type
    return null;
}
