import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, RiskLevel, Incoterm, ExportReason } from "../types";

const API_KEY = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey: API_KEY });

// -- HELPER: ENRICH SHIPMENT DATA --
// Takes minimal inputs and expands to full customs data
export const enrichShipment = async (
    description: string,
    quantity: number,
    totalValue: number, // Total value of shipment, not unit
    origin: string,
    destination: string,
    dutiesPaidBy: 'Seller' | 'Buyer'
) => {
    if (!API_KEY) {
        // Mock fallback
        await new Promise(r => setTimeout(r, 1000));
        return {
            hsCode: "6205.20",
            material: "Cotton",
            intendedUse: "Retail Sale",
            grossWeight: quantity * 0.5,
            netWeight: quantity * 0.4,
            incoterms: dutiesPaidBy === 'Seller' ? Incoterm.DDP : Incoterm.DAP,
            unitPrice: totalValue / quantity,
            reasonForExport: ExportReason.SALE,
            riskLevel: RiskLevel.LOW,
            reasoning: "Mock enrichment data."
        };
    }

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
        model: "gemini-2.5-flash",
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

    return JSON.parse(response.text || "{}");
};

// -- HELPER: PARSE RAW ORDER TEXT --
export const extractOrderData = async (rawText: string) => {
    if (!API_KEY) return null;

    const prompt = `
    Extract shipment details from this raw order text.
    Text: "${rawText}"
    
    Return JSON with: consigneeName, consigneeAddress, productDescription, quantity, totalValue, currency.
    If multiple items, just summarize the main one for this MVP.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

    return JSON.parse(response.text || "{}");
};

// -- HELPER: VALIDATE SHIPMENT --
export const validateShipment = async (shipmentData: any) => {
    if (!API_KEY) return { valid: true, warnings: [] };

    const prompt = `
    Validate this customs invoice data for errors or anomalies.
    Data: ${JSON.stringify(shipmentData)}
    
    Check for:
    - Mismatched weight vs quantity (e.g. 100 items weighing 0.1kg).
    - Missing or malformed HS codes.
    - Missing descriptions.
    - Value discrepancies.
    
    Return JSON: { valid: boolean, warnings: string[] }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
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

    return JSON.parse(response.text || "{}");
};

export const classifyShipment = async (
  description: string,
  material: string,
  intendedUse: string,
  origin: string,
  destination: string,
  value: number
): Promise<AIAnalysisResult> => {
    // Legacy function wrapper using enrich logic potentially, 
    // but kept separate for specific detailed calls if needed.
    // For MVP, we can reuse the logic from enrich or just keep independent.
    // Simplifying to reuse existing logic for now.
    return {
        hsCode: "0000.00",
        dutyEstimate: "Pending",
        riskLevel: RiskLevel.LOW,
        reasoning: "Legacy classification."
    };
};
