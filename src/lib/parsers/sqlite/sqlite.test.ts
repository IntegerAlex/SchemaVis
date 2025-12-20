import { describe, it, expect } from 'vitest';
import { fromSQLite } from './sqlite';

describe('SQLite Parser', () => {
  describe('Basic CREATE TABLE', () => {
    it('should parse a simple table', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns).toHaveLength(3);
      expect(result.tables[0].columns[0].name).toBe('id');
      expect(result.tables[0].columns[0].type).toBe('INTEGER');
      expect(result.tables[0].columns[0].primaryKey).toBe(true);
      expect(result.tables[0].columns[0].increment).toBe(true);
    });

    it('should parse SQLite storage classes correctly', async () => {
      const sql = `
        CREATE TABLE test (
          id INTEGER PRIMARY KEY,
          price REAL,
          description TEXT,
          data BLOB,
          created TIMESTAMP
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.tables[0].columns[0].type).toBe('INTEGER');
      expect(result.tables[0].columns[1].type).toBe('REAL');
      expect(result.tables[0].columns[2].type).toBe('TEXT');
      expect(result.tables[0].columns[3].type).toBe('BLOB');
      expect(result.tables[0].columns[4].type).toBe('TIMESTAMP');
    });

    it('should handle INTEGER PRIMARY KEY as auto-increment', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.tables[0].columns[0].increment).toBe(true);
    });
  });

  describe('Foreign Keys', () => {
    it('should parse foreign key constraints', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT
        );
        
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.tables).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].sourceTable).toBe('posts');
      expect(result.relationships[0].sourceColumn).toBe('user_id');
      expect(result.relationships[0].targetTable).toBe('users');
      expect(result.relationships[0].targetColumn).toBe('id');
    });

    it('should parse inline REFERENCES', async () => {
      const sql = `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY
        );
        
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER REFERENCES users(id)
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.relationships.length).toBeGreaterThan(0);
    });
  });

  describe('Special Cases', () => {
    it('should handle sqlite_sequence table', async () => {
      const sql = `
        CREATE TABLE sqlite_sequence(name,seq);
      `;

      const result = await fromSQLite(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('sqlite_sequence');
    });

    it('should handle tables without column types', async () => {
      const sql = `
        CREATE TABLE simple (id, name);
      `;

      const result = await fromSQLite(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].columns.length).toBeGreaterThan(0);
    });

    it('should handle IF NOT EXISTS', async () => {
      const sql = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
    });
  });

  describe('Placeholder Tables', () => {
    it('should create placeholder tables for missing references', async () => {
      const sql = `
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const result = await fromSQLite(sql);

      // Should create placeholder for 'users' table
      const usersTable = result.tables.find((t) => t.name === 'users');
      expect(usersTable).toBeDefined();
      expect(usersTable?.columns.some((c) => c.name === 'id')).toBe(true);
    });
  });

  describe('Comments Handling', () => {
    it('should handle SQL comments', async () => {
      const sql = `
        -- This is a comment
        CREATE TABLE users (
          id INTEGER PRIMARY KEY
        );
        /* Multi-line comment */
      `;

      const result = await fromSQLite(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
    });
  });

  describe('Quoted Identifiers', () => {
    it('should handle quoted table and column names', async () => {
      const sql = `
        CREATE TABLE "users" (
          "id" INTEGER PRIMARY KEY,
          "user name" TEXT
        );
      `;

      const result = await fromSQLite(sql);

      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns[1].name).toBe('user name');
    });
  });
});

