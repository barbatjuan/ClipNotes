import { z } from 'zod';

export const urlSchema = z.string().url({ message: 'Debe ser una URL válida.' });

export const fileSchema = z
  .instanceof(File)
  .refine(file => file.size < 100 * 1024 * 1024, {
    message: 'El archivo debe pesar menos de 100MB.'
  });
