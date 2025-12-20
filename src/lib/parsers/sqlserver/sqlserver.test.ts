import { describe, it, expect } from 'vitest';
import { fromSQLServer } from './sqlserver';

describe('SQL Server Parser', () => {
  describe('Basic CREATE TABLE', () => {
    it('should parse a simple table', async () => {
      const sql = `
        CREATE TABLE [dbo].[users] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [name] NVARCHAR(255) NOT NULL,
          [email] NVARCHAR(255)
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables).toHaveLength(1);
      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].schema).toBe('dbo');
      expect(result.tables[0].columns).toHaveLength(3);
      expect(result.tables[0].columns[0].name).toBe('id');
      expect(result.tables[0].columns[0].type).toBe('int');
      expect(result.tables[0].columns[0].primaryKey).toBe(true);
      expect(result.tables[0].columns[0].increment).toBe(true);
    });

    it('should parse table without schema (defaults to dbo)', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY,
          name NVARCHAR(255)
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables[0].schema).toBe('dbo');
    });

    it('should parse SQL Server data types', async () => {
      const sql = `
        CREATE TABLE test (
          id INT,
          name NVARCHAR(255),
          price DECIMAL(10, 2),
          created DATETIME2,
          guid UNIQUEIDENTIFIER,
          data VARBINARY(MAX)
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables[0].columns[1].type).toBe('nvarchar');
      expect(result.tables[0].columns[2].type).toBe('decimal');
      expect(result.tables[0].columns[3].type).toBe('datetime2');
      expect(result.tables[0].columns[4].type).toBe('uniqueidentifier');
    });
  });

  describe('Foreign Keys', () => {
    it('should parse foreign key constraints', async () => {
      const sql = `
        CREATE TABLE [dbo].[users] (
          [id] INT PRIMARY KEY,
          [name] NVARCHAR(255)
        );
        
        CREATE TABLE [dbo].[posts] (
          [id] INT PRIMARY KEY,
          [user_id] INT,
          CONSTRAINT [FK_posts_users] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id])
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables).toHaveLength(2);
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].sourceTable).toBe('posts');
      expect(result.relationships[0].sourceColumn).toBe('user_id');
      expect(result.tables[0].name).toBe('users');
      expect(result.relationships[0].targetTable).toBe('users');
    });

    it('should parse ALTER TABLE foreign keys', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        
        CREATE TABLE posts (
          id INT PRIMARY KEY,
          user_id INT
        );
        
        ALTER TABLE posts ADD CONSTRAINT FK_posts_users FOREIGN KEY (user_id) REFERENCES users(id);
      `;

      const result = await fromSQLServer(sql);

      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].name).toBe('FK_posts_users');
    });
  });

  describe('IDENTITY Columns', () => {
    it('should handle IDENTITY columns', async () => {
      const sql = `
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255)
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables[0].columns[0].increment).toBe(true);
    });
  });

  describe('Preprocessing', () => {
    it('should handle GO statements', async () => {
      const sql = `
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
        GO
        CREATE TABLE posts (
          id INT PRIMARY KEY
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables).toHaveLength(2);
    });

    it('should handle SET statements', async () => {
      const sql = `
        SET ANSI_NULLS ON;
        SET QUOTED_IDENTIFIER ON;
        CREATE TABLE users (
          id INT PRIMARY KEY
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables).toHaveLength(1);
    });

    it('should handle square brackets', async () => {
      const sql = `
        CREATE TABLE [dbo].[users] (
          [id] INT PRIMARY KEY,
          [user name] NVARCHAR(255)
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables[0].name).toBe('users');
      expect(result.tables[0].columns[1].name).toBe('user name');
    });
  });

  describe('VARCHAR(MAX)', () => {
    it('should handle VARCHAR(MAX) and NVARCHAR(MAX)', async () => {
      const sql = `
        CREATE TABLE test (
          id INT PRIMARY KEY,
          description VARCHAR(MAX),
          content NVARCHAR(MAX)
        );
      `;

      const result = await fromSQLServer(sql);

      expect(result.tables[0].columns[1].typeArgs).toBe('max');
      expect(result.tables[0].columns[2].typeArgs).toBe('max');
    });
  });
});


