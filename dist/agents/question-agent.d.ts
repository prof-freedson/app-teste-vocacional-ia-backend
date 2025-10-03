import type { VocationalTestRequest } from "../types";
/**
 * Agente especializado em geração de perguntas vocacionais
 * Responsável por criar perguntas personalizadas baseadas no perfil do usuário
 */
export declare class QuestionAgent {
    private systemPrompt;
    /**
     * Gera uma pergunta personalizada baseada no perfil do usuário
     */
    generateQuestion(userProfile: Partial<VocationalTestRequest>, questionNumber: number, previousAnswers?: Record<string, any>): Promise<any>;
    /**
     * Gera um conjunto de perguntas padronizadas para o teste
     */
    generateQuestionSet(userProfile: Partial<VocationalTestRequest>, numberOfQuestions?: number): Promise<any[]>;
    /**
     * Gera perguntas adaptativas baseadas nas respostas anteriores
     */
    generateAdaptiveQuestion(userProfile: Partial<VocationalTestRequest>, previousAnswers: Record<string, any>, questionNumber: number): Promise<any>;
    private buildUserPrompt;
    private analyzeDominantAreas;
    private analyzePersonalityTraits;
}
export declare const questionAgent: QuestionAgent;
//# sourceMappingURL=question-agent.d.ts.map