import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto-Tech Blogger | AI-Driven Tech Insights",
  description: "Gemini 3.1 Pro와 LangGraph 기반으로 자율적으로 리서치하고 발행되는 프리미엄 지능형 기술 블로그입니다.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark scroll-smooth">
      <body className="bg-[#050505] text-white selection:bg-blue-500/30">
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-600/10 blur-[100px] rounded-full" />
        </div>
        
        {children}
      </body>
    </html>
  );
}
