import cors from "@fastify/cors";
import Fastify from "fastify";
import { planRoutes } from "./routes/plan";
import { agentRoutes } from "./routes/agents";
import { adminRoutes } from "./routes/admin";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "*",
  methods: ["GET", "POST"],
});

app.get("/teste", (req, res) => {
  res.send("Hello World");
});

// Registra rotas existentes
app.register(planRoutes);

// Registra novas rotas dos agentes especializados
app.register(agentRoutes);
app.register(adminRoutes);

app
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
    app.log.error(err);
    process.exit(1);
  });
