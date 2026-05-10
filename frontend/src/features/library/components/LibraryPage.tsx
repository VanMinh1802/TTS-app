'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { useLocalLibrary } from '../hooks/useLocalLibrary';
import { useLibraryRecords } from '../hooks/useLibraryRecords';
import { useLibrarySync } from '../hooks/useLibrarySync';
import { useLibraryFilter } from '../hooks/useLibraryFilter';
import { LibraryToolbar } from './LibraryToolbar';
import { LibraryTabs } from './LibraryTabs';
import { LibraryGrid } from './LibraryGrid';
import { LibraryList } from './LibraryList';
import { LibraryEmpty } from './LibraryEmpty';
import { LibrarySyncBar } from './LibrarySyncBar';
import { CloudUpgradeBanner } from './CloudUpgradeBanner';
import { FormatPickerModal } from './FormatPickerModal';
import { LibraryRecord, LibraryViewMode, LibraryTab } from '../types';
import { notificationService } from "@/shared/notifications/notification-store";
import { useVoiceMap } from '@/features/voice/hooks/useVoiceMap';

export function LibraryPage() {
  const { user } = useAuth();
  const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';
  const { voiceMap, getVoice } = useVoiceMap();
  const { loading: localLoading } = useLocalLibrary();
  const { records, loading, error, refresh } = useLibraryRecords(isPro);
  const { syncProgress, startSync, isSyncing } = useLibrarySync();
  const { filter, setFilter, filteredRecords, availableVoices, tabCounts } = useLibraryFilter(records);
  const [viewMode, setViewMode] = useState<LibraryViewMode>('grid');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryRecord | null>(null);
  const [deleteMode, setDeleteMode] = useState<'local' | 'cloud' | 'both'>('both');
  const [formatPick, setFormatPick] = useState<{ record: LibraryRecord; mode: 'download' | 'upload' } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback((record: LibraryRecord) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === record.id) {
      setPlayingId(null);
      return;
    }
    setPlayingId(record.id);
    const playbackUrl = record.audio_mp3 || record.audio_url;
    if (!playbackUrl) return;
    const audio = new Audio(playbackUrl);
    audio.onended = () => { setPlayingId(null); audioRef.current = null; };
    audioRef.current = audio;
    audio.play();
  }, [playingId]);

  const handleDelete = useCallback((id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) return;
    setDeleteTarget(record);
    setDeleteMode(record.sync_status.local && record.sync_status.cloud ? 'both' : record.sync_status.local ? 'local' : 'cloud');
  }, [records]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      if (deleteMode === 'cloud' || deleteMode === 'both') {
        if (isPro) {
          const { deleteCloudRecord } = await import('../api/library-api');
          await deleteCloudRecord(deleteTarget.id);
        }
      }
      if (deleteMode === 'local' || deleteMode === 'both') {
        const { deleteRecordFromDB } = await import('../lib/indexed-db');
        await deleteRecordFromDB(deleteTarget.id);
      }
      setDeleteTarget(null);
      refresh();
    } catch (e) {
      console.error('Delete failed:', e);
      notificationService.notify({ severity: "error", title: "Lỗi", message: "Không thể xóa bản ghi. Vui lòng thử lại." });
    }
  }, [deleteTarget, deleteMode, isPro, refresh]);

  const handleDownload = useCallback((record: LibraryRecord) => {
    setFormatPick({ record, mode: 'download' });
  }, []);

  const handleUploadToCloud = useCallback((record: LibraryRecord) => {
    if (!isPro) return;
    setFormatPick({ record, mode: 'upload' });
  }, [isPro]);

  const handleFormatChoice = useCallback(async (record: LibraryRecord, format: 'mp3' | 'wav') => {
    setFormatPick(null);
    if (!formatPick) return;

    if (formatPick.mode === 'download') {
      const url = format === 'mp3' ? record.audio_mp3 : record.audio_url;
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.download = `genvoice-${record.id}.${format}`;
      a.click();
    } else {
      await startSync([record]);
      refresh();
    }
  }, [formatPick, startSync, refresh]);

  const handleSyncAll = useCallback(async () => {
    if (!isPro) return;
    const localOnly = records.filter(r => r.sync_status.local && !r.sync_status.cloud);
    if (localOnly.length === 0) return;
    await startSync(localOnly);
    refresh();
  }, [isPro, records, startSync, refresh]);

  const handleTabChange = useCallback((tab: LibraryTab) => {
    setFilter({ tab });
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlayingId(null); }
  }, [setFilter]);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  if (error) {
    return (
      <div className="aether-glass-wrapper rounded-[24px] mt-6">
        <div className="aether-glass rounded-[24px] h-48 flex flex-col items-center justify-center">
          <p className="text-sm text-red-400 mb-2">Tải thư viện thất bại</p>
          <button onClick={refresh} className="aether-btn aether-btn-primary text-xs px-5 py-2">Thử lại</button>
        </div>
      </div>
    );
  }

  const isLoading = loading || localLoading;

  return (
    <div>
      {syncProgress && !syncProgress.inProgress && syncProgress.failed > 0 && (
        <div className="mb-4"><LibrarySyncBar progress={syncProgress} /></div>
      )}
      {!isPro && <div className="mb-4"><CloudUpgradeBanner /></div>}
      <LibraryTabs activeTab={filter.tab} counts={tabCounts} isPro={isPro} onTabChange={handleTabChange} />
      <LibraryToolbar filter={filter} onFilterChange={setFilter} viewMode={viewMode} onViewModeChange={setViewMode} availableVoices={availableVoices} totalRecords={records.length} getVoice={getVoice} />
      {isPro && records.filter(r => r.sync_status.local && !r.sync_status.cloud).length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#6366F1]/10 to-[#C968F7]/10 border border-[#6366F1]/30 text-[#818CF8] text-[10px] font-bold uppercase tracking-widest hover:text-white hover:from-[#6366F1]/20 hover:to-[#C968F7]/20 transition-all disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            {isSyncing ? 'Đang đồng bộ...' : `Đồng bộ ${records.filter(r => r.sync_status.local && !r.sync_status.cloud).length} bản ghi`}
          </button>
        </div>
      )}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center justify-center py-32">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] mx-1" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#818CF8] mx-1" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, delay: 0.2, repeat: Infinity }} />
            <motion.div className="w-1.5 h-1.5 rounded-full bg-[#C968F7] mx-1" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, delay: 0.4, repeat: Infinity }} />
          </motion.div>
        ) : filteredRecords.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <LibraryEmpty />
          </motion.div>
        ) : (
          <motion.div
            key={`${viewMode}-${filter.tab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {viewMode === 'grid' ? (
              <LibraryGrid records={filteredRecords} onPlay={handlePlay} onDelete={handleDelete} onDownload={handleDownload} onUploadToCloud={handleUploadToCloud} playingId={playingId} isPro={isPro} getVoice={getVoice} />
            ) : (
              <LibraryList records={filteredRecords} onPlay={handlePlay} onDelete={handleDelete} onDownload={handleDownload} onUploadToCloud={handleUploadToCloud} playingId={playingId} isPro={isPro} getVoice={getVoice} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aether-glass-wrapper rounded-[24px] max-w-sm w-full" onClick={e => e.stopPropagation()}
          >
            <div className="aether-glass rounded-[24px] p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Xoá bản ghi?</p>
                  <p className="text-[10px] text-[#A1A1AA]">{deleteTarget.text_content.slice(0, 60)}...</p>
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex gap-2 mb-5">
                {deleteTarget.sync_status.local && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" /> Local
                  </span>
                )}
                {deleteTarget.sync_status.cloud && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-[#C968F7]/10 border border-[#C968F7]/30 text-[#C968F7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C968F7]" /> Cloud
                  </span>
                )}
              </div>

              {/* Delete options for synced records */}
              {deleteTarget.sync_status.local && deleteTarget.sync_status.cloud && (
                <div className="space-y-2 mb-5">
                  <p className="text-[10px] text-[#71717A] uppercase tracking-wider mb-3">Chọn vị trí xoá:</p>
                  {[
                    { mode: 'local' as const, label: 'Xoá khỏi máy', desc: 'Giữ bản sao trên Cloud', color: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
                    { mode: 'cloud' as const, label: 'Xoá khỏi Cloud', desc: 'Giữ bản sao trên máy', color: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
                    { mode: 'both' as const, label: 'Xoá vĩnh viễn', desc: 'Xoá cả Local và Cloud', color: 'border-red-500/30 bg-red-500/5 text-red-400' },
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      onClick={() => setDeleteMode(opt.mode)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        deleteMode === opt.mode
                          ? `${opt.color} ring-1 ring-current/20`
                          : 'border-white/5 text-[#71717A] hover:border-white/10'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${deleteMode === opt.mode ? 'border-current' : 'border-[#333]'}`}>
                        {deleteMode === opt.mode && <span className="w-2 h-2 rounded-full bg-current" />}
                      </span>
                      <div>
                        <p className="text-xs font-medium">{opt.label}</p>
                        <p className="text-[9px] opacity-60">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[#A1A1AA] text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                  Huỷ
                </button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all">
                  {deleteMode === 'both' ? 'Xoá vĩnh viễn' : deleteMode === 'local' ? 'Xoá khỏi máy' : 'Xoá khỏi Cloud'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <FormatPickerModal
        show={!!formatPick}
        onClose={() => setFormatPick(null)}
        record={formatPick?.record ?? null}
        mode={formatPick?.mode ?? 'download'}
        onChoose={handleFormatChoice}
      />
    </div>
  );
}
