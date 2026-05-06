"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { getDictionaryEntries, createDictionaryEntry, deleteDictionaryEntry, updateDictionaryEntry } from "@/features/dictionary/api/dictionary-api";
import type { DictionaryEntry as DictEntry } from "@/features/dictionary/api/dictionary-api";

export default function DictionaryPage() {
  const [entries, setEntries] = useState<DictEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [word, setWord] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editPron, setEditPron] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try { setEntries(await getDictionaryEntries()); } catch {} finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!word.trim() || !pronunciation.trim()) return;
    const e = await createDictionaryEntry({ word: word.trim(), pronunciation: pronunciation.trim() });
    setEntries(p => [e, ...p]); setWord(""); setPronunciation("");
  };

  const handleDel = async (id: string) => {
    await deleteDictionaryEntry(id);
    setEntries(p => p.filter(e => e.id !== id));
  };

  const handleSave = async () => {
    if (!editId) return;
    await updateDictionaryEntry(editId, { word: editWord, pronunciation: editPron });
    setEntries(p => p.map(e => e.id === editId ? { ...e, word: editWord, pronunciation: editPron } : e));
    setEditId(null);
  };

  const filtered = entries.filter(e => e.word.toLowerCase().includes(search.toLowerCase()) || e.pronunciation.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <FadeIn>
          <div className="mb-8">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              Cơ sở dữ liệu Thuật ngữ
            </h2>
            <h1 className="text-4xl md:text-5xl leading-tight py-0 tracking-tight font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">
              Từ điển Phát âm
            </h1>
            <p className="text-xs font-light text-[#A1A1AA] mt-2">{entries.length} mục đã đăng ký</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="aether-glass-wrapper rounded-[24px] mb-6" id="add-form">
            <div className="aether-glass rounded-[24px] p-6">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#818CF8] mb-5">Thêm thuật ngữ mới</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Từ gốc</label>
                  <input
                    value={word}
                    onChange={e => setWord(e.target.value)}
                    placeholder="VD: COVID-19"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-light text-sm text-white placeholder:text-[#A1A1AA]/50 outline-none focus:border-[#818CF8]/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Phát âm</label>
                  <input
                    value={pronunciation}
                    onChange={e => setPronunciation(e.target.value)}
                    placeholder="VD: cô vít mười chín"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-light text-sm text-white placeholder:text-[#A1A1AA]/50 outline-none focus:border-[#818CF8]/50 focus:bg-white/10 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                  />
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={!word.trim() || !pronunciation.trim()}
                className={`aether-btn px-8 py-3 text-[10px] font-bold uppercase tracking-widest min-h-[44px] ${
                  !word.trim() || !pronunciation.trim()
                    ? "!bg-white/5 !border-white/10 !text-[#A1A1AA] !cursor-not-allowed !shadow-none"
                    : "aether-btn-primary"
                }`}
              >
                Ghi nhận
              </button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/50 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm thuật ngữ..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 font-light text-sm text-white placeholder:text-[#A1A1AA]/50 outline-none focus:border-[#818CF8]/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
            />
          </div>
        </FadeIn>

        {loading ? (
          <div className="h-32 aether-glass-wrapper rounded-[24px]">
            <div className="aether-glass h-full flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-[#818CF8] border-t-transparent animate-spin" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-48 aether-glass-wrapper rounded-[24px]">
            <div className="aether-glass h-full flex flex-col items-center justify-center">
              <svg className="w-10 h-10 text-[#A1A1AA] mb-4 opacity-40" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">
                {search ? "Không tìm thấy kết quả" : "Chưa có thuật ngữ nào"}
              </p>
            </div>
          </div>
        ) : (
          <div className="aether-glass-wrapper rounded-[24px]">
            <div className="aether-glass rounded-[24px] overflow-hidden">
              {filtered.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  className={`border-b border-white/[0.04] last:border-none ${editId === entry.id ? 'bg-[#6366F1]/[0.02]' : ''}`}
                >
                  <div className="px-6 py-4 group">
                    {editId === entry.id ? (
                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <input value={editWord} onChange={e => setEditWord(e.target.value)} placeholder="Từ gốc" className="w-full bg-white/5 border border-[#818CF8]/30 rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[#818CF8] focus:shadow-[0_0_12px_rgba(129,140,248,0.15)] transition-all" />
                        <input value={editPron} onChange={e => setEditPron(e.target.value)} placeholder="Phát âm" className="w-full bg-white/5 border border-[#818CF8]/30 rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[#818CF8] focus:shadow-[0_0_12px_rgba(129,140,248,0.15)] transition-all" />
                        <div className="flex gap-2 shrink-0">
                          <button onClick={handleSave} className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 text-[10px] font-bold uppercase tracking-widest shadow-[0_0_12px_rgba(99,102,241,0.2)]">Lưu</button>
                          <button onClick={() => setEditId(null)} className="px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-[#D4D4D8] text-[10px] font-bold uppercase tracking-widest hover:bg-white/10">Hủy</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[15px] font-semibold tracking-tight text-white truncate">{entry.word}</span>
                          <svg className="w-4 h-4 shrink-0 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                          <span className="text-[14px] font-medium text-[#D4D4D8] bg-white/[0.04] px-3 py-0.5 rounded-lg border border-white/5 truncate">{entry.pronunciation}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                          <button onClick={() => { if (entry.id) { setEditId(entry.id); setEditWord(entry.word); setEditPron(entry.pronunciation); } }} className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#818CF8] hover:bg-[#6366F1]/10 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"/></svg>
                          </button>
                          <button onClick={() => entry.id && handleDel(entry.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
