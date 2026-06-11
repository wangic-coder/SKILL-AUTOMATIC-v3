import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, AlertCircle, X, Check, Brain, Loader2 } from "lucide-react";

interface UploadProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (projectId: string, initialText: string) => void;
}

export default function UploadProjectModal({ isOpen, onClose, onCreated }: UploadProjectModalProps) {
  const [name, setName] = useState<string>("");
  const [theme, setTheme] = useState<string>("");
  const [reportsText, setReportsText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process selected file
  const processFile = (file: File) => {
    if (!file) return;
    
    setFileName(file.name);
    // Convert file size to KB/MB
    const sizeStr = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(2) + " MB" 
      : (file.size / 1024).toFixed(1) + " KB";
    setFileSize(sizeStr);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setReportsText(text);
        
        // Auto-fill custom industry name from file name if name is empty
        if (!name) {
          const guessedName = file.name
            .replace(/\.[^/.]+$/, "") // remove extension
            .replace(/[-_]/g, " ")     // replace dashes/underscores
            .trim();
          setName(guessedName);
        }
      }
    };
    reader.onerror = () => {
      setErrorMsg("无法解析该报告文件，可能内容已损坏或编码不支持。");
    };
    
    // Read as plain text (supports txt, md, json, csv, etc.)
    reader.readAsText(file);
  };

  // Drag handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Regular input handler
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const loadPresetTestReport = () => {
    setName("AI人形机器人 (AI Humanoid Robotics)");
    setTheme("高扭矩减速器自研率及新型谐波传动结构对装整制造成本敏感性分析");
    setReportsText(`【人形机器人前沿工艺分析】\n由于特斯拉Optimus Gen3和波士顿动力最新Atlas中试线参数泄露：其旋转关节的谐波减速机由于需要承受240Nm扭矩衰减，海外巨头正全面尝试将原有的渗碳钢换为硬度达HRC62的氮化金属陶瓷复合高纯钛粉材料，极大地缩减了装机空间与润滑寿命。国内绿的谐波、双环传动在中试层面实现了相似工艺适配，其单套关节一次合格直通率从第一季度的65%飙增到78%，使整装综合材料配比成本降低了24%。数据监测需结合WIND出关海量工业件口径做进一步清洗推估。`);
    setFileName("Humanoid_Robotics_Industry_Report_2026.md");
    setFileSize("3.8 KB");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg("请填写投资聚焦的赛道或产业名称（例如：人形机器人、半导体量测等）。");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          theme: theme.trim() || undefined,
          reportsText: reportsText.trim()
        })
      });

      if (!res.ok) {
        throw new Error("后端接口返回异常");
      }

      const data = await res.json();
      onCreated(data.id, reportsText.trim());
      onClose();
    } catch (e) {
      console.error(e);
      setErrorMsg("无法提交创建，请检查投研飞轮中台连接是否正常。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div 
        id="upload-modal-container"
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-850 rounded-2xl p-6 shadow-2xl relative space-y-5 animate-in fade-in duration-200"
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/15 rounded-lg border border-emerald-500/20 text-emerald-400">
              <Brain className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">手工上传研究报告 • 开启全新产业自演进</h3>
              <p className="text-[10.5px] text-zinc-500 mt-0.5">上传前沿产业调研、会议纪要与商业文书，自动解构出海内外特异分析框架及雷达极性指标</p>
            </div>
          </div>
          <button 
            id="close-upload-modal-btn"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Form area */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium">1. 聚焦产业名称 (必填)</label>
              <input
                id="modal-industry-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：人形机器人、低温超导材料、AI智能眼镜..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] text-zinc-400 font-medium">2. 研究主题/核心痛点 (选填)</label>
              <input
                id="modal-theme"
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="例如：先进减速机构件自研率及物理直通良件核算..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-400 font-medium">3. 拖入或选取最新研究报告 / 调研文件</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept=".txt,.md,.json,.csv,.xlsx,.xls,.pdf"
              className="hidden" 
            />
            
            <div
              id="upload-dropzone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border border-dashed rounded-xl p-5.5 text-center flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
                isDragging 
                  ? "border-emerald-500 bg-emerald-950/20 text-emerald-300"
                  : fileName
                    ? "border-emerald-500/45 bg-zinc-900/40" 
                    : "border-zinc-800 bg-zinc-900/25 hover:bg-zinc-900/60 text-zinc-400"
              }`}
            >
              {fileName ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-emerald-950/50 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-zinc-200">{fileName}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">大小: {fileSize} • 报告文本内容已成功提取解析 ✅</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-zinc-850 px-2.5 py-1 rounded hover:bg-zinc-800">
                    更换其他研究报告
                  </span>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-300">
                      将文件 <span className="text-emerald-400">拖到此处</span>，或 <span className="text-emerald-400">点击浏览</span> 选取
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                      建议大厂深度研报、产业调研纪要等。支持 .txt, .md, .csv 或 .json 文件 
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Live read-out editable box */}
          {reportsText.trim() && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex justify-between items-center text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  研报内容实时预览 & 人工订正区
                </span>
                <span className="font-mono text-zinc-550">共 {reportsText.length} 字</span>
              </div>
              <textarea
                id="modal-report-textarea"
                value={reportsText}
                onChange={(e) => setReportsText(e.target.value)}
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-[11px] text-zinc-350 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 leading-relaxed"
                placeholder="在此细微修改解析出的研报段落，以便更精确地喂入对碰引擎..."
              />
            </div>
          )}

          {/* Quick loading simulator feedback */}
          {!fileName && (
            <div className="flex justify-between items-center p-3.5 rounded-lg border border-zinc-900 bg-zinc-900/20 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 leading-none">
                <AlertCircle className="h-4 w-4 text-emerald-400" />
                如果没有本地研报：
              </span>
              <button
                id="preset-loader-btn"
                onClick={loadPresetTestReport}
                className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline decoration-dotted underline-offset-3"
              >
                📥 智能一键加载：人形机器人前沿内参段落进行全链路测试
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions line */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-900">
          <button
            id="modal-cancel-btn"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            id="modal-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors shadow flex items-center gap-1.5 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在智能解构产业链路...
              </>
            ) : (
              <>
                <Brain className="h-3.5 w-3.5" />
                一键入库，启动全链路投研
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
