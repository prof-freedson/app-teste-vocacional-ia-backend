import cors from "@fastify/cors";
import Fastify from "fastify";
import { planRoutes } from "./routes/plan";
import { agentRoutes } from "./routes/agents";
import { adminRoutes } from "./routes/admin";
let app = null;
async function createApp() {
    if (app)
        return app;
    app = Fastify({
        logger: process.env.NODE_ENV !== 'production',
    });
    await app.register(cors, {
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://app-teste-vocacional-ia-frontend.vercel.app",
            "https://app-teste-vocacional-ia.vercel.app"
        ],
        credentials: true,
        methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    });
    // Health check endpoint
    app.get("/", async (req, res) => {
        return { message: "API Teste Vocacional funcionando!", status: "OK", timestamp: new Date().toISOString() };
    });
    app.get("/teste", async (req, res) => {
        return { message: "Hello World", status: "OK" };
    });
    // Registra rotas existentes
    await app.register(planRoutes);
    // Registra novas rotas dos agentes especializados
    await app.register(agentRoutes);
    await app.register(adminRoutes);
    return app;
}
// Export the app for Vercel
export default async function handler(req, res) {
    try {
        const fastifyApp = await createApp();
        await fastifyApp.ready();
        fastifyApp.server.emit('request', req, res);
    }
    catch (error) {
        console.error('Erro no handler do Vercel:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Internal Server Error', message: errorMessage });
    }
}
// For local development
if (process.env.NODE_ENV !== 'production') {
    createApp().then((fastifyApp) => {
        fastifyApp
            .listen({ port: Number(process.env.PORT) || 3333, host: "0.0.0.0" })
            .then(() => {
            console.log("🚀 Server is running on port 3333");
            console.log("📚 Agentes especializados disponíveis:");
            console.log("   - POST /agents/questions - Geração de perguntas");
            console.log("   - POST /agents/analysis - Análise vocacional");
            console.log("   - POST /agents/courses - Recomendação de cursos");
            console.log("   - POST /agents/whatsapp - Formatação WhatsApp");
            console.log("   - POST /agents/workflow - Workflow completo");
            console.log("   - GET  /agents/health - Status dos agentes");
        })
            .catch((err) => {
            console.error(err);
            process.exit(1);
        });
    });
}
//# sourceMappingURL=server.js.map