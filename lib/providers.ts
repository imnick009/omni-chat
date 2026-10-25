export type ApiType = 'openai' | 'anthropic';

export interface Provider {
  id: string;
  label: string;
  baseURL: string;
  api: ApiType;
  models: string[];
}

export const PROVIDERS: Record<string, Provider> = {
  groq: { id: 'groq', label: 'Groq', api: 'openai', baseURL: 'https://api.groq.com/openai/v1', models: [] },
  openrouter: { id: 'openrouter', label: 'OpenRouter', api: 'openai', baseURL: 'https://openrouter.ai/api/v1', models: [] },
  deepseek: { id: 'deepseek', label: 'DeepSeek', api: 'openai', baseURL: 'https://api.deepseek.com/v1', models: ['deepseek-chat'] },
  gemini: { id: 'gemini', label: 'Google Gemini', api: 'openai', baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai', models: [] },
  anthropic: { id: 'anthropic', label: 'Claude', api: 'anthropic', baseURL: 'https://api.anthropic.com/v1', models: [] },
  openai: { id: 'openai', label: 'OpenAI', api: 'openai', baseURL: 'https://api.openai.com/v1', models: [] },
  qwen: { id: 'qwen', label: 'Qwen', api: 'openai', baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: [] },
};