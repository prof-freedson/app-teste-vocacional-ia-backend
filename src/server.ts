import cors from "@fastify/cors";
import Fastify from "fastify";
import { planRoutes } from "./routes/plan";
import { agentRoutes } from "./routes/agents";
import { adminRoutes } from "./routes/admin";

let app: any = null;

async function createApp() {
  if (app) return app;
  
  app = Fastify({
    logger: process.env.NODE_ENV !== 'production',
  });

  await app.register(cors, {
    origin: [
      "http://localhost:3001",
      "https://app-teste-vocacional-ia-frontend.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  app.get("/teste", async (req: any, res: any) => {
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
export default async function handler(req: any, res: any) {
  const fastifyApp = await createApp();
  await fastifyApp.ready();
  fastifyApp.server.emit('request', req, res);
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
      .catch((err: any) => {
        console.error(err);
        process.exit(1);
      });
  });
}
