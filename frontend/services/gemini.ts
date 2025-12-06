import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeTransaction = async (
  description: string, 
  amount: number, 
  role: 'buyer' | 'seller'
): Promise<{ terms: string[]; riskScore: number; analysis: string }> => {
  if (!apiKey) {
    return {
        terms: [
            "Item must be shipped within 3 business days.",
            "Funds held in escrow until delivery confirmation.",
            "Buyer has 24 hours to inspect goods.",
        ],
        riskScore: 15,
        analysis: "Demo mode: API Key not found. This is a simulated safe transaction analysis."
    };
  }

  try {
    const prompt = `
      You are Krowba, an AI Escrow Agent. 
      Analyze this transaction:
      Role: ${role}
      Amount: $${amount}
      Description: "${description}"

      Output a JSON object with this schema:
      {
        "terms": ["string", "string", "string"], // 3-5 specific, protective contract clauses
        "riskScore": number, // 0-100 (0 is safe, 100 is scam)
        "analysis": "string" // A brief 2 sentence summary of potential pitfalls or confirmation of safety.
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      terms: ["Standard Escrow Protection applies.", "Dispute resolution enabled."],
      riskScore: 0,
      analysis: "Unable to perform deep AI analysis at this moment. Standard protocols apply."
    };
  }
};