import type { VocationalTestRequest } from "../types";
/**
 * Agente especializado em geração de narrativa personalizada
 * Responsável por criar textos personalizados da análise vocacional
 */
export declare class NarrativeAgent {
    private systemPrompt;
    /**
     * Gera narrativa personalizada da análise vocacional
     */
    generatePersonalizedNarrative(userRequest: VocationalTestRequest, vocationalAnalysis: any, courseRecommendations: any): Promise<string>;
    private buildNarrativePrompt;
}
export declare const narrativeAgent: NarrativeAgent;
//# sourceMappingURL=narrative-agent.d.ts.map