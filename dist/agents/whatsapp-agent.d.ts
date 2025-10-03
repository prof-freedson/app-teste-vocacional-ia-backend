import type { VocationalTestRequest } from "../types";
/**
 * Agente especializado em formatação de mensagens WhatsApp
 * Responsável por criar mensagens otimizadas para envio via WhatsApp
 */
export declare class WhatsAppAgent {
    private systemPrompt;
    /**
     * Formata resultado completo do teste vocacional para WhatsApp
     */
    formatVocationalResult(userRequest: VocationalTestRequest, vocationalAnalysis: any, courseRecommendations: any): Promise<any>;
    /**
     * Cria resumo rápido dos resultados
     */
    formatQuickSummary(userName: string, topArea: string, topCourse: string): Promise<any>;
    /**
     * Formata convite para matrícula em curso específico
     */
    formatEnrollmentInvite(userName: string, courseName: string, courseDetails: any): Promise<any>;
    /**
     * Cria lembrete de acompanhamento
     */
    formatFollowUpReminder(userName: string, daysSinceTest: number, recommendedCourses: string[]): Promise<any>;
    /**
     * Formata informações detalhadas sobre curso
     */
    formatCourseInfo(courseName: string, courseDetails: any, userName?: string): Promise<any>;
    /**
     * Cria mensagem promocional para múltiplos cursos
     */
    formatPromotionalMessage(targetAudience: string, courses: string[], promotion?: string): Promise<any>;
    /**
     * Formata mensagem de boas-vindas para novos alunos
     */
    formatWelcomeMessage(studentName: string, courseName: string, startDate: string, importantInfo: string[]): Promise<any>;
    private generateMessage;
    /**
     * Valida se a mensagem está dentro dos limites do WhatsApp
     */
    validateMessage(message: string): {
        valid: boolean;
        issues: string[];
        suggestions: string[];
    };
}
export declare const whatsAppAgent: WhatsAppAgent;
//# sourceMappingURL=whatsapp-agent.d.ts.map