import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PROVIDERS } from './providers';

export interface ChatMsg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMsg[];
}

export interface CustomModel {
  id: string;
  name: string;
  baseURL: string;
  modelId: string;
  apiKey: string;
}

interface State {
  chats: Chat[];
  activeChatId: string | null;
  customModels: CustomModel[];
  activeCustomId: string | null;
  appName: string;
  providerId: string;
  model: string;
  apiKeys: Record<string, string>;
  models: Record<string, string[]>;
  newChat: () => string;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  addCustomModel: (m: Omit<CustomModel, 'id'>) => void;
  updateCustomModel: (id: string, patch: Partial<Omit<CustomModel, 'id'>>) => void;
  removeCustomModel: (id: string) => void;
  setActiveCustom: (id: string | null) => void;
  setAppName: (n: string) => void;
  setProvider: (id: string) => void;
  setModel: (m: string) => void;
  setKey: (id: string, k: string) => void;
  setModels: (id: string, m: string[]) => void;
  addMsg: (m: Omit<ChatMsg, 'id'>) => void;
  updateLast: (c: string, reasoning?: string) => void;
  clearMsgs: () => void;
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useStore = create<State>()(
  persist(
    (set) => ({
      chats: [],
      activeChatId: null,
      customModels: [],
      activeCustomId: null,
      appName: 'Omni Chat',
      providerId: 'groq',
      model: '',
      apiKeys: {},
      models: {},

      newChat: () => {
        const id = uid();
        const now = Date.now();
        set((s) => ({
          chats: [{ id, title: 'New Chat', createdAt: now, updatedAt: now, messages: [] }, ...s.chats],
          activeChatId: id,
        }));
        return id;
      },

      selectChat: (id) => set({ activeChatId: id }),

      deleteChat: (id) =>
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id);
          return {
            chats,
            activeChatId: s.activeChatId === id ? chats[0]?.id ?? null : s.activeChatId,
          };
        }),

      addCustomModel: (m) =>
        set((s) => ({ customModels: [...s.customModels, { ...m, id: uid() }] })),

      updateCustomModel: (id, patch) =>
        set((s) => ({
          customModels: s.customModels.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCustomModel: (id) =>
        set((s) => ({
          customModels: s.customModels.filter((c) => c.id !== id),
          activeCustomId: s.activeCustomId === id ? null : s.activeCustomId,
        })),

      setActiveCustom: (id) => set({ activeCustomId: id }),
      setAppName: (n) => set({ appName: n }),

      setProvider: (id) =>
        set((s) => ({
          providerId: id,
          model: s.models[id]?.[0] ?? PROVIDERS[id]?.models[0] ?? '',
          activeCustomId: null,
        })),

      setModel: (model) => set({ model, activeCustomId: null }),
      setKey: (id, k) => set((s) => ({ apiKeys: { ...s.apiKeys, [id]: k } })),
      setModels: (id, m) => set((s) => ({ models: { ...s.models, [id]: m } })),

      addMsg: (m) =>
        set((s) => {
          let chats = s.chats;
          let activeChatId = s.activeChatId;

          if (!activeChatId || !chats.some((c) => c.id === activeChatId)) {
            const id = uid();
            const now = Date.now();
            chats = [{ id, title: 'New Chat', createdAt: now, updatedAt: now, messages: [] }, ...chats];
            activeChatId = id;
          }

          const msg: ChatMsg = { ...m, id: uid() };
          chats = chats.map((c) => {
            if (c.id !== activeChatId) return c;
            const title =
              c.title === 'New Chat' && msg.role === 'user'
                ? msg.content.slice(0, 40) || 'New Chat'
                : c.title;
            return { ...c, title, updatedAt: Date.now(), messages: [...c.messages, msg] };
          });

          return { chats, activeChatId };
        }),

      updateLast: (content, reasoning) =>
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== s.activeChatId || !c.messages.length) return c;
            const msgs = [...c.messages];
            const last = msgs[msgs.length - 1];
            msgs[msgs.length - 1] = {
              ...last,
              content,
              reasoning: reasoning !== undefined ? reasoning : last.reasoning,
            };
            return { ...c, messages: msgs, updatedAt: Date.now() };
          }),
        })),

      clearMsgs: () =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === s.activeChatId ? { ...c, messages: [] } : c
          ),
        })),
    }),
    {
      name: 'ai-chat-v5',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        chats: s.chats,
        activeChatId: s.activeChatId,
        customModels: s.customModels,
        activeCustomId: s.activeCustomId,
        appName: s.appName,
        providerId: s.providerId,
        model: s.model,
        models: s.models,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (state.appName === 'AI Model Hub' || state.appName === 'My AI Chatbox')) {
          state.setAppName('Omni Chat');
        }
      },
    }
  )
);