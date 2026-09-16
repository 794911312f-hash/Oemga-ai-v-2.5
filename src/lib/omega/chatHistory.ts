/**
 * src/lib/omega/chatHistory.ts
 * Multi-session conversation history and cross-session memory recall for Omega AI.
 */

import type { ChatMessage } from "./types";
import type { Domain } from "./domainRouting";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  domain?: Domain;
  messages: ChatMessage[];
  summary?: string;
  tags?: string[];
}

const STORAGE_KEY = "omega_chat_sessions_v2.5";
const ACTIVE_SESSION_ID_KEY = "omega_active_session_id";

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-default",
  role: "assistant",
  content: `مرحباً بك في **نظام أوميغا للذكاء الاصطناعي متعدد الخوادم (Omega AI Multi-Model Consensus System)**.

تم تفعيل منظومة القدرات المتكاملة والمحدثة:
1. **توليد وتصميم الصور والفيديوهات (AI Media Studio)**: توليد صور فائقة الجودة ومقاطع فيديو متحركة تفاعلية مع مشغل مخصص.
2. **إنشاء المخططات والرسوم البيانية (Interactive Charts)**: رسم مخططات أعمدة وخطي ودائري ومساحي وشبكي راداري ديناميكية.
3. **الاستدلال الفلسفي واللاهوتي العميق ومقارنة الأديان**: تفكيك أعقد الإشكاليات الفلسفية (الوجود، العدم، مشكلة الشر، حرية الإرادة) وتحليل مقارن موضوعي وتوثيقي عميق للأديان والمذاهب.
4. **تذكر المحادثات السابقة وإدارة الجلسات**: حفظ كامل لسجل المحادثات، إمكانية إنشاء محادثة جديدة، واستدعاء السياقات المعرفية السابقة تلقائياً.
5. **معادلات LaTeX والتحليل الرياضي**: دعم كامل للمعادلات الرياضية والمستندات ومصادر الويب والوقت اللحظي.`,
  timestamp: Date.now(),
};

export function loadAllSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialSession: ChatSession = {
        id: "session-" + Date.now(),
        title: "المحادثة الافتراضية",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        domain: "general",
        messages: [DEFAULT_WELCOME_MESSAGE],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([initialSession]));
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, initialSession.id);
      return [initialSession];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to load chat sessions from localStorage:", err);
    return [];
  }
}

export function saveAllSessions(sessions: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save chat sessions to localStorage:", err);
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
}

export function setActiveSessionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
}

export function createNewSession(title = "محادثة جديدة"): ChatSession {
  const newSession: ChatSession = {
    id: `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    domain: "general",
    messages: [
      {
        ...DEFAULT_WELCOME_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: Date.now(),
      },
    ],
  };

  const sessions = loadAllSessions();
  sessions.unshift(newSession);
  saveAllSessions(sessions);
  setActiveSessionId(newSession.id);
  return newSession;
}

export function updateSession(
  sessionId: string,
  updater: (session: ChatSession) => ChatSession
): ChatSession[] {
  const sessions = loadAllSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    const updated = updater(sessions[index]);
    updated.updatedAt = Date.now();
    // Auto generate title if it's the default and user sent a message
    if (
      (updated.title === "المحادثة الافتراضية" || updated.title === "محادثة جديدة") &&
      updated.messages.length > 1
    ) {
      const firstUserMsg = updated.messages.find((m) => m.role === "user");
      if (firstUserMsg && firstUserMsg.content) {
        const clean = firstUserMsg.content.slice(0, 32).trim();
        updated.title = clean.length > 0 ? clean + (firstUserMsg.content.length > 32 ? "..." : "") : updated.title;
      }
    }
    sessions[index] = updated;
    saveAllSessions(sessions);
  }
  return sessions;
}

export function deleteSession(sessionId: string): { sessions: ChatSession[]; nextActiveId: string } {
  let sessions = loadAllSessions();
  sessions = sessions.filter((s) => s.id !== sessionId);

  if (sessions.length === 0) {
    const fallback = createNewSession("محادثة رئيسية");
    return { sessions: [fallback], nextActiveId: fallback.id };
  }

  saveAllSessions(sessions);
  const nextActiveId = sessions[0].id;
  setActiveSessionId(nextActiveId);
  return { sessions, nextActiveId };
}

export function renameSession(sessionId: string, newTitle: string): void {
  updateSession(sessionId, (s) => ({ ...s, title: newTitle.trim() || s.title }));
}

/**
 * Cross-conversation memory recall:
 * Searches across past conversations to find relevant thoughts, facts, or topics
 * that the user discussed in other sessions, ensuring long-term contextual intelligence.
 */
export function findRelevantPastContext(
  arg1: string,
  arg2: string,
  maxResults = 2
): string {
  // Allow passing (currentSessionId, query) or (query, currentSessionId)
  const sessions = loadAllSessions();
  let currentSessionId = "";
  let query = "";

  if (sessions.some((s) => s.id === arg1)) {
    currentSessionId = arg1;
    query = arg2;
  } else if (sessions.some((s) => s.id === arg2)) {
    currentSessionId = arg2;
    query = arg1;
  } else {
    currentSessionId = arg2;
    query = arg1;
  }

  const otherSessions = sessions.filter((s) => s.id !== currentSessionId);
  if (otherSessions.length === 0 || !query || query.length < 3) return "";

  const queryTokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (queryTokens.length === 0) return "";

  const matches: { sessionId: string; sessionTitle: string; excerpt: string; score: number }[] = [];

  for (const session of otherSessions) {
    for (const msg of session.messages) {
      if (!msg.content || msg.id.startsWith("welcome")) continue;
      const lower = msg.content.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (lower.includes(token)) {
          matchCount++;
        }
      }
      if (matchCount > 0) {
        const score = matchCount / queryTokens.length;
        if (score >= 0.25) {
          const excerpt = msg.content.length > 200 ? msg.content.slice(0, 200) + "..." : msg.content;
          matches.push({
            sessionId: session.id,
            sessionTitle: session.title,
            excerpt,
            score,
          });
        }
      }
    }
  }

  if (matches.length === 0) return "";

  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, maxResults);
  return topMatches.map((m) => `[من جلسة "${m.sessionTitle}"]: ${m.excerpt}`).join(" | ");
}

export function clearAllSessions(): ChatSession[] {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  }
  const fresh = createNewSession("محادثة جديدة");
  return [fresh];
}

export function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user" && m.content.trim().length > 0);
  if (!firstUserMsg) return "محادثة جديدة";
  const clean = firstUserMsg.content.trim().replace(/\n+/g, " ");
  return clean.length > 32 ? clean.slice(0, 32) + "..." : clean;
}

// Aliases for developer convenience
export const loadSessions = loadAllSessions;
export const saveSessions = saveAllSessions;
export const createSession = createNewSession;
