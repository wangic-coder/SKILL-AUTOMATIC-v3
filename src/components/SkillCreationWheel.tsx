import { useState, useEffect } from "react";
import { 
  ProjectDetail, 
  SkillItem, 
  FrameworkDraft 
} from "../types";
import { 
  Sparkles, 
  Import, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  HelpCircle, 
  ArrowRight,
  GitCompare,
  FileText,
  Plus,
  Trash2,
  Lock,
  Download,
  AlertTriangle,
  RotateCw,
  RefreshCw
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

interface SkillCreationWheelProps {
  project: ProjectDetail;
  onRefresh: () => void;
}

export default function SkillCreationWheel({ project, onRefresh }: SkillCreationWheelProps) {
  // Navigation for sub-steps 1 to 6
  const [activeStep, setActiveStep] = useState<number>(1);
  
  // Local state for Step 1 Ingest
  const [reportsText, setReportsText] = useState<string>("");
  const [isGeneratingFramework, setIsGeneratingFramework] = useState<boolean>(false);
  
  // Local states for editable lists
  const [editableFramework, setEditableFramework] = useState<FrameworkDraft | null>(null);
  const [activeFrameworkTab, setActiveFrameworkTab] = useState<"domestic" | "foreign" | "comparison">("domestic");
  
  // Status check list
  const [isResearcherConfirmed, setIsResearcherConfirmed] = useState<boolean>(false);
  const [isExpertConfirmed, setIsExpertConfirmed] = useState<boolean>(false);
  
  // Skills tracking
  const [skillsV0, setSkillsV0] = useState<SkillItem[]>([]);
  const [isCompilingSkills, setIsCompilingSkills] = useState<boolean>(false);
  const [activeSkillTab, setActiveSkillTab] = useState<string>("");
  
  // Radar metrics grading
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [radarScores, setRadarScores] = useState<Record<string, number> | null>(null);
  const [radarVerdict, setRadarVerdict] = useState<string>("");
  
  // V1.0 saving state
  const [skillsV1, setSkillsV1] = useState<SkillItem[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingMarkdown, setEditingMarkdown] = useState<string>("");
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>("");
  const [isLockingV1, setIsLockingV1] = useState<boolean>(false);

  // Expert opinions configuration states
  const [localExperts, setLocalExperts] = useState<any[]>([]);
  const [editingExpertId, setEditingExpertId] = useState<string | null>(null);
  const [isSavingOpinions, setIsSavingOpinions] = useState<boolean>(false);
  const [isAddingNewExpert, setIsAddingNewExpert] = useState<boolean>(false);
  const [expertForm, setExpertForm] = useState({
    name: "",
    title: "",
    comment: "",
    status: "conditional" as "agreed" | "conditional" | "need_tweak",
    avatarColor: "amber"
  });

  // Custom extraction prompt states
  const [extractionPrompt, setExtractionPrompt] = useState<string>("");
  const [isSavingPrompt, setIsSavingPrompt] = useState<boolean>(false);
  const [promptSaveStatus, setPromptSaveStatus] = useState<string>("");

  // Sync with project updates
  useEffect(() => {
    if (project) {
      setEditableFramework(JSON.parse(JSON.stringify(project.frameworkDraft)));
      setSkillsV0(project.skillsV0 || []);
      setRadarScores(project.radarScoresV0 || null);
      setSkillsV1(project.skillsV1 || JSON.parse(JSON.stringify(project.skillsV0 || [])));
      setIsResearcherConfirmed(project.confirmedFramework !== null);
      setIsExpertConfirmed(project.isExpertReviewed);
      if (project.extractionPrompt) {
        setExtractionPrompt(project.extractionPrompt);
      } else {
        setExtractionPrompt("");
      }
      if (project.skillsV0 && project.skillsV0.length > 0) {
        setActiveSkillTab(project.skillsV0[0].id);
      }
      if (project.expertOpinions && project.expertOpinions.length > 0) {
        setLocalExperts(JSON.parse(JSON.stringify(project.expertOpinions)));
      } else if (project.expertPanelFeedback) {
        setLocalExperts([
          {
            id: "exp-1",
            name: "专家评议组",
            title: "多方专家交叉核心回馈",
            comment: project.expertPanelFeedback,
            status: "conditional",
            avatarColor: "amber"
          }
        ]);
      }
    }
  }, [project]);

  // Save all expert opinions to backend
  const saveExpertOpinionsToBackend = async (opinions: any[]) => {
    setIsSavingOpinions(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/expert-opinions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expertOpinions: opinions })
      });
      if (res.ok) {
        onRefresh();
      } else {
        console.error("Failed to save expert opinions to the backend.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingOpinions(false);
    }
  };

  // Add or update a single expert's opinion from form
  const handleSaveSingleExpert = () => {
    if (!expertForm.name || !expertForm.comment) {
      alert("请填写专家姓名以及具体的反馈意见。");
      return;
    }

    let updatedList = [...localExperts];
    if (isAddingNewExpert) {
      const newExp = {
        id: "exp-" + Date.now().toString(),
        name: expertForm.name,
        title: expertForm.title || "特聘咨询顾问",
        comment: expertForm.comment,
        status: expertForm.status,
        avatarColor: expertForm.avatarColor
      };
      updatedList.push(newExp);
    } else if (editingExpertId) {
      updatedList = updatedList.map(item => {
        if (item.id === editingExpertId) {
          return {
            ...item,
            name: expertForm.name,
            title: expertForm.title || "特聘咨询顾问",
            comment: expertForm.comment,
            status: expertForm.status,
            avatarColor: expertForm.avatarColor
          };
        }
        return item;
      });
    }

    setLocalExperts(updatedList);
    setEditingExpertId(null);
    setIsAddingNewExpert(false);

    // Persist to server
    saveExpertOpinionsToBackend(updatedList);
  };

  // Save custom extraction prompt template
  const handleSaveExtractionPrompt = async () => {
    setIsSavingPrompt(true);
    setPromptSaveStatus("");
    try {
      const res = await fetch(`/api/projects/${project.id}/extraction-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extractionPrompt })
      });
      if (res.ok) {
        setPromptSaveStatus("success");
        setTimeout(() => setPromptSaveStatus(""), 3000);
        onRefresh();
      } else {
        setPromptSaveStatus("error");
        setTimeout(() => setPromptSaveStatus(""), 3000);
      }
    } catch (e) {
      console.error(e);
      setPromptSaveStatus("error");
      setTimeout(() => setPromptSaveStatus(""), 3000);
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Submit report + run AI to build/re-generate framework draft
  const handleGenerateFramework = async () => {
    setIsGeneratingFramework(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate-framework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportsText, extractionPrompt })
      });
      const data = await res.json();
      setEditableFramework(data);
      onRefresh();
      alert("研究框架初稿生成成功！已根据您配置的全新抽取提示词整合最新比对。");
    } catch (e) {
      console.error(e);
      alert("框架生成异常，请检查后端状态。");
    } finally {
      setIsGeneratingFramework(false);
    }
  };

  // Add a new row to dimension table
  const handleAddDimensionRow = () => {
    if (!editableFramework) return;
    const updated = { ...editableFramework };
    updated.dimensions.push({
      dimension: "新分析维度",
      scope: "点击编辑分析范畴描述...",
      metrics: "极性参数1, 技术参数2"
    });
    setEditableFramework(updated);
  };

  const handleRemoveDimensionRow = (idx: number) => {
    if (!editableFramework) return;
    const updated = { ...editableFramework };
    updated.dimensions.splice(idx, 1);
    setEditableFramework(updated);
  };

  // Add a new row to Data Acquisition Table
  const handleAddDataRow = () => {
    if (!editableFramework) return;
    const updated = { ...editableFramework };
    const nextId = "D0" + (updated.dataAcquisition.length + 1);
    updated.dataAcquisition.push({
      id: nextId,
      name: "新数据监测指标",
      desc: "指标主要物理/财务机理意义描述",
      logic: "—",
      source: "可能的获取源（如百川, WIND, 上海有色）"
    });
    setEditableFramework(updated);
  };

  const handleRemoveDataRow = (idx: number) => {
    if (!editableFramework) return;
    const updated = { ...editableFramework };
    updated.dataAcquisition.splice(idx, 1);
    setEditableFramework(updated);
  };

  // Step 2: Confirmation as initial draft by researcher
  const handleConfirmFrameworkDraft = async () => {
    if (!editableFramework) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/confirm-framework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: editableFramework,
          isReviewed: false // not yet expert-reviewed
        })
      });
      if (res.ok) {
        setIsResearcherConfirmed(true);
        setActiveStep(3); // Auto-advance to Expert Panel
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Step 3: Conform Expert reviews
  const handleConfirmExpertReview = async () => {
    if (!editableFramework) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/confirm-framework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          framework: editableFramework,
          isReviewed: true
        })
      });
      if (res.ok) {
        setIsExpertConfirmed(true);
        setActiveStep(4); // Advance to skills compilation
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Step 4: AI generate specific atomic skills (V0.0)
  const handleGenerateSkillsV0 = async () => {
    setIsCompilingSkills(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/generate-skills-v0`, {
        method: "POST"
      });
      const data = await res.json();
      setSkillsV0(data);
      // Synchronize in-progress V1 items
      setSkillsV1(JSON.parse(JSON.stringify(data)));
      if (data && data.length > 0) {
        setActiveSkillTab(data[0].id);
      }
      onRefresh();
      setActiveStep(5); // Auto jump to evaluation radar view
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompilingSkills(false);
    }
  };

  // Step 5: Automated quantitative assessment scoring & diagnostics
  const handleGradeSkills = async () => {
    setIsGrading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/evaluate-skills-v0`, {
        method: "POST"
      });
      const data = await res.json();
      setRadarScores(data.scores);
      setRadarVerdict(data.verdict);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGrading(false);
    }
  };

  // Step 6: Save edited Markdown changes
  const handleStartEditSkill = (skill: SkillItem) => {
    setEditingSkillId(skill.id);
    setEditingMarkdown(skill.markdown);
  };

  const handleSaveSkillEdit = () => {
    const updated = skillsV1.map(s => {
      if (s.id === editingSkillId) {
        return { ...s, markdown: editingMarkdown };
      }
      return s;
    });
    setSkillsV1(updated);
    setEditingSkillId(null);
    setSaveStatusMsg("修改已临时保存到内存缓冲区。");
    setTimeout(() => setSaveStatusMsg(""), 3500);
  };

  // Freeze final V1.0 skill system
  const handleFreezeV1 = async () => {
    setIsLockingV1(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/confirm-v1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: skillsV1 })
      });
      if (res.ok) {
        alert("恭喜！投研技能规范体系 V1.0 正式确认并冻结归档。当前可支持监测和自迭代。");
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLockingV1(false);
    }
  };

  // Simple copy simulator
  const handleDownloadSkillMarkdown = (skill: SkillItem) => {
    const element = document.createElement("a");
    const file = new Blob([skill.markdown], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${skill.id}_${skill.name}_V0.0.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Map values for Recharts radar
  const getRadarData = () => {
    if (!radarScores) return [];
    return Object.entries(radarScores).map(([key, value]) => ({
      subject: key,
      A: value,
      fullMark: 100,
    }));
  };

  return (
    <div id="skill-creation-wheel" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Left Stepper control panel */}
      <div className="lg:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
              一、Skill 自动生成路径
            </h3>
          </div>

          <div className="space-y-2">
            {[
              { num: 1, label: "框架初稿：海内外比对", active: activeStep === 1, done: !!project.frameworkDraft },
              { num: 2, label: "研究员审核：框架编辑", active: activeStep === 2, done: isResearcherConfirmed },
              { num: 3, label: "专家审核：融汇评审", active: activeStep === 3, done: isExpertConfirmed },
              { num: 4, label: "技能拆解：原子V0.0", active: activeStep === 4, done: skillsV0.length > 0 },
              { num: 5, label: "雷达检测：评测引擎", active: activeStep === 5, done: !!radarScores },
              { num: 6, label: "体系确证：出炉V1.0", active: activeStep === 6, done: !!project.skillsV1 }
            ].map(step => (
              <button
                key={step.num}
                id={`step-btn-${step.num}`}
                onClick={() => setActiveStep(step.num)}
                className={`w-full flex items-center justify-between p-3.5 rounded-lg text-left transition-all ${
                  step.active 
                    ? "bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-medium" 
                    : "bg-zinc-900 hover:bg-zinc-800/60 border border-zinc-800/40 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-mono border ${
                    step.active 
                      ? "bg-emerald-500 text-black border-emerald-400"
                      : step.done 
                        ? "bg-emerald-900/30 text-emerald-400 border-emerald-800"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                  }`}>
                    {step.num}
                  </span>
                  <span className="text-xs truncate max-w-[130px] lg:max-w-none">{step.label}</span>
                </div>
                {step.done && (
                  <CheckCircle2 id={`check-icon-${step.num}`} className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-800 text-[11px] text-zinc-500 space-y-2">
          <div>当前的产业基底：</div>
          <div className="text-zinc-300 font-mono text-xs font-semibold bg-zinc-950 p-2 rounded border border-zinc-850">
            {project.industry}
          </div>
          <div className="leading-relaxed">
            * 依照大中台数据模型，从海内外框架的工艺对碰出发，实现研究方法沉淀与资产包化。
          </div>
        </div>
      </div>

      {/* 2. Right Interactive visual stage */}
      <div className="lg:col-span-9 bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
        
        {/* STEP 1: IMPORT & FIRST DRAFT */}
        {activeStep === 1 && (
          <div id="creation-step-1" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <Import className="h-5 w-5 text-emerald-400 animate-pulse" />
                  【第一步】海内外研报搜集与对比生成框架初稿
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  拖入大厂研报、会议纪要、或是粘贴最新市场综述，AI会自动对碰海内外框架，解构分析维度。
                </p>
              </div>
              <span className="bg-zinc-800 text-zinc-300 text-[10px] font-mono px-2 py-1 rounded">
                STEP V0.0 PREPARATION
              </span>
            </div>

            {/* Ingestion interface */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-zinc-400 flex justify-between">
                    <span>研报/会议纪要导入区 (拖拽或粘贴文本)</span>
                    <span className="text-emerald-500 font-mono text-[10px]">Support MD/TXT/PDF</span>
                  </label>
                  <textarea
                    id="reports-textarea"
                    value={reportsText}
                    onChange={(e) => setReportsText(e.target.value)}
                    placeholder="[示例：拖拽此处或在此黏贴关于此固态电池/硅光材料的技术参数与竞品最新发布纪要...] "
                    className="w-full h-44 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-zinc-700"
                  />
                  
                  <div className="flex gap-2">
                    <button
                      id="preset-text-battery-btn"
                      type="button"
                      onClick={() => setReportsText("最新固态电池研报：丰田与三星全固态中试线爆料：正极涂层厚度压缩30%，并在界面压力封装中使用钛基弹性结构克服热收缩；而国内卫蓝半固态装车容量超150GWh，其界面加入氧化锆复合陶瓷涂覆防树枝晶穿刺效果显著。数据源需加入百川盈孚中试产量测算评估。")}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-2.5 py-1.5 rounded transition-colors"
                    >
                      💡 加载固态电池测试报料
                    </button>
                    <button
                      id="preset-text-cpo-btn"
                      type="button"
                      onClick={() => setReportsText("台积电最新硅光论坛：下代高速算力云大厂正式招标基于硅通孔（TSV）电气引脚在1.6T/3.2T CPO中的高频衰减规范；由于激光光源长期在85度温箱下运行，激光器失效率从以往年均1.8%骤降，光源测试应纳入抗反射损伤监测体系。")}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-2.5 py-1.5 rounded transition-colors"
                    >
                      💡 加载硅光/CPO测试报料
                    </button>
                  </div>
                </div>

                {/* Custom prompt configuration entrance */}
                <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-center bg-zinc-950/50 p-1 rounded">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span>研究框架抽取提示词配置</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSaveExtractionPrompt}
                      disabled={isSavingPrompt}
                      className="text-[10px] bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-2 py-0.5 rounded flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isSavingPrompt ? (
                        <>
                          <RotateCw className="h-2.5 w-2.5 animate-spin" />
                          <span>保存中...</span>
                        </>
                      ) : (
                        <>
                          <span>💾 保存提示词模板</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    AI将根据以下提示词指令对研报开展深层抽取（可自由编辑微调指令重点，完成后生成初稿）：
                  </p>
                  <textarea
                    id="extraction-prompt-input"
                    value={extractionPrompt}
                    onChange={(e) => setExtractionPrompt(e.target.value)}
                    placeholder="请输入自定义抽取提示词指令模板，规定如何识别并抽取核心工艺、量化指标和关键对标体系..."
                    className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded p-2 text-xs text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-zinc-700"
                  />
                  {promptSaveStatus === "success" && (
                    <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span>✓ 提示词抽取模板已成功固化保存至项目资产中！</span>
                    </div>
                  )}
                  {promptSaveStatus === "error" && (
                    <div className="text-[10px] text-red-1050 font-mono flex items-center gap-1">
                      <span>✗ 保存失败，请检查连接状态。</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview of ingestion queue */}
              <div className="bg-zinc-950 rounded-lg border border-zinc-850 p-4 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-zinc-300 mb-2.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    当前导入队列 & 研报缓存池 (2条)
                  </h5>
                  <div className="space-y-2 text-[10px] font-mono text-zinc-500">
                    <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850/40 flex justify-between items-center text-zinc-400">
                      <span>📌 Overseas_Tech_Trends_2026.pdf</span>
                      <span className="text-emerald-500 text-[9px]">已解析其安全TP机制</span>
                    </div>
                    <div className="bg-zinc-900/60 p-2 rounded border border-zinc-850/40 flex justify-between items-center text-zinc-400">
                      <span>📌 Domestic_SupplyChain_Costing_Q2.xlsx</span>
                      <span className="text-emerald-500 text-[9px]">SMM均值数据已洗涤</span>
                    </div>
                    <div className="p-4 border border-dashed border-zinc-800 rounded text-center text-zinc-650">
                      拖拽海海外一手路演纪要文件直接落入比对库
                    </div>
                  </div>
                </div>

                <button
                  id="generate-framework-btn"
                  onClick={handleGenerateFramework}
                  disabled={isGeneratingFramework}
                  className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {isGeneratingFramework ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" />
                      AI 正在深度解析并合成海内外双重视角...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      开始海内外对碰：生成核心框架初稿
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated results review */}
            {editableFramework && (
              <div id="framework-quick-preview" className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/40 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h5 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <GitCompare className="h-4 w-4 text-emerald-400" />
                    海内外差异分析预览与对碰结论
                  </h5>
                  <div className="flex gap-1">
                    {["domestic", "foreign", "comparison"].map((tab) => (
                      <button
                        key={tab}
                        id={`fw-preview-tab-${tab}`}
                        onClick={() => setActiveFrameworkTab(tab as any)}
                        className={`text-[10px] px-2.5 py-1 rounded transition-all capitalize ${
                          activeFrameworkTab === tab 
                            ? "bg-zinc-800 text-emerald-400 border border-zinc-700" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {tab === "domestic" ? "🇨🇳 国内研究框架" : tab === "foreign" ? "🌐 海外研究视角" : "📊 对比总结结论"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs leading-relaxed text-zinc-300 font-sans min-h-[50px] bg-zinc-950 p-3 rounded border border-zinc-900">
                  {activeFrameworkTab === "domestic" && editableFramework.domestic}
                  {activeFrameworkTab === "foreign" && editableFramework.foreign}
                  {activeFrameworkTab === "comparison" && editableFramework.comparison}
                </div>

                <div className="flex justify-end">
                  <button
                    id="step1-to-step2-btn"
                    onClick={() => setActiveStep(2)}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
                  >
                    结构化分析指标编辑（第一步完毕，前进） <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: RESEARCHER REVIEWS & EDITS */}
        {activeStep === 2 && (
          <div id="creation-step-2" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  【第二步】AI投研研究员人工审核确认框架初稿
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  作为核心产出，你可以直接修改分析维度范畴、扩充关键高新指标，或调整底层加工逻辑。
                </p>
              </div>
              <span className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[10px] px-2.5 py-1 rounded">
                可修改交互式面板
              </span>
            </div>

            {editableFramework ? (
              <div className="space-y-6">
                
                {/* Editable Table 1: Dimension Table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      模块一：分析维度、范畴与关键指标定义
                    </h5>
                    <button
                      id="add-dimension-row-btn"
                      onClick={handleAddDimensionRow}
                      className="text-[10px] bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> 添加维度
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-950 text-zinc-400 font-mono text-[10px] border-b border-zinc-800">
                          <th className="p-3 w-[20%]">分析维度</th>
                          <th className="p-3 w-[45%]">分析范畴 (研究重点与深度描述)</th>
                          <th className="p-3 w-[30%]">关键物理/核心指标</th>
                          <th className="p-3 w-[5%] text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-sans">
                        {editableFramework.dimensions.map((row, idx) => (
                          <tr key={idx} className="bg-zinc-900/40 text-zinc-300 hover:bg-zinc-850/20">
                            <td className="p-2">
                              <input
                                id={`dim-input-${idx}`}
                                type="text"
                                value={row.dimension}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dimensions[idx].dimension = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-emerald-500 font-medium"
                              />
                            </td>
                            <td className="p-2">
                              <textarea
                                id={`scope-input-${idx}`}
                                rows={2}
                                value={row.scope}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dimensions[idx].scope = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:ring-1 focus:ring-emerald-500 font-mono leading-relaxed"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                id={`metrics-input-${idx}`}
                                type="text"
                                value={row.metrics}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dimensions[idx].metrics = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950/80 border border-zinc-800 rounded px-2 py-1 text-xs text-emerald-400 focus:ring-1 focus:ring-emerald-500 font-mono"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                id={`remove-dim-btn-${idx}`}
                                onClick={() => handleRemoveDimensionRow(idx)}
                                className="text-zinc-650 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mathematical Models */}
                <div className="space-y-2 bg-zinc-950 p-4 rounded-lg border border-zinc-850">
                  <h5 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    模块二：主导研究模型或物理学计算公式 ($ LaTeX 仿真)
                  </h5>
                  <textarea
                    id="formula-text-input"
                    rows={4}
                    value={editableFramework.formula}
                    onChange={(e) => {
                      const updated = { ...editableFramework };
                      updated.formula = e.target.value;
                      setEditableFramework(updated);
                    }}
                    className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>

                {/* Editable Table 2: Data Acquisition table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      模块三：数据获取声明与口径方向核对
                    </h5>
                    <button
                      id="add-data-row-btn"
                      onClick={handleAddDataRow}
                      className="text-[10px] bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <Plus className="h-3 w-3" /> 扩充数据源
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-950 text-zinc-400 font-mono text-[10px] border-b border-zinc-800">
                          <th className="p-3 w-[10%]">数据ID</th>
                          <th className="p-3 w-[20%]">监测指标名称</th>
                          <th className="p-3 w-[30%]">核心描述/物理投研原理</th>
                          <th className="p-3 w-[20%]">加工衍生逻辑</th>
                          <th className="p-3 w-[17%]">可能来源方向</th>
                          <th className="p-3 w-[3%] text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 font-sans">
                        {editableFramework.dataAcquisition.map((row, idx) => (
                          <tr key={idx} className="bg-zinc-900/40 text-zinc-300 hover:bg-zinc-850/20">
                            <td className="p-3 font-mono text-zinc-500 text-[11px] font-bold">{row.id}</td>
                            <td className="p-2">
                              <input
                                id={`data-name-${idx}`}
                                type="text"
                                value={row.name}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dataAcquisition[idx].name = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                id={`data-desc-${idx}`}
                                type="text"
                                value={row.desc}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dataAcquisition[idx].desc = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-400 focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                id={`data-logic-${idx}`}
                                type="text"
                                value={row.logic}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dataAcquisition[idx].logic = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-455 focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                id={`data-source-${idx}`}
                                type="text"
                                value={row.source}
                                onChange={(e) => {
                                  const updated = { ...editableFramework };
                                  updated.dataAcquisition[idx].source = e.target.value;
                                  setEditableFramework(updated);
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 text-xs text-emerald-400/90 focus:ring-1 focus:ring-emerald-500 font-mono"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                id={`remove-data-btn-${idx}`}
                                onClick={() => handleRemoveDataRow(idx)}
                                className="text-zinc-650 hover:text-rose-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Save actions */}
                <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <AlertCircle className="h-4 w-4 text-emerald-400" />
                    <span>确认无误后，点击确认将产生一个具有海低耦合的研究框架基线方案。</span>
                  </div>
                  <button
                    id="confirm-framework-draft-btn"
                    onClick={handleConfirmFrameworkDraft}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2 px-5 rounded-lg transition-all flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    我已确认初稿（前进至专家评审）
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg text-zinc-550">
                请先返回【第一步】加载研报并合成初始框架。
              </div>
            )}
          </div>
        )}

        {/* STEP 3: EXPERT REVIEW PANEL */}
        {activeStep === 3 && (
          <div id="creation-step-3" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-400" />
                  【第三步】提交专家组评审与框架定稿调整
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  该环节对应投研平台向行业老兵专家发出外部询价或问卷。汇总反馈并对框架做最后的订正。
                </p>
              </div>
              <span className="bg-amber-950/40 border border-amber-800 text-amber-400 text-[10px] px-2.5 py-1 rounded">
                专家咨询会汇聚点
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Expert feedback block */}
              <div className="md:col-span-5 bg-zinc-950 rounded-lg p-5 border border-zinc-850 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-black font-semibold text-[10px] px-1.5 py-0.5 rounded">外部询证</span>
                    <h5 className="text-xs font-bold text-zinc-300">专家评审独立意见</h5>
                  </div>
                  <button
                    type="button"
                    id="add-new-expert-trigger-btn"
                    onClick={() => {
                      setIsAddingNewExpert(true);
                      setEditingExpertId(null);
                      setExpertForm({
                        name: "",
                        title: "",
                        comment: "",
                        status: "conditional",
                        avatarColor: "sky"
                      });
                    }}
                    className="text-[10px] bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-400 py-1 px-2 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-2.5 w-2.5" />
                    添加专家
                  </button>
                </div>

                {/* Form to Add / Edit */}
                {(editingExpertId || isAddingNewExpert) && (
                  <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3 animate-in slide-in-from-top-2 duration-250">
                    <div className="text-xs font-bold text-white flex justify-between items-center">
                      <span className="text-emerald-400 font-mono text-[11px]">
                        {isAddingNewExpert ? "➕ 添加新专家意见" : "⚙️ 配置专家独立意见"}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingExpertId(null);
                          setIsAddingNewExpert(false);
                        }} 
                        className="text-zinc-400 hover:text-white text-[11px] font-mono underline"
                      >
                        取消
                      </button>
                    </div>

                    <div className="space-y-2 mt-1">
                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">专家学者姓名 *</label>
                        <input
                          type="text"
                          value={expertForm.name}
                          onChange={(e) => setExpertForm({ ...expertForm, name: e.target.value })}
                          placeholder="例如: 林文生 教授"
                          className="w-full text-xs bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded px-2.5 py-1 text-white outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">职称 / 代表机构与背书 *</label>
                        <input
                          type="text"
                          value={expertForm.title}
                          onChange={(e) => setExpertForm({ ...expertForm, title: e.target.value })}
                          placeholder="例如: 中科院物理所新型材料实验室总工程师"
                          className="w-full text-xs bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded px-2.5 py-1 text-white outline-none font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">态度倾向</label>
                          <select
                            value={expertForm.status}
                            onChange={(e) => setExpertForm({ ...expertForm, status: e.target.value as any })}
                            className="w-full text-[11px] bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded p-1 text-white outline-none font-mono"
                          >
                            <option value="agreed">✔️ 同意定稿</option>
                            <option value="conditional">⏳ 补充修正</option>
                            <option value="need_tweak">❌ 驳回纠偏</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">视觉主题色</label>
                          <div className="flex gap-1.5 pt-1.5">
                            {["amber", "emerald", "blue", "purple", "sky", "rose"].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setExpertForm({ ...expertForm, avatarColor: c })}
                                className={`w-4 h-4 rounded-full border transition-all ${
                                  expertForm.avatarColor === c ? "border-white ring-1 ring-emerald-400 scale-110" : "border-transparent opacity-60 hover:opacity-100"
                                } ${
                                  c === "amber" ? "bg-amber-400" :
                                  c === "emerald" ? "bg-emerald-400" :
                                  c === "blue" ? "bg-blue-400" :
                                  c === "purple" ? "bg-purple-400" :
                                  c === "sky" ? "bg-sky-400" : "bg-rose-400"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-400 block mb-0.5 font-mono">具体指正意见 *</label>
                        <textarea
                          rows={4}
                          value={expertForm.comment}
                          onChange={(e) => setExpertForm({ ...expertForm, comment: e.target.value })}
                          placeholder="填写专家做出的反馈细节与指标微调指正意见。"
                          className="w-full text-xs bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded p-2 text-white outline-none font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveSingleExpert}
                      disabled={isSavingOpinions}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black font-extrabold text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isSavingOpinions ? "⏳ 正在同步到云端..." : "💾 确认意见并更新同步"}
                    </button>
                  </div>
                )}

                {/* Separated List display */}
                <div id="expert-opinions-list" className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {localExperts.map((exp, idx) => (
                    <div 
                      key={exp.id || idx} 
                      className={`p-3.5 rounded-lg bg-zinc-900/60 border transition-all relative group ${
                        editingExpertId === exp.id 
                          ? "border-emerald-500/75 shadow-md shadow-emerald-950/30" 
                          : exp.status === 'agreed'
                            ? "border-zinc-850/60 hover:border-emerald-500/20"
                            : exp.status === 'need_tweak'
                              ? "border-zinc-850/60 hover:border-rose-500/20"
                              : "border-zinc-850/60 hover:border-amber-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-mono font-black text-black select-none ${
                          exp.avatarColor === 'emerald' ? 'bg-emerald-400' :
                          exp.avatarColor === 'blue' ? 'bg-blue-400' :
                          exp.avatarColor === 'purple' ? 'bg-purple-300' :
                          exp.avatarColor === 'sky' ? 'bg-sky-400' :
                          exp.avatarColor === 'rose' ? 'bg-rose-400' : 'bg-amber-400'
                        }`}>
                          {exp.name ? exp.name.slice(0, 2) : "学"}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h6 className="text-[11px] font-bold text-zinc-100 font-mono">{exp.name}</h6>
                            <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border inline-block ${
                              exp.status === 'agreed'
                                ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400"
                                : exp.status === 'need_tweak'
                                  ? "bg-rose-950/30 border-rose-500/20 text-rose-400"
                                  : "bg-amber-950/30 border-amber-500/20 text-amber-400"
                            }`}>
                              {exp.status === 'agreed' ? "✔️ 同意" : 
                               exp.status === 'need_tweak' ? "❌ 驳回" : "⚠️ 需修改"}
                            </span>
                          </div>
                          
                          <p className="text-[9.5px] text-zinc-400 leading-tight font-mono">{exp.title}</p>
                          <p className="text-[10.5px] text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap pt-1">{exp.comment}</p>
                          
                          {/* Card Actions */}
                          <div className="flex items-center justify-end gap-3.5 pt-1.5 border-t border-zinc-800/40 mt-1.5 opacity-80 group-hover:opacity-100 transition-opacity text-[10px]">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingExpertId(exp.id);
                                setIsAddingNewExpert(false);
                                setExpertForm({
                                  name: exp.name,
                                  title: exp.title,
                                  comment: exp.comment,
                                  status: exp.status,
                                  avatarColor: exp.avatarColor || "amber"
                                });
                              }}
                              className="text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer font-mono flex items-center gap-0.5"
                            >
                              🛠️ 配置
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`确认要删除专家 ${exp.name} 的单独评语意见吗？`)) {
                                  const updated = localExperts.filter(item => item.id !== exp.id);
                                  setLocalExperts(updated);
                                  saveExpertOpinionsToBackend(updated);
                                }
                              }}
                              className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer font-mono"
                            >
                              🗑️ 移除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {localExperts.length === 0 && (
                    <div className="text-center py-6 text-zinc-550 text-xs font-mono">
                      暂无独立专家意见，请点击右上角添加。
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-zinc-500 leading-relaxed">
                  * 专家核心考量：是否具备一线生产线的真实指导效用。指标要精，去除纯学术、无法被连续跟踪的空洞概念。
                </div>
              </div>

              {/* Framework tweak on researcher hand */}
              <div className="md:col-span-7 bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
                <h5 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-emerald-400 animate-pulse" />
                  基于评审一键纠偏/微调框架 (在模块一中完成)
                </h5>

                <div className="p-4 bg-zinc-950 rounded border border-zinc-850 space-y-3">
                  <div className="text-xs text-zinc-300">
                    💡 **人工快捷纠偏动作引导** (建议添加以下专业细节)：
                  </div>
                  <div className="text-[11px] text-zinc-400 space-y-1.5 font-mono">
                    <div>1. 在‘工艺与量产线’维度添加：<code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded ml-1">干极片溶剂残留(ppm)</code></div>
                    <div>2. 在‘数据声明’第5项扩展：<code className="text-emerald-400 bg-zinc-900 px-1 py-0.5 rounded ml-1">海外海运仓储周期与折旧影响</code></div>
                  </div>
                  <button
                    id="mock-apply-expert-btn"
                    onClick={() => {
                      if (editableFramework) {
                        const updated = { ...editableFramework };
                        const hasIt = updated.dimensions.some(d => d.metrics.includes("残存"));
                        if (!hasIt) {
                          updated.dimensions[1].metrics += ", 干法工艺溶剂残留度(ppm)";
                          updated.dataAcquisition.push({
                            id: "D05",
                            name: "高精封装微裂隙一次品率",
                            desc: "由生产设备出片精度带来的折损边界",
                            logic: "月度抽检批次",
                            source: "一线中试车间回馈"
                          });
                          setEditableFramework(updated);
                          alert("专家主要纠偏点已被自动补入到框架暂存区中！");
                        } else {
                          alert("专家意见已经处于集成状态。");
                        }
                      }
                    }}
                    className="w-full text-xs bg-zinc-820 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 py-1.5 rounded transition-colors"
                  >
                    🛠️ 一键将专家补充件并入暂存区
                  </button>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-between">
                  <button
                    id="back-to-step2-btn"
                    onClick={() => setActiveStep(2)}
                    className="text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    返回第二步细化编辑
                  </button>

                  <button
                    id="confirm-expert-review-btn"
                    onClick={handleConfirmExpertReview}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2 px-4 rounded transition-all"
                  >
                    已整合完毕，框架定稿封版 ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: GENERATIVE ATOMIC SKILLS (V0.0) */}
        {activeStep === 4 && (
          <div id="creation-step-4" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  【第四步】自动切片/拆解为原子化研究 Skill 规范 V0.0
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  依据定稿框架中海内外对碰模型，飞轮平台将研究员成果沉淀为：主体维度（竞争力、业务、估值）和 行业维度（景气度、格局物色）的原子化 markdown 标准。
                </p>
              </div>
              <span className="bg-emerald-950/30 border border-emerald-900 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded">
                ATOMIC DISSECTION MODEL
              </span>
            </div>

            <div className="bg-zinc-950 rounded-lg p-5 border border-zinc-850 text-center space-y-4">
              <div className="max-w-md mx-auto space-y-2">
                <h5 className="text-sm font-semibold text-zinc-200">
                  行业与主体两大视角体系解构说明
                </h5>
                <p className="text-zinc-400 text-xs">
                  每个原子Skill负责解决一个具体的极窄痛点。更新条件明确、且包含规范步骤和固定数据源，保证新人研究员调用该Skill也能产出同级专业结论。
                </p>
              </div>

              {skillsV0.length === 0 ? (
                <div className="pt-4">
                  <button
                    id="compile-skills-btn"
                    onClick={handleGenerateSkillsV0}
                    disabled={isCompilingSkills}
                    className="mx-auto bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-3 px-6 rounded-xl flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isCompilingSkills ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        AI 正在把大红框架解构拆解为原子化 Markdown 技能系统...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        一键自动生成特定行业研究 Skill 体系 V0.0
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="bg-emerald-950/30 border border-emerald-950 text-emerald-400 text-xs p-3 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>原子技能模块解构完成！拆解为行业层面的景气研判Skill及主体层面的财务/估值Skill。</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillsV0.map((skill) => (
                      <div
                        key={skill.id}
                        id={`skill-card-${skill.id}`}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              skill.category === "industry" 
                                ? "bg-cyan-950 text-cyan-400 border border-cyan-800" 
                                : "bg-purple-950 text-purple-400 border border-purple-800"
                            }`}>
                              {skill.category === "industry" ? "行业景气度类" : "主体竞争力类"}
                            </span>
                            <span className="text-zinc-500 text-[10px] font-mono">{skill.id}</span>
                          </div>
                          
                          <h6 className="text-xs font-bold text-white leading-snug">{skill.name}</h6>
                          
                          <div className="text-[11px] text-zinc-400 leading-relaxed max-h-[72px] overflow-y-auto pr-1">
                            <span className="text-zinc-500 font-bold block mb-0.5">解决问题：</span>
                            {skill.problemSolved}
                          </div>

                          <div className="text-[10px] text-emerald-400 font-mono">
                            <span className="text-zinc-500 block mb-0.5">更新触发条件：</span>
                            {skill.triggers}
                          </div>
                        </div>

                        <div className="pt-3.5 mt-3.5 border-t border-zinc-850 flex justify-between items-center text-[10px]">
                          <span className="text-zinc-500">负责人: <span className="text-zinc-300 font-medium">{skill.owner}</span></span>
                          <button
                            id={`dl-v0-btn-${skill.id}`}
                            onClick={() => handleDownloadSkillMarkdown(skill)}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                          >
                            <Download className="h-3 w-3" /> 下载 MD 规范
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end p-2">
                    <button
                      id="v0-to-v1-radar-btn"
                      onClick={() => setActiveStep(5)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      点击进入自动化算法评测与雷达呈现 <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: AUTOMATED CRITICAL GRADING RADAR */}
        {activeStep === 5 && (
          <div id="creation-step-5" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  【第五步】多物理投研维度自动检测评测，生成评分雷达
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  评测引擎回扫数据质量与逻辑成因。量化评估该原子技能指标是否能达到入库标准。
                </p>
              </div>
              <span className="bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[10px] px-2.5 py-1 rounded font-mono">
                QUANTITATIVE RADAR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Left text feedback */}
              <div className="md:col-span-12 lg:col-span-5 bg-zinc-950 border border-zinc-850 rounded-lg p-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-zinc-850 pb-2">
                    <span className="bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">AI 评测报告</span>
                    <h5 className="text-xs font-semibold text-zinc-300">数据源健全度与回测评估诊断</h5>
                  </div>

                  {radarVerdict ? (
                    <div id="verdict-display-text" className="text-xs font-mono text-zinc-300 leading-relaxed bg-zinc-900/40 p-4 rounded border border-zinc-850 whitespace-pre-line">
                      {radarVerdict}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/20 p-4 rounded border border-zinc-850/60 flex items-center gap-2">
                      <AlertCircle className="text-emerald-500 h-5 w-5 shrink-0" />
                      <span>尚未触发评测。请在右侧一键唤醒“算法自动评测”按钮。</span>
                    </div>
                  )}
                  
                  <div className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-900/25 p-3 rounded">
                    📌 **打分依据规范**：
                    <br />
                    1. 维度完整(指海内外对套)；2. 逻辑坚固(指更新触发指标无盲区)；3. 数据覆盖(指直接取数ID是否可追溯)。
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-850 mt-4">
                  <button
                    id="trigger-grade-btn"
                    onClick={handleGradeSkills}
                    disabled={isGrading}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow active:scale-[0.98] disabled:opacity-50"
                  >
                    {isGrading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        评测芯片正在遍历回推诊断中...
                      </>
                    ) : (
                      <>
                        <RotateCw className="h-4 w-4" />
                        一键唤醒评测：生成 Skill 评分雷达
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right graphical radar */}
              <div className="md:col-span-12 lg:col-span-7 bg-zinc-950 border border-zinc-850 rounded-lg p-5 flex flex-col justify-center items-center">
                <h5 className="text-xs font-semibold text-zinc-300 self-start mb-4">自动评分模型 (评测结果)</h5>
                
                {radarScores ? (
                  <div id="radar-container" className="w-full h-[260px] flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a' }} />
                        <Radar
                          name="V0.0 Skill得分"
                          dataKey="A"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.15}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, fill: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[260px] flex flex-col justify-center items-center text-zinc-650 text-xs">
                    <AlertTriangle className="h-8 w-8 text-zinc-700 mb-2" />
                    <span>评测未启动，雷达无投影。请在左侧点击启用。</span>
                  </div>
                )}

                {radarScores && (
                  <div className="flex justify-end w-full mt-4">
                    <button
                      id="radar-to-step6-btn"
                      onClick={() => setActiveStep(6)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      对评定点进行人工校准整理 ➔
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* STEP 6: HUMAN INTERVENTION & LOCK V1.0 */}
        {activeStep === 6 && (
          <div id="creation-step-6" className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  【第六步】研究员基于专业分析人工微调，形成定稿规范 V1.0
                </h4>
                <p className="text-zinc-400 text-xs mt-1">
                  作为最终把关，高级研究员可以修正自动解构出的 Markdown 规范（编辑分析步骤或引入新数据门槛），然后一键确认归档。
                </p>
              </div>
              <span className="bg-emerald-950/20 border border-emerald-900 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded font-mono">
                FINAL RATIFICATION V1.0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Skills selector listing */}
              <div className="md:col-span-4 bg-zinc-950 rounded-lg p-4 border border-zinc-850 space-y-2">
                <h5 className="text-xs font-semibold text-zinc-450 uppercase tracking-widest mb-3">技能子项选择器</h5>
                
                {skillsV1.map((skill) => (
                  <button
                    key={skill.id}
                    id={`ratify-skill-tab-${skill.id}`}
                    onClick={() => {
                      setActiveSkillTab(skill.id);
                      setEditingSkillId(null); // Reset pending text editor
                    }}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-colors border ${
                      activeSkillTab === skill.id 
                        ? "bg-zinc-900 text-emerald-400 border-zinc-700" 
                        : "bg-zinc-950 text-zinc-400 border-transparent hover:bg-zinc-900/60"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-zinc-500">
                      <span>{skill.id} (当前V1.0自编辑区)</span>
                      <span className="text-emerald-500 font-bold">1.0 Draft</span>
                    </div>
                    <div className="font-bold truncate text-white">{skill.name}</div>
                  </button>
                ))}

                <div className="pt-4 border-t border-zinc-850 mt-4 text-[10px] text-zinc-500 leading-relaxed">
                  * 编撰技巧：凡是涉及参数门槛的细节，可以用加粗形式在 Markdown 内做标注。
                </div>
              </div>

              {/* Editable Markdown / Display panel */}
              <div className="md:col-span-8 bg-zinc-950 rounded-lg p-5 border border-zinc-850 space-y-4">
                {skillsV1.map((skill) => {
                  if (skill.id !== activeSkillTab) return null;
                  const isEditing = editingSkillId === skill.id;

                  return (
                    <div key={skill.id} id={`skill-ratify-view-${skill.id}`} className="space-y-4">
                      
                      <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                        <div>
                          <span className="text-zinc-500 text-[10px] font-mono">文案在线审核</span>
                          <h6 className="text-xs font-bold text-white capitalize">{skill.name}</h6>
                        </div>
                        
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                id="save-skill-edit-btn"
                                onClick={handleSaveSkillEdit}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-3 py-1 rounded transition-colors"
                              >
                                保存修改到内存
                              </button>
                              <button
                                id="cancel-skill-edit-btn"
                                onClick={() => setEditingSkillId(null)}
                                className="text-[10px] bg-zinc-800 hover:bg-zinc-750 text-zinc-300 px-3 py-1 rounded"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <button
                              id="edit-skill-btn"
                              onClick={() => handleStartEditSkill(skill)}
                              className="text-[10px] bg-zinc-800 hover:bg-zinc-750 text-emerald-400 px-3 py-1.5 rounded transition-colors"
                            >
                              ✍️ 手工订正本章 Markdown
                            </button>
                          )}
                        </div>
                      </div>

                      {saveStatusMsg && (
                        <div className="bg-emerald-950/40 text-emerald-400 text-[10px] p-2 rounded text-center">
                          {saveStatusMsg}
                        </div>
                      )}

                      {/* Display Markdown or Show text editor */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="text-[10px] text-zinc-500 font-mono">双向互认 Markdown 编者</label>
                          <textarea
                            id="skill-markdown-editor"
                            value={editingMarkdown}
                            onChange={(e) => setEditingMarkdown(e.target.value)}
                            className="w-full h-80 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                          />
                        </div>
                      ) : (
                        <div className="text-xs leading-relaxed space-y-4 font-sans max-h-80 overflow-y-auto bg-zinc-900/40 p-4 rounded border border-zinc-900">
                          {/* Render Markdown string cleanly */}
                          <div className="prose prose-invert prose-xs max-w-none text-zinc-300">
                            <pre className="whitespace-pre-wrap font-sans font-normal text-xs text-zinc-200">
                              {skill.markdown}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Final Freeze Submit button */}
                      {!isEditing && (
                        <div className="pt-4 border-t border-zinc-850 flex justify-between items-center">
                          <div className="text-[10.5px] text-zinc-500 flex items-center gap-1">
                            <Lock className="h-3 w-3 text-amber-500" />
                            确认封版后，该体系将作为运营监控的初始比对锚。
                          </div>

                          <button
                            id="freeze-v1-btn"
                            onClick={handleFreezeV1}
                            disabled={isLockingV1}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2 px-5 rounded-lg flex items-center gap-1.5 transition-all shadow"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            确认研究 Skill 体系 V1.0 定稿 ➔
                          </button>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
