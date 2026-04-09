import Link from 'next/link';
import { neon } from '@neondatabase/serverless';
import RunButton from '@/components/RunButton';

// 블로그 메인 화면: DB가 아직 없을 경우를 대비한 폴백 데이터와 함께 렌더링
export default async function Home() {
  let posts: any[] = [];
  
  // 1. Neon DB 연결 시도 (DATABASE_URL이 있을 때만)
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      posts = await sql`
        SELECT * FROM posts 
        WHERE status = 'published' 
        ORDER BY created_at DESC
      `;
    } catch (dbError) {
      console.warn("Neon DB 연결 실패, 로컬 데모 모드로 전환합니다.");
    }
  }

  // 2. DB에 데이터가 없거나 연결되지 않았을 때 보여줄 화려한 데모 포스트 (사용자가 방금 확인한 내용 기반)
  if (posts.length === 0) {
    posts = [
      {
        id: 'demo-1',
        title: "🚀 2024-2025 최신 AI 모델 생태계 심층 분석: OpenAI, Google, Claude, DeepSeek",
        slug: "2024-2025-latest-ai-model-trends-comparison",
        summary: "글로벌 AI 시장을 주도하는 4대 핵심 모델의 최신 기술 동향, 추론 능력, 비용 효율성을 팩트체크 기반으로 심층 분석합니다.",
        tags: ["AI", "LLM", "TechTrends", "DeepSeek"],
        created_at: new Date().toISOString(),
        status: 'published'
      },
      {
        id: 'demo-2',
        title: "에이전틱 AI(Agentic AI)의 시대: 스스로 도구를 사용하는 지능형 에이전트의 부상",
        slug: "rise-of-agentic-ai-2025",
        summary: "단순 챗봇을 넘어 스스로 웹을 탐색하고 업무를 자동화하는 행동형 AI의 미래를 진단합니다.",
        tags: ["AgenticAI", "Automation", "FutureTech"],
        created_at: new Date(Date.now() - 86400000).toISOString(),
        status: 'published'
      }
    ];
  }


  return (
    <main className="min-h-screen bg-neutral-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 mt-8 flex justify-between items-end border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 font-mono italic">
              Auto-Tech Blogger AI
            </h1>
            <p className="text-neutral-400 mt-2">
              Gemini 3.1 Pro & LangGraph 기반 지능형 기술 블로그
            </p>
          </div>
          
          <RunButton />
        </header>


        <section className="space-y-8">
          {posts && posts.length > 0 ? (
            posts.map(post => (
              <article key={post.id} className="group p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition duration-300 shadow-lg">
                <Link href={`/posts/${post.slug}`}>
                  <h2 className="text-2xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-neutral-300 leading-relaxed max-w-3xl">
                    {post.summary}
                  </p>
                  
                  <div className="mt-6 flex flex-wrap gap-2">
                    {post.tags?.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-neutral-800 text-xs text-neutral-300 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-6 text-sm text-neutral-500 font-mono">
                    {new Date(post.created_at).toLocaleDateString()} 에 AI가 발행함
                  </div>
                </Link>
              </article>
            ))
          ) : (
            <div className="py-20 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-900/30">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">작성된 포스트가 없습니다.</h3>
              <p className="text-neutral-400 max-w-sm mx-auto">
                우측 상단의 "수동 파이프라인 실행" 버튼을 눌러 첫 번째 AI 리서치 글을 작성해보세요. (약 1분~3분 소요)
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
