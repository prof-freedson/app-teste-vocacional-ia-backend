import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { promises as fs } from "fs";
import * as path from "path";

// Schema para validação de curso
const CourseSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  area: z.string().min(1, "Área é obrigatória"),
  descricao: z.string().optional().default(""),
  nivel: z.enum(["basico", "intermediario", "avancado"]).optional().default("basico"),
  modalidade: z.enum(["presencial", "online", "hibrido"]).optional().default("presencial"),
  duracao: z.string().optional().default(""),
  ativo: z.boolean().optional().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

const CoursesArraySchema = z.array(CourseSchema);

type Course = z.infer<typeof CourseSchema>;

// Caminhos para os arquivos de dados
const COURSES_FILE_PATH = path.join(process.cwd(), "data", "courses.json");
const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "config.json");

// Funções auxiliares para manipular arquivo de cursos
async function ensureDataDirectory() {
  const dataDir = path.dirname(COURSES_FILE_PATH);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadCourses(): Promise<Course[]> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(COURSES_FILE_PATH, "utf-8");
    const courses = JSON.parse(data);
    return CoursesArraySchema.parse(courses);
  } catch (error) {
    // Se o arquivo não existe ou está vazio, retorna array vazio
    return [];
  }
}

async function saveCourses(courses: Course[]): Promise<void> {
  await ensureDataDirectory();
  const validatedCourses = CoursesArraySchema.parse(courses);
  await fs.writeFile(COURSES_FILE_PATH, JSON.stringify(validatedCourses, null, 2), "utf-8");
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Schema para validação de configurações
const ConfigSchema = z.object({
  whatsapp: z.object({
    number: z.string().min(1, "Número do WhatsApp é obrigatório"),
    enabled: z.boolean().default(true),
    lastUpdated: z.string().optional()
  }),
  senac: z.object({
    name: z.string().default("Senac Maranhão"),
    phone: z.string().default("(98) 3216-4000"),
    website: z.string().default("www.ma.senac.br"),
    email: z.string().default("atendimento@ma.senac.br"),
    address: z.string().default("Rua do Egito, 251 - Centro, São Luís - MA")
  }).optional()
});

type Config = z.infer<typeof ConfigSchema>;

// Funções auxiliares para manipular arquivo de configurações
async function loadConfig(): Promise<Config> {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const config = JSON.parse(data);
    return ConfigSchema.parse(config);
  } catch (error) {
    // Se o arquivo não existe, retorna configuração padrão
    const defaultConfig: Config = {
      whatsapp: {
        number: "(98) 98765-4321",
        enabled: true,
        lastUpdated: new Date().toISOString()
      },
      senac: {
        name: "Senac Maranhão",
        phone: "(98) 3216-4000",
        website: "www.ma.senac.br",
        email: "atendimento@ma.senac.br",
        address: "Rua do Egito, 251 - Centro, São Luís - MA"
      }
    };
    await saveConfig(defaultConfig);
    return defaultConfig;
  }
}

async function saveConfig(config: Config): Promise<void> {
  await ensureDataDirectory();
  const configWithTimestamp = {
    ...config,
    whatsapp: {
      ...config.whatsapp,
      lastUpdated: new Date().toISOString()
    }
  };
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(configWithTimestamp, null, 2), "utf-8");
}

