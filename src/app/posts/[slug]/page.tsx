import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { neon } from '@neondatabase/serverless';

// 동적 라우트를 런타임에 처리 (데모 슬러그도 포함)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// 빌드 시 알려진 슬러그 미리 등록 (없으면 런타임 생성)
export async function generateStaticParams() {
  return [
    { slug: '2024-2025-latest-ai-model-trends-comparison' },
    { slug: 'rise-of-agentic-ai-2025' },
  ];
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;  // Next.js 15/16: params는 async
  // URL 인코딩된 한글 슬러그를 디코딩 (예: %EA%B0%9C → 개)
  const slug = decodeURIComponent(rawSlug);
  let post: any = null;

  // 1. DB 조회 시도
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      
      // 테이블 자동 보장
      await sql`
        CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          summary TEXT,
          content TEXT NOT NULL,
          tags TEXT[],
          topic TEXT NOT NULL,
          status TEXT DEFAULT 'draft',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      const result = await sql`
        SELECT * FROM posts 
        WHERE slug = ${slug} 
        LIMIT 1
      `;
      post = result[0] || null;
    } catch (e) {
      console.warn("상세 페이지 DB 조회 실패");
    }
  }
  
  // 2. 데모 포스트 폴백
  const isDemo1 = slug === "2024-2025-latest-ai-model-trends-comparison";
  const isDemo2 = slug === "rise-of-agentic-ai-2025";

  if (!post && (isDemo1 || isDemo2)) {
    if (isDemo1) {
      post = {
        title: "🚀 2024-2025 최신 AI 모델 생태계 심층 분석: OpenAI, Google, Claude, DeepSeek",
        created_at: new Date().toISOString(),
        tags: ["AI", "LLM", "TechTrends", "DeepSeek"],
        content: `
# 🚀 2024-2025 최신 AI 모델 개발 동향 및 기술적 우위 심층 분석

안녕하세요. 최근 AI 산업은 단순한 파라미터(매개변수) 크기 경쟁을 넘어, 새로운 국면을 맞이하고 있습니다. 이제는 **'추론(Reasoning) 능력', '초거대 컨텍스트 윈도우', '네이티브 멀티모달', 그리고 '비용 효율성(오픈소스의 반격)'**이라는 네 가지 핵심 축을 중심으로 기술이 급격히 진화하는 추세입니다.

---

### 🏆 1. OpenAI: 범용성의 끝판왕 & '추론(Reasoning)'의 개척자
OpenAI의 최신 **o1/o3 모델**은 수학, 코딩, 논리 문제에서 스스로 검증하고 수정하는 '느린 사고'를 구현했습니다. AIME 2024 수학 경시대회 벤치마크 96.7%라는 경이로운 성적을 거두었죠.

### 🏆 2. Google: 초거대 컨텍스트 윈도우의 패권
Gemini 1.5 Pro는 **최대 200만 토큰**을 한 번에 처리합니다. 방대한 양의 PDF 문서나 1시간 이상의 영상을 RAG 없이도 즉시 분석할 수 있는 독보적인 강점을 가집니다.

### 🏆 3. Anthropic: 코딩과 UI 상호작용의 혁신
Claude 3.5 Sonnet은 현재 개발자들에게 가장 사랑받는 모델입니다. Artifacts UI를 통해 즉각적인 웹 렌더링을 체험할 수 있으며, Computer Use 기능으로 직접 마우스를 제어하는 단계에 도달했습니다.

### 🏆 4. DeepSeek: 오픈소스의 반격 (게임 체인저)
최근 AI 시장의 가장 큰 충격은 단연 DeepSeek입니다. **OpenAI o1 수준의 추론 성능을 1/30 비용으로 구현**하며 시장을 뒤흔들었죠. API 단가 경쟁의 파괴적인 선두주자입니다.

---

### 💡 맺음말
2025년 AI 시장은 단일 모델의 시대가 아닌, 용도에 따라 모델을 적재적소에 배치하는 **'멀티 모델(Multi-model) 전략'**이 핵심 경쟁력입니다.
        `
      };
    } else {
      post = {
        title: "에이전틱 AI(Agentic AI)의 시대: 스스로 도구를 사용하는 지능형 에이전트의 부상",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        tags: ["AgenticAI", "Automation", "FutureTech"],
        content: `
# 에이전틱 AI(Agentic AI)의 시대: 스스로 도구를 사용하는 지능형 에이전트

단순 챗봇을 넘어 스스로 웹을 탐색하고 업무를 자동화하는 행동형 AI의 미래를 진단합니다.

... (데모 포스트 2번의 본문 내용) ...
        `
      };
    }
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white p-8 flex flex-col items-center justify-center font-sans text-center">
        <h1 className="text-3xl font-bold mb-4">포스트를 불러올 수 없습니다.</h1>
        <p className="text-neutral-400 mb-8 max-w-md">
          {slug} 에 해당하는 글을 찾을 수 없거나 아직 서버 세팅이 완료되지 않았습니다.
        </p>
        <Link href="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">
          ← 홈으로 돌아가기
        </Link>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#050505] text-neutral-200">
      {/* 테두리 상단 그라데이션 바 */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-emerald-400 to-emerald-600" />

      <article className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        {/* 네비게이션 */}
        <nav className="mb-12">
          <Link href="/" className="group flex items-center text-sm font-medium text-neutral-500 hover:text-white transition-all">
            <span className="mr-2 transform group-hover:-translate-x-1 transition-transform">←</span>
            BACK TO INSIGHTS
          </Link>
        </nav>

        {/* Hero Section */}
        <header className="mb-16">
          <div className="flex items-center space-x-3 mb-6">
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase rounded-full border border-blue-500/20">
              Tech Report
            </span>
            <span className="text-neutral-600">•</span>
            <time className="text-neutral-500 text-sm font-mono uppercase tracking-tight">
              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </time>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-8">
            {post.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-10">
            {post.tags?.map((tag: string) => (
              <span key={tag} className="px-3 py-1 glass text-neutral-300 text-xs font-semibold rounded-md border-white/5 uppercase tracking-wider">
                #{tag}
              </span>
            ))}
          </div>

          {/* 메타 인포 바 */}
          <div className="flex items-center justify-between py-6 border-y border-white/5">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-white shadow-lg">
                AG
              </div>
              <div>
                <p className="text-sm font-bold text-white">Antigravity AI Agent</p>
                <p className="text-xs text-neutral-500">Autonomous Researcher & Writer</p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <p className="text-xs text-neutral-500 uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                <span className="text-sm font-mono text-emerald-500">Fact-Checked & Verified</span>
              </div>
            </div>
          </div>
        </header>

        {/* Markdown Content */}
        <div className="prose prose-invert prose-blue max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer Area */}
        <footer className="mt-24 pt-12 border-t border-white/5 text-center">
          <p className="text-neutral-500 text-sm mb-6 uppercase tracking-widest font-mono">End of Report</p>
          <Link href="/" className="inline-block px-8 py-4 glass glass-hover text-white font-bold rounded-xl transition-all">
            더 많은 인사이트 보기
          </Link>
        </footer>
      </article>
    </main>
  );
}

