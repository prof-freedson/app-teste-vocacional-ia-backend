import OpenAI from "openai";
import fs from "fs";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
});
/**
 * Agente especializado em análise vocacional
 * Responsável por interpretar respostas e determinar perfil vocacional
 */
export class AnalysisAgent {
    systemPrompt = `
    Você é um psicólogo vocacional especialista em análise de perfis profissionais.
    Sua função é analisar respostas de testes vocacionais e determinar vocações.
    
    METODOLOGIA DE ANÁLISE:
    1. Identifique padrões nas respostas do usuário
    2. Mapeie interesses, habilidades, valores e personalidade
    3. Determine áreas de maior afinidade profissional
    4. Avalie compatibilidade com diferentes carreiras
    5. Considere fatores como escolaridade, idade e disponibilidade
    
    ÁREAS PROFISSIONAIS PRINCIPAIS (baseadas nos cursos disponíveis no Senac Maranhão):
    - Administração: Assistente Administrativo, Assistente Financeiro
    - Saúde: Atendimento humanizado em serviços de saúde, Cuidador de Idoso, Instrumentação Cirúrgica
    - Beleza e Estética: Barbeiro, Básico de Depilação, Penteados Estilizados, Tendências em Automaquiagem
    - Moda e Vestuário: Costureiro, Modelagem e Costura Para Iniciantes
    - Fotografia: Introdução à Fotografia Digital
    - Tecnologia da Informação: Cursos relacionados à área de TI
    - Gastronomia: Cursos relacionados à área gastronômica
    - Turismo e Hospitalidade: Cursos relacionados ao setor de turismo
    - Educação: Cursos relacionados à área educacional
    - Serviços: Cursos relacionados ao setor de serviços
    
    TIPOS DE PERSONALIDADE PROFISSIONAL:
    - Analítico: Gosta de dados, pesquisa, resolução de problemas
    - Criativo: Busca inovação, expressão artística, soluções originais
    - Comunicativo: Habilidade interpessoal, persuasão, relacionamento
    - Líder: Capacidade de gestão, tomada de decisão, coordenação
    - Detalhista: Precisão, organização, controle de qualidade
    - Inovador: Pioneirismo, tecnologia, mudanças e transformações
    - Colaborativo: Trabalho em equipe, cooperação, harmonia
    - Empreendedor: Iniciativa, risco calculado, oportunidades de negócio
    
    FORMATO DE RESPOSTA:
    Retorne sempre um JSON válido com a estrutura:
    {
      "perfil_vocacional": {
        "tipo_personalidade": "string",
        "areas_afinidade": ["area1", "area2", "area3"],
        "habilidades_principais": ["hab1", "hab2", "hab3"],
        "valores_profissionais": ["valor1", "valor2", "valor3"],
        "estilo_trabalho": "string"
      },
      "compatibilidade_areas": {
        "administracao": numero_0_a_100,
        "saude": numero_0_a_100,
        "beleza_estetica": numero_0_a_100,
        "moda_vestuario": numero_0_a_100,
        "fotografia": numero_0_a_100,
        "tecnologia_informacao": numero_0_a_100,
        "gastronomia": numero_0_a_100,
        "turismo_hospitalidade": numero_0_a_100,
        "educacao": numero_0_a_100,
        "servicos": numero_0_a_100
      },
      "recomendacoes_carreira": [
        {
          "area": "string",
          "profissoes": ["prof1", "prof2", "prof3"],
          "justificativa": "string",
          "compatibilidade": numero_0_a_100
        }
      ],
      "pontos_fortes": ["ponto1", "ponto2", "ponto3"],
      "areas_desenvolvimento": ["area1", "area2"],
      "confianca_analise": numero_0_a_100
    }
  `;
    /**
     * Analisa o perfil vocacional completo do usuário
     */
    async analyzeVocationalProfile(request) {
        const diretrizes = this.loadGuidelines();
        const userPrompt = this.buildAnalysisPrompt(request);
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "system", content: `Diretrizes técnicas: ${diretrizes}` },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3, // Baixa temperatura para análise mais consistente
            max_tokens: 2000,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao gerar análise vocacional");
        }
        try {
            // Log da resposta para debug
            console.log('🔍 [AnalysisAgent] Resposta da OpenAI:', content);
            // Tentar extrair JSON se estiver dentro de markdown
            let jsonContent = content;
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonContent = jsonMatch[1];
            }
            return JSON.parse(jsonContent);
        }
        catch (error) {
            console.error('❌ [AnalysisAgent] Erro ao parsear JSON:', error);
            console.error('📄 [AnalysisAgent] Conteúdo recebido:', content);
            throw new Error("Resposta inválida do agente de análise");
        }
    }
    /**
     * Analisa apenas as respostas do teste para identificar padrões
     */
    async analyzeTestResponses(responses) {
        const prompt = `
      Analise apenas as respostas do teste vocacional e identifique padrões:
      
      RESPOSTAS: ${JSON.stringify(responses)}
      
      Identifique:
      1. Padrões de interesse profissional
      2. Traços de personalidade dominantes
      3. Preferências de ambiente de trabalho
      4. Motivações principais
      5. Estilo de trabalho preferido
      
      Retorne a análise em formato JSON estruturado.
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao analisar respostas do teste");
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error("Resposta inválida na análise de respostas");
        }
    }
    /**
     * Calcula compatibilidade com áreas específicas
     */
    async calculateAreaCompatibility(userProfile, targetAreas) {
        const prompt = `
      Calcule a compatibilidade do usuário com as seguintes áreas profissionais:
      ${targetAreas.join(', ')}
      
      PERFIL DO USUÁRIO:
      ${this.buildProfileSummary(userProfile)}
      
      Retorne um JSON com a compatibilidade (0-100) para cada área:
      {
        "area1": numero,
        "area2": numero,
        ...
      }
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 500,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao calcular compatibilidade");
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error("Resposta inválida no cálculo de compatibilidade");
        }
    }
    /**
     * Identifica pontos fortes e áreas de desenvolvimento
     */
    async identifyStrengthsAndDevelopment(request) {
        const prompt = `
      Identifique os pontos fortes e áreas de desenvolvimento do usuário:
      
      ${this.buildProfileSummary(request)}
      
      Retorne um JSON com:
      {
        "pontos_fortes": ["força1", "força2", "força3"],
        "areas_desenvolvimento": ["area1", "area2"],
        "recomendacoes_crescimento": ["rec1", "rec2", "rec3"]
      }
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: this.systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 800,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao identificar pontos fortes");
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error("Resposta inválida na identificação de pontos fortes");
        }
    }
    buildAnalysisPrompt(request) {
        return `
      Analise o perfil vocacional completo do usuário e determine sua vocação:
      
      DADOS PESSOAIS:
      - Nome: ${request.nome}
      - Idade: ${request.idade}
      - Escolaridade: ${request.escolaridade}
      - Área de interesse: ${request.area_interesse}
      - Disponibilidade: ${request.disponibilidade}
      
      PERFIL PROFISSIONAL:
      - Habilidades: ${request.habilidades.join(', ')}
      - Personalidade: ${request.personalidade}
      - Experiência: ${request.experiencia}
      - Objetivos: ${request.objetivos}
      
      RESPOSTAS DO TESTE:
      ${JSON.stringify(request.respostas_teste)}
      
      Faça uma análise completa e determine o perfil vocacional ideal.
    `;
    }
    buildProfileSummary(request) {
        return `
      Perfil: ${request.nome}, ${request.idade} anos
      Escolaridade: ${request.escolaridade}
      Interesse: ${request.area_interesse}
      Habilidades: ${request.habilidades.join(', ')}
      Personalidade: ${request.personalidade}
      Experiência: ${request.experiencia}
      Objetivos: ${request.objetivos}
      Disponibilidade: ${request.disponibilidade}
      Respostas: ${JSON.stringify(request.respostas_teste)}
    `;
    }
    loadGuidelines() {
        try {
            return fs.readFileSync("knowledge/diretrizes.md", "utf-8");
        }
        catch (error) {
            console.warn("Arquivo de diretrizes não encontrado");
            return "";
        }
    }
}
export const analysisAgent = new AnalysisAgent();
//# sourceMappingURL=analysis-agent.js.map