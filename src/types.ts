import { z } from "zod";

export const VocationalTestRequestSchema = z.object({
  nome: z.string().min(2),
  idade: z.number().positive(),
  escolaridade: z.enum(["fundamental", "medio", "superior", "pos_graduacao"]),
  area_interesse: z.enum([
    "tecnologia", 
    "saude", 
    "educacao", 
    "negocios", 
    "arte_design", 
    "gastronomia", 
    "beleza_estetica", 
    "turismo_hospitalidade",
    "industria",
    "servicos"
  ]),
  habilidades: z.array(z.string()).min(1),
  personalidade: z.enum([
    "analitico", 
    "criativo", 
    "comunicativo", 
    "lider", 
    "detalhista", 
    "inovador",
    "colaborativo",
    "empreendedor"
  ]),
  experiencia: z.string(),
  objetivos: z.string(),
  disponibilidade: z.enum(["integral", "matutino", "vespertino", "noturno", "fins_de_semana"]),
  respostas_teste: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])),
  whatsapp: z.string().optional(),
});

export type VocationalTestRequest = z.infer<typeof VocationalTestRequestSchema>;

// Manter compatibilidade com sistema antigo (pode ser removido depois)
export const DietPlanRequestSchema = z.object({
  nome: z.string().min(2),
  idade: z.number().positive(),
  altura_cm: z.number().positive(),
  peso_kg: z.number().positive(),
  sexo: z.enum(["masculino", "feminino"]),
  nivel_atividade: z.enum(["sedentario", "2x_semana", "4x_semana"]),
  objetivo: z.enum(["perda_de_peso", "hipertrofia", "manter_massa_muscular"]),
});

export type DietPlanRequest = z.infer<typeof DietPlanRequestSchema>;
