import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import type { VocationalTestRequest } from "../types";
import type { Course } from "../routes/admin";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
  timeout: 2 * 60 * 1000, // 2 minutos
});

/**
 * Interface para cursos da programação atual do Senac
 */
interface CurrentProgramCourse {
  Turma: string;
  "C. H.": number;
}

/**
 * Agente especializado em recomendação de cursos
 * Responsável por sugerir trilhas de cursos do Senac Maranhão
 */
export class CourseAgent {
  /**
   * Carrega cursos da programação atual do Senac (PROGRAMAÇÃO- out-nov-dez-final.json)
   */
  private async loadCurrentProgramCourses(): Promise<CurrentProgramCourse[]> {
    try {
      const currentProgramPath = path.join(process.cwd(), "..", "PROGRAMAÇÃO- out-nov-dez-final.json");
      const data = await fs.readFile(currentProgramPath, "utf-8");
      const courses = JSON.parse(data) as CurrentProgramCourse[];
      // Filtrar cursos válidos (que têm nome da turma)
      return courses.filter(course => course.Turma && course.Turma.trim() !== "");
    } catch (error) {
      console.warn("Arquivo de programação atual não encontrado, usando apenas cursos genéricos:", error);
      return [];
    }
  }

  private async loadAvailableCourses(): Promise<Course[]> {
    try {
      const coursesPath = path.join(process.cwd(), "data", "courses.json");
      const data = await fs.readFile(coursesPath, "utf-8");
      const courses = JSON.parse(data) as Course[];
      return courses.filter(course => course.ativo); // Apenas cursos ativos
    } catch (error) {
      console.error("Erro ao carregar cursos do sistema administrativo:", error);
      return [];
    }
  }

  private async generateSystemPrompt(): Promise<string> {
    const currentProgramCourses = await this.loadCurrentProgramCourses();
    const genericCourses = await this.loadAvailableCourses();
    
    let coursesText = "CURSOS DISPONÍVEIS NO SENAC MARANHÃO:\n\n";
    
    // PRIORIDADE 1: Cursos da programação atual (out-nov-dez)
    if (currentProgramCourses.length > 0) {
      coursesText += "=== CURSOS DA PROGRAMAÇÃO ATUAL (PRIORIDADE MÁXIMA) ===\n";
      coursesText += "Estes cursos estão sendo oferecidos AGORA e devem ser priorizados:\n\n";
      
      // Agrupar cursos atuais por área estimada
      const currentCoursesByArea = this.groupCurrentCoursesByArea(currentProgramCourses);
      
      for (const [area, areaCourses] of Object.entries(currentCoursesByArea)) {
        coursesText += `${area.toUpperCase()}:\n`;
        areaCourses.forEach(course => {
          coursesText += `- ${course.Turma} (${course["C. H."]}h)\n`;
        });
        coursesText += '\n';
      }
      
      coursesText += "=== CURSOS GENÉRICOS (usar apenas se não houver correspondência acima) ===\n";
    }
    
    // PRIORIDADE 2: Cursos genéricos do sistema administrativo
    const coursesByArea = genericCourses.reduce((acc, course) => {
      if (!acc[course.area]) {
        acc[course.area] = [];
      }
      acc[course.area]!.push(course);
      return acc;
    }, {} as Record<string, Course[]>);

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
    1. SEMPRE PRIORIZE os cursos da "PROGRAMAÇÃO ATUAL" - estes estão sendo oferecidos AGORA
    2. Use cursos genéricos APENAS quando não houver correspondência na programação atual
    3. Analise o perfil vocacional e as preferências do usuário
    4. Recomende cursos que se alinhem com seus interesses e objetivos
    5. Considere a escolaridade, experiência e disponibilidade
    6. Sugira uma progressão lógica de cursos (básico → intermediário → avançado)
    7. Explique por que cada curso é adequado para o perfil
    8. Mencione oportunidades de carreira e mercado de trabalho
    9. Seja específico sobre os benefícios de cada curso
    10. Considere a carga horária dos cursos atuais
    
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
  private groupCurrentCoursesByArea(courses: CurrentProgramCourse[]): Record<string, CurrentProgramCourse[]> {
    const grouped: Record<string, CurrentProgramCourse[]> = {};
    
    courses.forEach(course => {
      const courseName = course.Turma.toLowerCase();
      let area = "Outros";
      
      // Classificação por palavras-chave no nome do curso
      if (courseName.includes("administrativo") || courseName.includes("financeiro")) {
        area = "Gestão e Negócios";
      } else if (courseName.includes("saúde") || courseName.includes("cuidador") || courseName.includes("cirurg")) {
        area = "Saúde";
      } else if (courseName.includes("barbeiro") || courseName.includes("depilação") || courseName.includes("maquiagem") || courseName.includes("penteado")) {
        area = "Beleza e Estética";
      } else if (courseName.includes("costur") || courseName.includes("modelagem")) {
        area = "Moda";
      } else if (courseName.includes("fotografia") || courseName.includes("oratória")) {
        area = "Comunicação";
      } else if (courseName.includes("banco de dados") || courseName.includes("tecnologia") || courseName.includes("autocad") || courseName.includes("revit") || courseName.includes("power bi") || courseName.includes("excel") || courseName.includes("adobe") || courseName.includes("python") || courseName.includes("informática") || courseName.includes("chatgpt") || courseName.includes("redes sociais") || courseName.includes("inteligência artificial")) {
        area = "Tecnologia da Informação";
      } else if (courseName.includes("hambúrguer") || courseName.includes("café")) {
        area = "Gastronomia";
      }
      
      if (!grouped[area]) {
        grouped[area] = [];
      }
      grouped[area]!.push(course);
    });
    
    return grouped;
  }

  /**
   * Recomenda cursos baseado no perfil vocacional
   */
  async recommendCourses(
    vocationalProfile: any,
    userRequest: VocationalTestRequest
  ): Promise<any> {
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
      return JSON.parse(content);
    } catch (error) {
      throw new Error("Resposta inválida do agente de cursos");
    }
  }

  /**
   * Recomenda cursos para uma área específica
   */
  async recommendCoursesForArea(
    area: string,
    userProfile: VocationalTestRequest,
    maxCourses: number = 5
  ): Promise<any> {
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
    } catch (error) {
      console.error("Erro ao parsear resposta:", content);
      throw new Error("Resposta inválida na recomendação por área");
    }
  }

  /**
   * Cria trilha de aprendizado progressiva
   */
  async createLearningPath(
    targetArea: string,
    currentLevel: string,
    userProfile: VocationalTestRequest
  ): Promise<any> {
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
    } catch (error) {
      throw new Error("Resposta inválida na criação da trilha");
    }
  }

  /**
   * Sugere cursos baseados na disponibilidade de tempo
   */
  async recommendByAvailability(
    availability: string,
    userProfile: VocationalTestRequest
  ): Promise<any> {
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
    } catch (error) {
      throw new Error("Resposta inválida na recomendação por disponibilidade");
    }
  }

  private buildRecommendationPrompt(
    vocationalProfile: any,
    userRequest: VocationalTestRequest
  ): string {
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
      
      Crie recomendações personalizadas e justificadas para este perfil.
    `;
  }

  private buildUserSummary(userProfile: VocationalTestRequest): string {
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

  private async loadGuidelines(): Promise<string> {
    try {
      const guidelinesPath = path.join(process.cwd(), "knowledge", "diretrizes.md");
      return await fs.readFile(guidelinesPath, "utf-8");
    } catch (error) {
      console.warn("Arquivo de diretrizes não encontrado");
      return "";
    }
  }
}

export const courseAgent = new CourseAgent();