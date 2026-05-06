"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="brutal-card p-12">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-3xl font-extrabold uppercase mb-4 font-bold bg-gradient-to-b from-white to-[#A78BFA] bg-clip-text text-transparent">Đã xảy ra lỗi</h1>
        <p className="text-[#A1A1AA] font-medium mb-8">{error.message || "Vui lòng thử lại."}</p>
        <button onClick={reset} className="brutal-btn bg-[#ffd800] px-8 py-3 font-bold text-lg">
          Thử lại
        </button>
      </div>
    </main>
  );
}
