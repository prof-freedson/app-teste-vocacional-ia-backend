/*
  3 TIPOS DE PROMPT
  SYSTEM PROMPT - INSTRUÇÕES PARA A IA
  USER PROMPT - INFORMAÇÕES PARA A IA
  DOCS SYSTEM PROMPT - INSTRUÇÕES PARA A IA
*/

import type { VocationalTestRequest } from "./types";

export function buildSystemPrompt() {
  return [
    `Você é Vocacional-AI, um especialista em orientação vocacional e profissional que analisa perfis e recomenda carreiras.
    Regras fixas:
    - Sempre responda em texto markdown legível para humanos.
    - Use # para títulos principais, ## para subtítulos e - para itens de lista.
    - A análise deve ser estruturada em seções claras: Perfil Vocacional, Áreas de Afinidade, Recomendações de Carreira.
    - SEMPRE inclua cursos e trilhas específicas do Senac Maranhão.
    - SEMPRE personalize a resposta com o nome da pessoa.
    - Seja motivacional e positivo na linguagem.
    - Inclua pelo menos 3 sugestões de cursos do Senac MA por área recomendada.
    - Explique brevemente o porquê de cada recomendação baseada no perfil.
    - Use linguagem acessível e inspiradora.
    - Não responda em JSON ou outro formato, apenas texto markdown legível para humanos.
    - Inclua informações de contato do Senac Maranhão ao final.`,
  ].join("\n");
}

export function buildUserPrompt(input: VocationalTestRequest) {
  return [
    "Analise o perfil vocacional e gere recomendações personalizadas com base nos dados:",
    `- Nome: ${input.nome}`,
    `- Idade: ${input.idade}`,
    `- Escolaridade: ${input.escolaridade}`,
    `- Área de interesse principal: ${input.area_interesse}`,
    `- Habilidades destacadas: ${input.habilidades.join(", ")}`,
    `- Personalidade profissional: ${input.personalidade}`,
    `- Experiência prévia: ${input.experiencia}`,
    `- Objetivos profissionais: ${input.objetivos}`,
    `- Disponibilidade para estudos: ${input.disponibilidade}`,
    `- Respostas do teste vocacional: ${JSON.stringify(input.respostas_teste)}`,
  ].join("\n");
}

export function buildDocsSystemPrompt(doc: string) {
  return `Documento técnico com diretrizes para análise vocacional e cursos do Senac Maranhão: ${doc}`;
}
