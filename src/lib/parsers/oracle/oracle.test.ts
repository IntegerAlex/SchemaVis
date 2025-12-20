import { describe, it, expect } from 'vitest';
import { fromOracle, isOracleFormat } from './oracle';

describe('Oracle Parser', () => {
  describe('isOracleFormat', () => {
    it('should detect Oracle SQL by VARCHAR2', () => {
      const sql = 'CREATE TABLE users (id NUMBER(10), name VARCHAR2(255));';
      expect(isOracleFormat(sql)).toBe(true);
    });

    it('should detect Oracle SQL by NUMBER(', () => {
      const sql = 'CREATE TABLE products (id NUMBER(10, 2));';
      expect(isOracleFormat(sql)).toBe(true);
    });

    it('should detect Oracle SQL by SYSDATE', () => {
      const sql = 'CREATE TABLE orders (created_at DATE DEFAULT SYSDATE);';
      expect(isOracleFormat(sql)).toBe(true);
    });

    it('should detect Oracle SQL by CREATE SEQUENCE', () => {
      const sql = 'CREATE SEQUENCE user_seq START WITH 1;';
      expect(isOracleFormat(sql)).toBe(true);
    });

    it('should not detect PostgreSQL as Oracle', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY);';
      expect(isOracleFormat(sql)).toBe(false);
    });
  });

  describe('Basic CREATE TABLE', () => {
    it('should parse a simple table', async () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY,
          name VARCHAR2(255) NOT NULL,
          email VARCHAR2(255)
        );
      `;

      const result = await fromOracle(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns).toHaveLength(3);
      expect(result.tables[0].columns[0].name).toBe('id');
      expect(result.tables[0].columns[0].type).toBe('number');
      expect(result.tables[0].columns[0].primaryKey).toBe(true);
    });

    it('should parse table with schema', async () => {
      const sql = `
        CREATE TABLE hr.users (
          id NUMBER(10) PRIMARY KEY,
          name VARCHAR2(255)
        );
      `;

      const result = await fromOracle(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].schema).toBe('hr');
    });

    it('should parse Oracle data types', async () => {
      const sql = `
        CREATE TABLE test (
          id NUMBER(10),
          name VARCHAR2(255),
          description CLOB,
          data BLOB,
          price NUMBER(10, 2),
          created DATE
        );
      `;

      const result = await fromOracle(sql);

      expect(result.tables[0].columns[1].type).toBe('varchar2');
      expect(result.tables[0].columns[2].type).toBe('clob');
      expect(result.tables[0].columns[3].type).toBe('blob');
      expect(result.tables[0].columns[4].type).toBe('number');
    });
  });

  describe('Foreign Keys', () => {
    it('should parse foreign key constraints', async () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY,
          name VARCHAR2(255)
        );
        
        CREATE TABLE posts (
          id NUMBER(10) PRIMARY KEY,
          user_id NUMBER(10),
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `;

      const result = await fromOracle(sql);

      expect(result.tables).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].sourceTable).toBe('posts');
      expect(result.relationships[0].sourceColumn).toBe('user_id');
      expect(result.relationships[0].targetTable).toBe('users');
      expect(result.relationships[0].targetColumn).toBe('id');
    });

    it('should parse ALTER TABLE foreign keys', async () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY
        );
        
        CREATE TABLE posts (
          id NUMBER(10) PRIMARY KEY,
          user_id NUMBER(10)
        );
        
        ALTER TABLE posts ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id);
      `;

      const result = await fromOracle(sql);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('fk_user');
    });
  });

  describe('Sequences and Identity', () => {
    it('should handle GENERATED ALWAYS AS IDENTITY', async () => {
      const sql = `
        CREATE TABLE users (
          id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          name VARCHAR2(255)
        );
      `;

      const result = await fromOracle(sql);

      expect(result.tables[0].columns[0].increment).toBe(true);
    });
  });

  describe('Preprocessing', () => {
    it('should handle Oracle-specific commands', async () => {
      const sql = `
        SET DEFINE OFF;
        PROMPT Creating table;
        CREATE TABLE users (
          id NUMBER(10) PRIMARY KEY
        );
        /
      `;

      const result = await fromOracle(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
    });
  });
});


