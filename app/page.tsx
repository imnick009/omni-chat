'use client';

import { useEffect, useRef, useState } from 'react';
import { useStore, type Chat, type CustomModel } from '@/lib/store';
import { streamChat } from '@/lib/stream';
import { PROVIDERS } from '@/lib/providers';

function Ic({ d, className = 'h-4 w-4', filled = false }: { d: string; className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function BrandMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M26 26 Q26 22 30 22 L46 22 Q50 22 50 26 L50 38 Q50 42 46 42 L34 42 L28 48 L28 42 Q26 42 26 38 Z" fill="currentColor" opacity="0.7" />
      <path d="M18 18 Q18 14 22 14 L38 14 Q42 14 42 18 L42 30 Q42 34 38 34 L26 34 L20 40 L20 34 Q18 34 18 30 Z" fill="currentColor" />
    </svg>
  );
}

const PATH = {
  chevron: 'm6 9 6 6 6-6',
  send: 'M12 19V5 m-7 7 7-7 7 7',
  stop: 'M8 8h8v8H8z',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  trash: 'M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  x: 'M18 6 6 18 M6 6l12 12',
  clip: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
  flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  refresh: 'M21 12a9 9 0 1 1-2.64-6.36L21 8 M21 3v5h-5',
  panel: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 3v18',
  plus: 'M12 5v14 M5 12h14',
  arrowDown: 'M12 5v14 m7-7-7 7-7-7',
  copy: 'M9 9h13v13H9z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  pencil: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z',
};

const CODE_EXT: Record<string, string> = {
  ts: 'ts', tsx: 'tsx', typescript: 'ts', js: 'js', jsx: 'jsx', javascript: 'js',
  python: 'py', py: 'py', html: 'html', css: 'css', json: 'json', bash: 'sh', sh: 'sh',
  sql: 'sql', md: 'md', java: 'java', cpp: 'cpp', c: 'c', go: 'go', rs: 'rs', php: 'php', ruby: 'rb',
};

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function chatToMd(chat: Chat) {
  return [`# ${chat.title}`, '', ...chat.messages.map((m) => `**${m.role === 'user' ? 'You' : 'Assistant'}:**\n\n${m.content}\n`)].join('\n');
}

function CodeBlock({ lang, code, onToast }: { lang: string; code: string; onToast: (m: string) => void }) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    onToast('Code copied with indentation');
    setTimeout(() => setCopied(false), 1500);
  };
  const download = () => {
    const ext = CODE_EXT[(lang || '').toLowerCase()] ?? 'txt';
    downloadText(`code.${ext}`, code);
    onToast(`Code downloaded as .${ext}`);
  };
  const btnCls = 'rounded-md border border-gray-600/60 bg-gray-700/40 px-2.5 py-1 text-[11px] font-medium text-gray-300 transition hover:bg-gray-600/60 hover:text-white active:scale-95';
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-gray-700/40 bg-gray-900 shadow-inner">
      <div className="flex items-center justify-between gap-2 border-b border-gray-700/60 bg-gray-800 px-3 py-2">
        <span className="truncate text-[11px] font-medium uppercase tracking-wider text-gray-400">
          {lang || 'code'} · {lines.length} lines
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <button onClick={download} title="Download code file" className={btnCls}>Download</button>
          <button onClick={copy} className={btnCls}>{copied ? '✓ Copied' : 'Copy'}</button>
        </span>
      </div>
      <div className="code-scroll max-h-[28rem] overflow-auto">
        <pre className="p-3.5 text-[13px] leading-relaxed text-gray-100">
          <code>
            {lines.map((ln, i) => (
              <span key={i} className="block whitespace-pre">
                <span className="mr-4 inline-block w-8 select-none text-right text-[11px] text-gray-600">{i + 1}</span>
                {ln.length ? ln : ' '}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

function RichText({ text, onToast }: { text: string; onToast: (m: string) => void }) {
  const parts = text.split('```');
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return part ? <span key={i} className="whitespace-pre-wrap">{part}</span> : null;
        const nl = part.indexOf('\n');
        return <CodeBlock key={i} lang={nl === -1 ? '' : part.slice(0, nl).trim()} code={nl === -1 ? part : part.slice(nl + 1)} onToast={onToast} />;
      })}
    </>
  );
}

function MsgActions({ text, onToast }: { text: string; onToast: (m: string) => void }) {
  if (!text) return null;
  const cls = 'rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-90';
  return (
    <div className="mt-1 flex justify-end gap-1">
      <button onClick={() => { navigator.clipboard?.writeText(text); onToast('Message copied'); }} title="Copy message" className={cls}><Ic d={PATH.copy} className="h-3.5 w-3.5" /></button>
      <button onClick={() => { downloadText(`message-${Date.now()}.md`, text); onToast('Message downloaded'); }} title="Download message" className={cls}><Ic d={PATH.download} className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1.5 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
      <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
      <span className="typing-dot h-2 w-2 rounded-full bg-gray-400" />
    </span>
  );
}

function StatusLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-[13px] font-medium text-gray-500">
      <TypingDots />
      <span>{label}</span>
    </div>
  );
}

function ReasoningPanel({ text, live, timer }: { text: string; live: boolean; timer?: string }) {
  const [open, setOpen] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (live && open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [text, live, open]);

  useEffect(() => {
    if (!live) setOpen(false);
  }, [live]);

  return (
    <div className="mb-2 overflow-hidden rounded-xl border border-indigo-200/70 bg-indigo-50/50 shadow-sm">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition hover:bg-indigo-50">
        <span className={`h-2 w-2 shrink-0 rounded-full ${live ? 'animate-pulse bg-indigo-500' : 'bg-indigo-300'}`} />
        <span className="flex-1 text-[11px] font-medium uppercase tracking-wider text-indigo-700">
          {live ? `Thinking… ${timer ?? ''}` : 'Thought process'}
        </span>
        <Ic d={PATH.chevron} className={`h-3.5 w-3.5 text-indigo-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div ref={bodyRef} className="reasoning-scroll max-h-56 overflow-y-auto border-t border-indigo-100/80 bg-white/70 px-3.5 py-2.5">
          <p className="whitespace-pre-wrap text-[12.5px] italic leading-relaxed text-gray-600">{text}</p>
        </div>
      )}
    </div>
  );
}

const GROUP_ORDER = ['Today', 'Previous 7 days', 'Previous 30 days', 'Older'];
const TEXT_EXT = /\.(txt|md|json|js|jsx|ts|tsx|py|html|css|csv|xml|yml|yaml|log)$/i;

function groupLabel(ts: number) {
  const day = 86400000;
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const s = t0.getTime();
  if (ts >= s) return 'Today';
  if (ts >= s - 7 * day) return 'Previous 7 days';
  if (ts >= s - 30 * day) return 'Previous 30 days';
  return 'Older';
}

interface Attachment { id: string; name: string; size: number; kind: 'image' | 'text' | 'file'; dataUrl?: string; text?: string; }

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinned, setPinned] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [apiOpen, setApiOpen] = useState(false);
  const [apiForm, setApiForm] = useState({ provider: '', key: '', model: '' });
  const [addingCustom, setAddingCustom] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cmName, setCmName] = useState('');
  const [cmURL, setCmURL] = useState('');
  const [cmModel, setCmModel] = useState('');
  const [cmKey, setCmKey] = useState('');
  const [cmError, setCmError] = useState('');
  const [cmLoading, setCmLoading] = useState(false);
  const [trends, setTrends] = useState<string[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const toastSeq = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    chats, activeChatId, customModels, activeCustomId, appName,
    providerId, model, apiKeys, models,
    newChat, selectChat, deleteChat, addCustomModel, updateCustomModel, removeCustomModel, setActiveCustom, setAppName,
    setProvider, setModel, setKey, setModels, addMsg, updateLast, clearMsgs,
  } = useStore();

  const provider = PROVIDERS[providerId];
  const list = models[providerId] ?? provider?.models ?? [];
  const curModel = model.trim();
  const activeCustom = customModels.find((c) => c.id === activeCustomId) ?? null;

  // Derived connection state — persists across refresh because apiKeys & model are in localStorage
  const hasApiKey = (apiKeys[providerId] ?? '').trim().length > 0;
  const isConnected = !!activeCustom || (hasApiKey && !!curModel);

  const conn = activeCustom
    ? { label: activeCustom.name, model: activeCustom.modelId, baseURL: activeCustom.baseURL, apiKey: activeCustom.apiKey.trim() }
    : { label: provider?.label ?? '', model: curModel, baseURL: provider?.baseURL ?? '', apiKey: (apiKeys[providerId] ?? '').trim() };

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;
  const messages = activeChat?.messages ?? [];

  useEffect(() => setMounted(true), []);
  useEffect(() => { document.title = appName === 'Omni Chat' ? 'Omni Chat — Multi-Model AI Chat Workspace' : appName; }, [appName]);
  useEffect(() => { if (pinned) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages, pinned]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((e) => +(e + 0.1).toFixed(1)), 100);
    return () => clearInterval(t);
  }, [loading]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) setModelMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModelMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [modelMenuOpen]);

  async function refreshTrends() {
    setTrendsLoading(true);
    try {
      const res = await fetch('/api/trends');
      const data = await res.json();
      if (Array.isArray(data.topics) && data.topics.length) setTrends(data.topics);
    } catch { }
    finally { setTrendsLoading(false); }
  }
  useEffect(() => { void refreshTrends(); }, []);

  function toast(msg: string) {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }
  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }
  function jumpToBottom() {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    setPinned(true);
  }
  function handleNew() { abortRef.current?.abort(); newChat(); setError(''); setPinned(true); toast('New chat started'); }
  function handleSelect(id: string) { abortRef.current?.abort(); selectChat(id); setError(''); setPinned(true); }
  function handleDelete(id: string) { if (id === activeChatId) abortRef.current?.abort(); deleteChat(id); toast('Chat deleted'); }
  function handleClear() {
    if (!messages.length) return;
    clearMsgs();
    toast('Chat cleared');
  }
  function handleDownload(chat: Chat) {
    downloadText(`${chat.title.replace(/[^a-z0-9-_ ]/gi, '').trim().slice(0, 40) || 'chat'}.md`, chatToMd(chat));
    toast('Chat downloaded');
  }
  function handleCopyChat(chat: Chat) {
    navigator.clipboard?.writeText(chatToMd(chat));
    toast('Chat copied');
  }

  async function saveConnect() {
    const p = apiForm.provider;
    const key = apiForm.key.trim();
    const chosen = apiForm.model.trim();
    if (!p) { setSettingsError('Select a provider'); return; }
    if (!key) { setSettingsError('API key required'); return; }
    setSettingsError('');
    setLoading(true);
    try {
      const res = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId: p, apiKey: key }) });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid API key. Please check and try again.'); }
      if (!res.ok || data.error) {
        const msg = String(data.error ?? '');
        throw new Error(res.status === 401 || res.status === 403 ? 'Invalid API key. Please check and try again.' : msg || `HTTP ${res.status}`);
      }
      const fetched: string[] = data.models ?? [];
      setKey(p, key);
      setProvider(p);
      setModels(p, fetched);
      setModel(chosen && (!fetched.length || fetched.includes(chosen)) ? chosen : fetched[0] ?? PROVIDERS[p]?.models[0] ?? '');
      setActiveCustom(null);
      setApiOpen(false);
      setApiForm({ provider: '', key: '', model: '' });
      setError('');
      toast(`Switched to ${PROVIDERS[p].label}`);
    } catch (e: any) {
      setSettingsError(e?.message ?? 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  function cancelApiForm() {
    setApiOpen(false);
    setApiForm({ provider: '', key: '', model: '' });
    setSettingsError('');
  }

  function removeApi(id: string) {
    setKey(id, '');
    setModels(id, []);
    if (id === providerId) {
      setModel('');
      const next = Object.values(PROVIDERS).find((p) => p.id !== id && (apiKeys[p.id] ?? '').trim());
      if (next) {
        setProvider(next.id);
        const nextModels = models[next.id] ?? PROVIDERS[next.id]?.models ?? [];
        if (nextModels.length) setModel(nextModels[0]);
      } else {
        setProvider('groq');
      }
    }
    toast(`Removed ${PROVIDERS[id].label}`);
  }

  function resetCustomForm() {
    setCmName(''); setCmURL(''); setCmModel(''); setCmKey('');
    setCmError('');
    setEditingId(null);
    setAddingCustom(false);
  }
  function startEdit(cm: CustomModel) {
    setEditingId(cm.id);
    setAddingCustom(false);
    setCmError('');
    setCmName(cm.name);
    setCmURL(cm.baseURL);
    setCmModel(cm.modelId);
    setCmKey(cm.apiKey);
  }
    async function saveCustomModel() {
    const badFieldsMsg = 'Could not connect. Please double-check your Base URL, API key and Model ID.';
    if (!cmName.trim() || !cmURL.trim() || !cmModel.trim()) { setCmError('Name, Base URL and Model ID are required'); return; }
    const key = cmKey.trim() || customModels[0]?.apiKey || '';
    if (!key) { setCmError('API key required'); return; }
    setCmError('');
    setCmLoading(true);
    try {
      const res = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId: 'openai', apiKey: key, baseURL: cmURL.trim() }) });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(badFieldsMsg); }
      if (!res.ok || data.error) {
        const msg = String(data.error ?? '');
        if (res.status === 401 || res.status === 403) throw new Error('Invalid API key. Please double-check and try again.');
        if (res.status === 502 || res.status === 504 || /network|timeout|url|fetch|parse/i.test(msg)) throw new Error(badFieldsMsg);
        throw new Error(msg || badFieldsMsg);
      }
      
      const fetched: string[] = data.models ?? [];
      if (fetched.length > 0 && !fetched.includes(cmModel.trim())) {
        throw new Error(badFieldsMsg);
      }

      const payload = { name: cmName.trim(), baseURL: cmURL.trim(), modelId: cmModel.trim(), apiKey: key };
      if (editingId) {
        updateCustomModel(editingId, payload);
        toast(`Updated ${payload.name}`);
      } else {
        addCustomModel(payload);
        toast(`Added ${payload.name}`);
      }
      resetCustomForm();
    } catch (e: any) {
      setCmError(e?.message ?? badFieldsMsg);
    } finally {
      setCmLoading(false);
    }
  }

  function downscale(file: File, max = 1280): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        URL.revokeObjectURL(url);
        if (!ctx) { reject(new Error('Canvas unsupported')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image read failed')); };
      img.src = url;
    });
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const next: Attachment[] = [];
    for (const f of Array.from(files)) {
      const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      try {
        if (f.type.startsWith('image/')) next.push({ id, name: f.name, size: f.size, kind: 'image', dataUrl: await downscale(f) });
        else if (f.type.startsWith('text/') || TEXT_EXT.test(f.name)) next.push({ id, name: f.name, size: f.size, kind: 'text', text: (await f.text()).slice(0, 200000) });
        else next.push({ id, name: f.name, size: f.size, kind: 'file' });
      } catch {
        toast(`Could not read ${f.name}`);
      }
    }
    setAttachments((a) => [...a, ...next]);
    if (next.length) toast(`${next.length} file(s) attached`);
  }

  async function send(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if ((!text && attachments.length === 0) || loading) return;
    if (!conn.apiKey) { setError('Add an API key or custom model in Settings'); return; }
    if (!conn.model) { setError('Select a model'); return; }
    if (!conn.baseURL) { setError('No Base URL for this connection'); return; }

    setError('');
    setPinned(true);

    let textPart = text;
    for (const tf of attachments.filter((a) => a.kind === 'text' && a.text)) textPart += `\n\n--- 📄 ${tf.name} ---\n\`\`\`\n${tf.text}\n\`\`\``;
    const otherFiles = attachments.filter((a) => a.kind === 'file');
    if (otherFiles.length) textPart += `\n\n📎 Attached: ${otherFiles.map((f) => f.name).join(', ')}`;
    const images = attachments.filter((a) => a.kind === 'image' && a.dataUrl);
    const displayContent = textPart + (images.length ? `\n\n${images.map((i) => `🖼 ${i.name}`).join('\n')}` : '');
    const apiContent: any = images.length
      ? [{ type: 'text', text: textPart || 'Describe this image in detail.' }, ...images.map((i) => ({ type: 'image_url', image_url: { url: i.dataUrl } }))]
      : textPart;

    const history = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: apiContent }];

    addMsg({ role: 'user', content: displayContent });
    addMsg({ role: 'assistant', content: '' });
    setInput('');
    setAttachments([]);
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = '';
    let reasonAcc = '';

    const toText = (v: any): string =>
      typeof v === 'string'
        ? v
        : Array.isArray(v)
          ? v.map((p: any) => (typeof p === 'string' ? p : typeof p?.text === 'string' ? p.text : '')).join('')
          : v && typeof v === 'object' && typeof v.text === 'string'
            ? v.text
            : '';

    try {
      for await (const raw of streamChat({ providerId, model: conn.model, apiKey: conn.apiKey, baseURL: conn.baseURL, messages: history, signal: controller.signal })) {
        const chunk: any = raw;
        acc += toText(typeof chunk === 'string' ? chunk : chunk?.content);
        reasonAcc += toText(typeof chunk === 'string' ? '' : chunk?.reasoning);
        updateLast(acc, reasonAcc);
      }
      if (!acc) updateLast('(No reply received)', reasonAcc);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      const visionHint = images.length && /image|vision|multimodal|content.type/i.test(msg)
        ? ' — This model does not support images. Choose a vision model.'
        : '';
      updateLast(acc ? `${acc}\n\n⚠️ ${msg}${visionHint}` : `⚠️ ${msg}${visionHint}`);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  if (!mounted) return null;

  const inputCls = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25';

  const filtered = chats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()));
  const grouped: Record<string, Chat[]> = {};
  for (const c of [...filtered].sort((a, b) => b.updatedAt - a.updatedAt)) {
    const g = groupLabel(c.updatedAt);
    (grouped[g] ??= []).push(c);
  }

  const formOpen = addingCustom || !!editingId;

  return (
    <div className="relative flex h-screen text-gray-900">
      <div className="pointer-events-none fixed left-1/2 top-4 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="toast flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-4 py-2.5 text-[13px] font-medium text-gray-800 shadow-lg shadow-indigo-500/10 backdrop-blur">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white"><Ic d={PATH.plus} className="h-3 w-3" /></span>
            {t.msg}
          </div>
        ))}
      </div>

      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} title="Open sidebar" className="pop-in fixed left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-lg transition hover:bg-gray-100 hover:text-gray-900 active:scale-95">
          <Ic d={PATH.panel} className="h-4 w-4" />
        </button>
      )}

      <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} shrink-0 overflow-hidden border-r border-gray-200/70 bg-white/80 backdrop-blur transition-all duration-200`}>
        <div className="flex h-full w-72 flex-col">
          <div className="space-y-2 p-3">
            <div className="flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats…" className={`${inputCls} min-w-0 flex-1`} />
              <button onClick={() => setSidebarOpen(false)} title="Collapse sidebar" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-100 hover:text-gray-900 active:scale-95">
                <Ic d={PATH.panel} className="h-4 w-4" />
              </button>
            </div>
            <button onClick={handleNew} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-indigo-500/30 active:translate-y-0 active:scale-[0.98]">
              <Ic d={PATH.plus} className="h-4 w-4" /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3">
            {GROUP_ORDER.map((g) => {
              const items = grouped[g];
              if (!items?.length) return null;
              return (
                <div key={g} className="mt-3">
                  <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{g}</p>
                  {items.map((c) => (
                    <div key={c.id} onClick={() => handleSelect(c.id)} className={`group msg-in relative flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-sm transition ${c.id === activeChatId ? 'bg-gradient-to-r from-indigo-50 to-violet-50 font-medium text-indigo-700' : 'text-gray-800 hover:bg-gray-100'}`}>
                      {c.id === activeChatId && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-500" />}
                      <span className="flex-1 truncate">{c.title}</span>
                      <button title="Copy chat" onClick={(e) => { e.stopPropagation(); handleCopyChat(c); }} className="hidden h-6 w-6 place-items-center rounded-md text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 group-hover:grid"><Ic d={PATH.copy} className="h-3.5 w-3.5" /></button>
                      <button title="Download chat" onClick={(e) => { e.stopPropagation(); handleDownload(c); }} className="hidden h-6 w-6 place-items-center rounded-md text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 group-hover:grid"><Ic d={PATH.download} className="h-3.5 w-3.5" /></button>
                      <button title="Delete chat" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="hidden h-6 w-6 place-items-center rounded-md text-gray-500 transition hover:bg-red-100 hover:text-red-600 group-hover:grid"><Ic d={PATH.trash} className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200/70 bg-gray-50/70 p-3">
            {!settingsOpen ? (
              <button onClick={() => { setSettingsOpen(true); setError(''); }} className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-medium text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-md active:translate-y-0">
                <span className="flex items-center gap-2"><Ic d={PATH.gear} className="h-4 w-4 text-gray-600" /> Settings</span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-600">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? 'animate-pulse bg-emerald-500' : 'bg-gray-300'}`} />
                  {isConnected ? 'Connected' : 'Not connected'}
                  <Ic d={PATH.chevron} className="h-3.5 w-3.5" />
                </span>
              </button>
            ) : (
              <div className="pop-in space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-gray-600"><Ic d={PATH.gear} className="h-3.5 w-3.5" /> Settings</span>
                  <button onClick={() => setSettingsOpen(false)} className="flex items-center gap-1 text-[11px] font-medium text-gray-500 transition hover:text-gray-900">Hide <Ic d={PATH.chevron} className="h-3 w-3 rotate-180" /></button>
                </div>

                <div className="space-y-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">API Settings</span>
                    <button onClick={() => { if (!apiOpen) setApiForm({ provider: '', key: '', model: '' }); setApiOpen((o) => !o); }} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800">
                      {apiOpen ? <>Close <Ic d={PATH.x} className="h-3 w-3" /></> : <>Add <Ic d={PATH.plus} className="h-3 w-3" /></>}
                    </button>
                  </div>

                  {!apiOpen && (
                    <div className="space-y-1 pt-0.5">
                      {Object.values(PROVIDERS).filter((p) => (apiKeys[p.id] ?? '').trim()).map((p) => {
                        const isActive = p.id === providerId && !activeCustom;
                        return (
                          <div key={p.id} onClick={() => { setProvider(p.id); setActiveCustom(null); setError(''); toast(`Switched to ${p.label}`); }} className={`group relative flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-2 text-[13px] transition hover:-translate-y-0.5 hover:shadow-sm ${isActive ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 font-medium text-emerald-800' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-100'}`}>
                            <span className={`h-2 w-2 shrink-0 rounded-full ${isActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-gray-300'}`} />
                            <span className="flex-1 truncate">{p.label}</span>
                            <span className="max-w-[90px] truncate text-[10px] text-gray-500">{isActive ? curModel : models[p.id]?.[0] ?? ''}</span>
                            <button title="Edit API" onClick={(e) => { e.stopPropagation(); setApiForm({ provider: p.id, key: apiKeys[p.id] ?? '', model: isActive ? curModel : models[p.id]?.[0] ?? '' }); setApiOpen(true); }} className="hidden h-5 w-5 place-items-center rounded text-gray-500 transition hover:bg-indigo-100 hover:text-indigo-700 group-hover:grid"><Ic d={PATH.pencil} className="h-3 w-3" /></button>
                            <button title="Remove API" onClick={(e) => { e.stopPropagation(); removeApi(p.id); }} className="hidden h-5 w-5 place-items-center rounded text-gray-500 transition hover:bg-red-100 hover:text-red-600 group-hover:grid"><Ic d={PATH.x} className="h-3 w-3" /></button>
                          </div>
                        );
                      })}
                      {!Object.values(PROVIDERS).some((p) => (apiKeys[p.id] ?? '').trim()) && (
                        <p className="px-1 py-1 text-[11px] text-gray-500">No API added yet. Click Add to connect.</p>
                      )}
                    </div>
                  )}

                  {apiOpen && (
                    <div className="space-y-2 pt-1">
                      <select value={apiForm.provider} disabled={loading} onChange={(e) => setApiForm((f) => ({ ...f, provider: e.target.value }))} className={`${inputCls} w-full`}>
                        <option value="" disabled>Select provider</option>
                        {Object.values(PROVIDERS).map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
                      </select>
                      <input type="password" placeholder="API key" value={apiForm.key} onChange={(e) => setApiForm((f) => ({ ...f, key: e.target.value }))} className={`${inputCls} w-full`} />
                      <input list="settings-model-list" value={apiForm.model} disabled={loading} onChange={(e) => setApiForm((f) => ({ ...f, model: e.target.value }))} placeholder="Model ID (optional)" className={`${inputCls} w-full`} />
                      <datalist id="settings-model-list">{(PROVIDERS[apiForm.provider]?.models ?? []).map((m) => (<option key={m} value={m} />))}</datalist>
                      <div className="flex gap-1.5">
                        <button onClick={saveConnect} disabled={loading} className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl active:translate-y-0 active:scale-[0.98] disabled:opacity-50">
                          Save & Connect
                        </button>
                        <button onClick={cancelApiForm} className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-medium text-gray-600 transition hover:bg-gray-100 active:scale-[0.98]">
                          Cancel
                        </button>
                      </div>
                      {settingsError && <p className="text-[11px] font-medium text-red-600">{settingsError}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                  <div className="flex items-center justify-between pb-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">Custom Models</span>
                    <button onClick={() => (formOpen ? resetCustomForm() : setAddingCustom(true))} className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-800">
                      {formOpen ? <>Close <Ic d={PATH.x} className="h-3 w-3" /></> : <>Add <Ic d={PATH.plus} className="h-3 w-3" /></>}
                    </button>
                  </div>
                  {customModels.map((cm) => (
                    <div key={cm.id} onClick={() => { setActiveCustom(cm.id); toast(`Switched to ${cm.name}`); }} className={`group mb-1 flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-2 text-[13px] transition hover:-translate-y-0.5 hover:shadow-sm ${cm.id === activeCustomId ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 font-medium text-emerald-800' : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-100'}`}>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${cm.id === activeCustomId ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-gray-300'}`} />
                      <span className="flex-1 truncate">{cm.name}</span>
                      <span className="max-w-[80px] truncate text-[10px] text-gray-500">{cm.modelId}</span>
                      <button title="Edit model" onClick={(e) => { e.stopPropagation(); startEdit(cm); }} className="hidden h-5 w-5 place-items-center rounded text-gray-500 transition hover:bg-indigo-100 hover:text-indigo-700 group-hover:grid"><Ic d={PATH.pencil} className="h-3 w-3" /></button>
                      <button title="Remove model" onClick={(e) => { e.stopPropagation(); removeCustomModel(cm.id); toast(`Removed ${cm.name}`); }} className="hidden h-5 w-5 place-items-center rounded text-gray-500 transition hover:bg-red-100 hover:text-red-600 group-hover:grid"><Ic d={PATH.x} className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {formOpen && (
                    <div className="pop-in space-y-1.5 rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <p className="text-[11px] font-semibold text-gray-600">{editingId ? 'Edit Model' : 'Add Model'}</p>
                      <input value={cmName} onChange={(e) => setCmName(e.target.value)} placeholder="Display name" className={`${inputCls} w-full`} />
                      <input value={cmURL} onChange={(e) => setCmURL(e.target.value)} placeholder="Base URL" className={`${inputCls} w-full`} />
                      <input value={cmModel} onChange={(e) => setCmModel(e.target.value)} placeholder="Model ID" className={`${inputCls} w-full`} />
                      <input type="password" value={cmKey} onChange={(e) => setCmKey(e.target.value)} placeholder="API key" className={`${inputCls} w-full`} />
                      <div className="flex gap-1.5">
                        <button onClick={saveCustomModel} disabled={cmLoading} className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98] disabled:opacity-50">
                          {cmLoading ? 'Validating…' : editingId ? 'Save Changes' : 'Add Model'}
                        </button>
                        <button onClick={resetCustomForm} disabled={cmLoading} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-gray-600 transition hover:bg-gray-100 active:scale-[0.98] disabled:opacity-50">
                          Cancel
                        </button>
                      </div>
                      {cmError && <p className="text-[11px] font-medium text-red-600">{cmError}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="border-b border-gray-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 ring-1 ring-white/40">
              <BrandMark className="h-7 w-7 text-white" />
            </div>
            <div className="mr-auto min-w-0">
              <h1 onClick={() => { const n = window.prompt('App name:', appName); if (n?.trim()) { setAppName(n.trim()); toast('App name updated'); } }} title="Rename" className="cursor-pointer text-base font-semibold leading-tight tracking-tight transition hover:text-indigo-600">{appName}</h1>
              <p className="flex items-center gap-1.5 truncate text-xs leading-tight text-gray-600">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isConnected ? 'animate-pulse bg-emerald-500' : 'bg-gray-300'}`} />
                <span className="truncate">
                  {activeCustom
                    ? `${activeCustom.name} · ${activeCustom.modelId}`
                    : isConnected && curModel
                      ? `${conn.label} · ${conn.model}`
                      : 'Not connected'}
                </span>
              </p>
            </div>
            <button onClick={handleClear} disabled={!messages.length} title="Clear current chat" className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-600">
              <Ic d={PATH.trash} className="h-4 w-4" />
            </button>
          </div>
        </header>

        {error && (
          <div className="absolute left-0 right-0 top-[73px] z-10 flex justify-center px-4">
            <div className="flex w-full max-w-3xl items-center gap-3 rounded-xl border border-red-200/80 bg-white px-4 py-3 shadow-lg shadow-red-500/10 backdrop-blur-sm">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="flex-1 text-sm font-medium text-red-700">{error}</p>
              <button onClick={() => setError('')} className="rounded-lg p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <main ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-5">
            {messages.length === 0 && (
              <div className="msg-in flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <h2 className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-[26px] font-bold tracking-tight text-transparent">What&apos;s on your mind?</h2>
                <div className="w-full max-w-xl">
                  <div className="mb-2 flex items-center justify-center gap-2 text-gray-500">
                    <Ic d={PATH.flame} className="h-3.5 w-3.5 text-orange-500" />
                    <button onClick={() => void refreshTrends()} title="Refresh topics" className="transition hover:text-indigo-600 active:scale-90">
                      <Ic d={PATH.refresh} className={`h-3.5 w-3.5 ${trendsLoading ? 'spin' : ''}`} />
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(trends.length ? trends : ['Loading topics…']).map((s, i) => (
                      <button key={i} disabled={!trends.length || loading} onClick={() => void send(s)} style={{ animationDelay: `${i * 40}ms` }} className="item-in rounded-2xl border border-gray-200/80 bg-white/90 px-4 py-2.5 text-sm text-gray-800 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-60">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              const isLast = i === messages.length - 1;
              return isUser ? (
                <div key={i} className="msg-in flex flex-col items-end">
                  <div className="max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-[15px] text-white shadow-lg shadow-indigo-600/20">{m.content}</div>
                  <MsgActions text={m.content} onToast={toast} />
                </div>
              ) : (
                <div key={i} className="msg-in flex gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25 ring-1 ring-white/40">
                    <BrandMark className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {m.reasoning ? <ReasoningPanel text={m.reasoning} live={loading && isLast} timer={`${elapsed.toFixed(1)}s`} /> : null}
                    <div className="break-words rounded-2xl rounded-tl-md border border-gray-200/80 bg-white/90 px-4 py-3.5 text-[15px] leading-relaxed shadow-sm backdrop-blur transition hover:shadow-md">
                      {m.content ? <RichText text={m.content} onToast={toast} /> : loading && isLast ? <StatusLine label={m.reasoning ? 'Generating answer…' : elapsed < 1.2 ? `Connecting to ${conn.label}…` : `Thinking… ${elapsed.toFixed(1)}s`} /> : <span className="text-gray-400">…</span>}
                    </div>
                    {loading && isLast && m.content ? <p className="mt-1 text-right text-[11px] text-gray-400">Generating… {elapsed.toFixed(1)}s</p> : null}
                    <MsgActions text={m.content} onToast={toast} />
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {!pinned && (
          <button onClick={jumpToBottom} className="pop-in absolute bottom-32 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-4 py-2 text-[12px] font-medium text-gray-800 shadow-lg shadow-indigo-500/10 backdrop-blur transition hover:bg-gray-100 active:scale-95">
            <Ic d={PATH.arrowDown} className="h-3.5 w-3.5" /> Scroll to latest
          </button>
        )}

        <footer className="border-t border-gray-200/60 bg-gradient-to-t from-white via-white/85 to-transparent p-3 pt-2 backdrop-blur">
          <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200/80 bg-white/90 p-2 shadow-xl shadow-indigo-500/5 backdrop-blur transition focus-within:border-indigo-300/70 focus-within:shadow-indigo-500/10 focus-within:ring-4 focus-within:ring-indigo-500/10">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
                {attachments.map((a) => (
                  <span key={a.id} className="pop-in flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1.5 pr-2.5 text-[12px] text-gray-700 shadow-sm">
                    {a.kind === 'image' && a.dataUrl ? <img src={a.dataUrl} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="grid h-6 w-6 place-items-center rounded-full bg-gray-100 text-gray-600"><Ic d={PATH.clip} className="h-3 w-3" /></span>}
                    <span className="max-w-[140px] truncate">{a.name}</span>
                    <button onClick={() => setAttachments((xs) => xs.filter((x) => x.id !== a.id))} className="text-gray-500 transition hover:text-red-600"><Ic d={PATH.x} className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" multiple accept="image/*,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.csv,.xml,.yml,.yaml,.log" className="hidden" onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
              <button onClick={() => fileRef.current?.click()} title="Add images or files" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-gray-200 bg-white text-gray-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90">
                <Ic d={PATH.clip} className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }}
                placeholder="Type a message…"
                className="min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-relaxed text-gray-900 placeholder-gray-400 focus:outline-none overflow-y-auto"
                style={{ maxHeight: '200px' }}
              />

              <div className="relative shrink-0" ref={modelMenuRef}>
                <button onClick={() => setModelMenuOpen((o) => !o)} className={`flex h-11 max-w-[180px] items-center gap-2 rounded-2xl border px-4 text-[13px] font-medium transition active:scale-95 ${modelMenuOpen ? 'border-indigo-300 bg-indigo-50/70 text-indigo-700 ring-4 ring-indigo-500/10' : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'}`}>
                  <span className="truncate">{activeCustom ? activeCustom.name : curModel || 'Model'}</span>
                  <Ic d={PATH.chevron} className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${modelMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {modelMenuOpen && (
                  <div className="pop-in absolute bottom-full right-0 z-20 mb-3 max-h-80 w-72 overflow-y-auto rounded-2xl border border-gray-200/80 bg-white/95 p-1.5 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl">
                    {list.length > 0 && (
                      <>
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Default · {provider?.label}</p>
                        {list.map((m, i) => {
                          const isSel = !activeCustom && m === curModel;
                          return (
                            <button key={m} onClick={() => { setActiveCustom(null); setModel(m); setModelMenuOpen(false); toast(`Switched to ${m}`); }} style={{ animationDelay: `${i * 25}ms` }} className={`item-in flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition hover:translate-x-0.5 ${isSel ? 'bg-gradient-to-r from-emerald-50 to-teal-50 font-medium text-emerald-800' : 'text-gray-800 hover:bg-gray-50'}`}>
                              <span className={`h-2 w-2 shrink-0 rounded-full ${isSel ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-transparent'}`} />
                              <span className="flex-1 truncate">{m}</span>
                            </button>
                          );
                        })}
                      </>
                    )}
                    {customModels.length > 0 && (
                      <>
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Custom</p>
                        {customModels.map((cm, i) => {
                          const isSel = cm.id === activeCustomId;
                          return (
                            <button key={cm.id} onClick={() => { setActiveCustom(cm.id); setModelMenuOpen(false); toast(`Switched to ${cm.name}`); }} style={{ animationDelay: `${(list.length + i) * 25}ms` }} className={`item-in flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] transition hover:translate-x-0.5 ${isSel ? 'bg-gradient-to-r from-emerald-50 to-teal-50 font-medium text-emerald-800' : 'text-gray-800 hover:bg-gray-50'}`}>
                              <span className={`h-2 w-2 shrink-0 rounded-full ${isSel ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-transparent'}`} />
                              <span className="flex-1 truncate">{cm.name}</span>
                            </button>
                          );
                        })}
                      </>
                    )}
                    {list.length === 0 && customModels.length === 0 && (
                      <p className="px-3 py-2 text-[12px] text-gray-500">No models</p>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <button onClick={() => abortRef.current?.abort()} title="Stop" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/40 transition hover:shadow-xl hover:shadow-red-500/50 hover:brightness-110 active:scale-90">
                  <Ic d={PATH.stop} className="h-4 w-4" filled />
                </button>
              ) : (
                <button onClick={() => void send()} disabled={!input.trim() && attachments.length === 0} title="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/40 transition hover:shadow-xl hover:shadow-indigo-500/50 hover:brightness-110 active:scale-90 disabled:opacity-40 disabled:shadow-none">
                  <Ic d={PATH.send} className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}