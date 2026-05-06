import { z } from "zod";

export const voiceLibrarySchema = z.object({
  id: z.string(),
  name: z.string(),
  language: z.string(),
  gender: z.string(),
  is_custom: z.boolean(),
  owner_id: z.string().nullable().optional(),
  model_url: z.string().nullable().optional(),
  config_url: z.string().nullable().optional(),
  sample_url: z.string().nullable().optional(),
  folder: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  region: z.string().optional(),
  style: z.string().optional(),
  priority: z.number().optional(),
});

export const studioVoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  lang: z.string(),
  sample_url: z.string().nullable().optional(),
  available: z.boolean(),
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
});

export const normalizationMetaSchema = z.object({
  mode: z.string().default("rule_based"),           // "llm" | "rule_based"
  llm_status: z.string().nullable().optional(),
  text_was_complex: z.boolean().default(false),
});

export const ttsGenerateResponseSchema = z.object({
  audio_url: z.string(),
  duration: z.number(),
  voice_id: z.string(),
  normalization: normalizationMetaSchema.optional(),
  audio_mp3: z.string().optional(),
  audio_wav: z.string().optional(),
});


export type VoiceLibraryEntry = z.infer<typeof voiceLibrarySchema>;
export type StudioVoice = z.infer<typeof studioVoiceSchema>;
export type TTSDictionaryEntry = z.infer<typeof ttsDictionaryEntrySchema>;
export type TTSGenerateRequest = z.infer<typeof ttsGenerateRequestSchema>;
export type TTSGenerateResponse = z.infer<typeof ttsGenerateResponseSchema>;
export type NormalizationMeta = z.infer<typeof normalizationMetaSchema>;

