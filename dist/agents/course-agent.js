import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
});
/**
 * Agente especializado em recomendação de cursos
 * Responsável por sugerir trilhas de cursos do Senac Maranhão
 */
export class CourseAgent {
    /**
     * Carrega cursos da programação atual do Senac (PROGRAMAÇÃO- out-nov-dez-final.json)
     */
    async loadCurrentProgramCourses() {
        try {
            let data;
            try {
                // Primeiro, tenta o arquivo no diretório data
                const dataPath = path.join(process.cwd(), "data", "senac-courses.json");
                console.log("🔍 Tentando caminho data:", dataPath);
                data = await fs.readFile(dataPath, "utf-8");
            }
            catch (dataError) {
                try {
                    // Segundo, tenta o caminho relativo
                    const relativePath = path.join(process.cwd(), "PROGRAMAÇÃO- out-nov-dez-final.json");
                    console.log("🔍 Tentando caminho relativo:", relativePath);
                    data = await fs.readFile(relativePath, "utf-8");
                }
                catch (relativeError) {
                    // Se falhar, tenta o caminho absoluto
                    const absolutePath = "C:\\Users\\freed\\OneDrive\\Documentos\\app-teste-vocacional-ia\\PROGRAMAÇÃO- out-nov-dez-final.json";
                    console.log("🔍 Tentando caminho absoluto:", absolutePath);
                    data = await fs.readFile(absolutePath, "utf-8");
                }
            }
            const courses = JSON.parse(data);
            // Filtrar cursos válidos (que têm nome da turma)
            const validCourses = courses.filter(course => course.Turma &&
                course.Turma.trim() !== "" &&
                course["C. H."] &&
                course["C. H."] > 0);
            console.log(`✅ Cursos da programação atual carregados: ${validCourses.length} cursos válidos`);
            console.log("📋 Cursos carregados:", validCourses.map(c => c.Turma).join(", "));
            return validCourses;
        }
        catch (error) {
            console.warn("⚠️ Arquivo de programação atual não encontrado, usando apenas cursos genéricos:", error);
            return [];
        }
    }
    async loadAvailableCourses() {
        try {
            const coursesPath = path.join(process.cwd(), "data", "courses.json");
            const data = await fs.readFile(coursesPath, "utf-8");
            const courses = JSON.parse(data);
            return courses.filter(course => course.ativo); // Apenas cursos ativos
        }
        catch (error) {
            console.error("Erro ao carregar cursos do sistema administrativo:", error);
            return [];
        }
    }
    async generateSystemPrompt() {
        const currentProgramCourses = await this.loadCurrentProgramCourses();
        const genericCourses = await this.loadAvailableCourses();
        let coursesText = "CURSOS DISPONÍVEIS NO SENAC MARANHÃO:\n\n";
        // PRIORIDADE 1: Cursos da programação atual (out-nov-dez)
        if (currentProgramCourses.length > 0) {
            coursesText += "=== CURSOS DA PROGRAMAÇÃO ATUAL (PRIORIDADE MÁXIMA) ===\n";
            coursesText += "Estes cursos estão sendo oferecidos AGORA (out-nov-dez 2024) e DEVEM SER PRIORIZADOS:\n\n";
            // Agrupar cursos atuais por área estimada
            const currentCoursesByArea = this.groupCurrentCoursesByArea(currentProgramCourses);
            for (const [area, areaCourses] of Object.entries(currentCoursesByArea)) {
                coursesText += `${area.toUpperCase()}:\n`;
                areaCourses.forEach(course => {
                    coursesText += `- ${course.Turma} (${course["C. H."]}h) [DISPONÍVEL AGORA]\n`;
                });
                coursesText += '\n';
            }
            coursesText += "=== CURSOS GENÉRICOS (usar APENAS se não houver correspondência acima) ===\n";
        }
        else {
            coursesText += "ATENÇÃO: Cursos da programação atual não foram carregados. Usando apenas cursos genéricos.\n\n";
        }
        // PRIORIDADE 2: Cursos genéricos do sistema administrativo
        const coursesByArea = genericCourses.reduce((acc, course) => {
            if (!acc[course.area]) {
                acc[course.area] = [];
            }
            acc[course.area].push(course);
            return acc;
        }, {});
        for (const [area, areaCourses] of Object.entries(coursesByArea)) {
            coursesText += `${area.toUpperCase()}:\n`;
            areaCourses.forEach(course => {
                coursesText += `- ${course.nome}`;
                if (course.nivel && course.nivel !== 'basico') {
                    coursesText += ` (${course.nivel})`;
                }
                if (course.duracao) {
                    coursesText += ` - ${course.duracao}`;
                }
                coursesText += '\n';
            });
            coursesText += '\n';
        }
        return `
    Você é um consultor educacional especialista nos cursos do Senac Maranhão.
    Sua função é recomendar trilhas de cursos personalizadas baseadas no perfil vocacional.
    
    ${coursesText}
    
    INSTRUÇÕES IMPORTANTES:
    1. SEMPRE PRIORIZE os cursos da "PROGRAMAÇÃO ATUAL" - estes estão sendo oferecidos AGORA (out-nov-dez 2024)
    2. Use cursos genéricos APENAS quando não houver correspondência na programação atual
    3. SEMPRE RECOMENDE PELO MENOS 2-3 CURSOS - nunca deixe o usuário sem recomendações
    4. Se não houver cursos da programação atual compatíveis, use os cursos genéricos como alternativa
    5. Analise o perfil vocacional e as preferências do usuário
    6. Recomende cursos que se alinhem com seus interesses e objetivos
    7. Considere a escolaridade, experiência e disponibilidade
    8. Sugira uma progressão lógica de cursos (básico → intermediário → avançado)
    9. Explique por que cada curso é adequado para o perfil
    10. Mencione oportunidades de carreira e mercado de trabalho
    11. Seja específico sobre os benefícios de cada curso
    12. Considere a carga horária dos cursos atuais
    13. SEMPRE marque "programacao_atual": true para cursos da programação atual
    14. SEMPRE marque "programacao_atual": false para cursos genéricos
    
    ESTRATÉGIA DE FALLBACK:
    - Se não encontrar cursos da programação atual compatíveis com o perfil exato, procure por cursos relacionados
    - Se ainda assim não encontrar, use cursos genéricos da mesma área de interesse
    - Como último recurso, recomende cursos genéricos que desenvolvam habilidades transferíveis
    - NUNCA retorne uma resposta vazia - sempre forneça pelo menos 2 recomendações
    
    FORMATO DE RESPOSTA:
    - Liste 3-5 cursos recomendados (priorizando os da programação atual)
    - Para cada curso, explique: por que é adequado, benefícios, oportunidades
    - Sugira uma ordem de prioridade
    - Inclua dicas de carreira relacionadas
    
    Retorne sempre um JSON válido com a estrutura:
    {
      "trilhas_recomendadas": [
        {
          "area": "nome_da_area",
          "compatibilidade": numero_0_a_100,
          "cursos": [
            {
              "nome": "nome_do_curso",
              "tipo": "tecnico|livre|qualificacao",
              "duracao": "tempo_estimado",
              "nivel": "basico|intermediario|avancado",
              "justificativa": "por_que_recomendado",
              "beneficios": ["beneficio1", "beneficio2"],
              "oportunidades": ["carreira1", "carreira2"],
              "programacao_atual": true_ou_false
            }
          ]
        }
      ],
      "observacoes": "comentarios_adicionais"
    }
    `;
    }
    /**
     * Agrupa cursos atuais por área estimada baseada no nome
     */
    groupCurrentCoursesByArea(courses) {
        const grouped = {};
        courses.forEach(course => {
            const courseName = course.Turma.toLowerCase();
            let area = "Outros";
            // Classificação por palavras-chave no nome do curso
            if (courseName.includes("administrativo") || courseName.includes("financeiro")) {
                area = "Gestão e Negócios";
            }
            else if (courseName.includes("saúde") || courseName.includes("cuidador") || courseName.includes("cirurg")) {
                area = "Saúde";
            }
            else if (courseName.includes("barbeiro") || courseName.includes("depilação") || courseName.includes("maquiagem") || courseName.includes("penteado")) {
                area = "Beleza e Estética";
            }
            else if (courseName.includes("costur") || courseName.includes("modelagem")) {
                area = "Moda";
            }
            else if (courseName.includes("fotografia") || courseName.includes("oratória")) {
                area = "Comunicação";
            }
            else if (courseName.includes("banco de dados") || courseName.includes("tecnologia") || courseName.includes("autocad") || courseName.includes("revit") || courseName.includes("power bi") || courseName.includes("excel") || courseName.includes("adobe") || courseName.includes("python") || courseName.includes("informática") || courseName.includes("chatgpt") || courseName.includes("redes sociais") || courseName.includes("inteligência artificial")) {
                area = "Tecnologia da Informação";
            }
            else if (courseName.includes("hambúrguer") || courseName.includes("café")) {
                area = "Gastronomia";
            }
            if (!grouped[area]) {
                grouped[area] = [];
            }
            grouped[area].push(course);
        });
        return grouped;
    }
    /**
     * Recomenda cursos baseado no perfil vocacional
     */
    async recommendCourses(vocationalProfile, userRequest) {
        const systemPrompt = await this.generateSystemPrompt();
        const diretrizes = await this.loadGuidelines();
        const userPrompt = this.buildRecommendationPrompt(vocationalProfile, userRequest);
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "system", content: `Diretrizes institucionais: ${diretrizes}` },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.4,
            max_tokens: 2500,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao gerar recomendações de cursos");
        }
        try {
            // Log da resposta para debug
            console.log('🔍 [CourseAgent] Resposta da OpenAI:', content);
            // Tentar extrair JSON se estiver dentro de markdown
            let jsonContent = content;
            const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch && jsonMatch[1]) {
                jsonContent = jsonMatch[1];
            }
            return JSON.parse(jsonContent);
        }
        catch (error) {
            console.error('❌ [CourseAgent] Erro ao parsear JSON:', error);
            console.error('📄 [CourseAgent] Conteúdo recebido:', content);
            throw new Error("Resposta inválida do agente de cursos");
        }
    }
    /**
     * Recomenda cursos para uma área específica
     */
    async recommendCoursesForArea(area, userProfile, maxCourses = 5) {
        const currentProgramCourses = await this.loadCurrentProgramCourses();
        const systemPrompt = await this.generateSystemPrompt();
        const prompt = `
      Recomende até ${maxCourses} cursos da área de ${area} para o usuário:
      
      PERFIL DO USUÁRIO:
      ${this.buildUserSummary(userProfile)}
      
      PRIORIDADE ABSOLUTA: Use PRIMEIRO os cursos da "PROGRAMAÇÃO ATUAL" que correspondam à área ${area}.
      Use cursos genéricos APENAS se não houver cursos atuais adequados para esta área.
      
      IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato:
      {
        "recomendacoes": [
          {
            "nome": "Nome do Curso",
            "area": "Área do Curso",
            "justificativa": "Por que este curso é adequado",
            "beneficios": "Benefícios do curso",
            "oportunidades": "Oportunidades de carreira",
            "programacao_atual": true_ou_false,
            "carga_horaria": "horas_se_disponivel"
          }
        ]
      }
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao recomendar cursos para área específica");
        }
        try {
            // Tentar extrair JSON se houver texto extra
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonContent = jsonMatch ? jsonMatch[0] : content;
            return JSON.parse(jsonContent);
        }
        catch (error) {
            console.error("Erro ao parsear resposta:", content);
            throw new Error("Resposta inválida na recomendação por área");
        }
    }
    /**
     * Cria trilha de aprendizado progressiva
     */
    async createLearningPath(targetArea, currentLevel, userProfile) {
        const systemPrompt = await this.generateSystemPrompt();
        const prompt = `
      Crie uma trilha de aprendizado progressiva na área de ${targetArea}:
      
      NÍVEL ATUAL: ${currentLevel}
      PERFIL: ${this.buildUserSummary(userProfile)}
      
      Crie uma sequência lógica de cursos do básico ao avançado.
      Retorne um JSON com:
      {
        "trilha": [
          {
            "etapa": numero,
            "curso": "nome",
            "objetivo": "o_que_aprende",
            "prerequisitos": ["req1", "req2"],
            "proximos_passos": ["prox1", "prox2"]
          }
        ],
        "tempo_total": "estimativa",
        "investimento": "estimativa_custo"
      }
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1500,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao criar trilha de aprendizado");
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error("Resposta inválida na criação da trilha");
        }
    }
    /**
     * Sugere cursos baseados na disponibilidade de tempo
     */
    async recommendByAvailability(availability, userProfile) {
        const currentProgramCourses = await this.loadCurrentProgramCourses();
        const systemPrompt = await this.generateSystemPrompt();
        const prompt = `
      Recomende cursos considerando a disponibilidade: ${availability}
      
      PERFIL: ${this.buildUserSummary(userProfile)}
      
      PRIORIDADE: Use PRIMEIRO os cursos da "PROGRAMAÇÃO ATUAL" que se adequem à disponibilidade.
      
      Considere:
      - Duração dos cursos (carga horária dos cursos atuais)
      - Horários disponíveis
      - Modalidade (presencial/EAD)
      - Intensidade do curso
      
      Priorize cursos da programação atual que se adequem à disponibilidade informada.
      Use cursos genéricos apenas se necessário.
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.4,
            max_tokens: 1200,
        });
        const content = response.choices[0]?.message?.content;
        if (!content) {
            throw new Error("Falha ao recomendar por disponibilidade");
        }
        try {
            return JSON.parse(content);
        }
        catch (error) {
            throw new Error("Resposta inválida na recomendação por disponibilidade");
        }
    }
    buildRecommendationPrompt(vocationalProfile, userRequest) {
        return `
      Recomende trilhas de cursos do Senac Maranhão baseadas na análise vocacional:
      
      PERFIL VOCACIONAL:
      ${JSON.stringify(vocationalProfile)}
      
      DADOS DO USUÁRIO:
      - Nome: ${userRequest.nome}
      - Idade: ${userRequest.idade}
      - Escolaridade: ${userRequest.escolaridade}
      - Área de interesse: ${userRequest.area_interesse}
      - Disponibilidade: ${userRequest.disponibilidade}
      - Habilidades: ${userRequest.habilidades.join(', ')}
      - Personalidade: ${userRequest.personalidade}
      - Objetivos: ${userRequest.objetivos}
      
      INSTRUÇÕES CRÍTICAS:
      1. SEMPRE PRIORIZE os cursos da "PROGRAMAÇÃO ATUAL" (out-nov-dez 2024) - estes estão DISPONÍVEIS AGORA
      2. Analise CUIDADOSAMENTE a compatibilidade entre o perfil do usuário e os cursos disponíveis
      3. Se houver cursos da programação atual compatíveis, RECOMENDE-OS PRIMEIRO
      4. Use cursos genéricos APENAS se não houver correspondência na programação atual
      5. SEMPRE marque "programacao_atual": true para cursos da programação atual
      6. SEMPRE marque "programacao_atual": false para cursos genéricos
      7. Seja ESPECÍFICO sobre por que cada curso é adequado para o perfil
      8. Considere a área de interesse, habilidades, personalidade e objetivos do usuário
      
      IMPORTANTE: O usuário deve receber recomendações concretas e aplicáveis. 
      Não deixe de recomendar cursos - sempre encontre pelo menos 2-3 opções adequadas.
      
      Crie recomendações personalizadas e justificadas para este perfil.
    `;
    }
    buildUserSummary(userProfile) {
        return `
      ${userProfile.nome}, ${userProfile.idade} anos
      Escolaridade: ${userProfile.escolaridade}
      Interesse: ${userProfile.area_interesse}
      Habilidades: ${userProfile.habilidades.join(', ')}
      Personalidade: ${userProfile.personalidade}
      Disponibilidade: ${userProfile.disponibilidade}
      Objetivos: ${userProfile.objetivos}
    `;
    }
    async loadGuidelines() {
        try {
            const guidelinesPath = path.join(process.cwd(), "knowledge", "diretrizes.md");
            return await fs.readFile(guidelinesPath, "utf-8");
        }
        catch (error) {
            console.warn("Arquivo de diretrizes não encontrado");
            return "";
        }
    }
}
export const courseAgent = new CourseAgent();
//# sourceMappingURL=course-agent.js.map