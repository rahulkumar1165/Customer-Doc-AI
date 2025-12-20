import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, RiskLevel, Incoterm, ExportReason } from "../types";

// Ambient declaration to satisfy TS for process.env.API_KEY in the Vite environment
declare const process: {
  env: {
    API_KEY: string;
  };
};

export const enrichShipment = async (
    description: string,
    quantity: number,
    totalValue: number,
    origin: string,
    destination: string,
    dutiesPaidBy: 'Seller' | 'Buyer'
) => {
    // Initializing Gemini API client with API key from environment variable as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    You are a Logistics AI. Enrich this shipment data for a customs invoice.
    
    Input:
    Product: ${description}
    Qty: ${quantity}
    Total Value: ${totalValue}
    Origin: ${origin}
    Destination: ${destination}
    Who pays duties: ${dutiesPaidBy}

    Tasks:
    1. Determine HS Code (6-digit).
    2. Infer Material & Intended Use.
    3. Estimate Gross & Net Weight in KG for the TOTAL shipment.
    4. Set Incoterm (DDP if Seller pays, DAP if Buyer pays).
    5. Calculate Unit Price.
    6. Set Reason for Export (default to Sale unless context implies otherwise).
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hsCode: { type: Type.STRING },
                    material: { type: Type.STRING },
                    intendedUse: { type: Type.STRING },
                    grossWeight: { type: Type.NUMBER },
                    netWeight: { type: Type.NUMBER },
                    incoterms: { type: Type.STRING, enum: ["DAP", "DDP", "FOB", "EXW", "CIF"] },
                    unitPrice: { type: Type.NUMBER },
                    reasonForExport: { type: Type.STRING, enum: ["Sale", "Sample", "Gift", "Repair", "Return"] },
                    riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                    reasoning: { type: Type.STRING }
                },
                required: ["hsCode", "material", "intendedUse", "grossWeight", "incoterms", "unitPrice"]
            }
        }
    });

    // Directly access .text property from GenerateContentResponse
    return JSON.parse(response.text || "{}");
};

export const extractOrderData = async (rawText: string) => {
    // Initializing Gemini API client with API key from environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    Extract shipment details from this raw order text.
    Text: "${rawText}"
    
    Return JSON with: consigneeName, consigneeAddress, productDescription, quantity, totalValue, currency.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    consigneeName: { type: Type.STRING },
                    consigneeAddress: { type: Type.STRING },
                    productDescription: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    totalValue: { type: Type.NUMBER },
                    currency: { type: Type.STRING },
                    destinationCountry: { type: Type.STRING }
                }
            }
        }
    });

    // Directly access .text property from GenerateContentResponse
    return JSON.parse(response.text || "{}");
};

export const validateShipment = async (shipmentData: any) => {
    // Initializing Gemini API client with API key from environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
    Validate this customs invoice data for errors or anomalies.
    Data: ${JSON.stringify(shipmentData)}
    
    Return JSON: { valid: boolean, warnings: string[] }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    valid: { type: Type.BOOLEAN },
                    warnings: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });

    // Directly access .text property from GenerateContentResponse
    return JSON.parse(response.text || "{}");
};

export const classifyShipment = async (
  _description: string,
  _material: string,
  _intendedUse: string,
  _origin: string,
  _destination: string,
  _value: number
): Promise<AIAnalysisResult> => {
    return {
        hsCode: "0000.00",
        dutyEstimate: "Pending",
        riskLevel: RiskLevel.LOW,
        reasoning: "Legacy classification."
    };
};
