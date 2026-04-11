import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";
import { WRITER_PROMPT } from "../prompts";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  temperature: 0.7,
});

// JSON 코드블럭 또는 순수 JSON에서 포스트 객체를 추출하는 강건한 파서
function extractPostFromResponse(raw: string): any | null {
  // 1순위: ```json ... ``` 코드블럭 추출
  const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch {}
  }

  // 2순위: 중괄호로 감싼 JSON 직접 추출
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }

  return null;
}

export async function writerNode(state: AgentState): Promise<Partial<AgentState>> {
  const verifiedContent = state.messages
    .filter(m => m instanceof AIMessage && m.content)
    .map(m => m.content)
    .join('\n\n');

  const outputFormat = `
반드시 아래 JSON 형식으로만 응답하세요 (마크다운 코드블럭 포함):
\`\`\`json
{
  "title": "블로그 포스트 제목",
  "slug": "english-only-slug-with-hyphens",
  "summary": "1~2줄 요약",
  "tags": ["태그1", "태그2", "태그3"],
  "content": "# 제목\\n\\n마크다운 본문 전체..."
}
\`\`\`
슬러그는 반드시 영문 소문자와 하이픈만 사용하세요.`;

  const messages = [
    new SystemMessage(WRITER_PROMPT),
    new HumanMessage(
      `다음 검증된 자료를 바탕으로 최고의 기술 블로그 포스트를 작성하세요.\n\n${verifiedContent}\n\n${outputFormat}`
    )
  ];

  const response = await llm.invoke(messages);
  const rawText = response.content as string;

  // 강건한 파싱 시도
  const parsed = extractPostFromResponse(rawText);

  if (parsed && parsed.title && parsed.content) {
    // 슬러그 안전 처리 (만약 한글이 섞여 있어도 강제 변환)
    const safeSlug = (parsed.slug || parsed.title)
      .toLowerCase()
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    return {
      messages: [response],
      finalPost: {
        title: parsed.title,
        slug: safeSlug,
        summary: parsed.summary || '',
        tags: parsed.tags || [],
        content: parsed.content,
      },
      status: 'completed'
    };
  }

  // 최후 폴백: 파싱 완전 실패 시 본문 전체를 마크다운으로 저장
  console.error("Writer JSON parsing failed, using raw text as content");
  const fallbackSlug = state.topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 60);

  return {
    messages: [response],
    finalPost: {
      title: state.topic,
      slug: `${fallbackSlug}-${Date.now()}`,
      content: rawText,
      summary: "AI가 작성한 기술 블로그 포스트입니다.",
      tags: ["AI", "Tech", "2026"],
    },
    status: 'completed'
  };
}
