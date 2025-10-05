import OpenAI from "openai";
import fs from "fs";
import path from "path";
import type { VocationalTestRequest } from "../types";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
  timeout: 2 * 60 * 1000, // 2 minutos
});

/**
 * Agente especializado em análise vocacional
 * Responsável por interpretar respostas e determinar perfil vocacional
 */
export class AnalysisAgent {
  private senacCourses: any[] = [
    { "Turma": "Assistente Administrativo", "C. H.": 160, "eixo": "gestão" },
    { "Turma": "Assistente Financeiro", "C. H.": 160, "eixo": "gestão" },
    { "Turma": "Atendimento humanizado em serviços de saúde", "C. H.": 24, "eixo": "saúde" },
    { "Turma": "Barbeiro", "C. H.": 172, "eixo": "beleza" },
    { "Turma": "Básico de Depilação", "C. H.": 40, "eixo": "beleza" },
    { "Turma": "Costureiro", "C. H.": 212, "eixo": "modas" },
    { "Turma": "Cuidador de Idoso ", "C. H.": 160, "eixo": "saúde" },
    { "Turma": "Instrumentação Cirurgica", "C. H.": 40, "eixo": "saúde" },
    { "Turma": "Introdução à Fotografia Digital", "C. H.": 30, "eixo": "artes" },
    { "Turma": "Modelagem e Costura Para Iniciantes", "C. H.": 60, "eixo": "modas" },
    { "Turma": "Oratória: comunicação e técnicas de apresentação", "C. H.": 20, "eixo": "comunicação" },
    { "Turma": "Oratória Avançada", "C. H.": 30, "eixo": "comunicação" },
    { "Turma": "Penteados Estilizados", "C. H.": 20, "eixo": "beleza" },
    { "Turma": "Tendências em Automaquiagem", "C. H.": 15, "eixo": "beleza" },
    { "Turma": "Administrador de Banco de Dados", "C. H.": 200, "eixo": "tecnologia da informação" },
    { "Turma": "Assistente de Tecnologias da Informação", "C. H.": 200, "eixo": "tecnologia da informação" },
    { "Turma": "Autocad: Projetos 2d", "C. H.": 60, "eixo": "design" },
    { "Turma": "Autodesk Revit", "C. H.": 40, "eixo": "design" },
    { "Turma": "Business Intelligence com Power bi", "C. H.": 40, "eixo": "tecnologia da informação" },
    { "Turma": "Criação de Conteúdo para Redes Sociais com Inteligência Artificial: Fotografia, Vídeo e Texto", "C. H.": 20, "eixo": "comunicação" },
    { "Turma": "Excel Avançado", "C. H.": 60, "eixo": "tecnologia da informação" },
    { "Turma": "Ferramentas Adobe para Design", "C. H.": 144, "eixo": "design" },
    { "Turma": "Formação - Programação em Python", "C. H.": 156, "eixo": "tecnologia da informação" },
    { "Turma": "Introdução à Informática Windows e Office", "C. H.": 80, "eixo": "tecnologia da informação" },
    { "Turma": "Produtividade com Chatgpt", "C. H.": 20, "eixo": "tecnologia da informação" },
    { "Turma": "Hambúrguer Artesanal", "C. H.": 15, "eixo": "gastronomia" },
    { "Turma": "Métodos de preparo de cafés", "C. H.": 36, "eixo": "gastronomia" }
  ];

