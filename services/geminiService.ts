import { ProductData } from "../types";

export const extractProductData = async (url: string): Promise<ProductData> => {
  try {
    const response = await fetch('/api/gemini/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Falha ao processar a URL no servidor.');
    }

    return data as ProductData;
  } catch (error: any) {
    console.error("Erro no serviço de extração:", error);
    throw new Error(error.message || "Falha na comunicação com o serviço de IA.");
  }
};
