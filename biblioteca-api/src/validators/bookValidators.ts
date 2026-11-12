import { z } from "zod";

export const createBookSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio"),
    author: z.string().trim().min(1, "El autor es obligatorio"),
    publishedYear: z.number().int("El año debe ser un número entero").optional(),
    genre: z.string().trim().min(1, "El género no puede estar vacío").optional(),
    available: z.boolean().optional(),
  })
  .strict();

export const updateBookSchema = createBookSchema
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Enviá al menos un campo para actualizar",
  });
