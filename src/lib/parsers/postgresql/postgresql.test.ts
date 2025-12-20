import { describe, it, expect } from 'vitest';
import { fromPostgres } from './postgresql';

describe('PostgreSQL Parser', () => {
  describe('Basic CREATE TABLE', () => {
    it('should parse a simple table', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns).toHaveLength(3);
      expect(result.tables[0].columns[0].name).toBe('id');
      expect(result.tables[0].columns[0].primaryKey).toBe(true);
    });

    it('should parse table with schema', async () => {
      const sql = `
        CREATE TABLE public.users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].schema).toBe('public');
    });

    it('should parse quoted identifiers', async () => {
      const sql = `
        CREATE TABLE "users" (
          "id" SERIAL PRIMARY KEY,
          "user name" VARCHAR(255)
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns[1].name).toBe('user name');
    });
  });

  describe('Foreign Keys', () => {
    it('should parse foreign key constraints', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255)
        );
        
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const result = await fromPostgres(sql);

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
          id SERIAL PRIMARY KEY
        );
        
        CREATE TABLE posts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id)
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.relationships.length).toBeGreaterThan(0);
    });
  });

  describe('ENUM Types', () => {
    it('should parse ENUM types', async () => {
      const sql = `
        CREATE TYPE status AS ENUM ('active', 'inactive');
        
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          status status
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.enums).toBeDefined();
      expect(result.enums?.length).toBeGreaterThan(0);
    });
  });

  describe('Data Types', () => {
    it('should parse PostgreSQL-specific types', async () => {
      const sql = `
        CREATE TABLE test (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          description TEXT,
          price NUMERIC(10, 2),
          created_at TIMESTAMP,
          data JSONB
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.tables[0].columns.length).toBe(6);
    });
  });

  describe('Comments Handling', () => {
    it('should handle SQL comments', async () => {
      const sql = `
        -- This is a comment
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
        /* Multi-line comment */
      `;

      const result = await fromPostgres(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
    });

    it('should handle dollar-quoted strings', async () => {
      const sql = `
        CREATE TABLE test (
          id SERIAL PRIMARY KEY,
          body TEXT DEFAULT $$This is a dollar-quoted string$$
        );
      `;

      const result = await fromPostgres(sql);

      expect(result.tables).toHaveLength(1);
    });
  });

  describe('Indexes', () => {
    it('should parse CREATE INDEX statements', async () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255)
        );
        
        CREATE INDEX idx_email ON users(email);
      `;

      const result = await fromPostgres(sql);

      expect(result.tables[0].indexes.length).toBeGreaterThan(0);
    });
  });
});

