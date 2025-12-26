import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY } from '../config/environment';

export async function extractFieldsFromText(
  textContent: string,
  projectId: number
): Promise<{ field_name: string; extracted_value: string; confidence_score: number }[]> {
  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });
  const prompt =
    'Extract the following fields from this construction project communication: client_name, project_address, start_date, budget, special_requirements. Return JSON array with field_name, extracted_value, confidence_score (0-1). Communication: ' +
    textContent;

  try {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = (response.content[0] as { type: 'text'; text: string }).text;
    const extractedFields = JSON.parse(responseText);

    const allowedFields = ['client_name', 'project_address', 'start_date', 'budget', 'special_requirements'];
    const validatedFields = extractedFields.filter(
      (item: { field_name: string; extracted_value: string; confidence_score: number }) => {
        return (
          allowedFields.includes(item.field_name) &&
          typeof item.confidence_score === 'number' &&
          item.confidence_score >= 0 &&
          item.confidence_score <= 1
        );
      }
    );

    return validatedFields;
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('Claude API rate limit exceeded');
    }
    if (error.status >= 500) {
      throw new Error('Claude API service error');
    }
    throw new Error('Failed to extract fields from text: ' + error.message);
  }
}

export async function extractFieldsFromFile(
  fileBuffer: Buffer,
  mimeType: string,
  projectId: number
): Promise<{ field_name: string; extracted_value: string; confidence_score: number }[]> {
  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });
  const base64Data = fileBuffer.toString('base64');
  const prompt =
    'Extract the following fields from this construction project document: client_name, project_address, start_date, budget, special_requirements. Return JSON array with field_name, extracted_value, confidence_score (0-1).';

  try {
    const response = await client.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = (response.content[0] as { type: 'text'; text: string }).text;
    const extractedFields = JSON.parse(responseText);

    const allowedFields = ['client_name', 'project_address', 'start_date', 'budget', 'special_requirements'];
    const validatedFields = extractedFields.filter(
      (item: { field_name: string; extracted_value: string; confidence_score: number }) => {
        return (
          allowedFields.includes(item.field_name) &&
          typeof item.confidence_score === 'number' &&
          item.confidence_score >= 0 &&
          item.confidence_score <= 1
        );
      }
    );

    return validatedFields;
  } catch (error: any) {
    if (error.status === 429) {
      throw new Error('Claude API rate limit exceeded');
    }
    if (error.status >= 500) {
      throw new Error('Claude API service error');
    }
    throw new Error('Failed to extract fields from file: ' + error.message);
  }
}

export function calculateConfidence(extractedValue: string, fieldType: string): number {
  if (!extractedValue || extractedValue === '') {
    return 0;
  }

  let baseConfidence = 0.5;

  if (fieldType === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(extractedValue)) {
      baseConfidence = 0.9;
    } else {
      baseConfidence = 0.3;
    }
  } else if (fieldType === 'phone') {
    const phoneRegex = /^[\d\s()+-]{10,}$/;
    if (phoneRegex.test(extractedValue)) {
      baseConfidence = 0.85;
    } else {
      baseConfidence = 0.3;
    }
  } else if (fieldType === 'date') {
    const dateTest = new Date(extractedValue);
    if (!isNaN(dateTest.getTime())) {
      baseConfidence = 0.8;
    } else {
      baseConfidence = 0.3;
    }
  } else if (fieldType === 'currency') {
    const currencyRegex = /^\$?[\d,]+(\.\d{2})?$/;
    if (currencyRegex.test(extractedValue)) {
      baseConfidence = 0.85;
    } else {
      baseConfidence = 0.4;
    }
  } else {
    if (extractedValue.length > 3) {
      baseConfidence = 0.7;
    } else {
      baseConfidence = 0.5;
    }
  }

  return Math.min(baseConfidence, 1.0);
}

const claudeService = {
  extractFieldsFromText,
  extractFieldsFromFile,
  calculateConfidence,
};

export default claudeService;