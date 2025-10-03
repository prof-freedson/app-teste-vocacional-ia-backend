import { z } from "zod";
import { openai } from "../lib/openai";
import fs from "fs/promises";
import path from "path";
import { vocationalOrchestrator, questionAgent, analysisAgent, courseAgent, whatsAppAgent, AgentLogger } from "../agents";
// Função para carregar cursos do sistema administrativo
async function loadCoursesFromAdmin() {
    try {
        const coursesPath = path.join(process.cwd(), "data", "courses.json");
        const data = await fs.readFile(coursesPath, "utf-8");
        const courses = JSON.parse(data);
        return courses.filter(course => course.ativo); // Apenas cursos ativos
    }
    catch (error) {
        console.error("Erro ao carregar cursos do sistema administrativo:", error);
        return [];
    }
}
/**
 * Rotas para agentes especializados
 * Permite acesso individual a cada agente
 */
export async function agentRoutes(fastify) {
    // Rota para geração de perguntas vocacionais
    fastify.post("/agents/questions", {
        schema: {
            body: {
                type: "object",
                properties: {
                    questionCount: { type: "number", default: 10 },
                    userProfile: { type: "object" },
                    difficulty: { type: "string", enum: ["basic", "intermediate", "advanced"] }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { questionCount = 10, userProfile, difficulty } = request.body;
            AgentLogger.logAgentCall('QuestionAgent', 'generateQuestionSet', Date.now());
            const questions = await questionAgent.generateQuestionSet(userProfile || {}, questionCount);
            return {
                success: true,
                data: questions,
                metadata: {
                    agent: 'questions',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            AgentLogger.logError('QuestionAgent', 'generateQuestionSet', error);
            reply.status(500);
            return {
                success: false,
                error: "Erro ao gerar perguntas vocacionais",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // Rota para análise vocacional apenas
    fastify.post("/agents/analysis", {
        schema: {
            body: {
                type: "object",
                properties: {
                    nome: { type: "string", minLength: 2 },
                    idade: { type: "number", minimum: 1 },
                    escolaridade: {
                        type: "string",
                        enum: ["fundamental", "medio", "superior", "pos_graduacao"]
                    },
                    area_interesse: {
                        type: "string",
                        enum: [
                            "tecnologia", "saude", "educacao", "negocios",
                            "arte_design", "gastronomia", "beleza_estetica",
                            "turismo_hospitalidade", "industria", "servicos"
                        ]
                    },
                    habilidades: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 1
                    },
                    personalidade: {
                        type: "string",
                        enum: [
                            "analitico", "criativo", "comunicativo", "lider",
                            "detalhista", "inovador", "colaborativo", "empreendedor"
                        ]
                    },
                    experiencia: { type: "string" },
                    objetivos: { type: "string" },
                    disponibilidade: {
                        type: "string",
                        enum: ["integral", "matutino", "vespertino", "noturno", "fins_de_semana"]
                    },
                    respostas_teste: { type: "object" },
                    whatsapp: { type: "string" }
                },
                required: [
                    "nome", "idade", "escolaridade", "area_interesse",
                    "habilidades", "personalidade", "experiencia",
                    "objetivos", "disponibilidade", "respostas_teste"
                ]
            }
        }
    }, async (request, reply) => {
        try {
            const userRequest = request.body;
            AgentLogger.logAgentCall('AnalysisAgent', 'analyzeVocationalProfile', Date.now());
            const analysis = await analysisAgent.analyzeVocationalProfile(userRequest);
            return {
                success: true,
                data: analysis,
                metadata: {
                    agent: 'analysis',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            AgentLogger.logError('AnalysisAgent', 'analyzeVocationalProfile', error);
            reply.status(500);
            return {
                success: false,
                error: "Erro na análise vocacional",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // Rota para recomendação de cursos apenas
    fastify.post("/agents/courses", {
        schema: {
            body: {
                type: "object",
                properties: {
                    vocationalProfile: { type: "object" },
                    userRequest: {
                        type: "object",
                        properties: {
                            nome: { type: "string", minLength: 2 },
                            idade: { type: "number", minimum: 1 },
                            escolaridade: {
                                type: "string",
                                enum: ["fundamental", "medio", "superior", "pos_graduacao"]
                            },
                            area_interesse: {
                                type: "string",
                                enum: [
                                    "tecnologia", "saude", "educacao", "negocios",
                                    "arte_design", "gastronomia", "beleza_estetica",
                                    "turismo_hospitalidade", "industria", "servicos"
                                ]
                            },
                            habilidades: {
                                type: "array",
                                items: { type: "string" },
                                minItems: 1
                            },
                            personalidade: {
                                type: "string",
                                enum: [
                                    "analitico", "criativo", "comunicativo", "lider",
                                    "detalhista", "inovador", "colaborativo", "empreendedor"
                                ]
                            },
                            experiencia: { type: "string" },
                            objetivos: { type: "string" },
                            disponibilidade: {
                                type: "string",
                                enum: ["integral", "matutino", "vespertino", "noturno", "fins_de_semana"]
                            },
                            respostas_teste: { type: "object" },
                            whatsapp: { type: "string" }
                        },
                        required: [
                            "nome", "idade", "escolaridade", "area_interesse",
                            "habilidades", "personalidade", "experiencia",
                            "objetivos", "disponibilidade", "respostas_teste"
                        ]
                    },
                    area: { type: "string" },
                    maxCourses: { type: "number", default: 5 }
                },
                required: ["userRequest"]
            }
        }
    }, async (request, reply) => {
        try {
            const { vocationalProfile, userRequest, area, maxCourses } = request.body;
            AgentLogger.logAgentCall('CourseAgent', 'recommendCourses', Date.now());
            let courses;
            if (area) {
                courses = await courseAgent.recommendCoursesForArea(area, userRequest, maxCourses);
            }
            else if (vocationalProfile) {
                courses = await courseAgent.recommendCourses(vocationalProfile, userRequest);
            }
            else {
                // Se não tem perfil vocacional, gera um básico primeiro
                const analysis = await analysisAgent.analyzeVocationalProfile(userRequest);
                courses = await courseAgent.recommendCourses(analysis, userRequest);
            }
            return {
                success: true,
                data: courses,
                metadata: {
                    agent: 'courses',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            AgentLogger.logError('CourseAgent', 'recommendCourses', error);
            reply.status(500);
            return {
                success: false,
                error: "Erro na recomendação de cursos",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // Rota para formatação WhatsApp
    fastify.post("/agents/whatsapp", {
        schema: {
            body: {
                type: "object",
                properties: {
                    userRequest: {
                        type: "object",
                        properties: {
                            nome: { type: "string", minLength: 2 },
                            idade: { type: "number", minimum: 1 },
                            escolaridade: {
                                type: "string",
                                enum: ["fundamental", "medio", "superior", "pos_graduacao"]
                            },
                            area_interesse: {
                                type: "string",
                                enum: [
                                    "tecnologia", "saude", "educacao", "negocios",
                                    "arte_design", "gastronomia", "beleza_estetica",
                                    "turismo_hospitalidade", "industria", "servicos"
                                ]
                            },
                            habilidades: {
                                type: "array",
                                items: { type: "string" },
                                minItems: 1
                            },
                            personalidade: {
                                type: "string",
                                enum: [
                                    "analitico", "criativo", "comunicativo", "lider",
                                    "detalhista", "inovador", "colaborativo", "empreendedor"
                                ]
                            },
                            experiencia: { type: "string" },
                            objetivos: { type: "string" },
                            disponibilidade: {
                                type: "string",
                                enum: ["integral", "matutino", "vespertino", "noturno", "fins_de_semana"]
                            },
                            respostas_teste: { type: "object" },
                            whatsapp: { type: "string" }
                        },
                        required: [
                            "nome", "idade", "escolaridade", "area_interesse",
                            "habilidades", "personalidade", "experiencia",
                            "objetivos", "disponibilidade", "respostas_teste"
                        ]
                    },
                    vocationalAnalysis: { type: "object" },
                    courseRecommendations: { type: "object" },
                    messageType: {
                        type: "string",
                        enum: ["resultado_completo", "resumo_rapido", "convite_matricula", "lembrete_followup"],
                        default: "resultado_completo"
                    }
                },
                required: ["userRequest"]
            }
        }
    }, async (request, reply) => {
        try {
            const { userRequest, vocationalAnalysis, courseRecommendations, messageType = "resultado_completo" } = request.body;
            AgentLogger.logAgentCall('WhatsAppAgent', 'formatMessage', Date.now());
            let message;
            switch (messageType) {
                case "resumo_rapido":
                    if (!vocationalAnalysis || !courseRecommendations) {
                        throw new Error("Análise vocacional e recomendações são necessárias para resumo rápido");
                    }
                    message = await whatsAppAgent.formatQuickSummary(userRequest.nome, vocationalAnalysis.area_principal, courseRecommendations.curso_prioritario?.nome);
                    break;
                case "resultado_completo":
                    if (!vocationalAnalysis || !courseRecommendations) {
                        // Gera análise e cursos se não fornecidos
                        const analysis = await analysisAgent.analyzeVocationalProfile(userRequest);
                        const courses = await courseAgent.recommendCourses(analysis, userRequest);
                        message = await whatsAppAgent.formatVocationalResult(userRequest, analysis, courses);
                    }
                    else {
                        message = await whatsAppAgent.formatVocationalResult(userRequest, vocationalAnalysis, courseRecommendations);
                    }
                    break;
                default:
                    throw new Error(`Tipo de mensagem não suportado: ${messageType}`);
            }
            return {
                success: true,
                data: message,
                metadata: {
                    agent: 'whatsapp',
                    messageType,
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            AgentLogger.logError('WhatsAppAgent', 'formatMessage', error);
            reply.status(500);
            return {
                success: false,
                error: "Erro na formatação WhatsApp",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // Rota para workflow completo (orquestrador)
    fastify.post("/agents/workflow", {
        schema: {
            body: {
                type: "object",
                properties: {
                    nome: { type: "string", minLength: 2 },
                    idade: { type: "number", minimum: 1 },
                    escolaridade: {
                        type: "string",
                        enum: ["fundamental", "medio", "superior", "pos_graduacao"]
                    },
                    area_interesse: {
                        type: "string",
                        enum: [
                            "tecnologia", "saude", "educacao", "negocios",
                            "arte_design", "gastronomia", "beleza_estetica",
                            "turismo_hospitalidade", "industria", "servicos"
                        ]
                    },
                    habilidades: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 1
                    },
                    personalidade: {
                        type: "string",
                        enum: [
                            "analitico", "criativo", "comunicativo", "lider",
                            "detalhista", "inovador", "colaborativo", "empreendedor"
                        ]
                    },
                    experiencia: { type: "string" },
                    objetivos: { type: "string" },
                    disponibilidade: {
                        type: "string",
                        enum: ["integral", "matutino", "vespertino", "noturno", "fins_de_semana"]
                    },
                    respostas_teste: { type: "object" },
                    whatsapp: { type: "string" }
                },
                required: [
                    "nome", "idade", "escolaridade", "area_interesse",
                    "habilidades", "personalidade", "experiencia",
                    "objetivos", "disponibilidade", "respostas_teste"
                ]
            }
        }
    }, async (request, reply) => {
        try {
            const userRequest = request.body;
            AgentLogger.logAgentCall('VocationalOrchestrator', 'executeFullWorkflow', Date.now());
            const workflow = await vocationalOrchestrator.executeFullWorkflow(userRequest);
            return {
                success: true,
                data: workflow,
                metadata: {
                    agent: 'orchestrator',
                    timestamp: new Date().toISOString()
                }
            };
        }
        catch (error) {
            AgentLogger.logError('VocationalOrchestrator', 'executeFullWorkflow', error);
            reply.status(500);
            return {
                success: false,
                error: "Erro no workflow completo",
                details: error instanceof Error ? error.message : String(error)
            };
        }
    });
    // Rota para status e saúde dos agentes
    fastify.get("/agents/health", async (request, reply) => {
        try {
            const health = {
                status: "healthy",
                agents: {
                    questions: "available",
                    analysis: "available",
                    courses: "available",
                    whatsapp: "available",
                    orchestrator: "available"
                },
                timestamp: new Date().toISOString(),
                version: "1.0.0"
            };
            return health;
        }
        catch (error) {
            reply.status(500);
            return {
                status: "unhealthy",
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            };
        }
    });
}
export default agentRoutes;
//# sourceMappingURL=agents.js.map