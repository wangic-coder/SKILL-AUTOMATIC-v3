import { useState, useEffect, FormEvent } from "react";
import { 
  OperationEvent, 
  CatalystItem, 
  FactorItem, 
  DashboardKpis 
} from "../types";
import { 
  Flame, 
  TrendingUp, 
  Award, 
  Zap, 
  Users, 
  Download, 
  BarChart2, 
  Percent, 
  Bell, 
  Send, 
  Eye, 
  RefreshCcw, 
  Plus, 
  ChevronRight, 
  Volume2, 
  ShieldAlert, 
  Layers, 
  HelpCircle,
  TrendingDown,
  RotateCw,
  Sparkles,
  Edit,
  Check
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";

export default function OperationHub() {
  const [activeTab, setActiveTab] = useState<"business" | "operation" | "competitor">("business");
  
  // States loaded from backend
  const [events, setEvents] = useState<OperationEvent[]>([]);
  const [catalysts, setCatalysts] = useState<CatalystItem[]>([]);
  const [factors, setFactors] = useState<FactorItem[]>([]);
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  
  // Ingest input for new hot event
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [newEventIndustry, setNewEventIndustry] = useState<string>("电池新能源");
  const [isGeneratingEvent, setIsGeneratingEvent] = useState<boolean>(false);
  
  // Editing a factor inside the factor dashboard
  const [editingFactorId, setEditingFactorId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingMomentum, setEditingMomentum] = useState<string>("");

  // Reload data from backend
  const loadOperationsData = async () => {
    try {
      const res = await fetch("/api/operations/data");
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setEvents(data.events);
        setCatalysts(data.catalysts);
        setFactors(data.factors);
        setKpis(data.kpis);
      } else {
        console.warn("Operations data response was non-JSON or not ok:", res);
      }
    } catch (e) {
      console.error("Failed to load operations metrics on client.", e);
    }
  };

  useEffect(() => {
    loadOperationsData();
  }, []);

  // Trigger Gemini/Mock generation of hot event Review & Opinion Ring
  const handleTriggerEventCreation = async (e: FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      alert("请黏贴或输入当前最新监控到的热门事件标题！");
      return;
    }

    setIsGeneratingEvent(true);
    try {
      const res = await fetch("/api/operations/trigger-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle,
          industryFocus: newEventIndustry
        })
      });
      if (res.ok) {
        const addedEvent = await res.json();
        setEvents([addedEvent, ...events]);
        setNewEventTitle("");
        alert(`事件点评生成成功！已关联相关研究Skill，并推入擂台。`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingEvent(false);
    }
  };

  // One-click mass push notifications to analyses core users group
  const handleMassPush = async () => {
    try {
      const res = await fetch("/api/operations/push-all", { method: "POST" });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
      } else {
        alert("推送通知异常，请检查后端状态。");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Confirm factors updates on inline editing row
  const handleUpdateFactor = async (id: string) => {
    try {
      const res = await fetch("/api/operations/factors/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          newValue: editingValue,
          newMomentum: editingMomentum
        })
      });
      if (res.ok) {
        setEditingFactorId(null);
        loadOperationsData(); // Reload updated factor sets
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="operations-hub-workspace" className="space-y-6">
      
      {/* Visual Tab header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
        <div>
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-400" />
            三、智能 Skill 运营、数据埋点与竞对跟踪中心
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            将沉淀好并归档的 V2.0 研究 Skill 全面应用在实盘监控和日常推送中。包含业务、运营及外部竞对三维监控看板。
          </p>
        </div>

        {/* Triple viewpoint switches */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
          {[
            { id: "business", label: "💼 业务运营视角" },
            { id: "operation", label: "📊 流量数据埋点" },
            { id: "competitor", label: "📡 竞品动态雷达" }
          ].map(tab => (
            <button
              key={tab.id}
              id={`view-switch-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-black font-semibold shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= VIEWPOINT 1: BUSINESS PERSPECTIVE ================= */}
      {activeTab === "business" && (
        <div id="business-view-grid" className="space-y-6">
          
          {/* Top Form to trigger live real-time hot event generation */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-4 w-4 text-amber-500 animate-bounce" />
              1. 实时监控热点事件评分 ➔ 调用 Skill 生成特快点评报告 (AI 实时辅助)
            </h4>

            <form onSubmit={handleTriggerEventCreation} className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <select
                  id="event-industry-select"
                  value={newEventIndustry}
                  onChange={(e) => setNewEventIndustry(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-zinc-300 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="电池新能源">电池新能源 (固态材料/极片/工艺)</option>
                  <option value="光电半导体">光电半导体 (CPO通信/有源硅片流片)</option>
                  <option value="智能机架硬件">智能算力集成件 (els外置光、COWOS芯片)</option>
                </select>
              </div>

              <div className="md:col-span-6">
                <input
                  id="event-title-input"
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="粘贴并输入最新发生的公司定点突变、公告获批、原料变价等热点大事件标题..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-700 font-mono"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  id="generate-event-btn"
                  type="submit"
                  disabled={isGeneratingEvent}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-[0.98]"
                >
                  {isGeneratingEvent ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      AI 正在研判并推导...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      生成特快点评报告
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Opinion Arena & Stance differences */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-emerald-400" />
                  2. 观点擂台：高频辩词、正反两端核心边际博弈
                </h4>

                <button
                  id="push-to-users-group-btn"
                  onClick={handleMassPush}
                  className="bg-zinc-800 hover:bg-zinc-750 text-[10px] text-emerald-300 border border-zinc-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <Send className="h-3 w-3" /> 一键向全平台订阅分析师群发推送
                </button>
              </div>

              {/* Event opinion ring cards list */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    id={`opinion-card-${evt.id}`}
                    className="bg-zinc-950 rounded-lg p-4 border border-zinc-850 space-y-3 hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-900/40 text-emerald-400 border border-emerald-850 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                          {evt.category}
                        </span>
                        <span className="text-[10px] text-zinc-550 font-mono">
                          关联 Skill: <code className="text-zinc-400">{evt.relatedSkill}</code>
                        </span>
                      </div>
                      <span className="text-zinc-600 text-[10px] font-mono">{evt.time}</span>
                    </div>

                    <h5 className="text-[12px] font-extrabold text-zinc-100">{evt.title}</h5>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed bg-zinc-900/40 p-3 rounded border border-zinc-900">
                      {evt.content}
                    </p>

                    {/* Stance Arena display columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      
                      {/* Positive */}
                      <div className="bg-emerald-950/20 border border-emerald-950/50 p-2.5 rounded text-[10.5px]">
                        <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          多方 / 正面增益边际：
                        </div>
                        <p className="text-zinc-300 font-sans leading-relaxed">{evt.stancePro}</p>
                      </div>

                      {/* Negative */}
                      <div className="bg-rose-950/20 border border-rose-950/50 p-2.5 rounded text-[10.5px]">
                        <div className="text-rose-400 font-bold mb-1 flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          空方 / 潜在制约漏洞：
                        </div>
                        <p className="text-zinc-300 font-sans leading-relaxed">{evt.stanceCon}</p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Catalyst trigger Tracker & Factors Dynamic Board */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* 1. Core Catalyst Trigger */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Bell className="h-4 w-4 text-emerald-400 animate-pulse" />
                  3. 核心催化剂实时跟踪哨
                </h4>
                
                <p className="text-zinc-500 text-[10px] leading-relaxed">
                  监控工业阈值与指标。条件触发后，系统将在 200 毫秒内向订阅买方发送主动感知通知。
                </p>

                <div className="space-y-2.5">
                  {catalysts.map(cat => (
                    <div
                      key={cat.id}
                      id={`catalyst-item-${cat.id}`}
                      className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-zinc-200">{cat.name}</div>
                        <div className="text-[10px] text-zinc-550 font-mono">
                          标准限制: {cat.threshold} • 触发日期: {cat.triggeredDate}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-zinc-100 font-mono font-bold text-[11px]">{cat.value}</div>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-mono ${
                          cat.status === "met" 
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-900" 
                            : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                        }`}>
                          {cat.status === "met" ? "● 已触发" : "监测中"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Factor Level Board (editable inputs) */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                  4. 热点赛道大要素因子看板 (实时自编辑)
                </h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed">
                  在飞轮中直接双击或点击“Edit”临时修订重要原料高阶纯度与耗损值，系统将刷新并传导至Skill更新流中。
                </p>

                <div className="space-y-2">
                  {factors.map(fac => {
                    const isEditing = editingFactorId === fac.id;
                    return (
                      <div
                        key={fac.id}
                        id={`factor-card-${fac.id}`}
                        className="bg-zinc-950 border border-zinc-850 p-3 rounded-lg space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-zinc-500 font-mono">{fac.sector} • 权重:{fac.weight}</span>
                          
                          {isEditing ? (
                            <button
                              id={`factor-save-btn-${fac.id}`}
                              onClick={() => handleUpdateFactor(fac.id)}
                              className="text-emerald-400 font-bold hover:text-emerald-300"
                            >
                              保存
                            </button>
                          ) : (
                            <button
                              id={`factor-edit-btn-${fac.id}`}
                              onClick={() => {
                                setEditingFactorId(fac.id);
                                setEditingValue(fac.value);
                                setEditingMomentum(fac.momentum);
                              }}
                              className="text-zinc-550 hover:text-emerald-400 font-mono"
                            >
                              改写
                            </button>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-200">{fac.name}</span>
                          
                          {isEditing ? (
                            <input
                              id={`factor-val-input-${fac.id}`}
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-24 bg-zinc-900 text-white font-mono text-right text-xs px-1 py-0.5 rounded border border-zinc-700"
                            />
                          ) : (
                            <span id={`factor-val-text-${fac.id}`} className="font-mono text-emerald-400 font-bold">{fac.value}</span>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-[10.5px] font-mono text-zinc-500 pt-1 border-t border-zinc-900/60">
                          <span>最新动量：</span>
                          {isEditing ? (
                            <input
                              id={`factor-mom-input-${fac.id}`}
                              type="text"
                              value={editingMomentum}
                              onChange={(e) => setEditingMomentum(e.target.value)}
                              className="w-32 bg-zinc-900 text-zinc-300 text-right text-[10px] px-1 py-0.2 rounded border border-zinc-750"
                            />
                          ) : (
                            <span id={`factor-mom-text-${fac.id}`} className="text-zinc-400">{fac.momentum}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ================= VIEWPOINT 2: DATA OPERATIONS VIEW ================= */}
      {activeTab === "operation" && kpis && (
        <div id="operation-view-grid" className="space-y-6">
          
          {/* Top numerical cards row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div id="kpi-card-calls" className="bg-zinc-905 border border-zinc-800 rounded-xl p-4.5 space-y-1 bg-zinc-900">
              <span className="text-zinc-500 text-[10px] uppercase font-mono block">Skill 累积调用量 (API calls)</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {kpis.cumulativeCalls.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">次</span>
              </div>
              <div className="text-[10px] text-zinc-500">• 包含自迭代后 API 主动轮巡调用</div>
            </div>

            <div id="kpi-card-downloads" className="bg-zinc-905 border border-zinc-800 rounded-xl p-4.5 space-y-1 bg-zinc-900">
              <span className="text-zinc-500 text-[10px] uppercase font-mono block">规范下载量 (Downloads)</span>
              <div className="text-2xl font-bold font-mono text-white">
                {kpis.cumulativeDownloads.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">次</span>
              </div>
              <div className="text-[10px] text-zinc-500">• 投研系统统一离线包打包下载</div>
            </div>

            <div id="kpi-card-pv" className="bg-zinc-905 border border-zinc-800 rounded-xl p-4.5 space-y-1 bg-zinc-900">
              <span className="text-zinc-500 text-[10px] uppercase font-mono block">页面点击量 (PV)</span>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {kpis.pageViews.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">次</span>
              </div>
              <div className="text-[10px] text-zinc-500">• 买方投顾及公募分析师访问折算</div>
            </div>

            <div id="kpi-card-dau" className="bg-zinc-905 border border-zinc-800 rounded-xl p-4.5 space-y-1 bg-zinc-900">
              <span className="text-zinc-500 text-[10px] uppercase font-mono block">活跃分析师数 (DAU)</span>
              <div className="text-2xl font-bold font-mono text-amber-500">
                {kpis.dau.toLocaleString()} <span className="text-xs text-zinc-550 font-normal">人</span>
              </div>
              <div className="text-[10px] text-zinc-500">• 全天候双轨系统粘性保持指标</div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Recharts Analytics area plot */}
            <div className="lg:col-span-8 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="h-4 w-4 text-emerald-400" />
                埋点与日活走势分析看板 (最近7日波动)
              </h4>

              <div id="graph-container-pv-dau" className="h-[270px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={kpis.historicalPerformance} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d1d20" />
                    <XAxis dataKey="date" stroke="#52525b" style={{ fontSize: 10 }} />
                    <YAxis stroke="#52525b" style={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: 11, color: '#fff' }} />
                    <Area type="monotone" dataKey="calls" name="Skill累计调用次数" stroke="#10b981" fillOpacity={1} fill="url(#colorCalls)" />
                    <Area type="monotone" dataKey="PV" name="全页面点击PV数" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPV)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Content releases and user feedback trigger suggestions (User Ops) */}
            <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                用户使用反馈与问答埋点潜在优化 (User Ops)
              </h4>

              <p className="text-zinc-500 text-[10px] leading-relaxed">
                机器学习引擎自动遍历买方与平台对话，反向抽取出下一版本建议增加的研究Skill要素：
              </p>

              <div className="space-y-3">
                {kpis.userFeedbackLogs.map(log => {
                  return (
                    <div
                      key={log.id}
                      id={`feedback-log-${log.id}`}
                      className="bg-zinc-950 rounded-lg p-3 border border-zinc-850 space-y-2"
                    >
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                          log.type === "active" 
                            ? "bg-amber-950 text-amber-400 border border-amber-900" 
                            : "bg-zinc-900 text-zinc-500"
                        }`}>
                          {log.type === "active" ? "买方主动提报" : "自动埋点捕获"}
                        </span>
                        <span className="text-zinc-650">{log.date}</span>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-snug font-sans italic">
                        "{log.text}"
                      </p>

                      <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/20 p-1.5 rounded">
                        <span className="text-zinc-500 font-bold shrink-0">➔ 潜在自更新点：</span>
                        <span className="truncate">{log.triggerSuggestion}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900 p-2.5 rounded-lg text-[10px] text-emerald-400 font-mono">
                🔋 **Skill 上新推送快报 (Content Ops)**：
                <br />
                - “ELS反射机制与全温区防穿刺全固态电池双核包 V2.0”已作为本日重磅推荐向 85 家主流机大公募推送。
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ================= VIEWPOINT 3: COMPETITOR MOVEMENT RADAR ================= */}
      {activeTab === "competitor" && kpis && (
        <div id="competitor-view-grid" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 text-zinc-400" />
              📡 全球投研对标平台市场监控（大模型定时轮巡抓取）
            </h4>
            <p className="text-zinc-400 text-xs mt-1">
              自动监控同业大厂（WIND, YOLE, Bloomberg）在相似科技/重工分析框架下的研究新篇上新动作，防止方法论代差错失。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Competitors update listing */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-zinc-3 w-max px-2.5 py-1 rounded bg-zinc-950 text-zinc-400">
                对标情报列表 (最近24小时变化)
              </h5>

              <div className="space-y-3">
                {kpis.competitorList.map(comp => (
                  <div
                    key={comp.id}
                    id={`competitor-card-${comp.id}`}
                    className="bg-zinc-950 rounded-xl p-4 border border-zinc-850 space-y-2.5 hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-teal-400 font-mono">{comp.platform}</span>
                      <span className="text-zinc-550">{comp.lastUpdate}</span>
                    </div>

                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                      同级别新竞动作监测：<span className="text-white font-medium">{comp.news}</span>
                    </p>

                    <div className="flex justify-between items-center text-[9px] font-mono bg-zinc-900 p-2 rounded">
                      <span className="text-zinc-550">防范威胁系数：</span>
                      <span className={`px-2 py-0.2 rounded font-bold ${
                        comp.rank === "高" ? "bg-rose-950 text-rose-400" : "bg-amber-955 text-amber-400 bg-amber-950"
                      }`}>
                        安全等级 - {comp.rank}偏斜
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Analytical conclusion & action plans */}
            <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-850 flex flex-col justify-between">
              <div className="space-y-4">
                <h5 className="text-xs font-semibold text-zinc-305 flex items-center gap-1.5 pb-2 border-b border-zinc-850">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  对标对抗策略与自动纠偏防御指示
                </h5>

                <div className="space-y-3 text-xs leading-relaxed font-sans text-zinc-300">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      针对 **WIND研报** 近日上线的硫化高压材料：
                      建议在我们**‘全固态电池V2.0’**中，进一步收窄对于“硫化锂纯度在极限室温条件对导电率滑塌敏感测定”，以巩固我们在专业小中试线上的数据源压制优势。
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      针对 **Yole先进封测** 细节：
                      已在上级模块**‘CPO 1.6T-3.2T有源对位自更新’**中增加了台积电Cowos-R的成品率测算公式。我们在微芯片高频通孔损耗的回测精确度，目前依然领先同业对标产品18个百分点。
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-90 w-full rounded border border-zinc-800 bg-zinc-900 text-[10.5px] text-zinc-500 leading-relaxed font-mono">
                🤖 **对标防御雷达总结**：
                平台会自动在每日UTC 00:00 分抓取竞对。若对标出现革命性技术模型更新，本平台飞轮优化器将自动将其转化为“更新优化目标”放入二级监测流中，由研究员再次二次调准。
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
