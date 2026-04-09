import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";
import { FACTCHECKER_PROMPT } from "../prompts";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  temperature: 0, // 팩트체커는 절대적 정확성 필요
});

export async function factCheckerNode(state: AgentState): Promise<Partial<AgentState>> {
  // 리서처가 생성한 모든 메시지 텍스트를 모아서 검증 데이터로 활용
  const researchContent = state.messages
    .filter(m => m instanceof AIMessage && m.content)
    .map(m => m.content)
    .join('\n\n');

  const messages = [
    new SystemMessage(FACTCHECKER_PROMPT),
    new HumanMessage(`아래는 리서처가 수집하고 정리한 자료입니다. 엄격하게 팩트체크해 주세요. 
    만약 검증을 통과한다면 'PASS' 라는 단어를 첫 줄에 포함시키고, 오류나 부족한 점이 있다면 피드백을 제공하세요.
    \n\n--- 자료 ---\n${researchContent}`)
  ];

  const response = await llm.invoke(messages);
  const content = response.content as string;
  
  const passed = content.toUpperCase().includes("PASS");

  return {
    messages: [response],
    factCheckResult: {
      passed,
      feedback: content,
      issues: passed ? [] : ["신뢰성/정확성 부족 (피드백 참조)"]
    },
    status: passed ? 'writing' : 'researching' // 실패 시 다시 리서처로 보낼 상태
  };
}
