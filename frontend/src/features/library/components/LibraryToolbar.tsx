'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FilterState, LibraryViewMode } from '../types';
import { UiSelect } from '@/components/ui/UiSelect';
import { LibraryRecord } from '../types';

interface Props {
  filter: FilterState;
  onFilterChange: (update: Partial<FilterState>) => void;
  viewMode: LibraryViewMode;
  onViewModeChange: (mode: LibraryViewMode) => void;
  availableVoices: string[];
  totalRecords?: number;
}

export function LibraryToolbar({ filter, onFilterChange, viewMode, onViewModeChange, availableVoices, totalRecords }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A1A1AA]/50 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
          placeholder="Tìm kiếm bản ghi..."
          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#818CF8]/50 focus:bg-white/10 text-white placeholder:text-[#A1A1AA]/50 transition-all font-normal text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
        />
      </div>

      {/* Voice filter */}
      <UiSelect
        value={filter.voiceFilter ?? ''}
        onChange={(v) => onFilterChange({ voiceFilter: v || null })}
        options={[
          { value: '', label: 'Tất cả giọng đọc' },
          ...availableVoices.map((v) => ({ value: v, label: v })),
        ]}
        placeholder="Tất cả giọng đọc"
      />

      {/* Sort */}
      <UiSelect
        value={filter.sortBy}
        onChange={(v) => onFilterChange({ sortBy: v as FilterState['sortBy'] })}
        options={[
          { value: 'newest', label: 'Mới nhất' },
          { value: 'oldest', label: 'Cũ nhất' },
          { value: 'az', label: 'A-Z' },
        ]}
      />

      {/* View toggle */}
      <div className="flex bg-white/5 border border-white/10 rounded-full overflow-hidden">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`px-4 py-3 transition-all duration-200 min-h-[44px] ${
            viewMode === 'grid'
              ? 'bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
          title="Dạng lưới"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`px-4 py-3 transition-all duration-200 min-h-[44px] ${
            viewMode === 'list'
              ? 'bg-gradient-to-r from-[#6366F1] to-[#C968F7] text-[#1A1A1A] border border-white/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
              : 'text-[#A1A1AA] hover:text-white'
          }`}
          title="Dạng danh sách"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
