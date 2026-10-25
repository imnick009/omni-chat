import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://omni.nikhilbuilds.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Omni Chat — Multi-Model AI Chat Workspace",
    template: "%s · Omni Chat",
  },
  description:
    "Omni Chat connects every leading AI model in one workspace — Groq, OpenRouter, DeepSeek, Gemini, Claude or any custom OpenAI-compatible API. Stream answers, attach images and files, and export chats.",
  applicationName: "Omni Chat",
  authors: [{ name: "Nikhil", url: "https://nikhilbuilds.com" }],
  creator: "Nikhil Builds",
  publisher: "Nikhil Builds",
  keywords: [
    "AI chat",
    "multi-model AI",
    "LLM playground",
    "chat with multiple AI models",
    "free AI models",
    "AI model hub",
    "custom AI API client",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Omni Chat",
    title: "Omni Chat — Multi-Model AI Chat Workspace",
    description:
      "Chat with Groq, OpenRouter, DeepSeek, Gemini, Claude or any custom AI API in one clean workspace. Streaming, file attachments, vision and chat export built in.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omni Chat — Multi-Model AI Chat Workspace",
    description:
      "One workspace. Every AI model. Stream answers, attach files, export chats.",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Omni Chat",
              url: SITE_URL,
              applicationCategory: "UtilitiesApplication",
              operatingSystem: "Web",
              description:
                "Multi-model AI chat workspace with streaming, file attachments, vision support and chat export.",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}