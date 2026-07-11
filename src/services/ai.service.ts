import axios from 'axios';
import { config } from '../config/env';

const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  headers: {
    'x-internal-secret': config.internal.secret,
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30s — LLM calls can be slow
});

// ─── Embeddings ──────────────────────────────────────────────

export async function embedContent(params: {
  text: string;
  resource_type: string;
  resource_id: string;
  workspace_id: string;
}): Promise<boolean> {
  try {
    console.log('🤖 Sending embedding request to AI service:', params.resource_type, params.resource_id);
    const response = await aiClient.post('/api/v1/embeddings/', params);
    console.log('✅ Embedding stored:', response.data);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to embed content:', err.message);
    console.error('AI Service URL:', process.env.AI_SERVICE_URL || 'http://localhost:8000');
    // Never fail the main request because embedding failed
    // console.error('Failed to embed content:', err);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    return false;
  }
}

export async function searchSimilar(params: {
  query: string;
  workspace_id: string;
  resource_types?: string[];
  limit?: number;
}): Promise<any[]> {
  try {
    const res = await aiClient.post('/api/v1/embeddings/search', params);
    return res.data.results || [];
  } catch (err) {
    console.error('Semantic search failed:', err);
    return [];
  }
}

// ─── Chat ────────────────────────────────────────────────────

export async function chatWithAI(params: {
  messages: Array<{ role: string; content: string }>;
  workspace_id: string;
  context_type?: string;
  context_id?: string;
}): Promise<{ message: string; sources: any[] }> {
  const res = await aiClient.post('/api/v1/chat/', params);
  return res.data;
}

export async function summarizeIssue(params: {
  resource_type: string;
  resource_id: string;
  workspace_id: string;
}): Promise<string> {
  const res = await aiClient.post('/api/v1/chat/summarize', params);
  return res.data.summary;
}