import { SkeletonVoiceCard } from "@/components/ui/SkeletonCard";

export default function Loading() {
  return (
    <div className="min-h-[calc(100dvh-5rem)] relative text-[#F4F4F5] overflow-hidden font-light pt-24 pb-12">
      <div className="absolute inset-0 pointer-events-none aether-bg-gradient" />
      <main className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-12">
          <div className="h-3 w-40 rounded-full mb-4"
            style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.08), rgba(99,102,241,0.15), rgba(99,102,241,0.08))" }}
          />
          <div className="h-10 w-80 rounded-lg mb-2"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1), rgba(255,255,255,0.04))" }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonVoiceCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
