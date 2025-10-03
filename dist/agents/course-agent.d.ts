import type { VocationalTestRequest } from "../types";
/**
 * Agente especializado em recomendação de cursos
 * Responsável por sugerir trilhas de cursos do Senac Maranhão
 */
export declare class CourseAgent {
    /**
     * Carrega cursos da programação atual do Senac (PROGRAMAÇÃO- out-nov-dez-final.json)
     */
    private loadCurrentProgramCourses;
    private loadAvailableCourses;
    private generateSystemPrompt;
    /**
     * Agrupa cursos atuais por área estimada baseada no nome
     */
    private groupCurrentCoursesByArea;
    /**
     * Recomenda cursos baseado no perfil vocacional
     */
    recommendCourses(vocationalProfile: any, userRequest: VocationalTestRequest): Promise<any>;
    /**
     * Recomenda cursos para uma área específica
     */
    recommendCoursesForArea(area: string, userProfile: VocationalTestRequest, maxCourses?: number): Promise<any>;
    /**
     * Cria trilha de aprendizado progressiva
     */
    createLearningPath(targetArea: string, currentLevel: string, userProfile: VocationalTestRequest): Promise<any>;
    /**
     * Sugere cursos baseados na disponibilidade de tempo
     */
    recommendByAvailability(availability: string, userProfile: VocationalTestRequest): Promise<any>;
    private buildRecommendationPrompt;
    private buildUserSummary;
    private loadGuidelines;
}
export declare const courseAgent: CourseAgent;
//# sourceMappingURL=course-agent.d.ts.map