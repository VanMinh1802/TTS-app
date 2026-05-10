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

export const generateTts = async (payload: TTSGenerateRequest, signal?: AbortSignal): Promise<TTSGenerateResponse> => {
  const validatedPayload = ttsGenerateRequestSchema.parse(payload);

  const raw = await apiRequest<TTSGenerateResponse>("/tts/generate", {
    method: "POST",
    body: JSON.stringify(validatedPayload),
    signal,
  });

  const parsed = ttsGenerateResponseSchema.safeParse(raw);
  return parsed.success ? parsed.data : (raw as TTSGenerateResponse);
};
