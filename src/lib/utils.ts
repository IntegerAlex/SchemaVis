import { customAlphabet } from 'nanoid';
import { type ClassValue, clsx } from 'clsx';

const randomId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 25);

export const generateId = () => randomId();

export const generateDiagramId = () => {
  return randomId(29);
};

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}


