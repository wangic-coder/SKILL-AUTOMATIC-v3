import { useState, useEffect } from "react";
import { ResearchProjectShort, ProjectDetail } from "./types";
import { 
  Plus, 
  RefreshCcw, 
  Layers, 
  HelpCircle, 
  Sparkles, 
  FileCheck, 
  Activity, 
  TrendingUp, 
  BookOpen,
  ArrowRightLeft,
  ChevronRight,
  Database,
  Flame,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info
} from "lucide-react";
import SkillCreationWheel from "./components/SkillCreationWheel";
import SkillMonitoringIteration from "./components/SkillMonitoringIteration";
import OperationHub from "./components/OperationHub";

export default function App() {
  const [projects, setProjects] = useState<ResearchProjectShort[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  
  // Toggling master wheel modules
  const [activeModule, setActiveModule] = useState<"generate" | "iterate" | "operations">("generate");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load all projects on mount
  const fetchProjectsList = async (selectFirst = false) => {
    try {
      const res = await fetch("/api/projects");
      const list: ResearchProjectShort[] = await res.json();
      setProjects(list);
      if (list.length > 0 && (!activeProjectId || selectFirst)) {
        setActiveProjectId(list[0].id);
      }
    } catch (e) {
      console.error("Error loading project list from server:", e);
    }
  };

  // Load active project detailed state
  const loadProjectDetails = async (id: string, silent = false) => {
    if (!id) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const detail: ProjectDetail = await res.json();
        setProjectDetail(detail);
      }
    } catch (e) {
      console.error(`Error loading details for project ${id}:`, e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialization hooks
  useEffect(() => {
    fetchProjectsList(true);
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      loadProjectDetails(activeProjectId);
    }
  }, [activeProjectId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (activeProjectId) {
      await fetchProjectsList();
      await loadProjectDetails(activeProjectId, true);
    }
    setIsRefreshing(false);
  };

  // Render a visual workflow tracker of the Flywheel (Progress Cockpit)
  const renderFlowCockpit = () => {
    if (!projectDetail) return null;
    
    // Determine stages done based on active structures in DB
    const step1Done = !!projectDetail.frameworkDraft;
    const step2Done = projectDetail.confirmedFramework !== null;
    const step3Done = projectDetail.isExpertReviewed;
    const step4Done = projectDetail.skillsV0 && projectDetail.skillsV0.length > 0;
    const step5Done = projectDetail.radarScoresV1_1 !== null; // upgraded iteration in M2
    const step6Done = projectDetail.skillsV2 !== null; // confirmed V2

    const steps = [
      { id: "ingest", title: "1. 原始框架合成", desc: "海内外对碰", done: step1Done, color: "emerald" },
      { id: "confirm", title: "2. 研究员定稿", desc: "框架指标确认", done: step2Done, color: "emerald" },
      { id: "review", title: "3. 专家组融汇", desc: "融入外部质询", done: step3Done, color: "emerald" },
      { id: "dissect", title: "4. 原子化 V0.0", desc: "拆解双边技能", done: step4Done, color: "amber" },
      { id: "signal", title: "5. 信源自迭代", desc: "自捕获优化点", done: step5Done, color: "cyan" },
      { id: "archive", title: "6. 定版 Skill V2", desc: "出炉终极规范", done: step6Done, color: "teal" }
    ];

    return (
      <div id="flywheel-flow-cockpit" className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-3 w-max">
              AI 投研方法论飞轮运行监测舱 （FLYWHEEL MONITORING COCKPIT）
            </span>
          </div>

          <button 
            id="global-refresh-btn"
            onClick={handleRefresh}
            className="text-[10px] bg-zinc-805 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 px-2.5 py-1 rounded transition-colors flex items-center gap-1 font-mono"
          >
            <RefreshCcw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            同步最新数据状态
          </button>
        </div>

        {/* Progress Pipeline */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5 pt-1">
          {steps.map((st, index) => {
            return (
              <div
                key={st.id}
                id={`flow-step-${st.id}`}
                className={`relative px-3.5 py-2.5 rounded-lg border transition-all ${
                  st.done 
                    ? "bg-zinc-90 w-full border-emerald-500/30 text-emerald-300 bg-zinc-900/50 shadow" 
                    : "bg-zinc-950/20 border-zinc-850 text-zinc-550"
                }`}
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className={`text-[10px] font-mono leading-none ${st.done ? "text-emerald-400" : "text-zinc-600"}`}>
                    STAGE 0{index + 1}
                  </span>
                  
                  {st.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-700"></span>
                  )}
                </div>

                <div className="font-sans font-bold text-xs text-white leading-tight">{st.title}</div>
                <div className="text-[10px] text-zinc-500 truncate mt-0.5">{st.desc}</div>

                {index < 5 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-zinc-700">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="reactor-flywheel-app" className="min-h-screen bg-[#09090b] text-zinc-200 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Global Navigation Top Header */}
      <header className="border-b border-zinc-850 bg-zinc-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-950/20 text-sm font-mono">
              FW
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-1.5 leading-none">
                AI投研飞轮平台
                <span className="bg-emerald-950 text-emerald-400 text-[9px] px-1.5 py-0.5 rounded font-mono font-normal">PRO ENTERPRISE</span>
              </h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">海内外分析对碰 • 技能闭环自进化 • 特快点评运营中台</p>
            </div>
          </div>

          {/* Project switcher & creation simulator */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">切换聚焦赛道:</span>
            
            <select
              id="global-project-selector"
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.industry}
                </option>
              ))}
            </select>

            <button
              id="create-sim-btn"
              onClick={() => {
                alert("本企业尊享版已为您预装了‘固态电池’与‘高宽硅光CPO互联’两大高频工业重头行业，由研究院副总裁合伙人长期维护。如需补充全新特定非标风控，请向上游大数据中心提报分配。");
              }}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-1.5 rounded-lg text-zinc-300 transition-colors"
              title="新增投研赛道申请"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Flywheel Stage Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">

        {/* Dynamic workflow tracker bar */}
        {renderFlowCockpit()}

        {/* Dual Panels layout (Left controller, Right modules) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Module tab toggler columns (Left Column) */}
          <div className="lg:col-span-12 xl:col-span-12 flex justify-start items-center border-b border-zinc-850 pb-2 gap-2 overflow-x-auto">
            {[
              { id: "generate", label: "🛠️ 研究Skill自动生成规范", count: "STAGE 1-3" },
              { id: "iterate", label: "🔄 变化监测与技能自迭代 (V1.1-V2.0)", count: "STAGE 4" },
              { id: "operations", label: "📊 实盘即时运营与多维埋点看板", count: "STAGE 5-6" }
            ].map(mod => (
              <button
                key={mod.id}
                id={`module-toggle-btn-${mod.id}`}
                onClick={() => setActiveModule(mod.id as any)}
                className={`py-2 px-4 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  activeModule === mod.id
                    ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-md shadow-emerald-900/30"
                    : "bg-zinc-950 text-zinc-400 border-zinc-850/60 hover:text-zinc-200"
                }`}
              >
                <span>{mod.label}</span>
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded border ${
                  activeModule === mod.id ? "bg-emerald-600/30 text-emerald-950 border-emerald-700" : "bg-zinc-900 text-zinc-550 border-zinc-800"
                }`}>
                  {mod.count}
                </span>
              </button>
            ))}
          </div>

          {/* Active Workspace Module Container */}
          <div className="lg:col-span-12 xl:col-span-12">
            
            {isLoading ? (
              <div className="py-24 text-center space-y-3 border border-zinc-850 rounded-xl bg-zinc-950/20">
                <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-zinc-500 font-mono">正在调取中台数据库，解构当前研究员状态资产包...</p>
              </div>
            ) : projectDetail ? (
              <div className="transition-all duration-300">
                
                {activeModule === "generate" && (
                  <SkillCreationWheel project={projectDetail} onRefresh={handleRefresh} />
                )}

                {activeModule === "iterate" && (
                  <SkillMonitoringIteration project={projectDetail} onRefresh={handleRefresh} />
                )}

                {activeModule === "operations" && (
                  <OperationHub />
                )}

              </div>
            ) : (
              <div className="py-20 text-center text-zinc-600 text-xs">
                尚未选定任何投研聚焦项目，请在头部下拉中聚焦。
              </div>
            )}

          </div>

        </div>

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-zinc-850 bg-zinc-950/30 py-4 text-center text-[10.5px] text-zinc-550">
        <div>© 2026 AI投研飞轮平台. Crafted for professional multi-market investment research firms.</div>
        <div className="mt-0.5 text-zinc-600 font-mono">Double-Loop Flywheel, Quantitative Radars, Closed Feedback Pipeline.</div>
      </footer>

    </div>
  );
}
