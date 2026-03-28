
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Encontre 5 celulares em oferta no Mercado Livre Brasil hoje. Liste o nome do produto, o preço e o link.",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  console.log(response.text);
}

main();
