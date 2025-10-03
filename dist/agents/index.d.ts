/**
 * Índice dos Agentes Especializados
 * Sistema modular de IA para teste vocacional
 */
export { QuestionAgent, questionAgent } from './question-agent';
export { AnalysisAgent, analysisAgent } from './analysis-agent';
export { CourseAgent, courseAgent } from './course-agent';
export { WhatsAppAgent, whatsAppAgent } from './whatsapp-agent';
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
export declare class VocationalOrchestrator {
    /**
     * Executa o fluxo completo do teste vocacional
     */
    executeFullWorkflow(userRequest: any): Promise<VocationalWorkflow>;
    /**
     * Executa apenas a análise vocacional
     */
    executeAnalysisOnly(userRequest: any): Promise<AgentResponse>;
    /**
     * Executa apenas recomendação de cursos
     */
    executeCoursesOnly(vocationalProfile: any, userRequest: any): Promise<AgentResponse>;
    /**
     * Gera perguntas vocacionais personalizadas
     */
    generateQuestions(userProfile?: any, questionCount?: number): Promise<AgentResponse>;
    /**
     * Formata resultado para WhatsApp
     */
    formatForWhatsApp(userRequest: any, analysis: any, courses: any, messageType?: string): Promise<AgentResponse>;
    private generateSessionId;
}
export declare const vocationalOrchestrator: VocationalOrchestrator;
export declare const AgentLogger: {
    logAgentCall: (agentName: string, method: string, duration: number) => void;
    logError: (agentName: string, method: string, error: any) => void;
    logSuccess: (agentName: string, method: string, result: any) => void;
};
//# sourceMappingURL=index.d.ts.map