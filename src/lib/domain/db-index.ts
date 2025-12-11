import { z } from 'zod';

export const INDEX_TYPES = [
  'btree',
  'hash',
  'gist',
  'gin',
  'spgist',
  'brin',
] as const;

export type IndexType = (typeof INDEX_TYPES)[number];

export interface DBIndex {
  id: string;
  name: string;
  unique: boolean;
  fieldIds: string[];
  createdAt: number;
  type?: IndexType | null;
  isPrimaryKey?: boolean | null;
}

export const dbIndexSchema: z.ZodType<DBIndex> = z.object({
  id: z.string(),
  name: z.string(),
  unique: z.boolean(),
  fieldIds: z.array(z.string()),
  createdAt: z.number(),
  type: z.enum(INDEX_TYPES).optional(),
  isPrimaryKey: z.boolean().or(z.null()).optional(),
});


