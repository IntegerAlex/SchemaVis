import { describe, it, expect } from 'vitest';
import { generateId, generateDiagramId, deepCopy, cn } from '../utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of consistent format', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('generateDiagramId', () => {
    it('should generate a unique diagram ID', () => {
      const id1 = generateDiagramId();
      const id2 = generateDiagramId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs of consistent format', () => {
      const id = generateDiagramId();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(29);
    });
  });

  describe('deepCopy', () => {
    it('should create a deep copy of an object', () => {
      const original = { a: 1, b: { c: 2 } };
      const copied = deepCopy(original);

      expect(copied).toEqual(original);
      expect(copied).not.toBe(original);
      expect(copied.b).not.toBe(original.b);
    });

    it('should handle arrays', () => {
      const original = [1, 2, { a: 3 }];
      const copied = deepCopy(original);

      expect(copied).toEqual(original);
      expect(copied).not.toBe(original);
      expect(copied[2]).not.toBe(original[2]);
    });

    it('should handle null and undefined', () => {
      expect(deepCopy(null)).toBeNull();
      expect(deepCopy(undefined)).toBeUndefined();
    });
  });

  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'hidden', 'visible');
      expect(result).toContain('base');
      expect(result).toContain('visible');
      expect(result).not.toContain('hidden');
    });
  });
});

