import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sqlImportToDiagram } from '@/lib/parsers';
import { DatabaseType } from '@/lib/domain/database-type';

const parseSQLSchema = z.object({
  sql: z
    .string()
    .min(1, 'SQL content cannot be empty')
    .refine(
      (val) => val.toLowerCase().includes('create table'),
      'SQL must include at least one CREATE TABLE statement'
    ),
  databaseType: z.nativeEnum(DatabaseType).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const start = Date.now();
    const body = await request.json();
    const { sql, databaseType } = parseSQLSchema.parse(body);

    if (!sql || typeof sql !== 'string' || !sql.toLowerCase().includes('create table')) {
      return NextResponse.json(
        { error: 'Invalid request: only .sql with CREATE TABLE is allowed' },
        { status: 400 }
      );
    }

    // Parse SQL and convert to diagram
    console.log(`[parse-sql] databaseType received: ${databaseType}, type: ${typeof databaseType}`);
    const diagram = await sqlImportToDiagram({
      sqlContent: sql,
      sourceDatabaseType: databaseType ?? DatabaseType.GENERIC,
      targetDatabaseType: DatabaseType.GENERIC,
    });

    const durationMs = Date.now() - start;
    console.log(`[parse-sql] parsed in ${durationMs}ms`);

    return NextResponse.json({ diagram, durationMs }, { status: 200 });
  } catch (error) {
    console.error('[parse-sql] Error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('[parse-sql] Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('[parse-sql] Error message:', error.message);
      console.error('[parse-sql] Error stack:', error.stack);
      return NextResponse.json(
        { error: error.message || 'Failed to parse SQL' },
        { status: 500 }
      );
    }

    console.error('[parse-sql] Unknown error type:', typeof error, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


