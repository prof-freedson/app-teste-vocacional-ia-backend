import OpenAI from "openai";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
});
/**
 * Agente especializado em formatação de mensagens WhatsApp
 * Responsável por criar mensagens otimizadas para envio via WhatsApp
 */
export class WhatsAppAgent {
    systemPrompt = `
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
    
    6. INFORMAÇÕES DE CONTATO OBRIGATÓRIAS:
       - Telefone: (98) 31981530
       - Site: www.ma.senac.br
       - E-mail: cepsaoluis@ma.senac.br
       - Endereço: Rua do Passeio, 495 - Centro, São Luís - MA
       
       IMPORTANTE: SEMPRE use essas informações de contato exatas. Não invente números ou sites diferentes.
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
    async formatVocationalResult(userRequest, vocationalAnalysis, courseRecommendations) {
        // Extrair cursos recomendados
        let recommendedCourses = [];
        if (courseRecommendations?.trilhas_recomendadas) {
            // Formato novo com trilhas
            courseRecommendations.trilhas_recomendadas.forEach((trilha) => {
                if (trilha.cursos) {
                    trilha.cursos.forEach((curso) => {
                        if (curso.nome && curso.programacao_atual) {
                            recommendedCourses.push(curso.nome);
                        }
                    });
                }
            });
        }
        else if (courseRecommendations?.recomendacoes) {
            // Formato alternativo
            courseRecommendations.recomendacoes.forEach((rec) => {
                if (rec.nome && rec.programacao_atual) {
                    recommendedCourses.push(rec.nome);
                }
            });
        }
        // Se não encontrou cursos da programação atual, usar todos os cursos
        if (recommendedCourses.length === 0) {
            if (courseRecommendations?.trilhas_recomendadas) {
                courseRecommendations.trilhas_recomendadas.forEach((trilha) => {
                    if (trilha.cursos) {
                        trilha.cursos.forEach((curso) => {
                            if (curso.nome) {
                                recommendedCourses.push(curso.nome);
                            }
                        });
                    }
                });
            }
        }
        // Limitar a 3 cursos para a mensagem
        recommendedCourses = recommendedCourses.slice(0, 3);
        const prompt = `
      Crie uma mensagem WhatsApp seguindo EXATAMENTE este formato:
      
      "Olá! Meu nome é ${userRequest.nome} e fiz o Teste Vocacional do Senac Maranhão na Expoindustria 2025.

      Baseado no meu perfil, o teste indicou que tenho afinidade com os seguintes cursos:

      ${recommendedCourses.map(curso => `• ${curso}`).join('\n')}

      Gostaria de receber mais informações sobre esses cursos e as próximas turmas disponíveis.

      Obrigado(a)!"
      
      INSTRUÇÕES IMPORTANTES:
      1. Use EXATAMENTE o formato acima
      2. Substitua apenas o nome (${userRequest.nome}) e os cursos recomendados
      3. Mantenha a estrutura e texto exatos
      4. NÃO adicione emojis, formatação extra ou informações de contato
      5. NÃO modifique o texto padrão
      6. Liste os cursos com bullet points (•) como mostrado
      
      CURSOS PARA INCLUIR:
      ${recommendedCourses.join('\n')}
      
      Retorne apenas a mensagem formatada, sem JSON ou estruturas extras.
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Você é um assistente que formata mensagens WhatsApp seguindo instruções exatas. Retorne apenas o texto da mensagem, sem JSON ou formatação extra." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1, // Baixa temperatura para seguir instruções exatamente
            max_tokens: 500,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao gerar mensagem WhatsApp");
        }
        // Retornar no formato esperado pelo frontend
        return {
            mensagem: content.trim(),
            caracteres: content.length,
            preview: content.substring(0, 100),
            elementos_visuais: {
                emojis_usados: [],
                formatacao: [],
                quebras_linha: (content.match(/\n/g) || []).length
            },
            call_to_action: "Solicitar informações sobre cursos",
            alternativas: []
        };
    }
    /**
     * Cria resumo rápido dos resultados
     */
    async formatQuickSummary(userName, topArea, topCourse) {
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
    async formatEnrollmentInvite(userName, courseName, courseDetails) {
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
    async formatFollowUpReminder(userName, daysSinceTest, recommendedCourses) {
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
    async formatCourseInfo(courseName, courseDetails, userName) {
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
    async formatPromotionalMessage(targetAudience, courses, promotion) {
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
    async formatWelcomeMessage(studentName, courseName, startDate, importantInfo) {
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
    async generateMessage(prompt, messageType) {
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
            // Log da resposta para debug
            console.log('🔍 [WhatsAppAgent] Resposta da OpenAI:', content);
            // Tentar extrair JSON se estiver dentro de markdown
            let jsonContent = content;
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonContent = jsonMatch[1];
            }
            return JSON.parse(jsonContent);
        }
        catch (error) {
            console.error('❌ [WhatsAppAgent] Erro ao parsear JSON:', error);
            console.error('📄 [WhatsAppAgent] Conteúdo recebido:', content);
            throw new Error("Resposta inválida do agente WhatsApp");
        }
    }
    /**
     * Valida se a mensagem está dentro dos limites do WhatsApp
     */
    validateMessage(message) {
        const issues = [];
        const suggestions = [];
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
//# sourceMappingURL=whatsapp-agent.js.map