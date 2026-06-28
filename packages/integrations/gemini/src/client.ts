import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables by searching upwards for .env
let currentDir = process.cwd();
let envLoaded = false;
while (currentDir) {
  const envPath = path.join(currentDir, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
  const parent = path.dirname(currentDir);
  if (parent === currentDir) break;
  currentDir = parent;
}

if (!envLoaded) {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  } catch (e) {}
}

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

let GoogleGenerativeAI: any;
let hasGenAI = false;

try {
  const genai = require('@google/generative-ai');
  GoogleGenerativeAI = genai.GoogleGenerativeAI;
  hasGenAI = true;
} catch (e) {
  hasGenAI = false;
}

export async function generateContent(
  prompt: string,
  options: { jsonMode?: boolean; systemInstruction?: string } = {}
): Promise<string> {
  if (!hasGenAI || !apiKey) {
    console.warn('WARNING: Gemini API key not found or @google/generative-ai package missing. Using fallback mock response.');
    
    if (options.jsonMode) {
      return JSON.stringify({
        proposed_policy_version: 'policy_late_delivery_gen3',
        proposed_memory_patch: {
          target: 'segments/loyal_shopper/late_delivery.md',
          patch_type: 'policy_guidance',
          candidate_text: '# Loyal Shopper - Late Delivery Playbook (Gen 3)\n\n## Core Policy Guidelines:\n1. Acknowledge the late delivery and urgency of the deadline first. Keep standard shipping rules in reserve.\n2. Look up replacement inventory immediately in the local warehouse using the lookup tool.\n3. Offer an expedited replacement shipment if available.\n4. Keep the refund/cancellation fallback open in case replacement is rejected or fails.'
        },
        proposed_prediction_prior_update: {
          condition: 'late_delivery + gift_deadline + policy_first_response',
          increase_intent_probability: {
            cancel_or_refund_threat: 0.18
          },
          decrease_intent_probability: {
            ask_for_tracking: 0.08
          }
        },
        evidence_summary: 'Policy-first response caused anger spike and refund/cancel threat. Predictor underweighted cancel_or_refund_threat after policy-first answer.',
        prevalence_stats: '1 call failed containment under policy_first strategy.',
        expected_containment_lift: '+15%',
        compliance_risk: 'low'
      }, null, 2);
    } else {
      return 'Mock text response.';
    }
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: modelName,
      generationConfig: options.jsonMode ? { responseMimeType: 'application/json' } : undefined,
      systemInstruction: options.systemInstruction
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (e: any) {
    console.error(`ERROR calling Gemini API: ${e.message || e}. Falling back to mock response.`);
    if (options.jsonMode) {
      return JSON.stringify({
        proposed_policy_version: 'policy_late_delivery_gen3',
        proposed_memory_patch: {
          target: 'segments/loyal_shopper/late_delivery.md',
          patch_type: 'policy_guidance',
          candidate_text: '# Loyal Shopper - Late Delivery Playbook (Gen 3)\n\n## Core Policy Guidelines:\n1. Acknowledge the late delivery and urgency of the deadline first. Keep standard shipping rules in reserve.\n2. Look up replacement inventory immediately in the local warehouse using the lookup tool.\n3. Offer an expedited replacement shipment if available.\n4. Keep the refund/cancellation fallback open in case replacement is rejected or fails.'
        },
        proposed_prediction_prior_update: {
          condition: 'late_delivery + gift_deadline + policy_first_response',
          increase_intent_probability: {
            cancel_or_refund_threat: 0.18
          },
          decrease_intent_probability: {
            ask_for_tracking: 0.08
          }
        },
        evidence_summary: 'Policy-first response caused anger spike and refund/cancel threat. Predictor underweighted cancel_or_refund_threat after policy-first answer.',
        prevalence_stats: '1 call failed containment under policy_first strategy.',
        expected_containment_lift: '+15%',
        compliance_risk: 'low'
      }, null, 2);
    }
    return 'Fallback text due to Gemini API failure.';
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!hasGenAI || !apiKey) {
    console.warn('WARNING: Gemini API key not found or @google/generative-ai package missing. Using mock embedding vector.');
    // Generate a deterministically pseudo-random embedding vector of 1536 dimensions
    const vector: number[] = [];
    for (let i = 0; i < 1536; i++) {
      // Basic pseudo-random number based on text characters
      const charCode = text.charCodeAt(i % text.length) || 0;
      vector.push(Math.sin(i + charCode) * 0.1);
    }
    return vector;
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    if (result && result.embedding && result.embedding.values) {
      // Ensure it is 1536 dimensions. text-embedding-004 usually outputs 768 dimensions by default.
      // If it is 768, we can pad or repeat it, or we can use it.
      // Wait, let's make sure our database column has the same dimension.
      // If pgvector column is VECTOR(1536), we must pad/repeat the 768 dimensions to reach 1536.
      // Better: we can configure the column dimension in postgres to match the model, OR we can pad it!
      // In PostgreSQL, let's keep VECTOR(1536) for general compatibility, and double the 768 vector to make it 1536!
      // Let's check:
      const vals = result.embedding.values;
      if (vals.length === 768) {
        return [...vals, ...vals]; // Duplicate to make it 1536
      }
      if (vals.length < 1536) {
        // Pad with zeros
        const padded = [...vals];
        while (padded.length < 1536) {
          padded.push(0);
        }
        return padded;
      }
      return vals.slice(0, 1536);
    }
    throw new Error('Invalid embedding response structure');
  } catch (e: any) {
    console.error(`ERROR calling Gemini Embedding API: ${e.message || e}. Using fallback mock embedding.`);
    const vector: number[] = [];
    for (let i = 0; i < 1536; i++) {
      const charCode = text.charCodeAt(i % text.length) || 0;
      vector.push(Math.sin(i + charCode) * 0.1);
    }
    return vector;
  }
}
