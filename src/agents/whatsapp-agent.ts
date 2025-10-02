import OpenAI from "openai";
import type { VocationalTestRequest } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
  timeout: 2 * 60 * 1000, // 2 minutos
});

/**
 * Agente especializado em formatação de mensagens WhatsApp
 * Responsável por criar mensagens otimizadas para envio via WhatsApp
 */
export class WhatsAppAgent {
  private systemPrompt = `
    Você é um especialista em comunicação digital e formatação de mensagens WhatsApp.
    Sua função é criar mensagens atrativas, bem formatadas e otimizadas para WhatsApp.
    
    DIRETRIZES DE FORMATAÇÃO:
    
    1. ESTRUTURA DA MENSAGEM:
       - Use emojis relevantes para tornar a mensagem mais atrativa
       - Mantenha parágrafos curtos (máximo 3 linhas)
       - Use quebras de linha estratégicas para facilitar leitura
       - Limite total: 4096 caracteres (limite do WhatsApp)
    
    2. ELEMENTOS VISUAIS:
       - Use *texto* para negrito
       - Use _texto_ para itálico
       - Use \`\`\`texto\`\`\` para código/destaque
       - Use emojis para separar seções
       - Crie hierarquia visual clara
    
    3. CONTEÚDO PERSONALIZADO:
       - Sempre use o nome da pessoa
       - Mencione resultados específicos do teste
       - Inclua cursos recomendados do Senac Maranhão
       - Adicione call-to-action claro
    
    4. TOM DE COMUNICAÇÃO:
       - Amigável e encorajador
       - Profissional mas acessível
       - Motivacional e inspirador
       - Focado em oportunidades
    
    5. ESTRUTURA PADRÃO:
       - Saudação personalizada
       - Resumo dos resultados
       - Cursos recomendados
       - Próximos passos
       - Informações de contato
       - Call-to-action
    
    TIPOS DE MENSAGEM:
    - resultado_completo: Resultado completo do teste vocacional
    - resumo_rapido: Versão resumida dos resultados
    - convite_matricula: Convite para matrícula em curso específico
    - lembrete_followup: Lembrete de acompanhamento
    - informacoes_curso: Detalhes sobre curso específico
    
    FORMATO DE RESPOSTA:
    Retorne sempre um JSON válido:
    {
      "mensagem": "texto_formatado_para_whatsapp",
      "caracteres": numero_total_caracteres,
      "preview": "primeiras_100_caracteres",
      "elementos_visuais": {
        "emojis_usados": ["emoji1", "emoji2"],
        "formatacao": ["negrito", "italico", "codigo"],
        "quebras_linha": numero_quebras
      },
      "call_to_action": "acao_principal_sugerida",
      "alternativas": [
        {
          "tipo": "versao_curta",
          "mensagem": "versao_reduzida"
        }
      ]
    }
  `;

  /**
   * Formata resultado completo do teste vocacional para WhatsApp
   */
  async formatVocationalResult(
    userRequest: VocationalTestRequest,
    vocationalAnalysis: any,
    courseRecommendations: any
  ): Promise<any> {
    const prompt = `
      Formate o resultado completo do teste vocacional para WhatsApp:
      
      DADOS DO USUÁRIO:
      - Nome: ${userRequest.nome}
      - Idade: ${userRequest.idade}
      - Área de interesse: ${userRequest.area_interesse}
      
      ANÁLISE VOCACIONAL:
      ${JSON.stringify(vocationalAnalysis)}
      
      CURSOS RECOMENDADOS:
      ${JSON.stringify(courseRecommendations)}
      
      Crie uma mensagem completa, atrativa e bem formatada para WhatsApp.
      Inclua informações de contato do Senac Maranhão e call-to-action para matrícula.
    `;

    return await this.generateMessage(prompt, "resultado_completo");
  }

  /**
   * Cria resumo rápido dos resultados
   */
  async formatQuickSummary(
    userName: string,
    topArea: string,
    topCourse: string
  ): Promise<any> {
    const prompt = `
      Crie um resumo rápido para WhatsApp:
      
      - Nome: ${userName}
      - Área principal: ${topArea}
      - Curso recomendado: ${topCourse}
      
      Mensagem deve ser concisa (máximo 500 caracteres) mas impactante.
      Foque no resultado principal e convite para saber mais.
    `;

    return await this.generateMessage(prompt, "resumo_rapido");
  }

