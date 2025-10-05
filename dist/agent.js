import fs from "fs";
import OpenAI from "openai";
import { buildDocsSystemPrompt, buildSystemPrompt, buildUserPrompt, } from "./prompt";
// Importação direta dos agentes
import { vocationalOrchestrator, analysisAgent, courseAgent, whatsAppAgent, AgentLogger } from "./agents/index.js";
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
    logLevel: "debug",
});
/**
 * Função principal para análise vocacional usando agentes especializados
 * Mantém compatibilidade com streaming para o frontend
 */
export async function* generateVocationalAnalysis(input) {
    const startTime = Date.now();
    try {
        console.log('🚀 Iniciando generateVocationalAnalysis com agentes especializados...');
        AgentLogger.logAgentCall('VocationalOrchestrator', 'executeFullWorkflow', 0);
        // Executa o workflow completo usando os agentes especializados
        console.log('📞 Chamando vocationalOrchestrator.executeFullWorkflow...');
        const workflow = await vocationalOrchestrator.executeFullWorkflow(input);
        console.log('✅ Workflow executado com sucesso:', workflow);
        // Converte o resultado para formato de streaming para manter compatibilidade
        const result = {
            analise_vocacional: workflow.data.analysis,
            cursos_recomendados: workflow.data.courses,
            narrativa_personalizada: workflow.data.personalizedNarrative,
            mensagem_whatsapp: workflow.data.whatsappMessage,
            metadata: {
                sessionId: workflow.sessionId,
                timestamp: workflow.createdAt,
                processingTime: Date.now() - startTime
            }
        };
        console.log('📦 Resultado formatado para streaming:', Object.keys(result));
        // Simula streaming enviando o resultado em chunks
        const resultString = JSON.stringify(result, null, 2);
        const chunkSize = 100; // Tamanho do chunk para simular streaming
        for (let i = 0; i < resultString.length; i += chunkSize) {
            const chunk = resultString.slice(i, i + chunkSize);
            yield chunk;
            // Pequeno delay para simular processamento em tempo real
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        AgentLogger.logSuccess('VocationalOrchestrator', 'executeFullWorkflow', result);
    }
    catch (error) {
        console.error('❌ ERRO nos agentes especializados:', error);
        console.error('📍 Stack trace:', error.stack);
        AgentLogger.logError('VocationalOrchestrator', 'executeFullWorkflow', error);
        // Fallback para o sistema antigo em caso de erro
        console.warn('⚠️ Fallback para sistema antigo devido a erro nos agentes especializados');
        yield* generateVocationalAnalysisLegacy(input);
    }
}
/**
 * Função legada mantida para compatibilidade e fallback
 */
async function* generateVocationalAnalysisLegacy(input) {
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
        if (delta)
            yield delta;
    }
}
// Manter compatibilidade com sistema antigo (pode ser removido depois)
export async function* generateDietPlan(input) {
    const diretrizes = fs.readFileSync("knowledge/diretrizes.md", "utf-8");
    const stream = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "system", content: buildDocsSystemPrompt(diretrizes) },
            { role: "user", content: buildUserPrompt(input) },
        ],
        temperature: 0.6,
        stream: true,
    });
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta)
            yield delta;
    }
}
/*
 - stream:false > O modelo pensa, gera toda a resposta inteira, e só depois te devolve.
 - stream:true > O modelo pensa, gera a resposta parcialmente, e te devolve a cada vez que tem uma nova parte.
*/
//# sourceMappingURL=agent.js.map