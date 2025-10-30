import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const teacherProfileSchema = z.object({
  nombre: z
    .string()
    .min(3, "Incluye tu nombre completo.")
    .max(120, "El nombre no puede exceder 120 caracteres."),
  plantel: z.string().min(2, "Indica el plantel al que perteneces.").max(80, "El nombre del plantel no puede exceder 80 caracteres."),
});

export type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;

interface TeacherProfileFormProps {
  defaultValues?: Partial<TeacherProfileFormData>;
  submitting?: boolean;
  serverError?: string | null;
  submitLabel?: string;
  onSubmit: (data: TeacherProfileFormData) => Promise<void> | void;
}

const TeacherProfileForm: React.FC<TeacherProfileFormProps> = ({
  defaultValues,
  submitting = false,
  serverError = null,
  submitLabel = "Guardar datos docentes",
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<TeacherProfileFormData>({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      nombre: defaultValues?.nombre ?? "",
      plantel: defaultValues?.plantel ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values))} className="space-y-4">
      <div>
        <label className="block mb-1 text-sm text-gray-300" htmlFor="teacher-name">
          Nombre completo
        </label>
        <input
          id="teacher-name"
          type="text"
          className="input-field w-full"
          placeholder="Ej. Profa. Ana López Martínez"
          autoComplete="name"
          {...register("nombre")}
          disabled={submitting}
        />
        {errors.nombre ? <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p> : null}
      </div>

      <div>
        <label className="block mb-1 text-sm text-gray-300" htmlFor="teacher-campus">
          Plantel
        </label>
        <input
          id="teacher-campus"
          type="text"
          className="input-field w-full"
          placeholder="Ej. Secundaria Técnica 42"
          autoComplete="organization"
          {...register("plantel")}
          disabled={submitting}
        />
        {errors.plantel ? <p className="text-xs text-red-400 mt-1">{errors.plantel.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-red-400">{serverError}</p> : null}

      <button type="submit" className="btn btn-primary w-full" disabled={submitting || !isDirty}>
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
};

export default TeacherProfileForm;
