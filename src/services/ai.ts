import { ChatMessage } from '../models';
import { getMoodMeta, MoodId } from '../theme';

// shortcut: EXPO_PUBLIC_AI_API_KEY is fine for local/personal Expo Go testing;
// move this HTTP call behind a Firebase Cloud Function before any public store release.
export async function getAiReply(params: {
  userMessage: string;
  history: ChatMessage[];
  currentMood: MoodId;
  username: string;
}): Promise<string> {
  const apiKey = (process.env.EXPO_PUBLIC_AI_API_KEY ?? '').trim();
  const provider = (process.env.EXPO_PUBLIC_AI_PROVIDER ?? 'openrouter').trim().toLowerCase();
  const model =
    (process.env.EXPO_PUBLIC_AI_MODEL ?? '').trim() ||
    (provider === 'openrouter'
      ? 'openrouter/free'
      : provider === 'groq'
      ? 'llama-3.3-70b-versatile'
      : provider === 'openai'
      ? 'gpt-4o-mini'
      : 'gemini-2.0-flash');

  if (!apiKey || apiKey.startsWith('your_')) {
    return offlineReply(params.userMessage, params.currentMood);
  }

  const moodLabel = getMoodMeta(params.currentMood).label;
  const systemPrompt =
    `You are BLIP!, a warm, concise, supportive mood-tracking companion talking to ${params.username} ` +
    `(current logged mood: ${moodLabel}). Reply in 1-3 short, caring sentences. Never diagnose or replace professional help.`;

  const recent = params.history.slice(-8);

  try {
    if (provider === 'openrouter' || provider === 'openai' || provider === 'groq') {
      const endpoint =
        provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://blip-mood-tracker.app';
        headers['X-Title'] = 'BLIP! Mood Tracker';
      }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...recent.map((m) => ({
              role: m.isUser ? 'user' : 'assistant',
              content: m.text,
            })),
            { role: 'user', content: params.userMessage },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${provider} HTTP ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      return text || offlineReply(params.userMessage, params.currentMood);
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...recent.map((m) => ({
              role: m.isUser ? 'user' : 'model',
              parts: [{ text: m.text }],
            })),
            { role: 'user', parts: [{ text: params.userMessage }] },
          ],
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || offlineReply(params.userMessage, params.currentMood);
  } catch (err) {
    console.warn('[BLIP AI]', err);
    return "I'm having trouble reaching my thoughts right now, but I'm still here with you. Try again in a moment.";
  }
}

function offlineReply(input: string, mood: MoodId): string {
  const lower = input.toLowerCase();
  if (lower.includes('sad') || lower.includes('cry') || mood === 'sad') {
    return "I'm sorry things feel heavy right now. You don't have to carry it all at once—want to tell me what happened?";
  }
  if (lower.includes('anxious') || lower.includes('stress') || mood === 'anxious') {
    return 'Take one slow breath with me. What is the single smallest thing on your mind right now?';
  }
  if (lower.includes('happy') || lower.includes('good') || mood === 'happy') {
    return "I'm glad to hear that! Hold onto that feeling—what made today brighter?";
  }
  return "Thanks for sharing that with me. I'm right here listening—add your EXPO_PUBLIC_AI_API_KEY in .env anytime for full AI replies.";
}
