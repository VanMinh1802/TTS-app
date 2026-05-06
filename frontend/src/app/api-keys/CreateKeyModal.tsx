"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UiSelect } from "@/components/ui/UiSelect";

interface CreateFormData {
  name: string;
  rateLimit: number;
}

interface CreateKeyModalProps {
  show: boolean;
  onClose: () => void;
  createForm: CreateFormData;
  setCreateForm: (updater: (prev: CreateFormData) => CreateFormData) => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

export function CreateKeyModal({
  show,
  onClose,
  createForm,
  setCreateForm,
  onGenerate,
  isGenerating,
}: CreateKeyModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 /80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="aether-glass-wrapper rounded-[24px] max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aether-glass p-8">
              <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#818CF8] mb-6 flex items-center gap-3">
                <span className="w-4 h-[1px] bg-[#818CF8]/50"></span>
                Khởi tạo API Key mới
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#A1A1AA] mb-2">Tên định danh (Key Name)</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[#0D100A]/50 border border-white/10 rounded-[8px] px-4 py-3 font-light text-sm text-[#F4F4F5] placeholder:text-gray-700 outline-none focus:border-[#6366F1]/50 transition-colors"
                    placeholder="VD: Mobile App Production"
                  />
                </div>
                <UiSelect
                  value={String(createForm.rateLimit)}
                  onChange={(v) => setCreateForm((f) => ({ ...f, rateLimit: parseInt(v) }))}
                  options={[
                    { value: "50", label: "50 requests/min" },
                    { value: "100", label: "100 requests/min" },
                    { value: "200", label: "200 requests/min" },
                  ]}
                  label="Giới hạn truy vấn (Rate Limit)"
                />
                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-[8px] bg-white/5 border border-white/10 text-[10px] font-medium uppercase tracking-widest text-[#D4D4D8] hover:bg-white/10 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={onGenerate}
                    disabled={isGenerating || !createForm.name.trim()}
                    className="aether-btn aether-btn-primary flex-1 py-3 text-[10px] font-medium uppercase tracking-widest disabled:opacity-50"
                  >
                    {isGenerating ? "Đang tạo..." : "Sinh mã (Generate)"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
