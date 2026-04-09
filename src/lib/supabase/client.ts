import { createClient } from "@supabase/supabase-js";

// 서버 및 클라이언트에서 공용으로 사용할 Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy-url.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy_key";

export const supabase = createClient(supabaseUrl, supabaseKey);

// DB 에 새 포스트 저장하는 헬퍼 함수
export async function savePostToDB(post: any, topic: string) {
  if (supabaseUrl === "https://dummy-url.supabase.co") {
    console.warn("Supabase 환경 변수가 설정되지 않아서 DB에 반영하지 고 콘솔에만 출력합니다.");
    return false;
  }
  
  const { data, error } = await supabase.from('posts').insert([
    {
      title: post.title,
      slug: post.slug,
      content: post.content,
      summary: post.summary,
      tags: post.tags,
      topic: topic,
      status: 'published' // 자동 생성 직후 바로 발행 (또는 draft)
    }
  ]);
  
  if (error) {
    console.error("Supabase Post 저장 실패:", error);
    throw error;
  }
  
  return true;
}