export async function adminRoutes(app: FastifyInstance) {
  
  // Middleware de autenticação simples (pode ser melhorado)
  app.addHook('preHandler', async (request, reply) => {
    // Permitir apenas rotas administrativas
    if (!request.url.startsWith('/admin')) {
      return;
    }
    
    // Aqui você pode adicionar autenticação mais robusta
    // Por enquanto, apenas log da tentativa de acesso
    app.log.info(`Admin access attempt: ${request.method} ${request.url}`);
  });

  // GET /admin/courses - Listar todos os cursos
  app.get("/admin/courses", async (request, reply) => {
    try {
      const courses = await loadCourses();
      
      return {
        success: true,
        data: courses,
        total: courses.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // GET /admin/courses/:id - Buscar curso por ID
  app.get("/admin/courses/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const courses = await loadCourses();
      const course = courses.find(c => c.id === id);
      
      if (!course) {
        reply.status(404);
        return {
          success: false,
          error: "Curso não encontrado"
        };
      }
      
      return {
        success: true,
        data: course,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // POST /admin/courses - Criar novo curso
  app.post("/admin/courses", {
    schema: {
      body: {
        type: 'object',
        required: ['nome', 'area'],
        properties: {
          nome: { type: 'string', minLength: 1 },
          area: { type: 'string', minLength: 1 },
          descricao: { type: 'string' },
          nivel: { type: 'string', enum: ['basico', 'intermediario', 'avancado'] },
          modalidade: { type: 'string', enum: ['presencial', 'online', 'hibrido'] },
          duracao: { type: 'string' },
          ativo: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const courseData = request.body as Omit<Course, 'id' | 'created_at' | 'updated_at'>;
      const courses = await loadCourses();
      
      const newCourse: Course = {
        ...courseData,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      courses.push(newCourse);
      await saveCourses(courses);
      
      reply.status(201);
      return {
        success: true,
        data: newCourse,
        message: "Curso criado com sucesso",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao criar curso",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // PUT /admin/courses/:id - Atualizar curso
  app.put("/admin/courses/:id", {
    schema: {
      body: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 1 },
          area: { type: 'string', minLength: 1 },
          descricao: { type: 'string' },
          nivel: { type: 'string', enum: ['basico', 'intermediario', 'avancado'] },
          modalidade: { type: 'string', enum: ['presencial', 'online', 'hibrido'] },
          duracao: { type: 'string' },
          ativo: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as Omit<Course, 'id' | 'created_at' | 'updated_at'>;
      const courses = await loadCourses();
      
      const courseIndex = courses.findIndex(c => c.id === id);
      if (courseIndex === -1) {
        reply.status(404);
        return {
          success: false,
          error: "Curso não encontrado"
        };
      }
      
      const updatedCourse: Course = {
        ...courses[courseIndex],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      courses[courseIndex] = updatedCourse;
      await saveCourses(courses);
      
      return {
        success: true,
        data: updatedCourse,
        message: "Curso atualizado com sucesso",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao atualizar curso",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // DELETE /admin/courses/:id - Deletar curso
  app.delete("/admin/courses/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const courses = await loadCourses();
      
      const courseIndex = courses.findIndex(c => c.id === id);
      if (courseIndex === -1) {
        reply.status(404);
        return {
          success: false,
          error: "Curso não encontrado"
        };
      }
      
      const deletedCourse = courses.splice(courseIndex, 1)[0];
      await saveCourses(courses);
      
      return {
        success: true,
        data: deletedCourse,
        message: "Curso deletado com sucesso",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao deletar curso",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // POST /admin/courses/import - Importar cursos de um arquivo JSON
  app.post("/admin/courses/import", {
    schema: {
      body: {
        type: "object",
        properties: {
          courses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                area: { type: "string" },
                descricao: { type: "string" },
                nivel: { type: "string" },
                modalidade: { type: "string" },
                duracao: { type: "string" }
              },
              required: ["nome", "area"]
            }
          },
          overwrite: { type: "boolean", default: false }
        },
        required: ["courses"]
      }
    }
  }, async (request, reply) => {
    try {
      const { courses: importCourses, overwrite = false } = request.body as {
        courses: Partial<Course>[];
        overwrite?: boolean;
      };
      
      let existingCourses = overwrite ? [] : await loadCourses();
      
      const processedCourses: Course[] = importCourses.map(course => ({
        id: generateId(),
        nome: course.nome || "",
        area: course.area || "",
        descricao: course.descricao || "",
        nivel: (course.nivel as any) || "basico",
        modalidade: (course.modalidade as any) || "presencial",
        duracao: course.duracao || "",
        ativo: course.ativo ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const allCourses = [...existingCourses, ...processedCourses];
      await saveCourses(allCourses);
      
      return {
        success: true,
        data: {
          imported: processedCourses.length,
          total: allCourses.length,
          courses: processedCourses
        },
        message: `${processedCourses.length} cursos importados com sucesso`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao importar cursos",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // GET /admin/courses/export - Exportar cursos
  app.get("/admin/courses/export", async (request, reply) => {
    try {
      const courses = await loadCourses();
      
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="cursos_senac_${new Date().toISOString().split('T')[0]}.json"`);
      
      return {
        success: true,
        data: courses,
        exported_at: new Date().toISOString(),
        total: courses.length
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao exportar cursos",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // GET /admin/stats - Estatísticas dos cursos
  app.get("/admin/stats", async (request, reply) => {
    try {
      const courses = await loadCourses();
      
      const stats = {
        total: courses.length,
        ativos: courses.filter(c => c.ativo).length,
        inativos: courses.filter(c => !c.ativo).length,
        por_area: courses.reduce((acc, course) => {
          acc[course.area] = (acc[course.area] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        por_nivel: courses.reduce((acc, course) => {
          acc[course.nivel || 'basico'] = (acc[course.nivel || 'basico'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        por_modalidade: courses.reduce((acc, course) => {
          acc[course.modalidade || 'presencial'] = (acc[course.modalidade || 'presencial'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
      
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao gerar estatísticas",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // GET /admin/config - Obter configurações
  app.get("/admin/config", async (request, reply) => {
    try {
      const config = await loadConfig();
      
      return {
        success: true,
        data: config,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao carregar configurações",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // PUT /admin/config/whatsapp - Atualizar configurações do WhatsApp
  app.put("/admin/config/whatsapp", {
    schema: {
      body: {
        type: "object",
        properties: {
          number: { type: "string", minLength: 1 },
          enabled: { type: "boolean" }
        },
        required: ["number"]
      }
    }
  }, async (request, reply) => {
    try {
      const { number, enabled = true } = request.body as { number: string; enabled?: boolean };
      
      // Validação básica do formato do número (aceita celular e fixo)
      const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
      if (!phoneRegex.test(number)) {
        reply.status(400);
        return {
          success: false,
          error: "Formato de número inválido. Use o formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX"
        };
      }
      
      const currentConfig = await loadConfig();
      const updatedConfig: Config = {
        ...currentConfig,
        whatsapp: {
          number,
          enabled,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await saveConfig(updatedConfig);
      
      return {
        success: true,
        data: updatedConfig.whatsapp,
        message: "Configurações do WhatsApp atualizadas com sucesso"
      };
    } catch (error) {
      app.log.error(error);
      reply.status(500);
      return {
        success: false,
        error: "Erro ao atualizar configurações do WhatsApp",
        details: error instanceof Error ? error.message : String(error)
      };
    }
  });
}

export { CourseSchema, type Course, ConfigSchema, type Config };