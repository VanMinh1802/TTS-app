"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { UiButton, UiChip, UiSection } from "@/components/ui/ui-kit";
import { useT } from "@/shared/i18n";
import { Field } from "./DictionaryField";
import { DictionaryEntryRow } from "./DictionaryEntryRow";

export interface DictionaryEntry {
  id?: string;
  word: string;
  pronunciation: string;
}

interface CustomDictionaryProps {
  dictionary: DictionaryEntry[];
  onAdd: (entry: DictionaryEntry) => void;
  onRemove: (index: number) => void;
  onEdit?: (index: number, entry: DictionaryEntry) => void;
}

export function CustomDictionary({ dictionary, onAdd, onRemove, onEdit }: CustomDictionaryProps) {
  const t = useT();
  const [newWord, setNewWord] = useState("");
  const [newPronunciation, setNewPronunciation] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DictionaryEntry>({ word: "", pronunciation: "" });

  const handleStartEdit = useCallback((index: number, entry: DictionaryEntry) => {
    setEditingIndex(index);
    setEditForm({ word: entry.word, pronunciation: entry.pronunciation });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingIndex === null || !editForm.word.trim() || !editForm.pronunciation.trim()) return;
    onEdit?.(editingIndex, editForm);
    setEditingIndex(null);
  }, [editingIndex, editForm, onEdit]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const handleAdd = useCallback(() => {
    if (!newWord.trim() || !newPronunciation.trim()) return;
    onAdd({ word: newWord, pronunciation: newPronunciation });
    setNewWord("");
    setNewPronunciation("");
  }, [newWord, newPronunciation, onAdd]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const filteredEntries = useMemo(
    () =>
      [...dictionary]
        .map((entry, originalIndex) => ({ entry, originalIndex }))
        .reverse()
        .filter(({ entry }) => {
          const q = searchQuery.toLowerCase();
          const matchesSearch = !q || entry.word.toLowerCase().includes(q) || entry.pronunciation.toLowerCase().includes(q);
          return matchesSearch;
        }),
    [dictionary, searchQuery],
  );

  const newestIndex = dictionary.length > 0 ? dictionary.length - 1 : -1;

  return (
    <>
      <div className="aether-glass-wrapper rounded-[24px] transition-all duration-300 group/dict hover:opacity-90">
        <div className="aether-glass rounded-[24px] p-4 flex flex-col">
          <label className="mb-3 flex items-center gap-3 text-[14px] font-medium tracking-wide text-[#A1A1AA]">
            <span className="text-lg opacity-80">📚</span>
            {t.studio.dictionaryLabel}
          </label>

            <div className="mb-4 space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <Field label={t.studio.wordToReplace} htmlFor="dict-word">
                <input
                  id="dict-word"
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. $50,000"
                  aria-label={t.studio.wordToReplace}
                  className="w-full bg-transparent border-b border-[#333333] px-0 py-2.5 text-[15px] font-medium text-[#F4F4F5] outline-none transition focus:border-[#6366F1] placeholder:text-[#52525B]"
                />
              </Field>
              <Field label={t.studio.pronunciation} htmlFor="dict-pronunciation">
                <input
                  id="dict-pronunciation"
                  type="text"
                  value={newPronunciation}
                  onChange={(e) => setNewPronunciation(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. năm mươi nghìn đô"
                  aria-label={t.studio.pronunciation}
                  className="w-full bg-transparent border-b border-[#333333] px-0 py-2.5 text-[15px] font-medium text-[#F4F4F5] outline-none transition focus:border-[#6366F1] placeholder:text-[#52525B]"
                />
              </Field>
            </div>

            <div className="flex items-end justify-between gap-3">
              <button
                type="button"
                onClick={handleAdd}
                className="aether-btn aether-btn-primary whitespace-nowrap"
              >
                {t.studio.add}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="group relative w-full rounded-xl border border-[#6366F1]/20 bg-gradient-to-r from-[#6366F1]/5 to-[#C968F7]/5 hover:from-[#6366F1]/10 hover:to-[#C968F7]/10 transition-all duration-300 p-4 mt-2"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-[14px] font-medium tracking-wide text-[#D4D4D8] group-hover:text-white transition-colors">
                <svg className="w-5 h-5 text-[#818CF8]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                </svg>
                {t.studio.savedWords}
              </span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-[#6366F1]/10 border border-[#818CF8]/30 text-[#818CF8] text-xs font-bold">{dictionary.length}</span>
                <svg className="w-4 h-4 text-[#818CF8] transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] bg-[#050508]/80 backdrop-blur-md"
                onClick={() => setIsDrawerOpen(false)}
              />

              <motion.aside
                key="drawer"
                initial={{ x: "110%" }}
                animate={{ x: 0 }}
                exit={{ x: "110%" }}
                transition={{ type: "tween", ease: [0.4, 0, 0.2, 1], duration: 0.3 }}
                className="fixed right-0 top-0 z-[101] flex h-dvh w-[420px] max-w-[92vw] flex-col overflow-hidden border-l border-white/10 bg-[#050508]/95 backdrop-blur-3xl text-white shadow-[-10px_0_40px_rgba(0,0,0,0.6)]"
              >
                <div className="shrink-0 border-b border-white/[0.06] bg-gradient-to-b from-[#6366F1]/5 to-transparent px-6 pt-20 pb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-white">{t.studio.savedWords}</h2>
                      <p className="text-[11px] font-light text-[#818CF8] mt-1">
                        {t.studio.dictItemCount.replace('{n}', String(dictionary.length))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setTimeout(() => document.getElementById('dict-word')?.focus(), 100);
                        }}
                        className="h-10 px-4 rounded-full bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/30 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest hover:text-white hover:bg-[#6366F1]/20 transition-all"
                      >
                        {t.studio.dictAddButton}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(false)}
                        aria-label={t.studio.dictClosePanel}
                        className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>

                <div className="shrink-0 space-y-4 border-b border-white/10 px-6 py-5">
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                      id="dict-search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label={t.studio.filterPlaceholder}
                      placeholder={t.studio.filterPlaceholder}
                      className="w-full rounded-[12px] border border-white/10 bg-black/40 py-2.5 pl-10 pr-4 text-sm font-medium text-white outline-none transition focus:border-[#818CF8]/50 focus:bg-white/5 shadow-inner"
                    />
                  </div>
                </div>

                <div className="custom-scroll flex-1 overflow-y-auto divide-y divide-white/5">
                  {filteredEntries.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-[#71717A]">
                      <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" />
                      </svg>
                      <p className="text-[11px] font-bold uppercase tracking-widest">{t.studio.noFilterResults}</p>
                    </div>
                  ) : (
                    filteredEntries.map(({ entry, originalIndex }) => (
                      <DictionaryEntryRow
                        key={originalIndex}
                        entry={entry}
                        index={originalIndex}
                        isNewest={originalIndex === newestIndex}
                        editingIndex={editingIndex}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveEdit={handleSaveEdit}
                        onRemove={onRemove}
                        hasEdit={!!onEdit}
                      />
                    ))
                  )}
                </div>

                <div className="shrink-0 border-t border-white/10 bg-black/40 px-6 py-5">
                  <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#71717A]">
                    {t.studio.backendNotice}
                  </p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
