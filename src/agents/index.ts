/**
 * Índice dos Agentes Especializados
 * Sistema modular de IA para teste vocacional
 */

// Agentes especializados
export { QuestionAgent, questionAgent } from './question-agent';
export { AnalysisAgent, analysisAgent } from './analysis-agent';
export { CourseAgent, courseAgent } from './course-agent';
export { WhatsAppAgent, whatsAppAgent } from './whatsapp-agent';

// Tipos e interfaces
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: string;
    agent: string;
    processingTime: number;
  };
}

export interface VocationalWorkflow {
  userId: string;
  sessionId: string;
  currentStep: 'questions' | 'analysis' | 'courses' | 'whatsapp' | 'completed';
  data: {
    questions?: any;
    responses?: any;
    analysis?: any;
    courses?: any;
    whatsappMessage?: any;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Orquestrador principal dos agentes
 * Coordena o fluxo completo do teste vocacional
 */
export class VocationalOrchestrator {
  /**
   * Executa o fluxo completo do teste vocacional
   */
  async executeFullWorkflow(userRequest: any): Promise<VocationalWorkflow> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    try {
      // 1. Análise vocacional
      console.log('🔍 Iniciando análise vocacional...');
      const { analysisAgent } = await import('./analysis-agent');
      const analysis = await analysisAgent.analyzeVocationalProfile(userRequest);

      // 2. Recomendação de cursos
      console.log('📚 Gerando recomendações de cursos...');
      const { courseAgent } = await import('./course-agent');
      const courses = await courseAgent.recommendCourses(analysis, userRequest);

      // 3. Formatação para WhatsApp
      console.log('📱 Formatando mensagem WhatsApp...');
      const { whatsAppAgent } = await import('./whatsapp-agent');
      const whatsappMessage = await whatsAppAgent.formatVocationalResult(
        userRequest,
        analysis,
        courses
      );

      const workflow: VocationalWorkflow = {
        userId: userRequest.nome || 'anonymous',
        sessionId,
        currentStep: 'completed',
        data: {
          analysis,
          courses,
          whatsappMessage
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log(`✅ Workflow concluído em ${Date.now() - startTime}ms`);
      return workflow;

    } catch (error) {
      console.error('❌ Erro no workflow:', error);
      throw new Error(`Falha no workflow vocacional: ${error}`);
    }
  }

  /**
   * Executa apenas a análise vocacional
   */
  async executeAnalysisOnly(userRequest: any): Promise<AgentResponse> {
    try {
      const { analysisAgent } = await import('./analysis-agent');
      const analysis = await analysisAgent.analyzeVocationalProfile(userRequest);

      return {
        success: true,
        data: analysis,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'analysis',
          processingTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro na análise: ${error}`,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'analysis',
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Executa apenas recomendação de cursos
   */
  async executeCoursesOnly(
    vocationalProfile: any,
    userRequest: any
  ): Promise<AgentResponse> {
    try {
      const { courseAgent } = await import('./course-agent');
      const courses = await courseAgent.recommendCourses(vocationalProfile, userRequest);

      return {
        success: true,
        data: courses,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'courses',
          processingTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro nas recomendações: ${error}`,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'courses',
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Gera perguntas vocacionais personalizadas
   */
  async generateQuestions(
    userProfile?: any,
    questionCount: number = 10
  ): Promise<AgentResponse> {
    try {
      const { questionAgent } = await import('./question-agent');
      const questions = await questionAgent.generateQuestionSet(userProfile, questionCount);

      return {
        success: true,
        data: questions,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'questions',
          processingTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro na geração de perguntas: ${error}`,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'questions',
          processingTime: Date.now()
        }
      };
    }
  }

  /**
   * Formata resultado para WhatsApp
   */
  async formatForWhatsApp(
    userRequest: any,
    analysis: any,
    courses: any,
    messageType: string = 'resultado_completo'
  ): Promise<AgentResponse> {
    try {
      const { whatsAppAgent } = await import('./whatsapp-agent');
      
      let message;
      switch (messageType) {
        case 'resumo_rapido':
          message = await whatsAppAgent.formatQuickSummary(
            userRequest.nome,
            analysis.area_principal,
            courses.curso_prioritario?.nome
          );
          break;
        default:
          message = await whatsAppAgent.formatVocationalResult(
            userRequest,
            analysis,
            courses
          );
      }

      return {
        success: true,
        data: message,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'whatsapp',
          processingTime: Date.now()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Erro na formatação WhatsApp: ${error}`,
        metadata: {
          timestamp: new Date().toISOString(),
          agent: 'whatsapp',
          processingTime: Date.now()
        }
      };
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instância singleton do orquestrador
export const vocationalOrchestrator = new VocationalOrchestrator();

// Utilitários para logging e monitoramento
export const AgentLogger = {
  logAgentCall: (agentName: string, method: string, duration: number) => {
    console.log(`🤖 [${agentName}] ${method} - ${duration}ms`);
  },
  
  logError: (agentName: string, method: string, error: any) => {
    console.error(`❌ [${agentName}] ${method} - Erro:`, error);
  },
  
  logSuccess: (agentName: string, method: string, result: any) => {
    console.log(`✅ [${agentName}] ${method} - Sucesso`);
  }
};