import { z } from "zod";

export const studioVoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  lang: z.string(),
  sample_url: z.string().nullable().optional(),
  available: z.boolean(),
  model_key: z.string().optional(),
  updated_at: z.string().optional(),
  is_premium: z.boolean().optional(),
});

export const ttsVoicesResponseSchema = z.object({
  voices: z.array(studioVoiceSchema),
});

export const ttsDictionaryEntrySchema = z.object({
  word: z.string(),
  pronunciation: z.string(),
});

export const emotionParamsSchema = z.object({
  length_scale: z.number().min(0.5).max(2.0).default(1.0),
  noise_scale: z.number().min(0.3).max(1.0).default(0.667),
});

export const ttsGenerateRequestSchema = z.object({
  text: z.string().min(1),
  voice_id: z.string().min(1),
  speed: z.number(),
  emotion_params: emotionParamsSchema.optional(),
  user_dictionary: z.array(ttsDictionaryEntrySchema).optional(),
  model_key: z.string().optional(),
  updated_at: z.string().optional(),
});

export const ttsGenerateResponseSchema = z.object({
  audio_url: z.string(),
  duration: z.number(),
  voice_id: z.string(),
  audio_mp3: z.string().optional(),
  audio_wav: z.string().optional(),
});


export type StudioVoice = z.infer<typeof studioVoiceSchema>;
export type TTSDictionaryEntry = z.infer<typeof ttsDictionaryEntrySchema>;
export type TTSGenerateRequest = z.infer<typeof ttsGenerateRequestSchema>;
export type TTSGenerateResponse = z.infer<typeof ttsGenerateResponseSchema>;


