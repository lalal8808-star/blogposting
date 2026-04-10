import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// 진단용 API - DB 실제 상태를 확인합니다
export const dynamic = 'force-dynamic';

export async function GET() {
  const result: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Connected' : '❌ NOT SET',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ NOT SET',
      TAVILY_API_KEY: process.env.TAVILY_API_KEY ? '✅ Set' : '❌ NOT SET',
    },
    db: null,
  };

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(result);
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // 테이블 존재 여부 확인
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    // posts 테이블이 있으면 데이터 조회
    const hasPosts = tables.some((t: any) => t.table_name === 'posts');
    let posts: any[] = [];
    
    if (hasPosts) {
      posts = await sql`SELECT id, title, slug, status, created_at FROM posts ORDER BY created_at DESC LIMIT 20`;
    }

    result.db = {
      tables: tables.map((t: any) => t.table_name),
      has_posts_table: hasPosts,
      post_count: posts.length,
      posts: posts,
    };
  } catch (err: any) {
    result.db = { error: err.message };
  }

  return NextResponse.json(result, { status: 200 });
}
