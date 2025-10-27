import { z } from "zod";

const isValidDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

export const reportInputSchema = z.object({
  title: z
    .string({ required_error: "El titulo es obligatorio." })
    .trim()
    .min(3, { message: "El titulo debe tener al menos 3 caracteres." })
    .max(120, { message: "El titulo debe tener maximo 120 caracteres." }),
  description: z
    .string({ required_error: "La descripcion es obligatoria." })
    .trim()
    .min(10, { message: "La descripcion debe tener al menos 10 caracteres." })
    .max(2000, { message: "La descripcion debe tener maximo 2000 caracteres." }),
  date: z
    .string({ required_error: "La fecha es obligatoria." })
    .trim()
    .refine(isValidDate, { message: "La fecha debe tener un formato valido (YYYY-MM-DD)." }),
  category: z
    .string({ required_error: "La categoria es obligatoria." })
    .trim()
    .min(3, { message: "La categoria debe tener al menos 3 caracteres." })
    .max(50, { message: "La categoria debe tener maximo 50 caracteres." }),
  uid: z
    .string({ required_error: "El identificador de usuario es obligatorio." })
    .trim()
    .min(1, { message: "El identificador de usuario es obligatorio." }),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
