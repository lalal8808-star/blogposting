import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";
import { WRITER_PROMPT } from "../prompts";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

// 출력 구조를 강제하여 파싱하기 쉽도록 설정
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    title: z.string().describe("블로그 포스트 제목"),
    slug: z.string().describe("URL 에 사용될 영문 슬러그 (소문자와 하이픈만 사용)"),
    summary: z.string().describe("포스트에 대한 1~2줄 요약"),
    tags: z.array(z.string()).describe("관련 태그 3~5개"),
    content: z.string().describe("마크다운 형식의 블로그 본문. 출처 링크 포함."),
  })
);

const formatInstructions = parser.getFormatInstructions();

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  temperature: 0.7, // 창의적인 글쓰기를 위해 약간 높임
});

export async function writerNode(state: AgentState): Promise<Partial<AgentState>> {
  // 이전 메시지 중 리서처의 최종 결과와 팩트체커의 확인 내역을 취합
  const verifiedContent = state.messages
    .filter(m => m instanceof AIMessage && m.content)
    .map(m => m.content)
    .join('\n\n');

  const messages = [
    new SystemMessage(WRITER_PROMPT),
    new HumanMessage(`다음 검증된 자료를 바탕으로 최고의 기술 블로그 포스트를 작성하세요.\n\n${verifiedContent}\n\n${formatInstructions}`)
  ];

  const response = await llm.invoke(messages);
  
  try {
    const parsedObj = await parser.parse(response.content as string);
    return {
      messages: [response],
      finalPost: parsedObj,
      status: 'completed'
    };
  } catch (error) {
    console.error("Writer output parsing failed", error);
    // 폴백: JSON 파싱에 실패했을 경우 텍스트 전체를 content 스키마에 우겨넣어서라도 저장
    return {
      messages: [response],
      finalPost: {
        title: state.topic,
        slug: state.topic.replace(/\s+/g, '-').toLowerCase(),
        content: response.content as string,
        summary: "작성된 컨텐츠 요약 추출 오류 발생.",
        tags: ["AI", "Tech"],
      },
      status: 'completed'
    };
  }
}