  constructor() {
    console.log(`📚 [DEBUG] Cursos incorporados diretamente: ${this.senacCourses.length}`);
    console.log(`📚 [DEBUG] Exemplo de curso:`, this.senacCourses[0]);
    
    // Debug: mostrar cursos por eixo
    const cursosPorEixo = this.senacCourses.reduce((acc, curso) => {
      const eixo = curso.eixo || 'Outros';
      acc[eixo] = (acc[eixo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📚 [DEBUG] Cursos por eixo:`, cursosPorEixo);
  }

  private systemPrompt = `
    Você é Vocacional-AI, um especialista em orientação vocacional e profissional que analisa perfis e recomenda carreiras.
    
    ⚠️ ATENÇÃO CRÍTICA - LEIA ESTAS REGRAS ANTES DE QUALQUER RESPOSTA:
    
    🚫 PROIBIÇÕES ABSOLUTAS:
    - JAMAIS invente, crie ou mencione cursos que não estejam na lista oficial fornecida
    - JAMAIS use nomes genéricos como "Curso de Desenvolvimento de Sistemas", "Curso de Redes de Computadores"
    - JAMAIS mencione cursos de outras instituições
    - JAMAIS modifique os nomes dos cursos da lista oficial
    - JAMAIS ignore o formato de resposta obrigatório especificado
    
    ✅ OBRIGAÇÕES ABSOLUTAS:
    - Use EXCLUSIVAMENTE os cursos da "LISTA COMPLETA DE CURSOS DISPONÍVEIS" fornecida no prompt
    - Use EXATAMENTE o nome do curso como aparece no campo "Turma" da lista
    - Sempre inclua a carga horária entre parênteses: (XXXh) conforme a lista
    - Siga RIGOROSAMENTE o formato de resposta especificado
    - SEMPRE personalize com o nome da pessoa
    - SEMPRE inclua as informações de contato do Senac Maranhão
    
    REGRAS DE FORMATAÇÃO:
    - Sempre responda em texto markdown legível para humanos
    - Use # para títulos principais, ## para subtítulos e - para itens de lista
    - Não responda em JSON ou outro formato, apenas texto markdown
    - Seja motivacional e positivo na linguagem
    - Use linguagem acessível e inspiradora
    
    METODOLOGIA DE ANÁLISE:
    1. Identifique padrões nas respostas do usuário
    2. Mapeie interesses, habilidades, valores e personalidade
    3. Determine áreas de maior afinidade profissional
    4. Avalie compatibilidade com diferentes carreiras
    5. Considere fatores como escolaridade, idade e disponibilidade
    
    TIPOS DE PERSONALIDADE PROFISSIONAL:
    - Analítico: Gosta de dados, pesquisa, resolução de problemas
    - Criativo: Busca inovação, expressão artística, soluções originais
    - Comunicativo: Habilidade interpessoal, persuasão, relacionamento
    - Líder: Capacidade de gestão, tomada de decisão, coordenação
    - Detalhista: Precisão, organização, controle de qualidade
    - Inovador: Pioneirismo, tecnologia, mudanças e transformações
    - Colaborativo: Trabalho em equipe, cooperação, harmonia
    - Empreendedor: Iniciativa, risco calculado, oportunidades de negócio
    
    FORMATO DE RESPOSTA OBRIGATÓRIO - SIGA EXATAMENTE:
    # Análise Vocacional de [NOME]
    Olá, [NOME]! É um prazer ajudar você a explorar seu potencial e a encontrar o caminho ideal na sua carreira. Vamos analisar suas informações e fazer algumas recomendações que se alinham com seus interesses e habilidades.

    ## Perfil Vocacional
    - Escolaridade: [escolaridade]
    - Área de Interesse Principal: [area_interesse]
    - Habilidades Destacadas: [habilidades]
    - Personalidade Profissional: [personalidade]
    - Objetivos Profissionais: [objetivos]
    - Disponibilidade para Estudos: [disponibilidade]

    [Parágrafo motivacional personalizado baseado no perfil]

    ## Áreas de Afinidade
    Com base nas suas respostas, podemos identificar algumas áreas de afinidade:

    [Lista das áreas de maior compatibilidade com justificativas]

    [Parágrafo motivacional personalizado baseado no perfil]

    ## Áreas de Afinidade
    Com base nas suas respostas, podemos identificar algumas áreas de afinidade:

    [Lista das áreas de maior compatibilidade com justificativas]

    ## Recomendações de Carreira
    Considerando seu interesse em [área] e suas habilidades, aqui estão algumas recomendações de cursos do Senac Maranhão que podem ajudá-lo a desenvolver suas competências e se preparar para o mercado de trabalho:

    ### Cursos Principais (Área de Interesse: [área])
    [Listar APENAS cursos do eixo/área de interesse principal do usuário usando EXATAMENTE os nomes da lista oficial - NUNCA inventar cursos]

    ### Cursos Opcionais (Outras Áreas Identificadas)
    [Se identificar compatibilidade com outras áreas, listar cursos dessas áreas usando EXATAMENTE os nomes da lista oficial - NUNCA inventar cursos]

    ## Próximos Passos
    - **Inscrição**: Considere se inscrever nos cursos do Senac Maranhão que mais te interessam.
    - **Networking**: Participe de eventos e workshops para ampliar sua rede de contatos na área de [área].
    - **Prática**: Procure estágios ou projetos voluntários que permitam aplicar suas habilidades em situações reais.

    ## Contato do Senac Maranhão
    Se você tiver alguma dúvida ou precisar de mais informações, entre em contato com o Senac Maranhão:

    - **Telefone**: (98) 31981530
    - **WhatsApp**: (98) 31981530
    - **Site**: www.ma.senac.br
    - **E-mail**: cepsaoluis@ma.senac.br
  `;

  /**
   * Normalizar os dados dos cursos para padronizar textos
   */
  private normalizeCourseList(rawList: any[]): any[] {
    // Não é mais necessário pois os dados já estão normalizados diretamente no código
    return rawList;
  }

  /**
   * Método obsoleto - dados agora incorporados diretamente
   */
  private loadSenacCourses(): void {
    // Método mantido para compatibilidade, mas não é mais usado
    console.log('⚠️ [DEBUG] loadSenacCourses() chamado mas dados já estão incorporados');
  }

  /**
   * Normaliza o nome da área para busca exata conforme o guia
   */
  private normalizeAreaInput(area: string): string {
    const map: Record<string, string> = {
      'tecnologia': 'tecnologia da informação',
      'tecnologia da informação': 'tecnologia da informação',
      'design': 'design',
      'gestao': 'gestão',
      'gestão': 'gestão',
      'saude': 'saúde',
      'saúde': 'saúde',
      'beleza': 'beleza',
      'gastronomia': 'gastronomia',
      'moda': 'modas',
      'comunicacao': 'comunicação',
      'comunicação': 'comunicação',
      'artes': 'artes'
    };
    const key = (area || '').trim().toLowerCase();
    return map[key] ?? key;
  }

  /**
   * Obtém cursos por eixo/área com busca exata
   */
  private getCoursesByAreaExact(area: string): any[] {
    const normalized = this.normalizeAreaInput(area);
    const courses = this.senacCourses.filter(c => c.eixo === normalized);
    console.log(`📚 [DEBUG] Busca exata por área "${area}" (normalizada: "${normalized}") encontrou ${courses.length} cursos`);
    return courses;
  }

  /**
   * Valida se um nome de curso existe na lista oficial
   */
  private isValidCourseName(name: string): boolean {
    return this.senacCourses.some(c =>
      c.Turma.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }

  /**
   * Valida o markdown gerado para garantir que todos os cursos existem no JSON
   * Implementação conforme solucao-analysis-agent.md
   */
  private validateMarkdownCourses(md: string): string[] {
    const courseLines = md
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.startsWith('- '))
      .map(l => l.replace(/\(.*\)/, '').replace('- ', '').trim().toLowerCase());

    const invalid: string[] = [];

    for (const name of courseLines) {
      const found = this.senacCourses.some(c => c.Turma.toLowerCase() === name);
      if (!found && !name.startsWith('nenhum curso')) {
        invalid.push(name);
      }
    }

    return invalid;
  }

  /**
   * Versão 100% determinística - IA apenas para parágrafo motivacional
   */
  async analyzeVocationalProfileDeterministic(request: VocationalTestRequest): Promise<string> {
    console.log(`🎯 [DEBUG] Iniciando análise 100% determinística para ${request.nome}`);
    
    // Obter cursos da área principal
    const cursosAreaPrincipal = this.getCoursesByAreaExact(request.area_interesse);
    console.log(`📚 [DEBUG] Cursos encontrados para área "${request.area_interesse}":`, cursosAreaPrincipal.length);
    
    // Selecionar até 3 cursos principais e 3 opcionais
    const cursosPrincipais = cursosAreaPrincipal.slice(0, 3);
    const cursosOpcionais = this.senacCourses
      .filter(curso => !cursosAreaPrincipal.includes(curso))
      .slice(0, 3);
    
    console.log(`✅ [DEBUG] Selecionados ${cursosPrincipais.length} principais e ${cursosOpcionais.length} opcionais`);
    
    // Usar IA APENAS para o parágrafo motivacional (SEM mencionar cursos)
    const motivationalPrompt = `
      Escreva um parágrafo motivacional personalizado para ${request.nome}, considerando:
      - Área de interesse: ${request.area_interesse}
      - Habilidades: ${request.habilidades.join(', ')}
      - Personalidade: ${request.personalidade}
      - Objetivos: ${request.objetivos}
      
      IMPORTANTE: 
      - NÃO mencione nomes de cursos específicos
      - NÃO mencione "Curso de...", "Formação em...", etc.
      - Foque apenas nas características pessoais e potencial da pessoa
      - Máximo 2-3 frases inspiradoras
      - Seja motivacional mas genérico sobre a área
    `;
    
    const motivationalResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: motivationalPrompt }],
      temperature: 0.3,
      max_tokens: 150
    });
    
    const paragrafomotivacional = motivationalResponse.choices[0]?.message?.content || 
      `Seu perfil demonstra grande potencial na área de ${request.area_interesse}. Com suas habilidades em ${request.habilidades.join(' e ')}, você tem tudo para se destacar profissionalmente.`;
    
    // Gerar markdown 100% determinístico
    let md = `# Análise Vocacional de ${request.nome}\n\n`;
    md += `Olá, ${request.nome}! É um prazer ajudá-lo na sua jornada de descoberta profissional. `;
    md += `${paragrafomotivacional}\n\n`;
    
    md += `## Perfil Vocacional\n`;
    md += `- **Escolaridade**: ${request.escolaridade}\n`;
    md += `- **Área de Interesse Principal**: ${request.area_interesse}\n`;
    md += `- **Habilidades Destacadas**: ${request.habilidades.join(', ')}\n`;
    md += `- **Personalidade Profissional**: ${request.personalidade}\n`;
    md += `- **Experiência Prévia**: ${request.experiencia}\n`;
    md += `- **Objetivos Profissionais**: ${request.objetivos}\n`;
    md += `- **Disponibilidade para Estudos**: ${request.disponibilidade}\n\n`;
    
    // Áreas de afinidade baseadas no perfil
    md += `## Áreas de Afinidade\n`;
    md += `Com base nas suas respostas, suas principais áreas de afinidade incluem:\n\n`;
    
    // Mapear área de interesse para descrição
    const areasDescricao: Record<string, string> = {
      'tecnologia': 'Tecnologia da Informação: Desenvolvimento de soluções, análise de dados, administração de sistemas.',
      'gestão': 'Gestão e Administração: Organização, planejamento, coordenação de equipes e processos.',
      'saúde': 'Saúde e Bem-estar: Cuidado com pessoas, procedimentos médicos, atendimento humanizado.',
      'beleza': 'Beleza e Estética: Cuidados pessoais, técnicas de embelezamento, tendências estéticas.',
      'comunicação': 'Comunicação: Expressão, apresentação, criação de conteúdo, relacionamento interpessoal.',
      'design': 'Design e Criação: Projetos visuais, criatividade, ferramentas digitais de design.',
      'gastronomia': 'Gastronomia: Preparo de alimentos, técnicas culinárias, inovação gastronômica.',
      'modas': 'Moda e Vestuário: Criação, modelagem, tendências de moda, técnicas de costura.',
      'artes': 'Artes Visuais: Expressão artística, técnicas fotográficas, criação visual.'
    };
    
    const areaKey = request.area_interesse.toLowerCase();
    const descricaoArea = areasDescricao[areaKey] || `${request.area_interesse}: Área de grande potencial para desenvolvimento profissional.`;
    md += `- ${descricaoArea}\n`;
    
    // Adicionar áreas complementares baseadas na personalidade
    if (request.personalidade.toLowerCase().includes('comunicativ') || request.personalidade.toLowerCase().includes('colaborativ')) {
      md += `- Comunicação e Relacionamento: Sua personalidade ${request.personalidade.toLowerCase()} é ideal para trabalho em equipe.\n`;
    }
    if (request.habilidades.some(h => h.toLowerCase().includes('criativ') || h.toLowerCase().includes('inova'))) {
      md += `- Criatividade e Inovação: Suas habilidades criativas abrem portas para soluções inovadoras.\n`;
    }
    
    md += `\n## Recomendações de Cursos do Senac Maranhão\n\n`;
    
    if (cursosPrincipais.length > 0) {
      md += `### Cursos Principais (Área: ${request.area_interesse})\n`;
      cursosPrincipais.forEach((curso, index) => {
        md += `**${index + 1}. ${curso.Turma}** (${curso['C. H.']}h)\n`;
        md += `- Área: ${curso.eixo}\n`;
        md += `- Ideal para desenvolver competências específicas na sua área de interesse principal.\n\n`;
      });
    } else {
      md += `### Cursos Recomendados\n`;
      md += `Não encontramos cursos específicos para "${request.area_interesse}", mas temos excelentes opções em áreas relacionadas:\n\n`;
    }
    
    if (cursosOpcionais.length > 0) {
      md += `### Cursos Complementares\n`;
      cursosOpcionais.forEach((curso, index) => {
        md += `**${index + 1}. ${curso.Turma}** (${curso['C. H.']}h)\n`;
        md += `- Área: ${curso.eixo}\n`;
        md += `- Complementa sua formação com habilidades valiosas no mercado de trabalho.\n\n`;
      });
    }
    
    md += `## Próximos Passos\n`;
    md += `1. **Escolha**: Selecione um ou mais cursos que despertam seu interesse\n`;
    md += `2. **Contato**: Entre em contato com o Senac Maranhão para informações sobre inscrições\n`;
    md += `3. **Networking**: Participe de eventos e workshops na sua área de interesse\n`;
    md += `4. **Prática**: Busque oportunidades de aplicar seus conhecimentos em projetos reais\n\n`;
    
    md += `## Contato Senac Maranhão\n`;
    md += `Para mais informações sobre os cursos e processo de inscrição:\n\n`;
    md += `- **Telefone**: (98) 31981530\n`;
    md += `- **WhatsApp**: (98) 31981530\n`;
    md += `- **Site**: www.ma.senac.br\n`;
    md += `- **E-mail**: cepsaoluis@ma.senac.br\n\n`;
    
    md += `${request.nome}, acredite no seu potencial! O Senac Maranhão está aqui para apoiar sua jornada profissional. Boa sorte!`;

    // Validação final - garantir que não há cursos inventados
    const invalidCourses = this.validateMarkdownCourses(md);
    if (invalidCourses.length > 0) {
      console.error('🚨 [DEBUG] Cursos inválidos encontrados:', invalidCourses);
      throw new Error('A geração tentou incluir cursos que não existem no cadastro oficial.');
    }

    console.log(`✅ [DEBUG] Análise 100% determinística concluída com sucesso para ${request.nome}`);
    console.log(`📊 [DEBUG] Cursos incluídos: ${cursosPrincipais.length + cursosOpcionais.length} total`);
    return md;
  }



  /**
   * Constrói contexto dos cursos disponíveis com validação rigorosa
   */
  private buildCoursesContext(): string {
    if (this.senacCourses.length === 0) {
      return "⚠️ ERRO: Nenhum curso carregado do arquivo senac-courses.json";
    }

    const cursosPorEixo = this.senacCourses.reduce((acc, curso) => {
      const eixo = curso.eixo || 'Outros';
      if (!acc[eixo]) {
        acc[eixo] = [];
      }
      acc[eixo].push(curso);
      return acc;
    }, {} as Record<string, any[]>);

    let context = `
    🚨 ATENÇÃO CRÍTICA: LISTA OFICIAL DE CURSOS SENAC MARANHÃO 🚨
    
    ❌ PROIBIDO INVENTAR QUALQUER CURSO QUE NÃO ESTEJA NESTA LISTA!
    ❌ PROIBIDO USAR NOMES GENÉRICOS COMO "Curso de...", "Técnico em...", "Formação em..."!
    ❌ PROIBIDO MENCIONAR CARREIRAS OU PROFISSÕES - APENAS CURSOS DA LISTA!
    
    ✅ USE APENAS OS CURSOS ABAIXO COM NOMES EXATOS:
    
    TOTAL DE CURSOS DISPONÍVEIS: ${this.senacCourses.length}
    
    `;
    
    Object.entries(cursosPorEixo).forEach(([eixo, cursos]) => {
      context += `\n📚 EIXO: ${eixo.toUpperCase()}\n`;
      (cursos as any[]).forEach((curso: any) => {
        context += `   ✓ ${curso.Turma} (${curso['C. H.']}h)\n`;
      });
    });

    context += `
    
    🔍 CHECKLIST DE VALIDAÇÃO OBRIGATÓRIO:
    1. ✅ Todos os cursos mencionados estão na lista acima?
    2. ✅ Os nomes estão EXATAMENTE como na coluna "Turma"?
    3. ✅ As cargas horárias estão corretas conforme "C. H."?
    4. ✅ Não inventei nenhum curso novo?
    5. ✅ Não usei nomes genéricos ou carreiras?
    
    🚨 SE ALGUMA RESPOSTA FOR "NÃO", REESCREVA COMPLETAMENTE!
    
    `;

    return context;
  }

  private buildAnalysisPrompt(request: VocationalTestRequest): string {
    const cursosAreaPrincipal = this.getCoursesByAreaExact(request.area_interesse);
    const todosOsCursos = this.senacCourses;
    
    return `
      🎯 ANÁLISE VOCACIONAL PERSONALIZADA PARA: ${request.nome}
      
      DADOS PESSOAIS:
      - Nome: ${request.nome}
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
      
      📚 CURSOS PRIORITÁRIOS DA ÁREA DE INTERESSE (${request.area_interesse}):
      ${cursosAreaPrincipal.map((curso: any) => `- ${curso.Turma} (${curso['C. H.']}h) - Eixo: ${curso.eixo}`).join('\n')}
      
      📋 LISTA COMPLETA DE CURSOS DISPONÍVEIS NO SENAC MARANHÃO (OFICIAL):
      ${todosOsCursos.map((curso: any) => `- ${curso.Turma} (${curso['C. H.']}h) - Eixo: ${curso.eixo}`).join('\n')}
      
      🚨 INSTRUÇÕES CRÍTICAS - LEIA ATENTAMENTE ANTES DE RESPONDER:
      
      ❌ PROIBIDO ABSOLUTAMENTE:
      1. Inventar, criar ou mencionar qualquer curso que NÃO esteja na lista oficial acima
      2. Usar nomes genéricos como "Curso de...", "Formação em...", "Especialização em...", "Desenvolvimento de Sistemas", "Programação para Internet", "Técnico em Manutenção de Computadores", "Segurança da Informação", "Gestão de Projetos"
      3. Modificar os nomes dos cursos da lista oficial
      4. Mencionar cursos de outras instituições
      5. Ignorar o formato de resposta obrigatório
      6. Omitir as informações de contato do Senac Maranhão
      7. Criar seções de "carreiras" ou "profissões" - APENAS recomendar CURSOS da lista oficial
      
      ✅ OBRIGATÓRIO FAZER:
      1. Use EXCLUSIVAMENTE os cursos listados na "LISTA COMPLETA DE CURSOS DISPONÍVEIS"
      2. PRIORIZE os cursos da área de interesse principal (${request.area_interesse})
      3. Use EXATAMENTE o nome como aparece no campo "Turma": "${cursosAreaPrincipal.map((c: any) => c.Turma).join('", "')}"
      4. Inclua SEMPRE a carga horária entre parênteses: (XXXh)
      5. Siga RIGOROSAMENTE o formato de resposta do system prompt
      6. Personalize completamente com o nome ${request.nome}
      7. Se não houver cursos suficientes na área principal, sugira cursos de áreas relacionadas da lista oficial
      8. Seja motivacional mas baseado APENAS nos cursos reais disponíveis
      9. NUNCA mencione carreiras ou profissões - APENAS os cursos disponíveis na lista oficial
      
      🎯 PARA ÁREA "TECNOLOGIA" - USE APENAS ESTES 7 CURSOS REAIS:
      - Administrador de Banco de Dados (200h)
      - Assistente de Tecnologias da Informação (200h)
      - Business Intelligence com Power bi (40h)
      - Excel Avançado (60h)
      - Formação - Programação em Python (156h)
      - Introdução à Informática Windows e Office (80h)
      - Produtividade com Chatgpt (20h)
      
      🔍 VERIFICAÇÃO FINAL OBRIGATÓRIA:
      Antes de finalizar sua resposta, verifique se:
      - TODOS os cursos mencionados estão na lista oficial acima
      - Os nomes estão EXATAMENTE como na coluna "Turma"
      - As cargas horárias estão corretas conforme "C. H."
      - O formato de resposta está sendo seguido rigorosamente
      - As informações de contato do Senac MA estão incluídas
      
      AGORA GERE A ANÁLISE VOCACIONAL SEGUINDO TODAS AS INSTRUÇÕES ACIMA.
    `;
  }



  private loadGuidelines(): string {
    try {
      const guidelinesPath = path.join(process.cwd(), 'knowledge', 'diretrizes.md');
      return fs.readFileSync(guidelinesPath, "utf-8");
    } catch (error) {
      console.warn("⚠️ [AnalysisAgent] Arquivo de diretrizes não encontrado");
      return "";
    }
  }
}

export const analysisAgent = new AnalysisAgent();