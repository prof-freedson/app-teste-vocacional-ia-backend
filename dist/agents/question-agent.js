import OpenAI from "openai";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
});
/**
 * Agente especializado em geração de perguntas vocacionais
 * Responsável por criar perguntas personalizadas baseadas no perfil do usuário
 */
export class QuestionAgent {
    systemPrompt = `
    Você é um especialista em psicologia vocacional e criação de questionários.
    Sua função é gerar perguntas vocacionais personalizadas e relevantes.
    
    REGRAS FUNDAMENTAIS:
    - Gere perguntas claras, objetivas e de fácil compreensão
    - Use linguagem acessível para todos os níveis de escolaridade
    - Foque em descobrir interesses, habilidades, valores e personalidade
    - Cada pergunta deve ter 4-5 opções de resposta bem balanceadas
    - Evite perguntas tendenciosas ou que induzam respostas específicas
    - Considere o contexto brasileiro e os cursos do Senac Maranhão
    
    CURSOS DISPONÍVEIS PARA RECOMENDAÇÃO:
    
    ADMINISTRAÇÃO:
    - Assistente Administrativo (160h)
    - Assistente Financeiro (160h)
    
    SAÚDE:
    - Atendimento humanizado em serviços de saúde (24h)
    - Cuidador de Idoso (160h)
    - Instrumentação Cirúrgica (40h)
    
    BELEZA E ESTÉTICA:
    - Barbeiro (172h)
    - Básico de Depilação (40h)
    - Penteados Estilizados (20h)
    - Tendências em Automaquiagem (15h)
    
    MODA E VESTUÁRIO:
    - Costureiro (212h)
    - Modelagem e Costura Para Iniciantes (60h)
    
    FOTOGRAFIA:
    - Introdução à Fotografia Digital (30h)
    
    COMUNICAÇÃO:
    - Oratória: comunicação e técnicas de apresentação (20h)
    - Oratória Avançada (30h)
    
    TECNOLOGIA DA INFORMAÇÃO:
    - Administrador de Banco de Dados (200h)
    - Assistente de Tecnologias da Informação (200h)
    - Autocad: Projetos 2d (60h)
    - Autodesk Revit (40h)
    - Business Intelligence com Power bi (40h)
    - Criação de Conteúdo para Redes Sociais com Inteligência Artificial (20h)
    - Excel Avançado (60h)
    - Ferramentas Adobe para Design (144h)
    - Formação - Programação em Python (156h)
    - Introdução à Informática Windows e Office (80h)
    - Produtividade com Chatgpt (20h)
    
    GASTRONOMIA:
    - Hambúrguer Artesanal (15h)
    - Métodos de preparo de cafés (36h)
    
    ÁREAS DE FOCO PARA AS PERGUNTAS:
    1. Interesses profissionais relacionados às áreas dos cursos disponíveis
    2. Habilidades naturais e desenvolvidas compatíveis com os cursos
    3. Valores e motivações pessoais
    4. Estilo de trabalho preferido (individual, equipe, criativo, técnico)
    5. Ambiente de trabalho ideal (escritório, laboratório, ateliê, etc.)
    6. Objetivos de carreira de curto e médio prazo
    7. Personalidade profissional (analítico, criativo, comunicativo, etc.)
    8. Preferências por trabalho manual vs. intelectual
    9. Interesse em tecnologia e inovação
    10. Disposição para cuidar de pessoas
    
    FORMATO DE RESPOSTA:
    Retorne sempre um JSON válido com a estrutura:
    {
      "pergunta": "texto da pergunta",
      "opcoes": [
        {"valor": "codigo", "texto": "opção 1"},
        {"valor": "codigo", "texto": "opção 2"},
        {"valor": "codigo", "texto": "opção 3"},
        {"valor": "codigo", "texto": "opção 4"}
      ],
      "categoria": "categoria_da_pergunta",
      "peso": numero_de_1_a_5
    }
  `;
    /**
     * Gera uma pergunta personalizada baseada no perfil do usuário
     */
    async generateQuestion(userProfile, questionNumber, previousAnswers) {
        const userPrompt = this.buildUserPrompt(userProfile, questionNumber, previousAnswers);
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 500,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao gerar pergunta");
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error("Resposta inválida do agente de perguntas");
        }
    }
    /**
     * Gera um conjunto de perguntas padronizadas para o teste
     */
    async generateQuestionSet(userProfile, numberOfQuestions = 15) {
        const questions = [];
        const categories = [
            "interesses", "habilidades", "valores", "personalidade",
            "ambiente_trabalho", "motivacao", "objetivos", "estilo_trabalho"
        ];
        for (let i = 0; i < numberOfQuestions; i++) {
            const category = categories[i % categories.length];
            const question = await this.generateQuestion(userProfile, i + 1);
            questions.push(question);
        }
        return questions;
    }
    /**
     * Gera perguntas adaptativas baseadas nas respostas anteriores
     */
    async generateAdaptiveQuestion(userProfile, previousAnswers, questionNumber) {
        // Analisa padrões nas respostas anteriores
        const dominantAreas = this.analyzeDominantAreas(previousAnswers);
        const personalityTraits = this.analyzePersonalityTraits(previousAnswers);
        const adaptedProfile = {
            ...userProfile,
            areas_dominantes: dominantAreas,
            tracos_personalidade: personalityTraits
        };
        return this.generateQuestion(adaptedProfile, questionNumber, previousAnswers);
    }
    buildUserPrompt(userProfile, questionNumber, previousAnswers) {
        let prompt = `
      Gere a pergunta número ${questionNumber} para um teste vocacional.
      
      PERFIL DO USUÁRIO:
      - Idade: ${userProfile.idade || 'não informado'}
      - Escolaridade: ${userProfile.escolaridade || 'não informado'}
      - Área de interesse: ${userProfile.area_interesse || 'não informado'}
      - Disponibilidade: ${userProfile.disponibilidade || 'não informado'}
    `;
        if (userProfile.categoria_foco) {
            prompt += `\n- Foco desta pergunta: ${userProfile.categoria_foco}`;
        }
        if (previousAnswers && Object.keys(previousAnswers).length > 0) {
            prompt += `\n\nRESPOSTAS ANTERIORES: ${JSON.stringify(previousAnswers)}`;
            prompt += `\nConsidere as respostas anteriores para fazer uma pergunta mais direcionada.`;
        }
        prompt += `\n\nGere uma pergunta relevante e personalizada para este perfil.`;
        return prompt;
    }
    analyzeDominantAreas(answers) {
        const areaCount = {};
        Object.values(answers).forEach(answer => {
            if (typeof answer === 'string') {
                // Mapeia respostas para áreas profissionais
                if (answer.includes('tecnologia') || answer.includes('computador')) {
                    areaCount['tecnologia'] = (areaCount['tecnologia'] || 0) + 1;
                }
                if (answer.includes('saude') || answer.includes('cuidar')) {
                    areaCount['saude'] = (areaCount['saude'] || 0) + 1;
                }
                if (answer.includes('criativo') || answer.includes('arte')) {
                    areaCount['criativo'] = (areaCount['criativo'] || 0) + 1;
                }
                if (answer.includes('negocio') || answer.includes('vender')) {
                    areaCount['negocios'] = (areaCount['negocios'] || 0) + 1;
                }
            }
        });
        return Object.entries(areaCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([area]) => area);
    }
    analyzePersonalityTraits(answers) {
        const traits = [];
        Object.values(answers).forEach(answer => {
            if (typeof answer === 'string') {
                if (answer.includes('liderar') || answer.includes('decisões')) {
                    traits.push('liderança');
                }
                if (answer.includes('equipe') || answer.includes('colaborar')) {
                    traits.push('colaborativo');
                }
                if (answer.includes('sozinho') || answer.includes('individual')) {
                    traits.push('independente');
                }
                if (answer.includes('criar') || answer.includes('inovar')) {
                    traits.push('criativo');
                }
            }
        });
        return [...new Set(traits)]; // Remove duplicatas
    }
}
export const questionAgent = new QuestionAgent();
//# sourceMappingURL=question-agent.js.map