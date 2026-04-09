import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";
import { tools } from "../tools/search";
import { RESEARCHER_PROMPT } from "../prompts";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.1-pro-preview",
  temperature: 0.2,
}).bindTools(tools);

export async function researcherNode(state: AgentState): Promise<Partial<AgentState>> {
  // 1. 메시지 구성 (Gemini 턴 최적화)
  // state.messages에는 순수한 [User] -> [AI] -> [Tool] 시퀀스만 남깁니다.
  // SystemMessage는 호출 시점에만 맨 앞에 붙여서 전달합니다.
  let chatHistory = state.messages;
  
  if (chatHistory.length === 0) {
    // 최초 실행: 첫 번째는 반드시 HumanMessage여야 함
    chatHistory = [
      new HumanMessage(`${state.topic} 주제에 대해 최신 기술 자료를 조사하고 마크다운 작성을 시작해 주세요.`)
    ];
  }

  // 실제 모델에 보낼 때는 [System] + [Clean Chat History]
  const inputMessages = [
    new SystemMessage(RESEARCHER_PROMPT),
    ...chatHistory
  ];

  // 2. 모델 호출
  const response = await llm.invoke(inputMessages);
  
  // 3. 상태 업데이트
  // chatHistory가 새로 생성된 것이라면(최초) 해당 HumanMessage와 response를 모두 반환
  // 이미 진행 중이라면 새로 생성된 response만 반환 (LangGraph가 누적)
  const isFirstRun = state.messages.length === 0;
  return {
    messages: isFirstRun ? [chatHistory[0], response] : [response],
    researchDepth: (state.researchDepth || 0) + 1,
    status: (response.tool_calls && response.tool_calls.length > 0) ? 'researching' : 'fact-checking'
  };
}
