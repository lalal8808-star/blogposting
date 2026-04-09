import { neon } from '@neondatabase/serverless';

// DB에 새 포스트 저장하는 헬퍼 함수
export async function savePostToDB(post: any, topic: string) {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL 환경 변수가 설정되지 않아서 DB에 반영하지 않고 콘솔에만 출력합니다.");
    return false;
  }
  
  // Neon 서버리스 커넥션 생성
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const result = await sql`
      INSERT INTO posts (title, slug, content, summary, tags, topic, status)
      VALUES (
        ${post.title}, 
        ${post.slug}, 
        ${post.content}, 
        ${post.summary}, 
        ${post.tags ? `{${post.tags.join(',')}}` : '{}'}, 
        ${topic}, 
        'published'
      )
      RETURNING *;
    `;
    
    return result.length > 0;

  } catch (error) {
    console.error("Neon Postgres Post 저장 실패:", error);
    throw error;
  }
}
