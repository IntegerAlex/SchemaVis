import { describe, it, expect } from 'vitest';
import { fromMySQL } from './mysql';

describe('MySQL Parser', () => {
  describe('Basic CREATE TABLE', () => {
    it('should parse a simple table', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns).toHaveLength(3);
      expect(result.tables[0].columns[0].name).toBe('id');
      expect(result.tables[0].columns[0].type).toBe('int');
      expect(result.tables[0].columns[0].primaryKey).toBe(true);
      expect(result.tables[0].columns[0].increment).toBe(true);
    });

    it('should parse table with schema', async () => {
      const sql = `
        CREATE TABLE \`mydb\`.\`users\` (
          id INT PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].schema).toBe('mydb');
    });

    it('should parse columns with default values', async () => {
      const sql = `
        CREATE TABLE products (
          id INT PRIMARY KEY,
          name VARCHAR(255) DEFAULT 'Unknown',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables[0].columns[1].default).toBeDefined();
      expect(result.tables[0].columns[2].default).toBeDefined();
    });
  });

  describe('Foreign Keys', () => {
    it('should parse foreign key constraints', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY,
          name VARCHAR(255)
        );
        
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].sourceTable).toBe('posts');
      expect(result.relationships[0].sourceColumn).toBe('user_id');
      expect(result.relationships[0].targetTable).toBe('users');
      expect(result.relationships[0].targetColumn).toBe('id');
    });

    it('should parse foreign keys with ON DELETE/UPDATE', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].deleteAction).toBeDefined();
    });
  });

  describe('Data Types', () => {
    it('should parse DECIMAL with precision and scale', async () => {
      const sql = `
        CREATE TABLE products (
          id INT PRIMARY KEY,
          price DECIMAL(10, 2)
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables[0].columns[1].type).toContain('decimal');
    });

    it('should parse VARCHAR with length', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY,
          name VARCHAR(100)
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables[0].columns[1].type).toContain('varchar');
    });
  });

  describe('Comments Handling', () => {
    it('should handle SQL comments', async () => {
      const sql = `
        -- This is a comment
        CREATE TABLE users (
          id INT PRIMARY KEY,
          name VARCHAR(255) -- Column comment
        );
        /* Multi-line comment */
      `;

      const result = await fromMySQL(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
    });

    it('should handle comments in strings', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY,
          description VARCHAR(255) DEFAULT 'This -- is not a comment'
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables[0].columns[1].default).toContain('--');
    });
  });

  describe('Indexes', () => {
    it('should parse CREATE INDEX statements', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY,
          email VARCHAR(255)
        );
        
        CREATE INDEX idx_email ON users(email);
      `;

      const result = await fromMySQL(sql);

      expect(result.tables[0].indexes.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle IF NOT EXISTS', async () => {
      const sql = `
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
    });

    it('should handle quoted identifiers', async () => {
      const sql = `
        CREATE TABLE \`users\` (
          \`id\` INT PRIMARY KEY,
          \`user name\` VARCHAR(255)
        );
      `;

      const result = await fromMySQL(sql);

      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns[1].name).toBe('user name');
    });
  });
});

