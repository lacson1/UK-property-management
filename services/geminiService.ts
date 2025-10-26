import { GoogleGenAI, Type } from '@google/genai';
import { MaintenanceUrgency, Property, MaintenanceRequest, Tenant, AISuggestion } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGuidance = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert on UK landlord and property management regulations. Provide clear, concise, and accurate guidance. Use markdown for formatting."
            }
        });
        return response.text;
    } catch (error) {
        console.error('Error getting guidance from Gemini:', error);
        throw new Error('Failed to fetch guidance from AI service.');
    }
};

export interface TriageResult {
    urgency: MaintenanceUrgency;
    suggestedTradesperson: string;
}

const triageSchema = {
    type: Type.OBJECT,
    properties: {
        urgency: {
            type: Type.STRING,
            description: 'The urgency of the maintenance request.',
            enum: Object.values(MaintenanceUrgency),
        },
        suggestedTradesperson: {
            type: Type.STRING,
            description: 'The type of tradesperson needed, e.g., Plumber, Electrician, General Handyman.',
        },
    },
    required: ['urgency', 'suggestedTradesperson'],
};

export const triageMaintenanceRequest = async (issueDescription: string): Promise<TriageResult> => {
    const prompt = `A tenant has reported the following issue: "${issueDescription}".
    Based on this, determine the urgency and suggest an appropriate tradesperson.
    Urgency must be one of: ${Object.values(MaintenanceUrgency).join(', ')}.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: triageSchema,
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && Object.values(MaintenanceUrgency).includes(result.urgency) && typeof result.suggestedTradesperson === 'string') {
             return result as TriageResult;
        } else {
            throw new Error('Invalid triage response from AI.');
        }
       
    } catch (error) {
        console.error('Error triaging maintenance request with Gemini:', error);
        // Fallback for safety
        return {
            urgency: MaintenanceUrgency.Medium,
            suggestedTradesperson: 'General Handyman',
        };
    }
};

export interface DocumentInfo {
    expiryDate: string | null;
}

const documentInfoSchema = {
    type: Type.OBJECT,
    properties: {
        expiryDate: {
            type: Type.STRING,
            description: "The expiry date of the document in YYYY-MM-DD format. If no date is found, this should be null.",
        },
    },
    required: ['expiryDate'],
};

export const extractDocumentInfo = async (base64ImageData: string, mimeType: string): Promise<DocumentInfo> => {
    const prompt = "Analyze this document image and find the expiration date, 'valid until' date, or expiry date. Return the date in YYYY-MM-DD format. If no specific expiry date is found, return null for the expiryDate field.";

    try {
        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType,
            },
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: documentInfoSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result && (typeof result.expiryDate === 'string' || result.expiryDate === null)) {
            return result;
        }

        console.warn('AI response for document info was not in the expected format.', result);
        return { expiryDate: null };

    } catch (error) {
        console.error('Error extracting document info with Gemini:', error);
        return { expiryDate: null }; // Fallback
    }
};


const suggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "A short, concise title for the suggestion.",
            },
            suggestion: {
                type: Type.STRING,
                description: "A detailed, actionable suggestion for the property manager.",
            },
        },
        required: ["title", "suggestion"],
    },
};

export const getTopSuggestions = async (
    properties: Property[],
    maintenanceRequests: MaintenanceRequest[],
    tenants: Tenant[]
): Promise<AISuggestion[]> => {
    const portfolioSummary = `
        Here is a summary of my UK property portfolio:
        - Total Properties: ${properties.length}
        - Properties Details: ${JSON.stringify(properties, null, 2)}
        - Active Tenants: ${tenants.length}
        - Tenants Details: ${JSON.stringify(tenants, null, 2)}
        - Maintenance Requests: ${maintenanceRequests.length}
        - Maintenance Details: ${JSON.stringify(maintenanceRequests, null, 2)}
    `;

    const prompt = `
        Based on the following UK property portfolio summary, act as an expert property management consultant.
        Identify potential risks, opportunities for improvement, and upcoming deadlines.
        Provide exactly 10 actionable and insightful suggestions to help me manage my portfolio more effectively.
        Focus on things like preventative maintenance, tenant relations, compliance, and financial optimization.
        Today's date is ${new Date().toISOString().split('T')[0]}.

        ${portfolioSummary}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionsSchema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (Array.isArray(result) && result.every(item => 'title' in item && 'suggestion' in item)) {
            return result as AISuggestion[];
        }

        console.warn('AI response for suggestions was not in the expected format.', result);
        throw new Error('Invalid suggestions response from AI.');

    } catch (error) {
        console.error('Error getting top suggestions from Gemini:', error);
        throw new Error('Failed to fetch suggestions from AI service.');
    }
};