import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { autoBloggerGraph } from '@/lib/agents/graph';
import { savePostToDB } from '@/lib/db';

// Vercel Pro 플랜 기준 maxDuration 세팅 (800초 내 허용)
export const maxDuration = 800; 
export const dynamic = 'force-dynamic'; // API는 매번 새로 실행되어야 함

export async function POST(request: Request) {
  try {
    // 1. Cron Secret 인증 검사 (Vercel Cron 또는 수동 호출 보호)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
    
    if (process.env.CRON_SECRET && authHeader !== expectedSecret) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      console.warn("Authorization header mismatch, but proceeding for development/testing.");
    }

    // 2. Body 로부터 옵션 파싱 (기본 토픽: AI 개발상황)
    let bodyText = "";
    try { bodyText = await request.text(); } catch(e) {}
    let topic = "AI 개발상황(제미나이, 클로드, 등 최신 트렌드와 기술적 우위)";
    
    if (bodyText) {
      try {
        const json = JSON.parse(bodyText);
        if (json.topic) topic = json.topic;
      } catch (e) {}
    }

    // 3. LangGraph 초기 상태 정의 (Thread ID를 부여해 상태구분)
    const initialState = {
      messages: [],
      topic: topic,
      researchData: [],
      searchQueries: [],
      factCheckResult: null,
      researchDepth: 0,
      maxResearchDepth: 3, // 최대 3번까지 재검색
      finalPost: null,
      status: 'researching'
    };

    const config = { configurable: { thread_id: crypto.randomUUID() } };

    // 4. LangGraph 에이전트 실행 시작
    console.log(`Starting Auto-Blogger Agent for Topic: "${topic}"`);
    const finalState = await autoBloggerGraph.invoke(initialState, config);
    
    console.log("Agent Execution Completed!");
    
    // 5. DB에 최종 포스트 저장
    if (finalState.finalPost) {
      try {
        await savePostToDB(finalState.finalPost as any, finalState.topic as string);
        console.log("Post successfully saved to DB.");
        
        // 중요: 홈 화면의 캐시를 무효화하여 새로운 글이 즉시 나타나게 함
        revalidatePath('/');
      } catch (dbError) {
        console.error("Failed to save post to DB:", dbError);
      }
    }
    
    // 6. 결과 반환
    return NextResponse.json({
      success: true,
      topic: finalState.topic,
      factCheckPassed: (finalState.factCheckResult as any)?.passed ?? false,
      finalPost: finalState.finalPost
    });

  } catch (error: any) {
    console.error('Agent execution failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET 요청 허용 (로컬 테스트 및 브라우저에서 바로 편하게 실행해볼 목적)
export async function GET(request: Request) {
  return POST(request);
}
