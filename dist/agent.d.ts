import type { VocationalTestRequest, DietPlanRequest } from "./types";
/**
 * Função principal para análise vocacional usando agentes especializados
 * Mantém compatibilidade com streaming para o frontend
 */
export declare function generateVocationalAnalysis(input: VocationalTestRequest): AsyncGenerator<string, void, unknown>;
export declare function generateDietPlan(input: DietPlanRequest): AsyncGenerator<string, void, unknown>;
//# sourceMappingURL=agent.d.ts.map