import OpenAI from "openai";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
});
/**
 * Agente especializado em geração de narrativa personalizada
 * Responsável por criar textos personalizados da análise vocacional
 */
export class NarrativeAgent {
    systemPrompt = `
    Você é um especialista em comunicação e redação de análises vocacionais personalizadas.
    Sua função é criar textos envolventes, personalizados e motivacionais baseados na análise vocacional.
    
    FORMATO OBRIGATÓRIO - SIGA EXATAMENTE ESTA ESTRUTURA:
    
    Seus Resultados Estão Prontos!
    Olá [Nome]! Descubra sua vocação e os cursos ideais para você

    Análise Vocacional Personalizada
    Análise Vocacional de [Nome]
    Olá, [Nome]! Estou animado para ajudar você a trilhar o caminho em direção a uma carreira gratificante na área de [área]. Vamos explorar seu perfil e como você pode avançar em sua jornada profissional.

    Perfil Vocacional
    Idade: [idade] anos
    Escolaridade: [escolaridade]
    Área de Interesse Principal: [área]
    Habilidades Destacadas: [habilidades]
    Personalidade Profissional: [personalidade]
    Experiência Prévia: [experiência]
    Objetivos Profissionais: [objetivos]
    Disponibilidade para Estudos: [disponibilidade]
    
    [Parágrafo personalizado sobre o perfil da pessoa, destacando características colaborativas e potencial na área escolhida]

    Áreas de Afinidade
    Com base nas suas respostas, podemos identificar algumas áreas de afinidade dentro da [área]:

    [Lista dos cursos específicos recomendados - APENAS do senac-courses.json]

    Lembre-se, [Nome], [características pessoais] são grandes aliados na sua jornada. Acredite em seu potencial e siga em frente!
    
    DIRETRIZES IMPORTANTES:
    1. Use EXATAMENTE este formato, sem markdown (# ## **), apenas texto simples
    2. Use o nome da pessoa pelo menos 3 vezes no texto
    3. Liste APENAS cursos que foram fornecidos na lista de recomendações
    4. Mantenha tom motivacional e encorajador
    5. Seja específico sobre características da personalidade
    6. Foque nas potencialidades e oportunidades
    7. IMPORTANTE: Use codificação UTF-8 correta - não use caracteres como "EstÃ£o", use "Estão"
    8. ESCOLARIDADE: Use "Médio" (com acento) em vez de "medio"
    9. ÁREA: Use "Tecnologia" (com maiúscula) em vez de "tecnologia"
  `;
    /**
     * Gera narrativa personalizada da análise vocacional
     */
    async generatePersonalizedNarrative(userRequest, vocationalAnalysis, courseRecommendations) {
        const userPrompt = this.buildNarrativePrompt(userRequest, vocationalAnalysis, courseRecommendations);
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7, // Temperatura moderada para criatividade controlada
            max_tokens: 2000,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao gerar narrativa personalizada");
        }
        console.log('📝 [NarrativeAgent] Narrativa gerada:', content);
        return content;
    }
    buildNarrativePrompt(userRequest, vocationalAnalysis, courseRecommendations) {
        // Extrair cursos recomendados
        let recommendedCourses = [];
        if (courseRecommendations?.trilhas_recomendadas) {
            courseRecommendations.trilhas_recomendadas.forEach((trilha) => {
                if (trilha.cursos) {
                    trilha.cursos.forEach((curso) => {
                        if (curso.nome && curso.programacao_atual) {
                            recommendedCourses.push(`- ${curso.nome}`);
                        }
                    });
                }
            });
        }
        // Se não encontrou cursos da programação atual, usar todos
        if (recommendedCourses.length === 0 && courseRecommendations?.trilhas_recomendadas) {
            courseRecommendations.trilhas_recomendadas.forEach((trilha) => {
                if (trilha.cursos) {
                    trilha.cursos.forEach((curso) => {
                        if (curso.nome) {
                            recommendedCourses.push(`- ${curso.nome}`);
                        }
                    });
                }
            });
        }
        // Normalizar escolaridade - criar variável separada para display
        let escolaridade = userRequest.escolaridade || 'Não informado';
        let escolaridadeDisplay = escolaridade;
        if (escolaridade === 'medio') {
            escolaridadeDisplay = 'Ensino Médio';
        }
        // Normalizar área de interesse - criar variável separada para display
        let areaInteresse = userRequest.area_interesse || 'Não informado';
        let areaInteresseDisplay = areaInteresse;
        if (areaInteresse === 'tecnologia') {
            areaInteresseDisplay = 'Tecnologia da Informação';
        }
        return `
      Crie uma análise vocacional personalizada para:
      
      DADOS DO USUÁRIO:
      - Nome: ${userRequest.nome}
      - Idade: ${userRequest.idade} anos
      - Escolaridade: ${escolaridadeDisplay}
      - Área de Interesse: ${areaInteresseDisplay}
      - Habilidades: ${userRequest.habilidades || 'Habilidades diversas'}
      - Personalidade: ${userRequest.personalidade || 'Colaborativo'}
      - Experiência: ${userRequest.experiencia || 'Baseada nas respostas do teste'}
      - Objetivos: ${userRequest.objetivos || 'Foco em ' + areaInteresseDisplay.toLowerCase()}
      - Disponibilidade: ${userRequest.disponibilidade || 'Matutino'}
      
      CURSOS RECOMENDADOS (use EXATAMENTE estes):
      ${recommendedCourses.join('\n')}
      
      INSTRUÇÕES ESPECÍFICAS:
      1. Use EXATAMENTE o formato fornecido no prompt do sistema
      2. Substitua [Nome] pelo nome real: ${userRequest.nome}
      3. Substitua [escolaridade] por: ${escolaridadeDisplay}
      4. Substitua [área] por: ${areaInteresseDisplay}
      5. Use codificação UTF-8 correta (não use "EstÃ£o", use "Estão")
      6. Liste os cursos exatamente como fornecidos acima
      7. Mantenha tom motivacional e personalizado
    `;
    }
}
// Instância singleton do agente
export const narrativeAgent = new NarrativeAgent();
//# sourceMappingURL=narrative-agent.js.map