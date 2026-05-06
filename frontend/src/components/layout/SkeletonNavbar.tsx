'use client';

export function SkeletonNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050508]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="w-24 h-4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-16 h-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="w-12 h-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="w-20 h-4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    </nav>
  );
}
