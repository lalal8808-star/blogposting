import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentState } from "./state";
import { tools } from "./tools/search";
import { researcherNode } from "./nodes/researcher";
import { factCheckerNode } from "./nodes/fact-checker";
import { writerNode } from "./nodes/writer";

// 1. 상태 객체 스키마 기반의 그래프 초기화
const graphBuilder: any = new StateGraph<AgentState>({
  channels: {
    messages: {
      value: (x: any[], y: any[]) => x.concat(y),
      default: () => [],
    },
    topic: null as any,
    researchData: {
      value: (x: string[], y: string[]) => x.concat(y),
      default: () => [],
    },
    searchQueries: {
      value: (x: string[], y: string[]) => x.concat(y),
      default: () => [],
    },
    factCheckResult: null as any,
    researchDepth: null as any,
    maxResearchDepth: null as any,
    finalPost: null as any,
    status: null as any,
  }
} as any); // Type error 무시를 위한 우회

// 2. 도구 노드 추가 (Tavily Search)
const toolNode = new ToolNode(tools);

// 3. 노드 등록
graphBuilder
  .addNode("researcher", researcherNode)
  .addNode("tools", toolNode)
  .addNode("fact_checker", factCheckerNode)
  .addNode("writer", writerNode);

// 4. 조건부 엣지 로직
// 리서처 이후: 도구를 써야하면 도구로, 아니면 팩트체커로
function afterResearcher(state: AgentState): "tools" | "fact_checker" {
  const lastMsg = state.messages[state.messages.length - 1];
  if ("tool_calls" in lastMsg && Array.isArray(lastMsg.tool_calls) && lastMsg.tool_calls.length > 0) {
    return "tools";
  }
  return "fact_checker";
}

// 팩트체커 이후: 통과 혹은 최대횟수 초과 시 라이터로, 아니면 다시 리서처로
function afterFactChecker(state: AgentState): "writer" | "researcher" {
  if (state.factCheckResult?.passed) {
    return "writer";
  }
  if (state.researchDepth >= state.maxResearchDepth) {
    console.warn(`최대 리서치 깊이(${state.maxResearchDepth}) 초과. 강제로 라이터에게 전달합니다.`);
    return "writer";
  }
  return "researcher";
}

// 5. 엣지 연결 (파이프라인 흐름 정의)
graphBuilder
  .addEdge(START, "researcher")
  
  .addConditionalEdges("researcher", afterResearcher)
  .addEdge("tools", "researcher") // 도구 사용 후엔 다시 리서처에게 결과 반환
  
  .addConditionalEdges("fact_checker", afterFactChecker)
  
  .addEdge("writer", END);

// 메모리 세이버를 통해 그래프 상태 보존 (선택사항)
const checkpointer = new MemorySaver();

// 6. 그래프 컴파일
export const autoBloggerGraph = graphBuilder.compile({ checkpointer });
