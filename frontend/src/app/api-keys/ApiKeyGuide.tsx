"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/motion";
import { useT } from "@/shared/i18n";

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

const sections: GuideSection[] = [
  {
    id: "what-is",
    title: "API Key là gì?",
    icon: "?",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <p>
          API Key là một chuỗi mã định danh duy nhất, cho phép ứng dụng bên ngoài (CLI tools, scripts, mobile apps, server-side apps) 
          xác thực và tương tác với Type2Vibe API thay mặt tài khoản của bạn &mdash; mà không cần đăng nhập bằng email/mật khẩu.
        </p>
        <p>
          Mỗi API Key có thể được cấu hình riêng về <strong className="text-white font-medium">giới hạn tốc độ (rate limit)</strong>,{" "}
          <strong className="text-white font-medium">phạm vi quyền (scopes)</strong>, và <strong className="text-white font-medium">thời hạn sử dụng</strong>.
          Điều này cho phép bạn cấp quyền truy cập có kiểm soát cho từng môi trường khác nhau.
        </p>
        <div className="bg-[#0D100A]/60 border border-white/5 rounded-xl p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Ví dụ thực tế</p>
          <ul className="text-xs space-y-2 text-[#A1A1AA]">
            <li className="flex gap-2"><span className="text-[#6366F1] shrink-0">&bull;</span> Key <strong className="text-white">Production</strong> &mdash; rate limit cao, scope đầy đủ, thời hạn dài</li>
            <li className="flex gap-2"><span className="text-[#6366F1] shrink-0">&bull;</span> Key <strong className="text-white">Development</strong> &mdash; rate limit thấp, scope giới hạn, ngắn hạn</li>
            <li className="flex gap-2"><span className="text-[#6366F1] shrink-0">&bull;</span> Key <strong className="text-white">Mobile App</strong> &mdash; rate limit vừa, chỉ scope TTS & voices</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "how-to-create",
    title: "Cách tạo API Key",
    icon: "+",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <div className="space-y-3">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[11px] font-bold text-[#6366F1] shrink-0">1</span>
            <div>
              <p className="text-white font-medium text-sm">Nhấn nút &quot;Khởi tạo Key mới&quot;</p>
              <p className="text-xs text-[#A1A1AA]">Nằm ở góc trên bên phải của trang này.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[11px] font-bold text-[#6366F1] shrink-0">2</span>
            <div>
              <p className="text-white font-medium text-sm">Đặt tên định danh (Key Name)</p>
              <p className="text-xs text-[#A1A1AA]">Chọn tên gợi nhớ mục đích sử dụng: VD &quot;Production Server&quot;, &quot;CLI Tool&quot;, &quot;Mobile App v2&quot;.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[11px] font-bold text-[#6366F1] shrink-0">3</span>
            <div>
              <p className="text-white font-medium text-sm">Chọn giới hạn truy vấn (Rate Limit)</p>
              <p className="text-xs text-[#A1A1AA]">Số request tối đa mỗi phút. Mặc định: 100 req/min. Chọn phù hợp với nhu cầu.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/30 flex items-center justify-center text-[11px] font-bold text-[#6366F1] shrink-0">4</span>
            <div>
              <p className="text-white font-medium text-sm">Nhấn &quot;Sinh mã&quot; và LƯU NGAY API Key</p>
              <p className="text-xs text-[#A1A1AA]">
                <strong className="text-red-400">Quan trọng:</strong> API Key chỉ hiển thị <u>một lần duy nhất</u> sau khi tạo.
                Hãy sao chép và lưu vào nơi an toàn (password manager, biến môi trường, secrets manager).
                Chúng tôi không lưu trữ key gốc &mdash; chỉ lưu hash để xác thực.
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-red-400 font-bold mb-1">Lưu ý bảo mật</p>
          <p className="text-xs text-red-400">
            Nếu bạn làm mất API Key, <strong>không thể khôi phục</strong>. Bạn phải thu hồi key cũ và tạo key mới.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "key-format",
    title: "Cấu trúc API Key",
    icon: "#",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <p>Mỗi API Key có định dạng:</p>
        <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4 font-mono text-xs overflow-x-auto">
          <code className="text-[#6366F1]">gva_</code><code className="text-[#22C55E]">{`{key_id}`}</code><code>.</code><code className="text-[#F4F4F5]">{`{secret}`}</code>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex gap-2">
            <span className="text-[#6366F1] font-mono shrink-0">gva_</span>
            <span className="text-[#A1A1AA]">Tiền tố cố định, viết tắt của GVoice AI</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#22C55E] font-mono shrink-0">{`{key_id}`}</span>
            <span className="text-[#A1A1AA]">UUID v4 &mdash; định danh duy nhất của key này</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#F4F4F5] font-mono shrink-0">{`{secret}`}</span>
            <span className="text-[#A1A1AA]">32-byte secret được sinh ngẫu nhiên, dùng để xác thực</span>
          </div>
        </div>
        <div className="bg-[#0D100A]/60 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#818CF8] font-medium mb-2">Ví dụ thực tế</p>
          <code className="text-xs font-mono text-[#D4D4D8] break-all">
            gva_a1b2c3d4-e5f6-7890-abcd-ef1234567890.XyZ12-abcDEFghIJKlmnOPqrSTUvwxYZ_1234567890AB
          </code>
        </div>
      </div>
    ),
  },
  {
    id: "client-side",
    title: "Tích hợp Client-side",
    icon: "⚛",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <p>
          Type2Vibe sử dụng kiến trúc <strong className="text-white font-medium">100% Client-side Synthesis</strong>. 
          Văn bản của bạn không bao giờ được gửi lên máy chủ để xử lý, đảm bảo quyền riêng tư tuyệt đối.
        </p>
        <div className="bg-[#0D100A]/60 border border-white/5 rounded-xl p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Quy trình tích hợp</p>
          <ol className="text-xs space-y-3 text-[#A1A1AA]">
            <li className="flex gap-3">
              <span className="text-white font-mono bg-white/10 w-5 h-5 flex items-center justify-center rounded">1</span>
              <div>
                <p className="text-white">Lấy thông tin giọng đọc</p>
                <p>Gọi <code className="text-[#6366F1]">GET /api/tts/voices</code> để nhận danh sách model keys.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-white font-mono bg-white/10 w-5 h-5 flex items-center justify-center rounded">2</span>
              <div>
                <p className="text-white">Tải mô hình (ONNX)</p>
                <p>Sử dụng public URL từ metadata để tải file <code className="text-[#6366F1]">.onnx</code> và <code className="text-[#6366F1] font-mono">.onnx.json</code>.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="text-white font-mono bg-white/10 w-5 h-5 flex items-center justify-center rounded">3</span>
              <div>
                <p className="text-white">Tổng hợp âm thanh</p>
                <p>Sử dụng thư viện <code className="text-white font-mono">@diffusionstudio/piper-wasm</code> trong Web Worker để sinh audio buffer.</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: "authentication",
    title: "Cách xác thực với API",
    icon: "&rarr;",
    content: (
      <div className="space-y-5 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <p>
          API Key được gửi qua HTTP header <code className="text-[#6366F1] bg-[#0D100A]/60 px-1.5 py-0.5 rounded text-xs font-mono">X-API-Key</code>.
          Backend hỗ trợ ba phương thức xác thực:
        </p>

        <div className="space-y-3">
          <h4 className="text-[11px] uppercase tracking-widest text-[#818CF8] font-medium">Phương thức 1: X-API-Key Header (khuyên dùng cho API)</h4>
          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#71717A] mb-3">cURL - Lấy danh sách giọng đọc</p>
            <pre className="text-xs font-mono text-[#D4D4D8] overflow-x-auto"><code>{`curl -X GET \\\n  "https://type2vibe.online/api/tts/voices" \\\n  -H "X-API-Key: gva_YOUR_KEY_ID.YOUR_SECRET"`}</code></pre>
          </div>
          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#71717A] mb-3">Python - Lấy quota sử dụng</p>
            <pre className="text-xs font-mono text-[#D4D4D8] overflow-x-auto"><code>{`import requests

API_KEY = "gva_YOUR_KEY_ID.YOUR_SECRET"
BASE_URL = "https://type2vibe.online/api"

response = requests.get(
    f"{BASE_URL}/quota",
    headers={"X-API-Key": API_KEY}
)

if response.ok:
    print(response.json())
else:
    print(f"Error {response.status_code}: {response.text}")`}</code></pre>
          </div>
          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#71717A] mb-3">JavaScript - Lấy danh sách giọng đọc</p>
            <pre className="text-xs font-mono text-[#D4D4D8] overflow-x-auto"><code>{`const API_KEY = "gva_YOUR_KEY_ID.YOUR_SECRET";
const BASE_URL = "https://type2vibe.online/api";

const response = await fetch(\`\${BASE_URL}/tts/voices\`, {
  headers: { "X-API-Key": API_KEY }
});

if (response.ok) {
  const voices = await response.json();
  console.log(voices);
}`}</code></pre>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[11px] uppercase tracking-widest text-[#A1A1AA] font-medium">Phương thức 2: Bearer Token</h4>
          <p className="text-xs text-[#71717A]">
            Dùng JWT access token nhận được sau khi đăng nhập. Phù hợp cho phiên tương tác ngắn hạn (web app frontend).
          </p>
          <div className="bg-[#0D100A]/80 border border-white/5 rounded-xl p-3">
            <pre className="text-xs font-mono text-[#A1A1AA] overflow-x-auto"><code>{`Authorization: Bearer <access_token>`}</code></pre>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-[11px] uppercase tracking-widest text-[#A1A1AA] font-medium">Phương thức 3: HttpOnly Cookie (Web App)</h4>
          <p className="text-xs text-[#71717A]">
            Dành riêng cho frontend web, tự động gửi cookie session khi gọi API từ cùng origin. Không yêu cầu header bổ sung.
          </p>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-yellow-400 font-bold mb-1">Lưu ý</p>
          <p className="text-xs text-yellow-400">
            Không gửi đồng thời <code className="text-yellow-400 bg-transparent">X-API-Key</code> và <code className="text-yellow-400 bg-transparent">Authorization: Bearer</code> &mdash;
            backend sẽ từ chối với lỗi 400.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "scopes",
    title: "Scopes và Phân quyền",
    icon: "&#9881;",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <p>
          Scopes xác định những endpoint API mà key có quyền truy cập. Mỗi scope tương ứng với một nhóm endpoint cụ thể.
          Key mới mặc định có scope <code className="text-[#6366F1] bg-[#0D100A]/60 px-1.5 py-0.5 rounded text-xs font-mono">models:read,tts:generate</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Scope</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Endpoint</th>
                <th className="py-2 text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Mô tả</th>
              </tr>
            </thead>
            <tbody className="text-[#A1A1AA]">
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">tts:generate</td><td className="py-2 pr-4 font-mono">/api/tts/convert-to-mp3</td><td className="py-2">Các công cụ hỗ trợ audio</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">voices:read</td><td className="py-2 pr-4 font-mono">/api/tts/voices</td><td className="py-2">Đọc metadata giọng đọc cho client-side synthesis</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">voices:read</td><td className="py-2 pr-4 font-mono">/api/voices</td><td className="py-2">Đọc danh sách giọng đọc</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">audio:upload</td><td className="py-2 pr-4 font-mono">/api/audio</td><td className="py-2">Upload file audio</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">library</td><td className="py-2 pr-4 font-mono">/api/library</td><td className="py-2">Quản lý thư viện audio cá nhân</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">dictionary</td><td className="py-2 pr-4 font-mono">/api/dictionary</td><td className="py-2">Quản lý từ điển phát âm</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">quota</td><td className="py-2 pr-4 font-mono">/api/quota</td><td className="py-2">Kiểm tra quota sử dụng</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">subscriptions</td><td className="py-2 pr-4 font-mono">/api/subscriptions</td><td className="py-2">Xem thông tin gói đăng ký</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">auth</td><td className="py-2 pr-4 font-mono">/api/auth</td><td className="py-2">Xác thực và quản lý key</td></tr>
              <tr className="border-b border-white/5"><td className="py-2 pr-4 font-mono text-[#F4F4F5]">admin</td><td className="py-2 pr-4 font-mono">/api/admin</td><td className="py-2">Quyền quản trị hệ thống</td></tr>
              <tr><td className="py-2 pr-4 font-mono text-[#22C55E]">*</td><td className="py-2 pr-4 font-mono text-[#22C55E]">Tất cả</td><td className="py-2 text-[#22C55E]">Toàn quyền truy cập tất cả endpoint</td></tr>
            </tbody>
          </table>
        </div>

        <div className="bg-[#0D100A]/60 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#818CF8] font-medium mb-2">Nguyên tắc phân quyền</p>
          <ul className="text-xs space-y-1.5 text-[#A1A1AA]">
            <li>&bull; Nếu scope của key <strong>không chứa</strong> scope yêu cầu của endpoint &rarr; trả về <span className="text-red-400">401 Invalid API key</span></li>
            <li>&bull; Scope <code className="text-[#22C55E] bg-transparent">*</code> là wildcard &mdash; cho phép truy cập mọi endpoint</li>
            <li>&bull; Các scope cách nhau bằng dấu phẩy: <code className="text-[#D4D4D8] bg-transparent">models:read,tts:generate,voices:read</code></li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: "rate-limit",
    title: "Rate Limit & Quota",
    icon: "&#9889;",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <div className="space-y-3">
          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
            <h4 className="text-[11px] uppercase tracking-widest text-[#818CF8] font-medium mb-2">Rate Limit (Giới hạn tốc độ)</h4>
            <ul className="text-xs space-y-2 text-[#A1A1AA]">
              <li>&bull; Số request tối đa trong một <strong className="text-white">cửa sổ thời gian</strong></li>
              <li>&bull; Mặc định: <strong className="text-white">100 requests / 60 giây</strong></li>
              <li>&bull; Phạm vi tùy chỉnh: <strong className="text-white">10 &ndash; 10,000 requests</strong>, cửa sổ <strong className="text-white">1 &ndash; 3,600 giây</strong></li>
              <li>&bull; Khi vượt quá: backend trả về HTTP <span className="text-yellow-400">429 Too Many Requests</span></li>
            </ul>
          </div>

          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
            <h4 className="text-[11px] uppercase tracking-widest text-[#818CF8] font-medium mb-2">Character Quota (Hạn mức ký tự)</h4>
            <ul className="text-xs space-y-2 text-[#A1A1AA]">
              <li>&bull; Giới hạn tổng số ký tự TTS được xử lý <strong className="text-white">mỗi tháng</strong></li>
              <li>&bull; Phụ thuộc vào <strong className="text-white">gói đăng ký (subscription tier)</strong> của tài khoản</li>
              <li>&bull; Kiểm tra quota hiện tại: <code className="text-[#6366F1] bg-[#0D100A]/60 px-1.5 py-0.5 rounded text-xs font-mono">GET /api/quota</code></li>
            </ul>
          </div>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-yellow-400 font-bold mb-1">Xử lý khi bị giới hạn</p>
          <div className="text-xs text-yellow-400 space-y-1">
            <p>1. Kiểm tra response header để biết thời gian reset</p>
            <p>2. Implement <strong>exponential backoff</strong> trong code của bạn</p>
            <p>3. Nếu cần rate limit cao hơn, tạo key mới với cấu hình phù hợp hoặc nâng cấp gói</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "expiration",
    title: "Thời hạn và Gia hạn",
    icon: "&#9202;",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <div className="space-y-2">
          <p>Mỗi API Key có thời hạn sử dụng cố định, tính từ ngày tạo:</p>
          <ul className="text-xs space-y-2 text-[#A1A1AA]">
            <li>&bull; Mặc định: <strong className="text-white">30 ngày</strong></li>
            <li>&bull; Tùy chỉnh: <strong className="text-white">1 &ndash; 365 ngày</strong></li>
            <li>&bull; Key hết hạn sẽ tự động bị từ chối với lỗi <span className="text-red-400">401 Invalid API key</span></li>
          </ul>
        </div>

        <div className="bg-[#0D100A]/60 border border-white/5 rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#818CF8] font-medium mb-2">Cách gia hạn</p>
          <p className="text-xs text-[#A1A1AA]">
            API Key <strong>không thể gia hạn</strong>. Khi key hết hạn, bạn cần:
          </p>
          <ul className="text-xs space-y-1.5 mt-2 text-[#A1A1AA]">
            <li>1. Tạo một API Key mới</li>
            <li>2. Cập nhật key mới vào ứng dụng của bạn</li>
            <li>3. Thu hồi key cũ (nếu muốn dọn dẹp)</li>
          </ul>
        </div>

        <div className="flex items-center gap-2 bg-[#0D100A]/60 border border-white/5 rounded-xl p-3">
          <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-yellow-400">
            Nên đặt lịch nhắc nhở trước ngày hết hạn để kịp thời tạo key mới, tránh gián đoạn dịch vụ.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Trạng thái</th>
                <th className="py-2 pr-4 text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Mô tả</th>
                <th className="py-2 text-[10px] uppercase tracking-widest text-[#818CF8] font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-[#A1A1AA]">
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4"><span className="text-[#22C55E] font-medium">Active</span></td>
                <td className="py-2 pr-4">Key đang hoạt động bình thường</td>
                <td className="py-2">Không cần làm gì</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4"><span className="text-yellow-400 font-medium">Sắp hết hạn</span></td>
                <td className="py-2 pr-4">Còn dưới 7 ngày</td>
                <td className="py-2">Tạo key mới và cập nhật ứng dụng</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-2 pr-4"><span className="text-red-400 font-medium">Hết hạn</span></td>
                <td className="py-2 pr-4">Đã quá ngày expires_at</td>
                <td className="py-2">Tạo key mới, thu hồi key cũ</td>
              </tr>
              <tr>
                <td className="py-2 pr-4"><span className="text-red-400 font-medium">Revoked</span></td>
                <td className="py-2 pr-4">Đã bị thu hồi thủ công</td>
                <td className="py-2">Tạo key mới nếu cần</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "security",
    title: "Bảo mật & Best Practices",
    icon: "&#128274;",
    content: (
      <div className="space-y-4 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <div className="space-y-3">
          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4 space-y-2">
            <h4 className="text-[11px] uppercase tracking-widest text-[#22C55E] font-bold mb-1">NÊN làm</h4>
            <ul className="text-xs space-y-2 text-[#A1A1AA]">
              <li className="flex gap-2">
                <span className="text-[#22C55E] shrink-0">&#10003;</span>
                Lưu API Key trong <strong className="text-white">biến môi trường</strong> (<code className="text-[#D4D4D8] bg-transparent">.env</code>), không hardcode trong source code
              </li>
              <li className="flex gap-2">
                <span className="text-[#22C55E] shrink-0">&#10003;</span>
                Sử dụng <strong className="text-white">secrets manager</strong> (AWS Secrets Manager, Vault, Doppler) cho production
              </li>
              <li className="flex gap-2">
                <span className="text-[#22C55E] shrink-0">&#10003;</span>
                <strong className="text-white">Phân quyền tối thiểu</strong> (least privilege): mỗi key chỉ nên có scope cần thiết cho mục đích của nó
              </li>
              <li className="flex gap-2">
                <span className="text-[#22C55E] shrink-0">&#10003;</span>
                Đặt <strong className="text-white">rate limit hợp lý</strong> để tránh lạm dụng và bảo vệ quota
              </li>
              <li className="flex gap-2">
                <span className="text-[#22C55E] shrink-0">&#10003;</span>
                <strong className="text-white">Xoay vòng key định kỳ</strong> (VD: mỗi 30 ngày cho production)
              </li>
              <li className="flex gap-2">
                <span className="text-[#22C55E] shrink-0">&#10003;</span>
                Thêm <code className="text-[#D4D4D8] bg-transparent">.env</code> vào <code className="text-[#D4D4D8] bg-transparent">.gitignore</code> &mdash; không bao giờ commit API Key lên git
              </li>
            </ul>
          </div>

          <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4 space-y-2">
            <h4 className="text-[11px] uppercase tracking-widest text-red-400 font-bold mb-1">KHÔNG NÊN làm</h4>
            <ul className="text-xs space-y-2 text-[#A1A1AA]">
              <li className="flex gap-2">
                <span className="text-red-400 shrink-0">&#10007;</span>
                KHÔNG hardcode API Key trong source code, đặc biệt là code public trên GitHub
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 shrink-0">&#10007;</span>
                KHÔNG chia sẻ API Key qua email, chat, hay bất kỳ kênh không mã hóa nào
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 shrink-0">&#10007;</span>
                KHÔNG sử dụng chung một key cho tất cả môi trường (dev, staging, production)
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 shrink-0">&#10007;</span>
                KHÔNG embed API Key trực tiếp vào mobile app hoặc frontend code
              </li>
            </ul>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-[11px] uppercase tracking-widest text-red-400 font-bold mb-1">Nếu Key bị lộ</h4>
            <ol className="text-xs space-y-1.5 text-red-400">
              <li>1. Vào trang API Keys &rarr; nhấn <strong>Thu hồi</strong> key bị lộ <strong>NGAY LẬP TỨC</strong></li>
              <li>2. Tạo key mới và cập nhật ứng dụng</li>
              <li>3. Kiểm tra audit log xem key bị lộ đã bị lạm dụng chưa</li>
              <li>4. Nếu key bị commit lên GitHub, xem hướng dẫn xóa secret khỏi git history của GitHub</li>
            </ol>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "troubleshooting",
    title: "Khắc phục lỗi thường gặp",
    icon: "!",
    content: (
      <div className="space-y-3 text-[#D4D4D8] font-light leading-relaxed text-sm">
        <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-red-400 font-bold mb-2">401 Unauthorized</h4>
          <ul className="text-xs space-y-1.5 text-[#A1A1AA]">
            <li>&bull; <strong className="text-white">Nguyên nhân:</strong> Key không tồn tại, sai định dạng, đã hết hạn, hoặc đã bị thu hồi</li>
            <li>&bull; <strong className="text-white">Khắc phục:</strong> Kiểm tra lại key đã sao chép đầy đủ chưa (bao gồm tiền tố <code className="text-[#D4D4D8] bg-transparent">gva_</code>). Xác nhận key chưa hết hạn</li>
          </ul>
        </div>

        <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-yellow-400 font-bold mb-2">429 Too Many Requests</h4>
          <ul className="text-xs space-y-1.5 text-[#A1A1AA]">
            <li>&bull; <strong className="text-white">Nguyên nhân:</strong> Đã vượt quá rate limit của key trong cửa sổ thời gian</li>
            <li>&bull; <strong className="text-white">Khắc phục:</strong> Chờ hết cửa sổ hiện tại, hoặc implement retry với exponential backoff. Có thể tạo key mới với rate limit cao hơn</li>
          </ul>
        </div>

        <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-yellow-400 font-bold mb-2">400 Bad Request (khi gửi cả X-API-Key và Bearer)</h4>
          <ul className="text-xs space-y-1.5 text-[#A1A1AA]">
            <li>&bull; <strong className="text-white">Nguyên nhân:</strong> Gửi đồng thời <code className="text-[#D4D4D8] bg-transparent">X-API-Key</code> và <code className="text-[#D4D4D8] bg-transparent">Authorization: Bearer</code></li>
            <li>&bull; <strong className="text-white">Khắc phục:</strong> Chỉ gửi MỘT trong hai phương thức xác thực</li>
          </ul>
        </div>

        <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-red-400 font-bold mb-2">Key không truy cập được một endpoint cụ thể</h4>
          <ul className="text-xs space-y-1.5 text-[#A1A1AA]">
            <li>&bull; <strong className="text-white">Nguyên nhân:</strong> Scope của key không bao gồm quyền cần thiết cho endpoint đó</li>
            <li>&bull; <strong className="text-white">Khắc phục:</strong> Kiểm tra scope của key, tạo key mới với scope phù hợp</li>
          </ul>
        </div>

        <div className="bg-[#0D100A]/80 border border-white/10 rounded-xl p-4">
          <h4 className="text-[11px] uppercase tracking-widest text-red-400 font-bold mb-2">Không tìm thấy Key ID trong danh sách</h4>
          <ul className="text-xs space-y-1.5 text-[#A1A1AA]">
            <li>&bull; <strong className="text-white">Nguyên nhân:</strong> Danh sách chỉ hiển thị key đang active của tài khoản hiện tại</li>
            <li>&bull; <strong className="text-white">Khắc phục:</strong> Đảm bảo bạn đang đăng nhập đúng tài khoản. Key đã bị thu hồi sẽ không xuất hiện</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export function ApiKeyGuide() {
  const t = useT();
  const [expanded, setExpanded] = useState<string | null>("what-is");

  const toggleSection = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <FadeIn delay={0.15}>
      <div className="aether-glass-wrapper rounded-[20px] mb-8">
        <div className="aether-glass p-6 md:p-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.3em] text-[#6366F1] flex items-center gap-3">
              <span className="w-6 h-[1px] bg-[#6366F1]/50"></span>
              {t.apiKeys.guideHeading}
            </h2>
            <span className="text-[9px] uppercase tracking-widest font-medium text-[#A1A1AA] bg-white/5 rounded-full px-2.5 py-0.5 border border-white/5">
              {t.apiKeys.guideTopicCount.replace("{n}", String(sections.length))}
            </span>
          </div>
          <p className="text-xs font-light text-[#71717A] mb-6">
            {t.apiKeys.guideDesc}
          </p>

          <div className="space-y-2">
            {sections.map((section) => {
              const isOpen = expanded === section.id;
              return (
                <motion.div
                  key={section.id}
                  layout
                  className={`border rounded-xl transition-colors duration-200 ${
                    isOpen
                      ? "border-[#6366F1]/30 bg-white/[0.02]"
                      : "border-white/5 hover:border-white/10 hover:bg-white/[0.01]"
                  }`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-3 p-4 md:p-5 text-left group"
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-200 ${
                        isOpen
                          ? "bg-[#6366F1]/20 text-[#6366F1]"
                          : "bg-white/5 text-[#A1A1AA] group-hover:bg-white/10 group-hover:text-[#D4D4D8]"
                      }`}
                    >
                      {section.id === "security" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                      ) : section.id === "troubleshooting" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                      ) : section.id === "expiration" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : section.id === "rate-limit" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                      ) : section.id === "what-is" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
                      ) : section.id === "scopes" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      ) : section.id === "how-to-create" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      ) : section.id === "key-format" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                      ) : section.id === "authentication" ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                      ) : (
                        <span>{section.id === "what-is" ? "?" : section.id === "how-to-create" ? "+" : section.id === "key-format" ? "#" : section.id === "authentication" ? "→" : section.id === "scopes" ? "⚙" : section.id === "rate-limit" ? "⚡" : section.id === "expiration" ? "⏲" : section.id === "troubleshooting" ? "!" : ""}</span>
                      )}
                    </span>
                    <span className={`text-sm font-medium flex-1 text-left transition-colors ${isOpen ? "text-white" : "text-[#D4D4D8]"}`}>
                      {((t.apiKeys as any).guide as Record<string, string>)[section.id] || section.title}
                    </span>
                    <motion.svg
                      className="w-4 h-4 text-[#71717A] shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </motion.svg>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 md:px-5 pb-5 pt-0">
                          <div className="border-t border-white/5 pt-5">
                            {section.content}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
