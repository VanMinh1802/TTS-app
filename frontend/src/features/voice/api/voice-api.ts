import { apiRequest } from "@/lib/api-client";
import {
  ttsVoicesResponseSchema,
  type StudioVoice,
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
