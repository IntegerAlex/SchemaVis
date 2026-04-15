import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(error: AppError) {
  return NextResponse.json(
    {
      error: error.message,
      code: error.name,
      details: error.details,
    },
    { status: error.statusCode }
  );
}
