import { useState, useRef, useEffect } from 'react';
import type { Message, Conversation } from './types';

interface ConversationPanelProps {
  conversation: Conversation;
  onCreateChild: (parentMsg: Message) => void;
  onSendMessage: (content: string, parentMsg?: Message) => Promise<void>;
}

export function ConversationPanel({ conversation, onCreateChild, onSendMessage }: ConversationPanelProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    try {
      await onSendMessage(userMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理消息点击 - 创建子对话
  const handleMessageClick = (msg: Message) => {
    if (msg.role === 'assistant') {
      onCreateChild(msg);
    }
  };

  const currentRootMsg = conversation.rootMessage;

  return (
    <div className="conversation-panel">
      {/* 显示上下文来源 */}
      {currentRootMsg && (
        <div className="context-quote">
          <div className="context-label">基于上文</div>
          <div className="context-content">{currentRootMsg.content}</div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="messages">
        {conversation.messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.role}`}
            onClick={() => handleMessageClick(msg)}
          >
            <div className="message-content">{msg.content}</div>
            {msg.role === 'assistant' && (
              <div className="message-actions">
                <span className="hint">点击扩展子对话</span>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">思考中...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <form className="input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          发送
        </button>
      </form>
    </div>
  );
}