import type { FastifyInstance } from "fastify";
import { z } from "zod";
declare const CourseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    nome: z.ZodString;
    area: z.ZodString;
    descricao: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    nivel: z.ZodDefault<z.ZodOptional<z.ZodEnum<["basico", "intermediario", "avancado"]>>>;
    modalidade: z.ZodDefault<z.ZodOptional<z.ZodEnum<["presencial", "online", "hibrido"]>>>;
    duracao: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    ativo: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nome: string;
    area: string;
    descricao: string;
    nivel: "basico" | "intermediario" | "avancado";
    modalidade: "presencial" | "online" | "hibrido";
    duracao: string;
    ativo: boolean;
    id?: string | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    nome: string;
    area: string;
    id?: string | undefined;
    descricao?: string | undefined;
    nivel?: "basico" | "intermediario" | "avancado" | undefined;
    modalidade?: "presencial" | "online" | "hibrido" | undefined;
    duracao?: string | undefined;
    ativo?: boolean | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
type Course = z.infer<typeof CourseSchema>;
declare const ConfigSchema: z.ZodObject<{
    whatsapp: z.ZodObject<{
        number: z.ZodString;
        enabled: z.ZodDefault<z.ZodBoolean>;
        lastUpdated: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        number: string;
        enabled: boolean;
        lastUpdated?: string | undefined;
    }, {
        number: string;
        enabled?: boolean | undefined;
        lastUpdated?: string | undefined;
    }>;
    senac: z.ZodOptional<z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        website: z.ZodDefault<z.ZodString>;
        email: z.ZodDefault<z.ZodString>;
        address: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        phone: string;
        website: string;
        email: string;
        address: string;
    }, {
        name?: string | undefined;
        phone?: string | undefined;
        website?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    whatsapp: {
        number: string;
        enabled: boolean;
        lastUpdated?: string | undefined;
    };
    senac?: {
        name: string;
        phone: string;
        website: string;
        email: string;
        address: string;
    } | undefined;
}, {
    whatsapp: {
        number: string;
        enabled?: boolean | undefined;
        lastUpdated?: string | undefined;
    };
    senac?: {
        name?: string | undefined;
        phone?: string | undefined;
        website?: string | undefined;
        email?: string | undefined;
        address?: string | undefined;
    } | undefined;
}>;
type Config = z.infer<typeof ConfigSchema>;
export declare function adminRoutes(app: FastifyInstance): Promise<void>;
export { CourseSchema, type Course, ConfigSchema, type Config };
//# sourceMappingURL=admin.d.ts.map