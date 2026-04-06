import { describe, it, expect } from 'vitest';
import { sqlImportToDiagram, detectDatabaseType, parseSQLError } from './index';
import { DatabaseType } from '../domain/database-type';

describe('SQL Import', () => {
  describe('detectDatabaseType', () => {
    it('should detect PostgreSQL', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.POSTGRESQL);
    });

    it('should detect PostgreSQL and not Oracle (BLOB keyword)', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          data BYTEA
        );
        -- BLOB is a PostgreSQL type too
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.POSTGRESQL);
    });

    it('should detect MySQL', () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.MYSQL);
    });

    it('should detect SQLite', () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.SQLITE);
    });

    it('should detect SQL Server', () => {
      const sql = `
        SET ANSI_NULLS ON;
        CREATE TABLE [dbo].[users] (
          [id] INT IDENTITY(1,1) PRIMARY KEY
        );
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.SQL_SERVER);
    });

    it('should detect Oracle', () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY,
          name VARCHAR2(255)
        );
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.ORACLE);
    });

    it('should detect pg_dump format', () => {
      const sql = `
        SET statement_timeout = 0;
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.POSTGRESQL);
    });

    it('should prioritize dump format detection over keyword detection', () => {
      const sql = `
        SET statement_timeout = 0;
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          data BYTEA
        );
        -- Contains BLOB-like keywords but should be PostgreSQL due to pg_dump markers
      `;

      const detected = detectDatabaseType(sql);
      expect(detected).toBe(DatabaseType.POSTGRESQL);
    });
  });

  describe('sqlImportToDiagram', () => {
    it('should convert PostgreSQL SQL to diagram', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const diagram = await sqlImportToDiagram({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.POSTGRESQL,
      });

      expect(diagram.tables!).toHaveLength(1);
      expect(diagram.tables![0].name).toBe('users');
    });

    it('should convert MySQL SQL to diagram', async () => {
      const sql = `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const diagram = await sqlImportToDiagram({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.MYSQL,
      });

      expect(diagram.tables!).toHaveLength(1);
      expect(diagram.tables![0].name).toBe('users');
    });

    it('should convert SQLite SQL to diagram', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT
        );
      `;

      const diagram = await sqlImportToDiagram({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.SQLITE,
      });

      expect(diagram.tables!).toHaveLength(1);
      expect(diagram.tables![0].name).toBe('users');
    });

    it('should convert Oracle SQL to diagram', async () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY,
          name VARCHAR2(255)
        );
      `;

      const diagram = await sqlImportToDiagram({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.ORACLE,
      });

      expect(diagram.tables!).toHaveLength(1);
      expect(diagram.tables![0].name).toBe('users');
    });

    it('should convert SQL Server SQL to diagram', async () => {
      const sql = `
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255)
        );
      `;

      const diagram = await sqlImportToDiagram({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.SQL_SERVER,
      });

      expect(diagram.tables!).toHaveLength(1);
      expect(diagram.tables![0].name).toBe('users');
    });

    it('should auto-detect database type when GENERIC', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
      `;

      const diagram = await sqlImportToDiagram({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.GENERIC,
      });

      expect(diagram.tables!).toHaveLength(1);
    });
  });

  describe('parseSQLError', () => {
    it('should return success for valid SQL', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
      `;

      const result = await parseSQLError({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.POSTGRESQL,
      });

      expect(result.success).toBe(true);
    });

    it('should return error for invalid SQL', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
          -- Missing comma
          name VARCHAR(255)
        );
      `;

      const result = await parseSQLError({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.POSTGRESQL,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate Oracle SQL', async () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY
        );
      `;

      const result = await parseSQLError({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.ORACLE,
      });

      expect(result.success).toBe(true);
    });

    it('should validate SQL Server SQL', async () => {
      const sql = `
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY
        );
      `;

      const result = await parseSQLError({
        sqlContent: sql,
        sourceDatabaseType: DatabaseType.SQL_SERVER,
      });

      expect(result.success).toBe(true);
    });
  });
});

