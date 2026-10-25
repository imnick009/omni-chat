<div align="center">

# ✦ Omni Chat

### One workspace. Every AI model.

**A modern multi-model AI chat client built with Next.js 16**

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-omni.nikhilbuilds.com-6366f1?style=for-the-badge)](https://omni.nikhilbuilds.com)
[![GitHub](https://img.shields.io/badge/GitHub-imnick009/omni--chat-181717?style=for-the-badge&logo=github)](https://github.com/imnick009/omni-chat)

---

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)
![Zustand](https://img.shields.io/badge/Zustand-5-453F39?logo=react)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

## 🎯 Overview

Omni Chat is a privacy-first, open-source AI chat workspace that connects every major LLM provider into a single unified interface. Stream responses in real-time, attach images for vision models, inject documents for context, and export conversations — all while keeping your API keys local in your browser.

> No backend database. No vendor lock-in. No telemetry. Just you and the models.

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **🔀 Multi-Model Switching** | Swap between Groq, OpenRouter, DeepSeek, Gemini, Claude, Qwen, and OpenAI with a single click. |
| **🧩 Custom Endpoints** | Plug in any OpenAI-compatible API (Ollama, LM Studio, vLLM, Together AI, etc.). |
| **⚡ Streaming + Reasoning** | Token-by-token response streaming with live "thought process" panel for reasoning models. |
| **🖼️ Vision Support** | Attach images directly — compatible with GPT-5.6, Claude 5.5, Gemini 3.8, and more. |
| **📎 File Attachments** | Inject `.txt`, `.md`, `.json`, `.py`, `.js`, `.ts` and other code/text files as context. |
| **💾 Local Persistence** | Chat history saved via `localStorage` using Zustand — works offline. |
| **🔍 Smart Organization** | Auto-grouped history (Today / 7 days / 30 days / Older) with instant search. |
| **📤 Chat Export** | Download any conversation as Markdown or copy to clipboard. |
| **🔥 Trending Topics** | Google Trends integration for instant conversation starters. |
| **⌨️ Keyboard Shortcuts** | `Enter` to send, `Shift+Enter` for newline, `Esc` to close menus. |
| **🎨 Polished UI** | Glassmorphic design with micro-animations, gradient accents, and responsive layout. |

## 🌐 Supported Providers

| Provider | Base URL | Latest Models (October 2026) | Vision |
| :--- | :--- | :--- | :---: |
| **Groq** | `api.groq.com/openai/v1` | Llama 4 Scout, Llama 4 Maverick, Llama 3.3 70B | ✅ |
| **OpenRouter** | `openrouter.ai/api/v1` | 200+ models including all latest | ✅ |
| **DeepSeek** | `api.deepseek.com/v1` | DeepSeek V4.1 Flash, V4 Pro, R1 | ✅ |
| **Google Gemini** | `generativelanguage.googleapis.com` | Gemini 3.8 Flash, Gemini 4 Argon | ✅ |
| **Claude** | `api.anthropic.com/v1` | Claude Sonnet 5.5, Opus 5.5, Haiku 5.5 | ✅ |
| **OpenAI** | `api.openai.com/v1` | GPT-5.6, GPT-6 Astra, GPT-5.5 | ✅ |
| **Qwen** | `dashscope.aliyuncs.com` | Qwen3.8-Max, Qwen3-235B-A22B | ✅ |
| **Custom** | Any OpenAI-compatible | Your choice | Varies |

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **State** | Zustand with `persist` middleware |
| **Streaming** | Native `ReadableStream` + SSE parser |
| **Deployment** | Vercel (Edge runtime) |
| **Icons** | Custom inline SVG system (no icon library) |

## 🚀 Quick Start

### Prerequisites

- Node.js **20+**
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/imnick009/omni-chat.git
cd omni-chat
npm install
npm run dev
