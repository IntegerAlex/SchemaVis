import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sqlImportToDiagram } from '@/lib/parsers';
import { DatabaseType } from '@/lib/domain/database-type';

const parseSQLSchema = z.object({
  sql: z.string().min(1, 'SQL content cannot be empty'),
});

export async function POST(request: NextRequest) {
  try {
    const start = Date.now();
    const body = await request.json();
    const { sql } = parseSQLSchema.parse(body);

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: SQL content is required' },
        { status: 400 }
      );
    }

    // Parse SQL and convert to diagram
    const diagram = await sqlImportToDiagram({
      sqlContent: sql,
      sourceDatabaseType: DatabaseType.POSTGRESQL,
      targetDatabaseType: DatabaseType.POSTGRESQL,
    });

    const durationMs = Date.now() - start;
    console.log(`[parse-sql] parsed in ${durationMs}ms`);

    return NextResponse.json({ diagram, durationMs }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || 'Failed to parse SQL' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}


