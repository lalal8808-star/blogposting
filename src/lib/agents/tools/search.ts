import { TavilySearch } from "@langchain/tavily";

// Tavily 검색 도구 초기화
export const searchTool = new TavilySearch({
  maxResults: 5,
});

export const tools = [searchTool];
