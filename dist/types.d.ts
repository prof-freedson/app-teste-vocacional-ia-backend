import { z } from "zod";
export declare const VocationalTestRequestSchema: z.ZodObject<{
    nome: z.ZodString;
    idade: z.ZodNumber;
    escolaridade: z.ZodEnum<["fundamental", "medio", "superior", "pos_graduacao"]>;
    area_interesse: z.ZodEnum<["tecnologia", "saude", "educacao", "negocios", "arte_design", "gastronomia", "beleza_estetica", "turismo_hospitalidade", "industria", "servicos"]>;
    habilidades: z.ZodArray<z.ZodString, "many">;
    personalidade: z.ZodEnum<["analitico", "criativo", "comunicativo", "lider", "detalhista", "inovador", "colaborativo", "empreendedor"]>;
    experiencia: z.ZodString;
    objetivos: z.ZodString;
    disponibilidade: z.ZodEnum<["integral", "matutino", "vespertino", "noturno", "fins_de_semana"]>;
    respostas_teste: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodArray<z.ZodString, "many">]>>;
    whatsapp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nome: string;
    idade: number;
    escolaridade: "fundamental" | "medio" | "superior" | "pos_graduacao";
    area_interesse: "tecnologia" | "saude" | "educacao" | "negocios" | "arte_design" | "gastronomia" | "beleza_estetica" | "turismo_hospitalidade" | "industria" | "servicos";
    habilidades: string[];
    personalidade: "analitico" | "criativo" | "comunicativo" | "lider" | "detalhista" | "inovador" | "colaborativo" | "empreendedor";
    experiencia: string;
    objetivos: string;
    disponibilidade: "integral" | "matutino" | "vespertino" | "noturno" | "fins_de_semana";
    respostas_teste: Record<string, string | number | string[]>;
    whatsapp?: string | undefined;
}, {
    nome: string;
    idade: number;
    escolaridade: "fundamental" | "medio" | "superior" | "pos_graduacao";
    area_interesse: "tecnologia" | "saude" | "educacao" | "negocios" | "arte_design" | "gastronomia" | "beleza_estetica" | "turismo_hospitalidade" | "industria" | "servicos";
    habilidades: string[];
    personalidade: "analitico" | "criativo" | "comunicativo" | "lider" | "detalhista" | "inovador" | "colaborativo" | "empreendedor";
    experiencia: string;
    objetivos: string;
    disponibilidade: "integral" | "matutino" | "vespertino" | "noturno" | "fins_de_semana";
    respostas_teste: Record<string, string | number | string[]>;
    whatsapp?: string | undefined;
}>;
export type VocationalTestRequest = z.infer<typeof VocationalTestRequestSchema>;
export declare const DietPlanRequestSchema: z.ZodObject<{
    nome: z.ZodString;
    idade: z.ZodNumber;
    altura_cm: z.ZodNumber;
    peso_kg: z.ZodNumber;
    sexo: z.ZodEnum<["masculino", "feminino"]>;
    nivel_atividade: z.ZodEnum<["sedentario", "2x_semana", "4x_semana"]>;
    objetivo: z.ZodEnum<["perda_de_peso", "hipertrofia", "manter_massa_muscular"]>;
}, "strip", z.ZodTypeAny, {
    nome: string;
    idade: number;
    altura_cm: number;
    peso_kg: number;
    sexo: "masculino" | "feminino";
    nivel_atividade: "sedentario" | "2x_semana" | "4x_semana";
    objetivo: "perda_de_peso" | "hipertrofia" | "manter_massa_muscular";
}, {
    nome: string;
    idade: number;
    altura_cm: number;
    peso_kg: number;
    sexo: "masculino" | "feminino";
    nivel_atividade: "sedentario" | "2x_semana" | "4x_semana";
    objetivo: "perda_de_peso" | "hipertrofia" | "manter_massa_muscular";
}>;
export type DietPlanRequest = z.infer<typeof DietPlanRequestSchema>;
//# sourceMappingURL=types.d.ts.map