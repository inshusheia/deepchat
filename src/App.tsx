import { useState, useRef, useEffect, Fragment } from 'react';
import './App.css';
import { getApiKey, setApiKey, setSelectedModel, getSelectedModel, sendToMiniMaxStream, fetchModels, type ModelInfo } from './services/minimax';
import { parsePDF } from './services/pdf';
import { saveConversations, loadConversations, savePositions, loadPositions, saveSizes, loadSizes } from './services/storage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  apiContent?: string;
  attachments?: Attachment[];
};

type Attachment = { id: string; name: string; type: 'image' | 'pdf' | 'code'; url?: string; content?: string };

type Conversation = {
  id: string;
  parentId?: string;
  rootMessage?: Message;
  messages: Message[];
  children: Conversation[];
  attachments?: Attachment[];
};

type Position = { x: number; y: number };
type Size = { width: number; height: number };

export default function App() {
  const [apiKey, setLocalApiKey] = useState(() => getApiKey() || '');
  const [showSettings, setShowSettings] = useState(false);
  const [model, setModel] = useState<string>(() => getSelectedModel() || 'abab6.5-chat');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [draftAttachments, setDraftAttachments] = useState<Record<string, Attachment[]>>({});
  const [allRoots, setAllRoots] = useState<Conversation[]>(() => loadConversations().length > 0 ? loadConversations() : [{ id: generateId(), messages: [], children: [] }]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [sizes, setSizes] = useState<Record<string, Size>>(() => loadSizes());
  const [positions, setPositions] = useState<Record<string, Position>>(() => loadPositions());
  const [scale, setScale] = useState(1);
  const [sidebarWidth, setSidebarWidth] = useState(200);
  const [filesHeight, setFilesHeight] = useState(280);
  const [resizing, setResizing] = useState<string | null>(null);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<{ sidebar?: HTMLDivElement; files?: HTMLDivElement }>({});

  const rootConv = allRoots[activeIdx];

  useEffect(() => { if (apiKey) fetchModels(apiKey).then(setModels).catch(() => setModels([])); }, [apiKey]);

  const findConv = (id: string): Conversation | undefined => {
    for (const c of allRoots) { if (c.id === id) return c; for (const cc of c.children || []) if (cc.id === id) return cc; }
  };

  const updateConv = (id: string, updater: (c: Conversation) => Conversation) => {
    setAllRoots(prev => prev.map(c => c.id === id ? updater(c) : { ...c, children: c.children?.map(cc => cc.id === id ? updater(cc) : cc) }));
  };

  const handleSend = async (convId: string, content: string, attachments?: Attachment[]) => {
    let fullContent = content;
    if (attachments?.length) fullContent = attachments.map(att => att.type === 'image' ? `[图片: ${att.name}]` : att.type === 'pdf' && att.content ? `[PDF: ${att.name}]\n${att.content}` : `[文件: ${att.name}]\n${att.content}`).join('\n\n') + '\n\n用户问题: ' + content;
    const displayContent = content || '上传了文件';
    const userMsg: Message = { id: generateId(), role: 'user', content: displayContent, apiContent: fullContent, attachments };
    if (!apiKey) { setShowSettings(true); return; }
    const currentConv = findConv(convId);
    if (!currentConv) return;
    updateConv(convId, c => ({ ...c, messages: [...c.messages, userMsg] }));
    setIsLoading(convId);
    const thinkingId = generateId();
    const thinkingMsg: Message = { id: thinkingId, role: 'assistant', content: '' };
    updateConv(convId, c => ({ ...c, messages: [...c.messages, thinkingMsg] }));
    try {
      let messages = [...currentConv.messages, userMsg].map(m => ({ role: m.role, content: m.apiContent || m.content }));
      let fullReply = '';
      await sendToMiniMaxStream(messages, apiKey, model, (chunk) => {
        fullReply += chunk;
        updateConv(convId, c => { const msgs = [...c.messages]; const idx = msgs.findIndex(m => m.id === thinkingId); if (idx >= 0) msgs[idx] = { ...thinkingMsg, content: fullReply }; return { ...c, messages: msgs }; });
      });
    } catch (error) {
      updateConv(convId, c => ({ ...c, messages: [...c.messages, { id: generateId(), role: 'assistant', content: `错误: ${error instanceof Error ? error.message : '未知错误'}` }] }));
    } finally { setIsLoading(null); }
  };

  const handleCreateChild = (parentMsg: Message, parentId: string) => {
    updateConv(parentId, c => ({ ...c, children: [...(c.children || []), { id: generateId(), parentId, rootMessage: parentMsg, messages: [], children: [] }] }));
  };

  const handleSummarize = async (childId: string, parentId: string) => {
    if (!apiKey) { setShowSettings(true); return; }
    const parentConv = findConv(parentId);
    if (!parentConv || parentConv.messages.length === 0) return;
    setIsLoading(childId);
    try {
      const summary = await sendToMiniMaxStream([{ role: 'user', content: `请简洁总结以下对话的要点（不超过100字）：\n\n${parentConv.messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n\n').slice(0, 3000)}` }], apiKey, model, () => {});
      updateConv(childId, c => ({ ...c, messages: [...c.messages, { id: generateId(), role: 'assistant', content: summary }] }));
    } finally { setIsLoading(null); }
  };

  const handleFileUpload = async (convId: string, files: FileList) => {
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let type: Attachment['type'] = 'code';
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
      else if (ext === 'pdf') type = 'pdf';
      const attachment: Attachment = { id: generateId(), name: file.name, type };
      try { if (type === 'image') attachment.url = URL.createObjectURL(file); else if (type === 'pdf') attachment.content = (await parsePDF(file)).text; else attachment.content = (await file.text()).slice(0, 8000); } catch { attachment.content = `[文件读取失败: ${file.name}]`; }
      setDraftAttachments(prev => ({ ...prev, [convId]: [...(prev[convId] || []), attachment] }));
    }
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      for (const item of Array.from(e.clipboardData?.items || [])) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) setDraftAttachments(prev => ({ ...prev, [rootConv.id]: [...(prev[rootConv.id] || []), { id: generateId(), name: `截图-${Date.now()}.png`, type: 'image', url: URL.createObjectURL(file) }] }));
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [rootConv.id]);

  const dragRef = useRef<{ startX: number; startY: number; startPosX?: number; startPosY?: number; startWidth?: number; startHeight?: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const rect = (document.querySelector(`[data-conv-id="${id}"]`) as HTMLElement)?.getBoundingClientRect();
    if (rect) dragRef.current = { startX: e.clientX, startY: e.clientY, startWidth: rect.width, startHeight: rect.height };
    setResizing(id);
  };
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const rect = (document.querySelector(`[data-conv-id="${id}"]`) as HTMLElement)?.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (rect && container) dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: rect.left - container.left, startPosY: rect.top - container.top };
    setDraggingCard(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing === 'sidebar' && panelsRef.current.sidebar) setSidebarWidth(Math.max(150, Math.min(400, e.clientX - panelsRef.current.sidebar.getBoundingClientRect().left)));
      else if (resizing === 'files' && panelsRef.current.files) setFilesHeight(Math.max(100, Math.min(500, window.innerHeight - e.clientY)));
      else if (resizing && dragRef.current?.startWidth) setSizes(prev => ({ ...prev, [resizing]: { width: Math.max(300, dragRef.current!.startWidth! + (e.clientX - dragRef.current!.startX) / scale), height: Math.max(300, dragRef.current!.startHeight! + (e.clientY - dragRef.current!.startY) / scale) } }));
      if (draggingCard && dragRef.current && containerRef.current) {
        const container = containerRef.current.getBoundingClientRect();
        const startPosX = dragRef.current.startPosX || 0;
        const startPosY = dragRef.current.startPosY || 0;
        const dx = (e.clientX - container.left) - startPosX;
        const dy = (e.clientY - container.top) - startPosY;
        setPositions(prev => ({ ...prev, [draggingCard]: { x: (startPosX + dx) / scale, y: (startPosY + dy) / scale } }));
        dragRef.current.startPosX = e.clientX - container.left;
        dragRef.current.startPosY = e.clientY - container.top;
      }
    };
    const handleMouseUp = () => { setResizing(null); setDraggingCard(null); dragRef.current = null; };
    if (resizing || draggingCard) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [resizing, draggingCard, scale]);

  const handleZoom = (delta: number) => setScale(s => Math.max(0.3, Math.min(2, s + delta)));

  useEffect(() => {
    let lastZoom = 0;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (Date.now() - lastZoom > 30) { lastZoom = Date.now(); setScale(s => Math.max(0.3, Math.min(2, s - e.deltaY * 0.01))); }
      }
    };
    const canvas = containerRef.current;
    if (canvas) { canvas.addEventListener('wheel', handleWheel, { passive: false }); }
    return () => { if (canvas) canvas.removeEventListener('wheel', handleWheel); };
  }, []);

  useEffect(() => { saveConversations(allRoots); }, [allRoots]);
  useEffect(() => { savePositions(positions); saveSizes(sizes); }, [positions, sizes]);

  const renderMsg = (msg: Message, convId: string) => (
    <div key={msg.id} className={`msg ${msg.role} ${!msg.content ? 'thinking' : ''}`}>
      <div className="msg-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || '思考中...'}</ReactMarkdown></div>
      {msg.role === 'assistant' && msg.content && <button type="button" className="add-child-btn" onClick={() => handleCreateChild(msg, convId)}>+ 子对话</button>}
    </div>
  );

  const renderDraftForConv = (convId: string) => {
    const atts = draftAttachments[convId] || [];
    if (!atts.length) return null;
    return <div className="draft-attachments">{atts.map((att, idx) => <div key={att.id} className="draft-attachment"><span>{att.type === 'image' ? '🖼️' : att.type === 'pdf' ? '📄' : '📝'}</span><span>{att.name}</span><button type="button" className="draft-remove" onClick={() => setDraftAttachments(prev => ({ ...prev, [convId]: (prev[convId] || []).filter((_, i) => i !== idx) }))}>×</button></div>)}</div>;
  };

  return (
    <div className="app">
      <aside className="sidebar" style={{ width: sidebarWidth }} ref={el => panelsRef.current.sidebar = el! as any}>
        <div className="sidebar-resizer" onMouseDown={e => { e.preventDefault(); setResizing('sidebar'); }} />
        <div className="sidebar-header"><span>历史对话</span></div>
        <div className="sidebar-list">
          {allRoots.map((conv, idx) => <Fragment key={conv.id}><div className={`sidebar-item ${conv.id === rootConv?.id ? 'active' : ''}`} onClick={() => setActiveIdx(idx)}><span className="sidebar-item-title">{conv.messages[0]?.content?.slice(0, 15) || `对话 ${idx + 1}`}</span><span className="sidebar-item-count">{conv.messages.length} 条</span><button className="sidebar-delete" onClick={(e) => { e.stopPropagation(); const newConvs = allRoots.filter(c => c.id !== conv.id); if (newConvs.length > 0) { setAllRoots(newConvs); setActiveIdx(idx >= newConvs.length ? newConvs.length - 1 : idx); } else { setAllRoots([{ id: generateId(), messages: [], children: [] }]); setActiveIdx(0); } }}>×</button></div>{conv.children?.map(child => <div key={child.id} className={`sidebar-item child ${child.id === rootConv?.id ? 'active' : ''}`} style={{ paddingLeft: '24px' }}><span className="sidebar-item-title">↳ {child.rootMessage?.content?.slice(0, 12) || '子对话'}</span></div>)}</Fragment>)}
          {allRoots.length === 0 && <div className="sidebar-empty">暂无历史对话</div>}
        </div>
      </aside>

      <div className="main-area">
        <header className="toolbar">
          <div className="logo"><span className="logo-icon">DeepChat</span></div>
          <div className="toolbar-actions">
            {showSettings && <div className="modal-overlay" onClick={() => setShowSettings(false)}><div className="modal" onClick={e => e.stopPropagation()}>
              <h2>API 设置</h2>
              <div className="form-group"><label>API Key</label><input type="password" value={apiKey} onChange={e => setLocalApiKey(e.target.value)} /></div>
              <div className="form-group"><label>模型</label><select value={model} onChange={e => setModel(e.target.value)}>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div className="modal-actions"><button onClick={() => setShowSettings(false)}>取消</button><button onClick={() => { setApiKey(apiKey); setSelectedModel(model); setShowSettings(false); }}>保存</button></div>
            </div></div>}
            <div className="model-select"><select value={model} onChange={e => { setModel(e.target.value); setSelectedModel(e.target.value); }}>{models.length > 0 ? models.map(m => <option key={m.id} value={m.id}>{m.name}</option>) : <option value="abab6.5-chat">abab6.5</option>}</select></div>
            <button className="settings-btn" onClick={() => setShowSettings(true)}>API</button>
            <button className="new-chat-btn" onClick={() => setAllRoots(prev => [...prev, { id: generateId(), messages: [], children: [] }])}>+ 新对话</button>
            <div className="zoom-controls"><button className="zoom-btn" onClick={() => handleZoom(-0.1)}>-</button><span className="zoom-level">{Math.round(scale * 100)}%</span><button className="zoom-btn" onClick={() => handleZoom(0.1)}>+</button></div>
          </div>
        </header>

        <main className="canvas" ref={containerRef}>
          <div className="canvas-content" style={{ transform: `scale(${scale})`, width: '5000px', height: '5000px' }}>
            {rootConv?.children?.length ? (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                {rootConv.children.map((child, cidx) => {
                  const parentX = (positions[rootConv.id]?.x || 20) + (sizes[rootConv.id]?.width || 500);
                  const parentY = (positions[rootConv.id]?.y || 80) + (sizes[rootConv.id]?.height || 500) / 2;
                  const childX = positions[child.id]?.x || 560 + cidx * 30;
                  const childY = (positions[child.id]?.y || 80 + cidx * 30) + (sizes[child.id]?.height || 450) / 2;
                  return (
                    <g key={child.id}>
                      <path d={`M ${parentX} ${parentY} C ${parentX + 50} ${parentY}, ${childX - 50} ${childY}, ${childX} ${childY}`} fill="none" stroke="#ccc" strokeWidth="2" />
                      <circle cx={childX} cy={childY} r="4" fill="#999" />
                    </g>
                  );
                })}
              </svg>
            ) : null}
            {rootConv && (
              <Fragment>
                <div className="brain-card main-card" data-conv-id={rootConv.id} style={{ left: positions[rootConv.id]?.x || 20, top: positions[rootConv.id]?.y || 80, width: sizes[rootConv.id]?.width || 500, height: sizes[rootConv.id]?.height || 500 }}>
                  <div className="resize-handle main-resize" onMouseDown={e => handleResizeStart(e, rootConv.id)} />
                  <div className="card-header">
                    <button type="button" className="drag-handle" onMouseDown={e => handleDragStart(e, rootConv.id)} title="拖拽">⋮⋮</button>
                    <div className="card-title">{rootConv.messages[0]?.content?.slice(0, 15) || '新对话'}</div>
                  </div>
                  <div className="card-messages">{rootConv.messages.map(msg => renderMsg(msg, rootConv.id))}{isLoading === rootConv.id && <div className="loading-indicator"><span>思考中</span></div>}</div>
                  <div className="card-input">
                    {renderDraftForConv(rootConv.id)}
                    <form onSubmit={e => { e.preventDefault(); const msg = new FormData(e.currentTarget).get('msg'); const atts = draftAttachments[rootConv.id] || []; if (msg || atts.length) { handleSend(rootConv.id, (msg as string) || '...', atts); setDraftAttachments(p => { const n = {...p}; delete n[rootConv.id]; return n; }); e.currentTarget.reset(); } }}>
                      <label className="attach-label" title="上传文件"><input type="file" multiple onChange={e => e.target.files && handleFileUpload(rootConv.id, e.target.files)} /><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg></label>
                      <input name="msg" placeholder="输入消息..." disabled={!!isLoading} />
                      <button type="submit" className="send-btn" disabled={!!isLoading}>{isLoading ? <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="12" cy="12" r="10"><animate attributeName="opacity" values="1;0.3" dur="1s" repeatCount="indefinite"/></circle></svg> : <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>}</button>
                    </form>
                  </div>
                </div>
                {rootConv.children?.map((child, cidx) => (
                  <div key={child.id} className="brain-card" data-conv-id={child.id} style={{ left: positions[child.id]?.x || 560 + cidx * 30, top: positions[child.id]?.y || 80 + cidx * 30, width: sizes[child.id]?.width || 450, height: sizes[child.id]?.height || 450 }}>
                    <div className="resize-handle" onMouseDown={e => handleResizeStart(e, child.id)} />
                    <div className="child-card-header">
                      <button type="button" className="drag-handle" onMouseDown={e => handleDragStart(e, child.id)} title="拖拽">⋮⋮</button>
                      <div className="child-card-title">↳ {child.rootMessage?.content?.slice(0, 10) || '子对话'}</div>
                      <button type="button" className="child-card-delete" onClick={() => { if (confirm('确定删除此子对话?')) updateConv(rootConv.id, c => ({ ...c, children: c.children?.filter(cc => cc.id !== child.id) })); }} title="删除">×</button>
                      <button type="button" className="summarize-btn" onClick={() => handleSummarize(child.id, rootConv.id)} disabled={!!isLoading}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6M12 22v-6M2 12h6M22 12h-6"/><circle cx="12" cy="12" r="4"/></svg><span>一键汇聚</span></button>
                    </div>
                    <div className="card-messages">{child.messages.map(msg => renderMsg(msg, child.id))}{isLoading === child.id && <div className="loading-indicator"><span>思考中</span></div>}</div>
                    <div className="card-input">
                      <form onSubmit={e => { e.preventDefault(); const msg = new FormData(e.currentTarget).get('msg'); if (msg) { handleSend(child.id, msg as string, []); e.currentTarget.reset(); } }}>
                        <input name="msg" placeholder="输入..." disabled={!!isLoading} />
                        <button type="submit" className="send-btn" disabled={!!isLoading}>→</button>
                      </form>
                    </div>
                  </div>
                ))}
              </Fragment>
            )}
          </div>
        </main>
        <aside className="files-panel" style={{ height: filesHeight }} ref={el => panelsRef.current.files = el! as any}>
          <div className="files-resizer" style={{ top: 0, left: 0, right: 0, height: 4, width: 'auto', cursor: 'ns-resize' }} onMouseDown={e => { e.preventDefault(); setResizing('files'); }} />
          <div className="files-header">当前对话文件</div>
          <div className="files-content">
            {(() => {
              const pdfs = rootConv?.attachments?.filter(a => a.type === 'pdf') || [];
              const images = rootConv?.attachments?.filter(a => a.type === 'image') || [];
              if (!pdfs.length && !images.length) return <div className="sidebar-empty">暂无上传文件</div>;
              return <>{pdfs.length > 0 && <div className="files-section"><div className="files-section-title">📄 PDF 文件 <span>{pdfs.length}</span></div><div className="files-list">{pdfs.map(att => <div key={att.id} className="file-item" onClick={() => handleSend(rootConv.id, `请分析这个PDF文件: ${att.name}`, [])}><span className="file-icon">📄</span><span className="file-name">{att.name}</span><button type="button" className="file-remove" onClick={(e) => { e.stopPropagation(); updateConv(rootConv.id, c => ({ ...c, attachments: (c.attachments || []).filter(a => a.id !== att.id) })); }}>×</button></div>)}</div></div>}{images.length > 0 && <div className="files-section"><div className="files-section-title">🖼️ 图片 <span>{images.length}</span></div><div className="files-list">{images.map(att => <div key={att.id} className="file-item" onClick={() => handleSend(rootConv.id, `请分析这张图片: ${att.name}`, [])}><span className="file-icon">🖼️</span><span className="file-name">{att.name}</span><button type="button" className="file-remove" onClick={(e) => { e.stopPropagation(); updateConv(rootConv.id, c => ({ ...c, attachments: (c.attachments || []).filter(a => a.id !== att.id) })); }}>×</button></div>)}</div></div>}</>;
            })()}
          </div>
        </aside>
      </div>
    </div>
  );
}