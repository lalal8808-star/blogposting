import { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  topic: string;
  researchData: string[];
  searchQueries: string[];
  factCheckResult: {
    passed: boolean;
    feedback: string;
    issues: string[];
  } | null;
  researchDepth: number;
  maxResearchDepth: number;
  finalPost: {
    title: string;
    slug: string;
    content: string;
    summary: string;
    tags: string[];
  } | null;
  status: 'researching' | 'fact-checking' | 'writing' | 'completed' | 'failed';
}
