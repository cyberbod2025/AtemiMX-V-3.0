import type { UserRole } from "./modules/sase310/auth/services/userService";

export interface DepartmentBranding {
  key: UserRole | "general";
  label: string;
  image: string;
  caption?: string;
}

const GENERAL_IMAGE = "/branding/superio al panel.png";

export const GENERAL_BRANDING: DepartmentBranding = {
  key: "general",
  label: "AtemiMX · SASE-310",
  image: GENERAL_IMAGE,
  caption: "Arquitectura S-SDLC",
};

const ROLE_BRANDING: Record<UserRole, DepartmentBranding> = {
  teacher: { key: "teacher", label: "Atem · Docentes", image: "/branding/docentes.png" },
  admin: { key: "admin", label: "Atem · Dirección", image: "/branding/direccion.png" },
  guidance: { key: "guidance", label: "Atem · Orientación", image: "/branding/orientacion.png" },
  socialWork: { key: "socialWork", label: "Atem · Trabajo Social", image: "/branding/t social.png" },
  prefect: { key: "prefect", label: "Atem · Prefectura", image: "/branding/prefectura.png" },
  medical: { key: "medical", label: "Atem · Enfermería", image: "/branding/enfermeria.png" },
  clerk: { key: "clerk", label: "Atem · Secretaría", image: "/branding/direccion.png" },
};

const PRIMARY_DEPARTMENT_ORDER: ReadonlyArray<UserRole> = [
  "teacher",
  "admin",
  "guidance",
  "socialWork",
  "prefect",
];

export const DEPARTMENT_BRANDS: ReadonlyArray<DepartmentBranding> = PRIMARY_DEPARTMENT_ORDER.map(
  (role) => ROLE_BRANDING[role],
);

export const getBrandingForRole = (role?: UserRole | null): DepartmentBranding => {
  if (!role) {
    return GENERAL_BRANDING;
  }
  return ROLE_BRANDING[role] ?? GENERAL_BRANDING;
};

export const getAllBranding = (): ReadonlyArray<DepartmentBranding> => [
  GENERAL_BRANDING,
  ROLE_BRANDING.teacher,
  ROLE_BRANDING.admin,
  ROLE_BRANDING.guidance,
  ROLE_BRANDING.socialWork,
  ROLE_BRANDING.prefect,
  ROLE_BRANDING.medical,
  ROLE_BRANDING.clerk,
];
