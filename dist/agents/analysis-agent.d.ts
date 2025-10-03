import type { VocationalTestRequest } from "../types";
/**
 * Agente especializado em análise vocacional
 * Responsável por interpretar respostas e determinar perfil vocacional
 */
export declare class AnalysisAgent {
    private systemPrompt;
    /**
     * Analisa o perfil vocacional completo do usuário
     */
    analyzeVocationalProfile(request: VocationalTestRequest): Promise<any>;
    /**
     * Analisa apenas as respostas do teste para identificar padrões
     */
    analyzeTestResponses(responses: Record<string, any>): Promise<any>;
    /**
     * Calcula compatibilidade com áreas específicas
     */
    calculateAreaCompatibility(userProfile: VocationalTestRequest, targetAreas: string[]): Promise<Record<string, number>>;
    /**
     * Identifica pontos fortes e áreas de desenvolvimento
     */
    identifyStrengthsAndDevelopment(request: VocationalTestRequest): Promise<any>;
    private buildAnalysisPrompt;
    private buildProfileSummary;
    private loadGuidelines;
}
export declare const analysisAgent: AnalysisAgent;
//# sourceMappingURL=analysis-agent.d.ts.map