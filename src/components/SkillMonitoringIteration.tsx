import { useState, useEffect } from "react";
import { 
  ProjectDetail, 
  MonitoringSignal, 
  OptimizationTarget, 
  SkillItem 
} from "../types";
import { 
  Bell, 
  Activity, 
  Settings, 
  AlertTriangle, 
  Wrench, 
  Sparkles, 
  UserCheck, 
  GitMerge, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Database,
  Flame,
  MessageSquare,
  HelpCircle,
  RefreshCw,
  Info
} from "lucide-react";
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend 
} from "recharts";

interface SkillMonitoringIterationProps {
  project: ProjectDetail;
  onRefresh: () => void;
}

export default function SkillMonitoringIteration({ project, onRefresh }: SkillMonitoringIterationProps) {
  const [signals, setSignals] = useState<MonitoringSignal[]>([]);
  const [targets, setTargets] = useState<OptimizationTarget[]>([]);
  
  // Tab selectors
  const [signalCategoryFilter, setSignalCategoryFilter] = useState<string>("all");
  const [isCompilingV1_1, setIsCompilingV1_1] = useState<boolean>(false);
  const [isRatifyingV2, setIsRatifyingV2] = useState<boolean>(false);
  const [activeSkillTab, setActiveSkillTab] = useState<string>("");

  useEffect(() => {
    if (project) {
      setSignals(project.monitoringSignals || []);
      setTargets(project.optimizationTargets || []);
      
      const combined = project.skillsV1_1 || project.skillsV1 || project.skillsV0;
      if (combined && combined.length > 0) {
        setActiveSkillTab(combined[0].id);
      }
    }
  }, [project]);

  // Handle checking of a target
  const handleToggleTarget = async (targetId: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}/targets/${targetId}/toggle`, {
        method: "POST"
      });
      if (res.ok) {
        const updatedTarget = await res.json();
        setTargets(targets.map(t => t.id === targetId ? updatedTarget : t));
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Compile upgrade V1.0 -> V1.1
  const handleCompileIteration = async () => {
    const hasConfirmedTargets = targets.some(t => t.confirmed);
    if (!hasConfirmedTargets) {
      alert("请至少核准并勾选一个优化方向再发起AI自迭代更新！");
      return;
    }

    setIsCompilingV1_1(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/iterate-to-v1_1`, {
        method: "POST"
      });
      if (res.ok) {
        alert("自迭代成功！AI研究员已提取历史库约束，生成最新Skill集V1.1并刷新系统打分。");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompilingV1_1(false);
    }
  };

  // Researcher signs off V2
  const handleRatifyV2 = async () => {
    setIsRatifyingV2(true);
    try {
      const skillsToConfirm = project.skillsV1_1 || project.skillsV1 || project.skillsV0;
      const res = await fetch(`/api/projects/${project.id}/confirm-v2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: skillsToConfirm })
      });
      if (res.ok) {
        alert("成果核可！研究Skill体系V2.0正式确认发布。已同步更新中台运营端！");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRatifyingV2(false);
    }
  };

  // Process comparative scores for Recharts double radar plotting
  const getComparativeRadarData = () => {
    const s0 = project.radarScoresV0 || {};
    const s1 = project.radarScoresV1_1 || {};
    return Object.keys(s0).map(key => ({
      subject: key,
      V0: s0[key] || 0,
      V1_1: s1[key] || s0[key] || 0, // Fallback to current if V1.1 scores not generated yet
    }));
  };

  // Filters signals list based on selected tab
  const getFilteredSignals = () => {
    if (signalCategoryFilter === "all") return signals;
    if (signalCategoryFilter === "industry") {
      return signals.filter(s => ["news", "policy", "report", "data"].includes(s.category));
    }
    if (signalCategoryFilter === "feedback") {
      return signals.filter(s => s.category === "feedback");
    }
    return signals;
  };

  return (
    <div id="monitoring-iteration-workspace" className="space-y-6">
      
      {/* Overview header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-950 p-5 rounded-xl border border-zinc-850">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500 animate-pulse" />
            【飞轮循环二】智能化监测、信号核对与Skill自迭代
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            动态捕捉全网新闻、最新政策壁垒、买方及产业专家互动日志，转化为具体的Skill微观升级指标，保持投研方法论永不落后。
          </p>
        </div>

        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
            基线版本: <code className="text-emerald-400">V1.0 Base</code>
          </span>
          <span className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300">
            拟升级版本: <code className="text-cyan-400">{"V1.1 -> V2.0"}</code>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SIGNALS & OPTIMIZATIONS (Step 1 & 2) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Signals Monitor Board */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  第一步：动态市场监测、反馈与情报捕获
                </h4>
              </div>

              {/* Signals filter tabs */}
              <div className="flex gap-1">
                {[
                  { id: "all", label: "全部信号" },
                  { id: "industry", label: "行业变化 / 新闻 policy" },
                  { id: "feedback", label: "用户意见 / 交互反馈" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    id={`signal-filter-${tab.id}`}
                    onClick={() => setSignalCategoryFilter(tab.id)}
                    className={`text-[10px] px-2.5 py-1 rounded transition-colors ${
                      signalCategoryFilter === tab.id
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/80"
                        : "text-zinc-500 hover:text-zinc-300 bg-zinc-950/20"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Signals Container */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {getFilteredSignals().map(sig => (
                <div
                  key={sig.id}
                  id={`signal-card-${sig.id}`}
                  className="bg-zinc-950 rounded-lg p-3.5 border border-zinc-850 hover:border-zinc-800 transition-colors space-y-2.5"
                >
                  <div className="flex justify-between items-start text-[10px]">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        sig.severity === "high" ? "bg-rose-500 animate-ping" : "bg-amber-400"
                      }`} />
                      <span className="text-zinc-400">来自：[{sig.source}]</span>
                      <span className="text-zinc-650">•</span>
                      <span className="text-zinc-500">{sig.timestamp}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                      sig.status === "applied" 
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-850" 
                        : "bg-amber-950/30 text-amber-400"
                    }`}>
                      {sig.status === "applied" ? "已融汇迭代" : "待处理"}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-zinc-100">{sig.title}</h5>
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{sig.content}</p>
                  
                  <div className="text-[10.5px] font-mono bg-zinc-900/60 p-2 rounded text-zinc-500 border border-zinc-850/40">
                    <span className="text-amber-500/90 font-bold">框架可能优化影响：</span>
                    {sig.implications}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Optimize targets Confirmation (Step 2) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-1.5">
              <Wrench className="h-4 w-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                第二步：模型提取可优化点 ➔ 人工勾选并确认
              </h4>
            </div>
            
            <p className="text-zinc-400 text-xs leading-relaxed">
              系统通过检索监控信号，反向寻找现有 Skill 结构漏洞。勾选你想改进的优化项，交给AI自闭环编译：
            </p>

            <div className="space-y-3">
              {targets.map(target => (
                <div
                  key={target.id}
                  id={`target-item-${target.id}`}
                  onClick={() => handleToggleTarget(target.id)}
                  className={`border rounded-lg p-3.5 cursor-pointer transition-all flex items-start gap-3 select-none ${
                    target.confirmed 
                      ? "bg-emerald-950/30 border-emerald-500/50" 
                      : "bg-zinc-950 border-zinc-850 hover:border-zinc-800"
                  }`}
                >
                  <div className={`mt-0.5 min-w-[16px] h-4 w-4 rounded flex items-center justify-center border transition-all ${
                    target.confirmed ? "bg-emerald-500 border-emerald-400" : "bg-zinc-900 border-zinc-700 hover:border-zinc-500"
                  }`}>
                    {target.confirmed && <CheckCircle2 className="h-3.5 w-3.5 text-black stroke-[3px]" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{target.title}</span>
                      <span className="text-[9px] font-mono bg-zinc-850 text-zinc-450 px-1.5 py-0.2 rounded uppercase">
                        关联: {target.skillMatches.join(", ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{target.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-805 flex justify-between items-center">
              <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-teal-400" />
                <span>已核中 {targets.filter(t => t.confirmed).length} 个优化目标</span>
              </div>

              <button
                id="compile-iteration-btn"
                onClick={handleCompileIteration}
                disabled={isCompilingV1_1}
                className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] disabled:opacity-40"
              >
                {isCompilingV1_1 ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    AI 正在自顶向下重构升级 Skill 体系中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 animate-bounce" />
                    第三步：自动编译升级 Skill集 V1.1
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DOUBLE CHART COMPARISON & APPROVATION (Step 3 & 4) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Radar scoring progress */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                第三步：自动化评测 ➔ 雷达对比一览 (V1.0 VS V1.1)
              </h4>
              <p className="text-zinc-500 text-[10px]">
                融合新指标后，通过量化评测对比前后两个版本。绿色为更新后，灰色基线为以往方案：
              </p>
            </div>

            {/* Recharts Double Radar chart */}
            <div id="comp-radar-container" className="h-[250px] w-full flex items-center justify-center">
              {project.skillsV1_1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getComparativeRadarData()}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 9 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#52525b', fontSize: 8 }} />
                    <Radar
                      name="V1.0 基线得分"
                      dataKey="V0"
                      stroke="#52525b"
                      fill="#3f3f46"
                      fillOpacity={0.10}
                    />
                    <Radar
                      name="V1.1 优化后得分"
                      dataKey="V1_1"
                      stroke="#06b6d4"
                      fill="#06b6d4"
                      fillOpacity={0.20}
                    />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-zinc-600 text-xs font-mono text-center flex flex-col items-center justify-center p-6 border border-dashed border-zinc-800 rounded">
                  <Flame className="h-6 w-6 text-zinc-800 mb-2 animate-pulse" />
                  <span>等待 V1.1 迭代编译触发后</span>
                  <span>输出前后多维评测投影对碰</span>
                </div>
              )}
            </div>

            {project.skillsV1_1 && (
              <div className="bg-cyan-950/20 border border-cyan-900/60 p-3 rounded text-[11px] text-cyan-300/95 leading-relaxed font-mono">
                📈 **评测结果跃升说明**：
                在补齐极温保持比和5阶估值递进折现模型后，新技能系统在**思维严密性**上整体提升8~10分，数据覆盖由于导入了行业一手微裂隙抽测而大幅精进。符合产业量产风控门定。
              </div>
            )}
          </div>

          {/* V1.1 Code reviews & Final Ratification of V2.0 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              第四步：研究员判断人工确认 ➔ 冻结定稿体系 V2
            </h4>

            {project.skillsV1_1 ? (
              <div className="space-y-4">
                
                {/* Visual file list showing the updated skills */}
                <div className="space-y-2">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono">迭代后技能 MD 文档一览 (V1.1)</div>
                  
                  <div className="flex gap-1.5">
                    {project.skillsV1_1.map(s => (
                      <button
                        key={s.id}
                        id={`it-skill-tab-${s.id}`}
                        onClick={() => setActiveSkillTab(s.id)}
                        className={`text-[10.5px] px-3 py-1.5 rounded border transition-colors flex-1 text-center font-mono truncate ${
                          activeSkillTab === s.id 
                            ? "bg-cyan-950/40 border-cyan-800 text-cyan-400" 
                            : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900 text-zinc-550"
                        }`}
                      >
                        {s.id === "SK-01" ? "📈 行业V1.1" : "💼 财务个股V1.1"}
                      </button>
                    ))}
                  </div>

                  {project.skillsV1_1.map(s => {
                    if (s.id !== activeSkillTab) return null;
                    return (
                      <div key={s.id} id={`it-skill-view-${s.id}`} className="bg-zinc-950 p-3.5 rounded border border-zinc-850 space-y-2">
                        <div className="flex justify-between text-[9px] font-mono border-b border-zinc-850 pb-1.5 text-zinc-550">
                          <span>技能名: {s.name}</span>
                          <span className="text-cyan-400 font-bold">V1.1 Auto</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 max-h-36 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                          {s.markdown}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-800 pt-3 flex flex-col gap-2">
                  <div className="text-[10px] text-zinc-500 leading-relaxed">
                    * 人工最终审阅后扣紧最终发布，此后，V2.0 技能体系将覆盖或重配至数据运营看板，形成新的监测哨。
                  </div>

                  <button
                    id="ratify-v2-btn"
                    onClick={handleRatifyV2}
                    disabled={isRatifyingV2}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    {isRatifyingV2 ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileCheck2 className="h-4.5 w-4.5" />
                    )}
                    确认审核并签发体系版本 V2.0 永久归档
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded bg-zinc-950/20 text-zinc-600 text-xs">
                <span>请先在前置栏确认优化项目</span>
                <br />
                <span>并执行第三步编译升级动作。</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
