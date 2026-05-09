import { z } from "zod";

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1, "Tên không được để trống").max(100, "Tên tối đa 100 ký tự"),
  rateLimit: z.number().min(10, "Tối thiểu 10 requests/min"),
});

export type ApiKeyCreateFormData = z.infer<typeof apiKeyCreateSchema>;

export const activateSchema = z.object({
  code: z.string().min(1, "Mã kích hoạt không được để trống"),
});

export type ActivateFormData = z.infer<typeof activateSchema>;


