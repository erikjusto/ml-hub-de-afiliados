
import { GoogleGenAI, Type } from "@google/genai";
import { ProductData } from "../types";

export const extractProductData = async (url: string): Promise<ProductData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aja como um scraper de elite especializado no Mercado Livre. Analise minuciosamente a URL: ${url}
    
    INSTRUÇÕES DE EXTRAÇÃO CRÍTICAS:

    1. PREÇO PRINCIPAL (VALOR ATUAL):
       - Localize o container de preço principal (geralmente .ui-pdp-price__main-container).
       - Extraia a fração (.andes-money-amount__fraction) e os centavos (.andes-money-amount__cents).
       - IMPORTANTE: Se o valor for 1.299 e os centavos 90, o resultado deve ser "1.299,90". Nunca ignore os centavos.
    
    2. PARCELAMENTO (NOVO PADRÃO):
       - Procure especificamente pelo elemento com id="pricing_price_subtitle".
       - Dentro dele, capture o texto completo. Exemplo: "18x " + "R$ 7,60" + " com Linha de Crédito".
       - Formate o resultado final como: "18x R$ 7,60 com Linha de Crédito".
       - Se não encontrar este ID, procure por classes como "ui-pdp-price__subtitles".
    
    3. IMAGEM EM ALTA RESOLUÇÃO (HD):
       - Localize a imagem principal do produto.
       - Exemplo de URL encontrada: "https://http2.mlstatic.com/...-F.webp" ou "https://http2.mlstatic.com/...-V.jpg".
       - Você DEVE converter o sufixo final (antes da extensão) para "-O". 
       - Exemplo: "...-F.webp" torna-se "...-O.webp" ou "...-O.jpg".
       - Isso garante a imagem na maior qualidade disponível.

    4. DESCRIÇÃO:
       - Extraia os dados técnicos principais de forma concisa e profissional.

    Retorne estritamente este JSON:
    {
      "name": "Título Completo do Produto",
      "price": "VALOR_COM_CENTAVOS (ex: 1.299,90)",
      "currency": "R$",
      "installmentInfo": "TEXTO_COMPLETO_DO_PARCELAMENTO",
      "description": "Resumo das especificações técnicas",
      "imageUrl": "URL_DA_IMAGEM_CONVERTIDA_PARA_HD"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.STRING },
            currency: { type: Type.STRING },
            installmentInfo: { type: Type.STRING },
            description: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
          },
          required: ["name", "price", "imageUrl", "installmentInfo"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    return {
      name: data.name || "Produto Mercado Livre",
      price: data.price || "0,00",
      currency: data.currency || "R$",
      installmentInfo: data.installmentInfo || "",
      description: data.description || "Descrição não extraída.",
      imageUrl: data.imageUrl || "",
      affiliateUrl: url,
    };
  } catch (error) {
    console.error("Erro na extração Gemini:", error);
    throw new Error("Não foi possível processar os dados. Verifique o link e tente novamente.");
  }
};
