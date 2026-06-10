export interface ResearchProjectShort {
  id: string;
  industry: string;
  theme: string;
  isExpertReviewed: boolean;
  hasV1_1: boolean;
  hasV2: boolean;
}

export interface FrameworkDraft {
  domestic: string;
  foreign: string;
  comparison: string;
  dimensions: Array<{ dimension: string; scope: string; metrics: string }>;
  formula: string;
  dataAcquisition: Array<{ id: string; name: string; desc: string; logic: string; source: string }>;
}

export interface SkillItem {
  id: string;
  name: string;
  category: "industry" | "subject";
  owner: string;
  version: string;
  problemSolved: string;
  triggers: string;
  scenario: string;
  steps: string;
  metrics: string;
  sources: string;
  outputRequirements: string;
  markdown: string;
}

export interface MonitoringSignal {
  id: string;
  category: "news" | "policy" | "report" | "social" | "data" | "competitor" | "feedback";
  source: string;
  title: string;
  content: string;
  timestamp: string;
  severity: "high" | "medium" | "low";
  implications: string;
  status: "pending" | "applied" | "ignored";
}

export interface OptimizationTarget {
  id: string;
  title: string;
  description: string;
  skillMatches: string[];
  confirmed: boolean;
}

export interface OperationEvent {
  id: string;
  title: string;
  category: string;
  content: string;
  relatedSkill: string;
  time: string;
  pushStatus: "draft" | "sent";
  stancePro: string;
  stanceCon: string;
}

export interface CatalystItem {
  id: string;
  name: string;
  value: string;
  threshold: string;
  status: "met" | "pending";
  triggeredDate: string;
}

export interface FactorItem {
  id: string;
  sector: string;
  name: string;
  weight: string;
  value: string;
  momentum: string;
  updateDate: string;
}

export interface DashboardKpis {
  cumulativeCalls: number;
  cumulativeDownloads: number;
  pageViews: number;
  dau: number;
  historicalPerformance: Array<{
    date: string;
    PV: number;
    DAU: number;
    calls: number;
    downloads: number;
  }>;
  userFeedbackLogs: Array<{
    id: string;
    type: "active" | "passive";
    text: string;
    date: string;
    triggerSuggestion: string;
  }>;
  competitorList: Array<{
    id: string;
    platform: string;
    lastUpdate: string;
    news: string;
    rank: "高" | "中" | "低";
  }>;
}

export interface ProjectDetail extends ResearchProjectShort {
  frameworkDraft: FrameworkDraft;
  confirmedFramework: FrameworkDraft | null;
  expertPanelFeedback: string;
  skillsV0: SkillItem[];
  radarScoresV0: Record<string, number>;
  skillsV1: SkillItem[] | null;
  monitoringSignals: MonitoringSignal[];
  optimizationTargets: OptimizationTarget[];
  skillsV1_1: SkillItem[] | null;
  radarScoresV1_1: Record<string, number> | null;
  skillsV2: SkillItem[] | null;
}
