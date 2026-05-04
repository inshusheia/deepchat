// DeepSeek 网页端逆向调用服务

const DEEPSEEK_WEB_URL = 'https://chat.deepseek.com';

interface DeepSeekMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  messages: DeepSeekMessage[];
  model: string;
  temperature: number;
  top_p: number;
}

export async function sendMessageToDeepSeek(messages: DeepSeekMessage[]): Promise<string> {
  // 方式1：尝试通过 API 调用
  // 注意：这是逆向方案，可能不稳定

  const response = await fetch(`${DEEPSEEK_WEB_URL}/api/v0/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      top_p: 0.9,
    } as DeepSeekRequest),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 备用方案：使用非官方 API 端点（如果上方不行）
export async function sendMessageToDeepSeekAlt(messages: DeepSeekMessage[]): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY', // 需要替换
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}