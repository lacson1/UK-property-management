import { GoogleGenAI, Type } from '@google/genai';
import { MaintenanceUrgency, Property, MaintenanceRequest, Tenant, DocumentType, Transaction } from '../types';

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
        // Fallback for safety
        return {
            urgency: MaintenanceUrgency.Medium,
            suggestedTradesperson: 'General Handyman',
        };
    }
};

export interface DocumentInfo {
    expiryDate: string | null;
    documentType: DocumentType | null;
}

const documentInfoSchema = {
    type: Type.OBJECT,
    properties: {
        expiryDate: {
            type: Type.STRING,
            description: "The expiry date of the document in YYYY-MM-DD format. If no date is found, this should be null.",
        },
        documentType: {
            type: Type.STRING,
            description: "The type of the document.",
            enum: Object.values(DocumentType),
        }
    },
    required: ['expiryDate', 'documentType'],
};

export const extractDocumentInfo = async (base64ImageData: string, mimeType: string): Promise<DocumentInfo> => {
    const prompt = `Analyze this document image. Identify its type and find the expiration date ('valid until' date, or expiry date).
    - The document type must be one of: ${Object.values(DocumentType).join(', ')}. If it doesn't fit, classify as 'Other'.
    - Return the expiration date in YYYY-MM-DD format. If no specific expiry date is found, return null for the expiryDate field.`;

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
            const docType = Object.values(DocumentType).includes(result.documentType) ? result.documentType : DocumentType.Other;
            return { expiryDate: result.expiryDate, documentType: docType };
        }

        return { expiryDate: null, documentType: DocumentType.Other };

    } catch (error) {
        return { expiryDate: null, documentType: DocumentType.Other }; // Fallback
    }
};


export const getPortfolioSummary = async (
    properties: Property[],
    maintenanceRequests: MaintenanceRequest[],
    tenants: Tenant[]
): Promise<string> => {
    const portfolioData = {
        properties,
        maintenanceRequests,
        tenants,
    };

    const prompt = `
        You are an AI summarizer for a property portfolio management system. Create a 3-line summary highlighting:
        - Total number of properties
        - Key statuses (Occupied, Vacant, Overdue)
        - Top recommendation for the user

        Input: ${JSON.stringify(portfolioData)}
        
        Output format:
        Summary: ...
        Status: ...
        Recommendation: ...`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;

    } catch (error) {
        throw new Error('Failed to fetch summary from AI service.');
    }
};

export const getTaxSummary = async (
    transactions: Transaction[],
    propertyAddress: string,
    taxYear: string
): Promise<string> => {
    
    const prompt = `
        You are an AI accountant specializing in UK property rental tax for landlords.
        Based on the following financial transaction data for the UK tax year ${taxYear}, generate a summary suitable for a tax self-assessment return.
        The data is for the property at: ${propertyAddress}.

        Your summary must include:
        1.  **Total Rental Income:** Sum of all 'Income' transactions.
        2.  **Total Allowable Expenses:** Sum of all 'Expense' transactions.
        3.  **Net Profit or Loss:** The result of Total Income minus Total Expenses.
        4.  **Narrative Summary:** A brief, professional paragraph summarizing the financial performance for the year. This should mention the key figures.

        Here is the transaction data:
        ${JSON.stringify(transactions)}

        Format the entire output using Markdown. Use headings for each section.
        For example:
        ### Tax Summary for [Property Address]
        **Tax Year:** ${taxYear}
        
        #### Financial Breakdown
        - **Total Income:** £...
        - **Total Expenses:** £...
        - **Net Profit/Loss:** £...

        #### Narrative Summary
        ...
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
         throw new Error('Failed to generate tax summary from AI service.');
    }

};