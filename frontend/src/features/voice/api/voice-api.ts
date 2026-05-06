import { ApiError, apiRequest } from "@/lib/api-client";
import {
  ttsGenerateRequestSchema,
  ttsGenerateResponseSchema,
  ttsVoicesResponseSchema,
  type StudioVoice,
  type TTSGenerateRequest,
  type TTSGenerateResponse,
} from "../types/voice-types";

let cachedStudioVoices: Promise<StudioVoice[]> | null = null;

export const getStudioVoices = async (): Promise<StudioVoice[]> => {
  if (cachedStudioVoices) return cachedStudioVoices;

  cachedStudioVoices = (async () => {
    try {
      const response = await apiRequest<unknown>("/tts/voices");
      return ttsVoicesResponseSchema.parse(response).voices;
    } catch (error) {
      cachedStudioVoices = null;
      throw error;
    }
  })();

  return cachedStudioVoices;
};

export const generateTts = async (payload: TTSGenerateRequest): Promise<TTSGenerateResponse> => {
  const validatedPayload = ttsGenerateRequestSchema.parse(payload);

  // Read Gemini API key from localStorage (BYOK — never stored server-side)
  const llmApiKey = typeof window !== "undefined" ? (localStorage.getItem("gemini_api_key") ?? "") : "";

  const extraHeaders: HeadersInit = {};
  if (llmApiKey) {
    extraHeaders["X-LLM-API-Key"] = llmApiKey;
  }

  const raw = await apiRequest<TTSGenerateResponse>("/tts/generate", {
    method: "POST",
    body: JSON.stringify(validatedPayload),
    headers: extraHeaders,
  });

  // safeParse so a schema mismatch on normalization never breaks audio playback
  const parsed = ttsGenerateResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : (raw as TTSGenerateResponse);
};


