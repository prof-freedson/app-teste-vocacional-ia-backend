import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import OpenAI from "openai";
import {
  buildDocsSystemPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from "./prompt";
import type { VocationalTestRequest, DietPlanRequest } from "./types";

// Importação direta dos agentes
import { 
  vocationalOrchestrator, 
  analysisAgent, 
  courseAgent, 
  whatsAppAgent,
  AgentLogger 
} from "./agents/index.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
  timeout: 2 * 60 * 1000, // 2 minutos
  logLevel: "debug",
});

/**
 * Função principal para análise vocacional usando agentes especializados
 * Mantém compatibilidade com streaming para o frontend
 */
export async function* generateVocationalAnalysis(input: VocationalTestRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Iniciando generateVocationalAnalysis com agentes especializados...');
    AgentLogger.logAgentCall('VocationalOrchestrator', 'executeFullWorkflow', 0);
    
    // Executa o workflow completo usando os agentes especializados
    console.log('📞 Chamando vocationalOrchestrator.executeFullWorkflow...');
    const workflow = await vocationalOrchestrator.executeFullWorkflow(input);
    console.log('✅ Workflow executado com sucesso:', workflow);
    
    // ===== Emissão de Markdown no formato esperado, usando somente cursos do Senac por eixo =====
    const analysis: any = workflow?.data?.analysis || {};
    const coursesData: any = workflow?.data?.courses || {};

    const normalize = (s?: string) => (s || '').toLowerCase().trim();
    const areaFromInput = normalize((input as any).area_interesse);
    const areaFromAnalysis = normalize(
      analysis?.perfil_vocacional?.areas_afinidade?.[0] ||
      analysis?.recomendacoes_carreira?.[0]?.area
    );
    const areaBase = areaFromInput || areaFromAnalysis;

    const areaToEixo: Record<string, string> = {
      'tecnologia': 'Tecnologia da Informação',
      'tecnologia da informação': 'Tecnologia da Informação',
      'ti': 'Tecnologia da Informação',
      't.i.': 'Tecnologia da Informação',
      'informatica': 'Tecnologia da Informação',
      'informática': 'Tecnologia da Informação',
      'gestao': 'Gestão',
      'gestão': 'Gestão',
      'administracao': 'Gestão',
      'administração': 'Gestão',
      'beleza': 'Beleza',
      'moda': 'Modas',
      'artes': 'Artes',
      'comunicacao': 'Comunicação',
      'comunicação': 'Comunicação',
      'design': 'Design',
      'gastronomia': 'Gastronomia',
      'saude': 'Saúde',
      'saúde': 'Saúde',
    };
    const eixoEscolhido = areaToEixo[areaBase] || 'Tecnologia da Informação';

    // Carregar cursos do Senac
    let senacCourses: Array<{ Turma: string; 'C. H.': number; eixo: string }> = [];
    try {
      const coursesPath = path.join(__dirname, "..", "data", "senac-courses.json");
      const raw = await fsPromises.readFile(coursesPath, "utf-8");
      senacCourses = JSON.parse(raw);
    } catch (err) {
      console.warn('⚠️ Não foi possível carregar senac-courses.json', err);
    }

    // Filtrar cursos estritamente pelo eixo escolhido
    let cursosDoEixo = senacCourses.filter(c => normalize(c.eixo) === normalize(eixoEscolhido));

    // Não priorizar cursos externos; sempre usar apenas os cursos do eixo do Senac

    // Preferências para TI: colocar Python e Excel primeiro se existirem
    if (normalize(eixoEscolhido) === normalize('Tecnologia da Informação')) {
      const preferidosNomes = ['Formação - Programação em Python', 'Excel Avançado'];
      cursosDoEixo.sort((a, b) => {
        const ai = preferidosNomes.indexOf(a.Turma);
        const bi = preferidosNomes.indexOf(b.Turma);
        const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        return av - bv;
      });
    }
    const cursosListaFinal = cursosDoEixo.slice(0, 8);

    // Construir Markdown alinhado ao arquivo resposta-esperada.md
    const nome = input.nome || 'Participante';
    const idade = (input as any).idade ? `${(input as any).idade} anos` : 'não informado';
    const escolaridade = (input as any).escolaridade ? 
      (input as any).escolaridade.charAt(0).toUpperCase() + (input as any).escolaridade.slice(1).toLowerCase() : 'Médio';
    const habilidades = Array.isArray((input as any).habilidades) ? (input as any).habilidades.join(', ') : 'Habilidades diversas';
    const personalidade = (input as any).personalidade ? 
      (input as any).personalidade.charAt(0).toUpperCase() + (input as any).personalidade.slice(1).toLowerCase() : 'Colaborativo';
    const experiencia = (input as any).experiencia || 'Baseada nas respostas do teste';
    const objetivos = (input as any).objetivos || `Foco em ${areaBase || 'tecnologia'}`;
    const disponibilidade = (input as any).disponibilidade ? 
      (input as any).disponibilidade.charAt(0).toUpperCase() + (input as any).disponibilidade.slice(1).toLowerCase() : 'Matutino';

    // Lógica para sugerir cursos de outras áreas se apropriado
    let cursosRecomendados = cursosDoEixo.slice(0, 8);
    
    // Se há poucos cursos no eixo principal, sugerir de áreas relacionadas
    if (cursosRecomendados.length < 3) {
      const areasRelacionadas: Record<string, string[]> = {
        'Tecnologia da Informação': ['Design', 'Comunicação'],
        'Gestão': ['Comunicação', 'Tecnologia da Informação'],
        'Design': ['Tecnologia da Informação', 'Comunicação'],
        'Comunicação': ['Design', 'Tecnologia da Informação'],
        'Beleza': ['Saúde'],
        'Saúde': ['Beleza'],
        'Gastronomia': ['Gestão'],
        'Modas': ['Design', 'Beleza'],
        'Artes': ['Design', 'Comunicação']
      };
      
      const relacionadas = areasRelacionadas[eixoEscolhido] || [];
      for (const areaRelacionada of relacionadas) {
        const cursosRelacionados = senacCourses.filter(c => 
          normalize(c.eixo) === normalize(areaRelacionada)
        ).slice(0, 3);
        cursosRecomendados = [...cursosRecomendados, ...cursosRelacionados];
        if (cursosRecomendados.length >= 6) break;
      }
    }

    const header = `Seus Resultados Estao Prontos!\nOla ${nome}! Descubra sua vocacao e os cursos ideais para voce`;
    const titulo = `\n\nAnalise Vocacional Personalizada\nAnalise Vocacional de ${nome}\nOla, ${nome}! Estou animado para ajudar voce a trilhar o caminho em direcao a uma carreira gratificante na area de ${areaBase || 'tecnologia'}. Vamos explorar seu perfil e como voce pode avancar em sua jornada profissional.`;
    const perfil = `\n\nPerfil Vocacional\nIdade: ${idade}\nEscolaridade: ${escolaridade}\nArea de Interesse Principal: ${areaBase ? areaBase.charAt(0).toUpperCase() + areaBase.slice(1) : eixoEscolhido}\nHabilidades Destacadas: ${habilidades}\nPersonalidade Profissional: ${personalidade}\nExperiencia Previa: ${experiencia}\nObjetivos Profissionais: ${objetivos}\nDisponibilidade para Estudos: ${disponibilidade}\nVoce se destaca como uma pessoa colaborativa, o que e uma grande vantagem em ambientes de tecnologia, onde o trabalho em equipe e a solucao de problemas sao essenciais. Sua disposicao para aprender e se desenvolver na area e fundamental, e sua escolha pela tecnologia mostra que voce esta atento as tendencias do mercado e as oportunidades de inovacao.`;
    const cursosTitle = `\n\nAreas de Afinidade\nCom base nas suas respostas, podemos identificar algumas areas de afinidade dentro da tecnologia:`;
    const cursosList = cursosRecomendados.length > 0
      ? cursosRecomendados.slice(0, 8).map(c => `- ${c.Turma}`).join('\n')
      : `- (Sem cursos disponiveis para o eixo ${eixoEscolhido} no momento)`;
    const footer = `\n\nLembre-se, ${nome}, seu perfil colaborativo e sua paixao pela tecnologia sao grandes aliados na sua jornada. Acredite em seu potencial e siga em frente!`;

    const markdown = `${header}${titulo}${perfil}${cursosTitle}\n\n${cursosList}${footer}`;

    // Streaming do markdown
    const chunkSize = 256;
    for (let i = 0; i < markdown.length; i += chunkSize) {
      const chunk = markdown.slice(i, i + chunkSize);
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, 8));
    }
    
    AgentLogger.logSuccess('VocationalOrchestrator', 'executeFullWorkflow', {
      sessionId: workflow.sessionId,
      timestamp: workflow.createdAt,
      processingTime: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('❌ ERRO nos agentes especializados:', error);
    console.error('📍 Stack trace:', (error as Error).stack);
    AgentLogger.logError('VocationalOrchestrator', 'executeFullWorkflow', error);
    
    // Fallback determinístico: gerar markdown com cursos do Senac por eixo, sem agentes
    console.warn('⚠️ Fallback determinístico: usando apenas senac-courses.json');

    const normalize = (s?: string) => (s || '').toLowerCase().trim();
    const areaFromInput = normalize((input as any).area_interesse);
    const areaToEixo: Record<string, string> = {
      'tecnologia': 'Tecnologia da Informação',
      'tecnologia da informação': 'Tecnologia da Informação',
      'ti': 'Tecnologia da Informação',
      't.i.': 'Tecnologia da Informação',
      'informatica': 'Tecnologia da Informação',
      'informática': 'Tecnologia da Informação',
      'gestao': 'Gestão',
      'gestão': 'Gestão',
      'administracao': 'Gestão',
      'administração': 'Gestão',
      'beleza': 'Beleza',
      'moda': 'Modas',
      'artes': 'Artes',
      'comunicacao': 'Comunicação',
      'comunicação': 'Comunicação',
      'design': 'Design',
      'gastronomia': 'Gastronomia',
      'saude': 'Saúde',
      'saúde': 'Saúde',
    };
    const eixoEscolhido = areaToEixo[areaFromInput] || 'Tecnologia da Informação';

    let senacCourses: Array<{ Turma: string; 'C. H.': number; eixo: string }> = [];
    try {
      const coursesPath = path.join(__dirname, "..", "data", "senac-courses.json");
      const raw = await fsPromises.readFile(coursesPath, "utf-8");
      senacCourses = JSON.parse(raw);
    } catch (err) {
      console.warn('⚠️ Não foi possível carregar senac-courses.json no fallback', err);
    }

    let cursosDoEixo = senacCourses.filter(c => normalize(c.eixo) === normalize(eixoEscolhido));
    if (normalize(eixoEscolhido) === normalize('Tecnologia da Informação')) {
      const preferidosNomes = ['Formação - Programação em Python', 'Excel Avançado'];
      cursosDoEixo.sort((a, b) => {
        const ai = preferidosNomes.indexOf(a.Turma);
        const bi = preferidosNomes.indexOf(b.Turma);
        const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        return av - bv;
      });
    }
    const cursosListaFinal = cursosDoEixo.slice(0, 8);

    const nome = input.nome || 'Participante';
    const idade = (input as any).idade ?? 'não informado';
    const escolaridade = (input as any).escolaridade ?? 'não informado';
    const habilidades = Array.isArray((input as any).habilidades) ? (input as any).habilidades.join(', ') : 'Habilidades diversas';
    const personalidade = (input as any).personalidade || 'Colaborativo';
    const experiencia = (input as any).experiencia || 'Baseada nas respostas do teste';
    const objetivos = (input as any).objetivos || `Foco em ${areaFromInput || eixoEscolhido}`;
    const disponibilidade = (input as any).disponibilidade || 'Matutino';

    const header = `Seus Resultados Estão Prontos!\nOlá ${nome}! Descubra sua vocação e os cursos ideais para você`;
    const titulo = `\n\nAnálise Vocacional Personalizada\nAnálise Vocacional de ${nome}\nOlá, ${nome}! Estou animado para ajudar você a trilhar o caminho em direção a uma carreira gratificante na área de ${eixoEscolhido.toLowerCase()}. Vamos explorar seu perfil e como você pode avançar em sua jornada profissional.`;
    const perfil = `\n\nPerfil Vocacional\nIdade: ${idade}\nEscolaridade: ${escolaridade}\nÁrea de Interesse Principal: ${areaFromInput || eixoEscolhido}\nHabilidades Destacadas: ${habilidades}\nPersonalidade Profissional: ${personalidade}\nExperiência Prévia: ${experiencia}\nObjetivos Profissionais: ${objetivos}\nDisponibilidade para Estudos: ${disponibilidade}`;
    const cursosTitle = `\n\nÁreas de Afinidade\nCom base nas suas respostas, indicamos cursos do Senac Maranhão no eixo: ${eixoEscolhido}`;
    const cursosList = cursosListaFinal.length > 0
      ? cursosListaFinal.map(c => `- ${c.Turma}${c["C. H."] ? ` (${c["C. H."]}h)` : ''}`).join('\n')
      : `- (Sem cursos disponíveis para o eixo ${eixoEscolhido} no momento)`;
    const footer = `\n\nLembre-se, ${nome}, seu perfil colaborativo e sua paixão são grandes aliados na sua jornada. Acredite em seu potencial e siga em frente!`;

    const markdown = `${header}${titulo}${perfil}${cursosTitle}\n\n${cursosList}${footer}`;

    const chunkSize = 256;
    for (let i = 0; i < markdown.length; i += chunkSize) {
      const chunk = markdown.slice(i, i + chunkSize);
      yield chunk;
      await new Promise(resolve => setTimeout(resolve, 8));
    }
  }
}

/**
 * Função legada mantida para compatibilidade e fallback
 */
async function* generateVocationalAnalysisLegacy(input: VocationalTestRequest) {
  const diretrizes = fs.readFileSync("knowledge/diretrizes.md", "utf-8");

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "system", content: buildDocsSystemPrompt(diretrizes) },
      { role: "user", content: buildUserPrompt(input) },
    ],
    temperature: 0.7,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

// Manter compatibilidade com sistema antigo (pode ser removido depois)
export async function* generateDietPlan(input: DietPlanRequest) {
  const diretrizes = fs.readFileSync("knowledge/diretrizes.md", "utf-8");

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "system", content: buildDocsSystemPrompt(diretrizes) },
      { role: "user", content: buildUserPrompt(input as any) },
    ],
    temperature: 0.6,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}

/*
 - stream:false > O modelo pensa, gera toda a resposta inteira, e só depois te devolve.
 - stream:true > O modelo pensa, gera a resposta parcialmente, e te devolve a cada vez que tem uma nova parte.
*/
