// 对话历史存储服务

const STORAGE_KEY = 'deepchat_conversations';
const ACTIVE_CONV_KEY = 'deepchat_active_conv';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'code';
  url?: string;
  content?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  apiContent?: string;
  attachments?: Attachment[];
}

interface Conversation {
  id: string;
  parentId?: string;
  rootMessage?: Message;
  messages: Message[];
  children: Conversation[];
}

const POSITIONS_KEY = 'deepchat_positions';
const SIZES_KEY = 'deepchat_sizes';

// 保存所有对话
export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('保存对话失败:', e);
  }
}

// 加载所有对话
export function loadConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('加载对话失败:', e);
  }
  return [];
}

// 保存位置
export function savePositions(positions: Record<string, { x: number; y: number }>): void {
  try {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions));
  } catch (e) { console.error('保存位置失败:', e); }
}

// 加载位置
export function loadPositions(): Record<string, { x: number; y: number }> {
  try {
    const data = localStorage.getItem(POSITIONS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { console.error('加载位置失败:', e); }
  return {};
}

// 保存尺寸
export function saveSizes(sizes: Record<string, { width: number; height: number }>): void {
  try {
    localStorage.setItem(SIZES_KEY, JSON.stringify(sizes));
  } catch (e) { console.error('保存尺寸失败:', e); }
}

// 加载尺寸
export function loadSizes(): Record<string, { width: number; height: number }> {
  try {
    const data = localStorage.getItem(SIZES_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { console.error('加载尺寸失败:', e); }
  return {};
}

// 保存当前活跃对话ID
export function saveActiveConvId(id: string): void {
  localStorage.setItem(ACTIVE_CONV_KEY, id);
}

// 加载当前活跃对话ID
export function loadActiveConvId(): string | null {
  return localStorage.getItem(ACTIVE_CONV_KEY);
}

// 清除所有对话历史
export function clearConversations(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_CONV_KEY);
}

// 导出对话为 Markdown
export function exportToMarkdown(conversation: Conversation): string {
  let md = `# 对话导出\n\n`;
  md += `导出时间: ${new Date().toLocaleString()}\n\n`;
  md += `---\n\n`;

  for (const msg of conversation.messages) {
    if (msg.role === 'user') {
      md += `**用户**: ${msg.content}\n\n`;
      if (msg.attachments && msg.attachments.length > 0) {
        const files = msg.attachments.map((a: Attachment) => a.name).join(', ');
        md += `📎 附件: ${files}\n\n`;
      }
    } else {
      md += `**AI**: ${msg.content}\n\n`;
    }
    md += `---\n\n`;
  }

  return md;
}