  /**
   * Formata convite para matrícula em curso específico
   */
  async formatEnrollmentInvite(
    userName: string,
    courseName: string,
    courseDetails: any
  ): Promise<any> {
    const prompt = `
      Crie convite para matrícula no curso:
      
      - Nome: ${userName}
      - Curso: ${courseName}
      - Detalhes: ${JSON.stringify(courseDetails)}
      
      Mensagem deve ser persuasiva e incluir:
      - Benefícios do curso
      - Próximas turmas
      - Como se inscrever
      - Contato para dúvidas
    `;

    return await this.generateMessage(prompt, "convite_matricula");
  }

  /**
   * Cria lembrete de acompanhamento
   */
  async formatFollowUpReminder(
    userName: string,
    daysSinceTest: number,
    recommendedCourses: string[]
  ): Promise<any> {
    const prompt = `
      Crie lembrete de acompanhamento:
      
      - Nome: ${userName}
      - Dias desde o teste: ${daysSinceTest}
      - Cursos recomendados: ${recommendedCourses.join(', ')}
      
      Mensagem deve ser amigável e motivacional.
      Pergunte sobre interesse nos cursos e ofereça ajuda.
    `;

    return await this.generateMessage(prompt, "lembrete_followup");
  }

  /**
   * Formata informações detalhadas sobre curso
   */
  async formatCourseInfo(
    courseName: string,
    courseDetails: any,
    userName?: string
  ): Promise<any> {
    const prompt = `
      Formate informações sobre o curso:
      
      - Curso: ${courseName}
      - Detalhes: ${JSON.stringify(courseDetails)}
      ${userName ? `- Para: ${userName}` : ''}
      
      Inclua:
      - Descrição do curso
      - Duração e horários
      - Investimento
      - Próximas turmas
      - Como se inscrever
    `;

    return await this.generateMessage(prompt, "informacoes_curso");
  }

  /**
   * Cria mensagem promocional para múltiplos cursos
   */
  async formatPromotionalMessage(
    targetAudience: string,
    courses: string[],
    promotion?: string
  ): Promise<any> {
    const prompt = `
      Crie mensagem promocional:
      
      - Público-alvo: ${targetAudience}
      - Cursos: ${courses.join(', ')}
      ${promotion ? `- Promoção: ${promotion}` : ''}
      
      Mensagem deve ser atrativa e gerar interesse.
      Inclua benefícios e call-to-action claro.
    `;

    return await this.generateMessage(prompt, "promocional");
  }

  /**
   * Formata mensagem de boas-vindas para novos alunos
   */
  async formatWelcomeMessage(
    studentName: string,
    courseName: string,
    startDate: string,
    importantInfo: string[]
  ): Promise<any> {
    const prompt = `
      Crie mensagem de boas-vindas:
      
      - Aluno: ${studentName}
      - Curso: ${courseName}
      - Início: ${startDate}
      - Informações importantes: ${importantInfo.join(', ')}
      
      Mensagem deve ser calorosa e informativa.
      Inclua próximos passos e contatos importantes.
    `;

    return await this.generateMessage(prompt, "boas_vindas");
  }

  private async generateMessage(prompt: string, messageType: string): Promise<any> {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: this.systemPrompt },
        { role: "system", content: `Tipo de mensagem: ${messageType}` },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Falha ao gerar mensagem WhatsApp");
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error("Resposta inválida do agente WhatsApp");
    }
  }

  /**
   * Valida se a mensagem está dentro dos limites do WhatsApp
   */
  validateMessage(message: string): {
    valid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Verifica limite de caracteres
    if (message.length > 4096) {
      issues.push("Mensagem excede limite de 4096 caracteres");
      suggestions.push("Reduza o conteúdo ou divida em múltiplas mensagens");
    }
    
    // Verifica quebras de linha excessivas
    const lineBreaks = (message.match(/\n/g) || []).length;
    if (lineBreaks > 20) {
      issues.push("Muitas quebras de linha");
      suggestions.push("Reduza quebras de linha para melhor legibilidade");
    }
    
    // Verifica uso de emojis
    const emojiCount = (message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
    if (emojiCount === 0) {
      suggestions.push("Considere adicionar emojis para tornar a mensagem mais atrativa");
    }
    
    return {
      valid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export const whatsAppAgent = new WhatsAppAgent();