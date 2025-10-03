import OpenAI from "openai";
export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 2 * 60 * 1000, // 2 minutos
});
//# sourceMappingURL=openai.js.map