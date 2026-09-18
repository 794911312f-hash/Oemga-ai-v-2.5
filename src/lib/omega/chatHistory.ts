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

// In-memory fallback if localStorage is inaccessible or corrupted
let inMemorySessionsCache: ChatSession[] | null = null;
let inMemoryActiveSessionId: string | null = null;

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

function createDefaultSession(title = "المحادثة الافتراضية"): ChatSession {
  return {
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
}

export function loadAllSessions(): ChatSession[] {
  console.log("[OmegaStorage] loadAllSessions called");
  if (inMemorySessionsCache && inMemorySessionsCache.length > 0) {
    console.log("[OmegaStorage] Returning inMemorySessionsCache count:", inMemorySessionsCache.length);
  }

  if (typeof window === "undefined") {
    const fallback = [createDefaultSession()];
    inMemorySessionsCache = fallback;
    return fallback;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      console.log("[OmegaStorage] No existing sessions found in localStorage. Creating initial session.");
      const initialSession = createDefaultSession("المحادثة الافتراضية");
      const initialList = [initialSession];
      inMemorySessionsCache = initialList;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialList));
        localStorage.setItem(ACTIVE_SESSION_ID_KEY, initialSession.id);
      } catch (err) {
        console.warn("[OmegaStorage] localStorage setItem failed during initial session creation:", err);
      }
      return initialList;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log(`[OmegaStorage] Successfully loaded ${parsed.length} sessions from localStorage.`);
      inMemorySessionsCache = parsed;
      return parsed;
    }

    console.warn("[OmegaStorage] Parsed sessions from localStorage was empty or non-array. Creating fallback.");
    const fallbackSession = createDefaultSession("المحادثة الافتراضية");
    const fallbackList = [fallbackSession];
    inMemorySessionsCache = fallbackList;
    return fallbackList;
  } catch (err) {
    console.error("[OmegaStorage] Error loading sessions from localStorage:", err);
    if (inMemorySessionsCache && inMemorySessionsCache.length > 0) {
      return inMemorySessionsCache;
    }
    const safeFallback = [createDefaultSession("المحادثة الافتراضية")];
    inMemorySessionsCache = safeFallback;
    return safeFallback;
  }
}

/**
 * Sanitizes sessions array to reduce size if localStorage hits QuotaExceededError
 */
export function sanitizeSessionsForStorage(sessions: ChatSession[]): ChatSession[] {
  console.log(`[OmegaStorage] sanitizeSessionsForStorage called for ${sessions?.length || 0} sessions.`);
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return [createDefaultSession()];
  }

  return sessions.map((session) => {
    if (!session || !Array.isArray(session.messages)) {
      return createDefaultSession(session?.title || "جلسة مستعادة");
    }
    return {
      ...session,
      messages: session.messages.slice(-40).map((msg) => {
        if (!msg) return { id: `msg-${Date.now()}`, role: "assistant", content: "", timestamp: Date.now() };
        if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
          return {
            ...msg,
            attachments: msg.attachments.map((att) => ({
              ...att,
              base64Data: att.base64Data && att.base64Data.length > 30000 ? undefined : att.base64Data,
            })),
          };
        }
        return msg;
      }),
    };
  });
}

export function saveAllSessions(sessions: ChatSession[]): void {
  console.log(`[OmegaStorage] saveAllSessions called with ${sessions?.length || 0} sessions.`);
  if (!Array.isArray(sessions) || sessions.length === 0) {
    console.warn("[OmegaStorage] saveAllSessions received invalid or empty array. Aborting save.");
    return;
  }

  inMemorySessionsCache = sessions;

  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    console.log("[OmegaStorage] Standard save succeeded.");
  } catch (err) {
    console.warn("[OmegaStorage] Standard save failed (likely quota or security restriction), attempting sanitized save:", err);
    try {
      const sanitized = sanitizeSessionsForStorage(sessions);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      inMemorySessionsCache = sanitized;
      console.log("[OmegaStorage] Sanitized save succeeded.");
    } catch (retryErr) {
      console.error("[OmegaStorage] Sanitized save also failed. Continuing with in-memory sessions cache.", retryErr);
    }
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === "undefined") return inMemoryActiveSessionId;
  try {
    const stored = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
    return stored || inMemoryActiveSessionId;
  } catch (err) {
    console.warn("[OmegaStorage] getActiveSessionId error:", err);
    return inMemoryActiveSessionId;
  }
}

export function setActiveSessionId(id: string): void {
  console.log(`[OmegaStorage] setActiveSessionId: ${id}`);
  inMemoryActiveSessionId = id;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } catch (err) {
    console.warn("[OmegaStorage] setActiveSessionId failed in localStorage:", err);
  }
}

export function createNewSession(title = "محادثة جديدة"): ChatSession {
  console.log(`[OmegaStorage] createNewSession called with title: "${title}"`);
  const newSession = createDefaultSession(title);
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
  console.log(`[OmegaStorage] updateSession called for sessionId: ${sessionId}`);
  let sessions = loadAllSessions();
  if (!Array.isArray(sessions) || sessions.length === 0) {
    sessions = [createDefaultSession()];
  }

  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    try {
      const updated = updater(sessions[index]);
      if (updated && Array.isArray(updated.messages)) {
        updated.updatedAt = Date.now();
        if (
          (updated.title === "المحادثة الافتراضية" || updated.title === "محادثة جديدة") &&
          updated.messages.length > 1
        ) {
          const firstUserMsg = updated.messages.find((m) => m?.role === "user");
          if (firstUserMsg && firstUserMsg.content) {
            const clean = firstUserMsg.content.slice(0, 32).trim();
            updated.title = clean.length > 0 ? clean + (firstUserMsg.content.length > 32 ? "..." : "") : updated.title;
          }
        }
        sessions[index] = updated;
        saveAllSessions(sessions);
        console.log(`[OmegaStorage] Session ${sessionId} updated successfully.`);
      } else {
        console.warn("[OmegaStorage] updateSession updater returned invalid session structure.");
      }
    } catch (err) {
      console.error("[OmegaStorage] Exception inside updateSession updater:", err);
    }
  } else {
    console.warn(`[OmegaStorage] updateSession: sessionId ${sessionId} not found in sessions list.`);
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
