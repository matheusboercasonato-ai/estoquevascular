
import { GoogleGenAI, Type } from "@google/genai";
import { InventoryState } from "../types";

// Always use the direct process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeInventory = async (state: InventoryState) => {
  try {
    const prompt = `
      Analise o seguinte estado do estoque e forneça insights estratégicos em Português:
      Categorias: ${state.categories.map(c => c.name).join(', ')}
      Locais: ${state.locations.map(l => l.name).join(', ')}
      Produtos: ${JSON.stringify(state.products.map(p => ({
        nome: p.name,
        qtd: p.quantity,
        vencimento: p.expirationDate,
        preco: p.costPrice
      })))}

      Por favor, identifique:
      1. Produtos com estoque baixo (crítico).
      2. Produtos próximos do vencimento.
      3. Sugestão de reposição baseada no valor investido.
      4. Um resumo geral da saúde do estoque.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Erro na análise Gemini:", error);
    return "Não foi possível realizar a análise inteligente no momento. Verifique sua conexão ou chave de API.";
  }
};
