import { z } from 'zod';

export interface DBRelationship {
  id: string;
  name: string;
  sourceSchema?: string | null;
  sourceTableId: string;
  targetSchema?: string | null;
  targetTableId: string;
  sourceFieldId: string;
  targetFieldId: string;
  sourceCardinality: Cardinality;
  targetCardinality: Cardinality;
  createdAt: number;
}

export const dbRelationshipSchema: z.ZodType<DBRelationship> = z.object({
  id: z.string(),
  name: z.string(),
  sourceSchema: z.string().or(z.null()).optional(),
  sourceTableId: z.string(),
  targetSchema: z.string().or(z.null()).optional(),
  targetTableId: z.string(),
  sourceFieldId: z.string(),
  targetFieldId: z.string(),
  sourceCardinality: z.union([z.literal('one'), z.literal('many')]),
  targetCardinality: z.union([z.literal('one'), z.literal('many')]),
  createdAt: z.number(),
});

export type Cardinality = 'one' | 'many';


