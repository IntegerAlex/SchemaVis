import { z } from 'zod';

export interface DBField {
  id: string;
  name: string;
  type: DataType;
  primaryKey: boolean;
  unique: boolean;
  nullable: boolean;
  increment?: boolean | null;
  isArray?: boolean | null;
  createdAt: number;
  characterMaximumLength?: string | null;
  precision?: number | null;
  scale?: number | null;
  default?: string | null;
  collation?: string | null;
  comments?: string | null;
}

export interface DataType {
  id: string;
  name: string;
}

export const dataTypeSchema: z.ZodType<DataType> = z.object({
  id: z.string(),
  name: z.string(),
});

export const dbFieldSchema: z.ZodType<DBField> = z.object({
  id: z.string(),
  name: z.string(),
  type: dataTypeSchema,
  primaryKey: z.boolean(),
  unique: z.boolean(),
  nullable: z.boolean(),
  increment: z.boolean().or(z.null()).optional(),
  isArray: z.boolean().or(z.null()).optional(),
  createdAt: z.number(),
  characterMaximumLength: z.string().or(z.null()).optional(),
  precision: z.number().or(z.null()).optional(),
  scale: z.number().or(z.null()).optional(),
  default: z.string().or(z.null()).optional(),
  collation: z.string().or(z.null()).optional(),
  comments: z.string().or(z.null()).optional(),
});


