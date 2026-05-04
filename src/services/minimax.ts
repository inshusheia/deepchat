// MiniMax API 服务
// 文档: https://www.minimaxi.com/api-detail/2

const API_BASE_URL = 'https://api.minimax.chat/v1';

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

// 默认模型列表
const DEFAULT_MODELS: ModelInfo[] = [
  { id: 'abab6.5-chat', name: 'abab6.5' },
  { id: 'abab6.5s-chat', name: 'abab6.5s' },
  { id: 'abab6.5g-chat', name: 'abab6.5g' },
];

export type ModelId = 'abab6.5-chat' | 'abab6.5s-chat' | 'abab6.5g-chat' | string;

// 保存用户选择的模型
const SELECTED_MODEL_KEY = 'deepchat_selected_model';

interface MiniMaxMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MiniMaxRequest {
  model: string;
  messages: MiniMaxMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

interface MiniMaxChoice {
  index: number;
  message: MiniMaxMessage;
  finish_reason: string;
}

interface MiniMaxResponse {
  id: string;
  created: number;
  choices: MiniMaxChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface ModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

// 保存 API Key 到 localStorage
const STORAGE_KEY = 'deepchat_apikey';

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setApiKey(apiKey: string): void {
  localStorage.setItem(STORAGE_KEY, apiKey);
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getSelectedModel(): string | null {
  return localStorage.getItem(SELECTED_MODEL_KEY);
}

export function setSelectedModel(model: string): void {
  localStorage.setItem(SELECTED_MODEL_KEY, model);
}

// 获取模型列表（从 API）
export async function fetchModels(apiKey: string): Promise<ModelInfo[]> {
  if (!apiKey) {
    return DEFAULT_MODELS;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.warn('获取模型列表失败，使用默认列表');
      return DEFAULT_MODELS;
    }

    const data: ModelsResponse = await response.json();
    return data.data.map(m => ({
      id: m.id,
      name: m.id,
    }));
  } catch (error) {
    console.warn('获取模型列表出错:', error);
    return DEFAULT_MODELS;
  }
}

// 发送消息到 MiniMax API
export async function sendToMiniMax(
  messages: MiniMaxMessage[],
  apiKey: string,
  model: ModelId = 'abab6.5-chat'
): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }

  const request: MiniMaxRequest = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 8192,
    top_p: 0.95,
  };

  const response = await fetch(`${API_BASE_URL}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 错误: ${response.status} - ${error}`);
  }

  const data: MiniMaxResponse = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 流式响应处理
export async function sendToMiniMaxStream(
  messages: MiniMaxMessage[],
  apiKey: string,
  model: ModelId = 'abab6.5-chat',
  onChunk: (content: string) => void
): Promise<string> {
  if (!apiKey) {
    throw new Error('API Key 未设置');
  }

  const request: MiniMaxRequest = {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 8192,
    top_p: 0.95,
  };

  const response = await fetch(`${API_BASE_URL}/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 错误: ${response.status} - ${error}`);
  }

  const contentType = response.headers.get('content-type') || '';

  // 如果是 SSE 流式响应
  if (contentType.includes('text/event-stream') || contentType.includes('stream')) {
    if (!response.body) throw new Error('空响应');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              result += content;
              onChunk(content);
            }
          } catch {}
        }
      }
    }
    return result;
  }

  // 普通JSON响应（模拟流式效果）
  const data: MiniMaxResponse = await response.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 模拟逐字输出效果
  let result = '';
  for (const char of content) {
    result += char;
    onChunk(char);
    await new Promise(r => setTimeout(r, 20)); // 每个字符延迟20ms
  }

  return result;
}