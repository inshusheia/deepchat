// 消息类型
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

// 对话分支（树状结构）
export type Conversation = {
  id: string;
  parentConversationId?: string;
  rootMessage?: Message;
  messages: Message[];
  children: Conversation[];
};

// 应用状态
export type AppState = {
  conversations: Conversation[];
  activeConversationId: string;
};