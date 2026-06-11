import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const PORT = 3000;

interface GeminiStatus {
  configured: boolean;
  verified: boolean;
  error: string | null;
}

const geminiStatus: GeminiStatus = {
  configured: false,
  verified: false,
  error: null
};

// Initialize Gemini SDK with recommended pattern
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    geminiStatus.configured = true;
    console.log("Gemini API Client initialized, awaiting validation probe.");
  } else {
    console.log("No GEMINI_API_KEY found or it has default value. Falling back to pre-built expert generator.");
    geminiStatus.error = "No custom GEMINI_API_KEY configured. Active fallback system is running.";
  }
} catch (e: any) {
  geminiStatus.error = e.message || String(e);
  console.error("Failed to initialize Gemini API Client:", e);
}

// Background validation probe
async function verifyGeminiKey() {
  if (!geminiStatus.configured || !ai) {
    geminiStatus.verified = false;
    return;
  }
  try {
    console.log("Probing Gemini API key validity with a health check request...");
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Ping. Simply reply with the word OK",
      config: {
        maxOutputTokens: 2,
      }
    });
    geminiStatus.verified = true;
    geminiStatus.error = null;
    console.log("Gemini API key successfully verified. Live AI Generation is fully ACTIVE.");
  } catch (err: any) {
    geminiStatus.verified = false;
    geminiStatus.error = err.message || String(err);
    console.warn("Gemini API validation probe failed. In-Memory fallback system will be used. Error:", geminiStatus.error);
  }
}

// In-memory runtime state for the AI Investment Research Flywheel Platform
// This stores active research projects, frameworks, generated skill files, monitoring events, etc.
interface ResearchProject {
  id: string;
  industry: string;
  theme: string;
  frameworkDraft: {
    domestic: string;
    foreign: string;
    comparison: string;
    dimensions: Array<{ dimension: string; scope: string; metrics: string }>;
    formula: string;
    dataAcquisition: Array<{ id: string; name: string; desc: string; logic: string; source: string }>;
  };
  confirmedFramework: any | null;
  expertPanelFeedback: string;
  isExpertReviewed: boolean;
  skillsV0: Array<{
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
  }>;
  radarScoresV0: Record<string, number>;
  skillsV1: any[] | null;
  monitoringSignals: Array<{
    id: string;
    category: "news" | "policy" | "report" | "social" | "data" | "competitor" | "feedback";
    source: string;
    title: string;
    content: string;
    timestamp: string;
    severity: "high" | "medium" | "low";
    implications: string;
    status: "pending" | "applied" | "ignored";
  }>;
  optimizationTargets: Array<{
    id: string;
    title: string;
    description: string;
    skillMatches: string[];
    confirmed: boolean;
  }>;
  skillsV1_1: any[] | null;
  radarScoresV1_1: Record<string, number> | null;
  skillsV2: any[] | null;
}

const db: { projects: Record<string, ResearchProject> } = {
  projects: {}
};

// Seed initial project data
const PRESETS: Record<string, any> = {
  "solid-state-battery": {
    industry: "固态电池 (Solid-State Batteries)",
    theme: "海内外全固态电池技术路径与商业化量产竞争力研判",
    frameworkDraft: {
      domestic: "重点关注硫化物/氧化物/聚合物等材料体系的技术开发。国内更聚焦于正负极材料以及固态电解质的固相法、液相法制备工艺，关注混料、涂布、辊压、极片干燥等制造工艺改造，以及干电极技术在固态电池中的适配度。国内企业倾向于通过半固态逐步过渡到全固态，商业化路径和整车测试较为渐进。",
      foreign: "海外（以丰田、三星SDI、QuantumScape等为代表）更加注重系统层面的专利壁垒，偏好一步到位的“全固态”路线。核心聚焦在安全热失控阀值、超高压力封装系统设计（TP机制）、全温区工作指标、高倍率放电性能、资源战略合作（如锂、硫原材料等）及知识产权覆盖度上。",
      comparison: "国内重生产工艺和产业链成本，具有快速迭代和工程化制造成本优势；海外重前沿专利、物理模型及原位失效表征，其系统安全性与大Pack设计理念领先。结合两者能够构建一个兼顾制备成本、物料配比与整车放电环境适配度的最强全固态研究模型。",
      dimensions: [
        { dimension: "技术路线迭代", scope: "硫化物/氧化物/聚合物三大主流体路线开发、界面阻抗克克服", metrics: "离子电导率(mS/cm)、界面电阻(Ω·cm²)、热稳定性温度(°C)" },
        { dimension: "关键材料演进", scope: "超薄超宽锂金属负极、硅碳负极、单晶富锂高压正负极配位", metrics: "负极厚度(μm)、比容量(mAh/g)、材料克容量发挥率(%)" },
        { dimension: "工艺与量产线", scope: "干法极片成膜、双面混压、固态电解质共烧结与连续装配良品率", metrics: "烧结温度(°C)、整线一次良率(%)、设备稼动率(%)、单GW投资成本" },
        { dimension: "下游渗透与需求", scope: "乘用车渗透速度、低空eVTOL高倍率适配、溢价接受阀值与容量配额", metrics: "渗透率(%)、PACK系统能量密度(Wh/kg)、单Wh量产成本(元)" }
      ],
      formula: "固态Pack理想制备成本预测模型: C_pack = (C_electrolyte * W_electrolyte + C_lithium_anode * W_anode + C_other_materials + C_factory_depreciation / Y_yield) * (1 + Margin_rate)\n\n固态电池容量衰退衰减公式: S_capacity(t) = S_0 * (1 - α * sqrt(t_cycles)) * exp(-E_a / (R * T_temp))",
      dataAcquisition: [
        { id: "D01", name: "流延法氧化物电解质膜均价", desc: "反映氧化物固态电解质核心材料的采购与生产难度", logic: "月度监测流延厚度、材质纯度与主流厂报价加权平均", source: "SMM (上海有色网) & 百川盈孚" },
        { id: "D02", name: "全固态动力电池装车规模", desc: "跟踪国内新能源车搭载并跑全固态电池的落地数据", logic: "月度整车厂出货口径与PACK装机拆解", source: "中国汽车动力电池产业创新联盟 & SNE Research" },
        { id: "D03", name: "固态电池工艺全球专利新增", desc: "跟踪主要竞争国度在硫化物共烧结等极硬技术壁垒上的布局", logic: "每季度检索全球各专利局公开申请，分类标记固态核心词", source: "智慧芽 (PatSnap) & 万得资讯" },
        { id: "D04", name: "硅碳负极掺杂工艺平均克容量", desc: "辅助计算固态匹配负极性能的理论出货边界", logic: "基于行业龙头中试线反馈与学术成果转换折算", source: "鑫椤资讯 & 钢联数据" }
      ]
    },
    expertPanelFeedback: "专家组意见：\n1. 在‘工艺与量产线’维度中，应加入‘干电极工艺溶剂残留度’这一指标，这会直接影响锂金属在全固态界面上的原位刺穿树枝晶行为。\n2. 增加针对海外固态包（Toyota硫化物等）在零下30摄氏度极端低温下的充放电循环衰减参数。\n3. 数据源方面，需要引入国际船运/海关出关口径的稀有原料（如锂/硫纯化物等）进口数据，用于核对供应链受约束的概率。",
    isExpertReviewed: false,
    skillsV0: [
      {
        id: "SK-01",
        name: "固态电池行业景气度研判-市场需求与技术渗透Skill",
        category: "industry",
        owner: "电池新能源首席分析师",
        version: "V0.0",
        problemSolved: "评估固态电池技术由半固态向全固态演进各个拐点时期的产业渗透率及中短期需求容量，解答‘何时实现固态电池全面商业化’的重大估算难题。",
        triggers: "1. 固态电解质原料（碳酸锂、硫化锂）价格周度波动率 > 15%\n2. 头部整车厂（如广汽、蔚来、丰田）发布全固态车型装车新参数\n3. 消费电子或无人设备领域首次批量应用固态电解质电池公告",
        scenario: "季度/年度新能源电池及材料产业链景气度周期审查，以及新能源特定赛道（低空经济、高档EV）的投资机遇筛选。",
        steps: "1. 收集最新流延氧化物电解质/硫化物前驱体报价与整包制造成本推算;\n2. 依据各企业最新的量产落地路线图，匹配对应阶段的溢价空间;\n3. 核算PACK能量密度相比主流三元锂的代差比率;\n4. 用Bas扩散模型测算各级别整车的装配渗透率拐点。",
        metrics: "离子电导率(mS/cm)、整车续航代差、PACK能量密度(Wh/kg)、单Wh成本溢价(%)",
        sources: "SMM (上海有色网), SNE Research, 乘联会, 企业中试线一手调研",
        outputRequirements: "提供未来5年各细分市场（EV、低空飞行器、高档数码）固态电池交付量及产值预测，并输出不同成本水平下的渗透率敏感性敏感系数表。",
        markdown: `# 固态电池行业景气度研判-市场需求与技术渗透Skill V0.0\n\n- **负责人**: 电池新能源首席分析师\n- **版本号**: V0.0\n- **解决问题**: 评估固态电池中短期渗透节奏与市场供求。\n- **更新触发条件**: 核心原材料波动超15%或车端重大发布。\n\n### 1. 适用场景\n季度与年度动力电池产业链周期审查，重点捕捉材料技术范式重构中的商业周期拐点。\n\n### 2. 分析步骤\n1. **原料计价**: 收集氧化物/硫化物前驱体最新报价。\n2. **能量密度核验**: 拆解中试线电芯比能量指标。\n3. **需求模型计算**: 结合Bas渗透方程演算下游装车拐点。\n\n### 3. 关键指标\n- 离子电导率 (mS/cm)\n- 电池整包能量密度 (Wh/kg)\n- 溢价临界值 (%)\n\n### 4. 数据来源与输出要求\n数据依托SMM、百川盈孚；产出包含未来五年固态电池商业出货时序图与敏感性系数表。`
      },
      {
        id: "SK-02",
        name: "固态电池核心标竞争力研判-财务与估值Skill",
        category: "subject",
        owner: "电池新能源高级研究员",
        version: "V0.0",
        problemSolved: "对固态电池板块高成长重资产标的进行财务质量深度剖析与估值锚定，避免高位泡沫与技术假突破中招。",
        triggers: "1. 核心公司发布中报/年报，披露研发费用率或资本开支进度重大偏离\n2. 首次进入主流主机厂固态项目定点名单披露\n3. 进行新一轮定增或大型中试厂融资估值定论",
        scenario: "特定固态标的个股研报发表前审议、高估值重资产项目的投前财务审查、并购合伙决策支持。",
        steps: "1. 锁定标的公司研发资本化VS费用化比例，校正真实研发投入;\n2. 跟踪其在建工程、开发支出科目的转固进度，防范产能空地化与虚假计提;\n3. 使用PS估值法（针对成熟前期纯技术股）或修正式PE-EBITDA（针对进入批量量产股）进行定位;\n4. 并对生产线 Capex 超支折旧影响做压力测试。",
        metrics: "研发开支/营业收入(%)、产能折旧占比、单GW建设期(月)、市销率(PS)、市盈率(PE)",
        sources: "上市公司财报, 交易所问询函, 投融资路演BP, 行业专家定性评价",
        outputRequirements: "个股财务健康评分表与清算价值评估，分技术路径（氧化物固液混合、硫化物全固态）下的目标估值中枢区间矩阵公允价值区间。",
        markdown: `# 固态电池核心标竞争力研判-财务与估值Skill V0.0\n\n- **负责人**: 电池新能源高级研究员\n- **版本号**: V0.0\n- **解决问题**: 对固态电池题材高成长股财务泡沫挤压与估值精确定位。\n\n### 1. 适用场景\n个股深度研报发表前置审议，高层投前投后风控财务研判。\n\n### 2. 分析步骤\n1. **财务脱水**: 核准资本化研发比例。\n2. **产能比对**: 跟踪在建转固对折旧费用的真实咬合度。\n3. **估值对表**: 技术成长期采取PS、量产兑现期采取EV/EBITDA与PE矩阵结合方式。\n\n### 3. 关键指标与数据来源\n- 研发开支占比 (%)\n- 单GW产能折旧曲线\n- 目标估值区间\n数据均来源于上市公司合规财报与交易所权威公告。`
      }
    ],
    radarScoresV0: {
      "维度完整度": 82,
      "逻辑严密性": 85,
      "数据覆盖面": 78,
      "可落地实施度": 80,
      "模型可回测性": 75
    },
    skillsV1: null,
    monitoringSignals: [
      {
        id: "SIG-01",
        category: "news",
        source: "海外科技快报",
        title: "丰田宣布固态电解质连续烧结取得新工艺突破，成本相比此前预计削减40%",
        content: "丰田研发中心联合固态陶瓷供应商推出了气相辅助烧结法（VASS），克服了以往高温高压模压面临的裂纹问题，使得整线一次出片率从30%飙升至82%，极大降低材料端摩擦成本。",
        timestamp: "10分钟前",
        severity: "high",
        implications: "此技术可能使海外主流路线的降本速度远超此前预测，国内纯干法工艺正面临严峻挑战，应在‘行业技术分析’skill中追加此路线的监控指标。",
        status: "pending"
      },
      {
        id: "SIG-02",
        category: "policy",
        source: "产业支持意见",
        title: "国家针对具有固态高能量密度电池资质的初创企业追加低息专项科研贷款",
        content: "国家六部委关于促进下一带高性能储能装机实施细则中，首次将电芯 Wh/kg > 450Wh/kg 且循环寿命超1500次的固态/全固态项目，列为优先低息绿债支持名单。",
        timestamp: "2小时前",
        severity: "medium",
        implications: "标的公司的研发资质与补贴获取概率上升，在竞争力研判及财务模型中，关于补贴收入的权重需要上调，同时450Wh/kg指标可能成为行业新入壁垒标准。",
        status: "pending"
      },
      {
        id: "SIG-03",
        category: "feedback",
        source: "买方基金经理交流群",
        title: "反馈：对现有的估值分析感到不解，缺乏对不同技术方向（半固态VS硫化物全固态）的估值梯度拆解",
        content: "目前全固态电池短期无法贡献规模利润，估值不应等同于传统的湿法锂电池，急需按照产业链成型阶段设计对应的过渡态折现率体系，否则实操中容易导致误杀和误入估值陷阱。",
        timestamp: "5小时前",
        severity: "high",
        implications: "用户强烈建议优化‘标研竞争力财务与估值Skill’。必须在估值分析步骤中新增‘估值阶梯溢价因子’，根据其产业化进度分档（1-5档），并在模型中匹配不同的WACC偏置参数。",
        status: "pending"
      }
    ],
    optimizationTargets: [
      {
        id: "OPT-01",
        title: "引入极温极寒性能监控指标（零下30度至80度）",
        description: "由于海外多款车规级固态包在极寒温区中衰减系数面临拐点突变，亟需在‘景气度分析框架-市场需求与技术渗透Skill’中，新增低温循环保持率（%）这一高敏感指标。",
        skillMatches: ["SK-01"],
        confirmed: false
      },
      {
        id: "OPT-02",
        title: "补充阶段性阶梯估值评定矩阵",
        description: "采纳买方反馈意见，在‘标的竞争力-财务与估值Skill’中追加技术路径成型评估表，按其是否具备‘中试定点-小批样件-整车搭载-中批量供货’分成5个成长档，赋予阶梯折现率阶值。",
        skillMatches: ["SK-02"],
        confirmed: false
      }
    ],
    skillsV1_1: null,
    radarScoresV1_1: null,
    skillsV2: null
  },
  "cpo-photonics": {
    industry: "AI芯片光电互联 (CPO & Silicon Photonics)",
    theme: "海外下一代AI巨群互联网络高速率硅光与CPO架构升级趋势",
    frameworkDraft: {
      domestic: "国内以易华录、光迅科技、中际旭创等光模块巨头引领，重点处于800G、1.6T高速光连接的批量封装产能释放与良品率控制。目前主要以可插拔光模块技术（Pluggable）为主。在CPO（共封装光学）领域也进行了研发布局。极其侧重于原材料组件：微晶玻璃、铌酸锂调制器及激光光源外置路线的代工和总装测试效率。",
      foreign: "海外以NVIDIA、Broadcom、Intel为代表的巨头掌控产业链底层标准与新型高速ASIC主控。重点放在晶圆级硅光混合集成（SiPh Integration）、光电混合共封装高密度光纤对准工艺（Fibers alignment）、通道内多波长技术。对热稳定性、激光器退化速率（dB/1000h）、多核单片集成良率的要求极高，注重将光学IO直接推向ASIC裸片边缘的系统性能代时代演变。",
      comparison: "国内是封装和系统集成的精密生产链霸主，更关心海外在光IC流片等关键节点的限制；海外则在架构定义、微纳制造与全链路光学架构演化上占据主导。框架应实现将硅光芯片级测试指标与批量自动化对准封装效率的联合监控。",
      dimensions: [
        { dimension: "技术制式迭代", scope: "高速可插拔光模块1.6T向3.2T CPO跨越、异质集成与外置光源、多波长多路复用", metrics: "调制带宽(GHz)、通道衰减(dB/km)、通道数(Ch)、片上面积(mm²)" },
        { dimension: "关键材料器件", scope: "薄膜铌酸锂(TFLN)调制芯片、磷化铟(InP)高性能光源底板、微环共振腔热光调节稳定性", metrics: "折射率差、耦合损耗(dB)、插损值、寿命半衰期(h)" },
        { dimension: "封装工艺改造", scope: "光电多层布线（TSV/RDL）工艺、微透镜阵列（MLA）精密对准、高度耐压自动化贴片效率与成品率", metrics: "对准精度(μm)、组装循环时间(s)、可靠性老化失效率" },
        { dimension: "下游需求及云厂商Capex", scope: "北美四大AI厂商资本开支分布、大模型训练集群全光网络组网密度", metrics: "光纤端口数量、单模光器件渗透率、各代光模块转换周期、单模块售价波动" }
      ],
      formula: "高速光纤链路传输误码率与抖动敏感性预测模型: BER_link = Q_function(V_signal / (N_thermal + N_shot + Jitter_index * f(S_rate)))\n\nCPO发热与散热敏感均衡函数: Heat_dissipation = P_laser_input * (1 - Conv_efficiency) - h_area * (T_junction - T_ambient)",
      dataAcquisition: [
        { id: "D01", name: "薄膜铌酸锂调制器核心芯片平均价格", desc: "主导超高速光通信是否能替代传统硅光方案的关键成本因数", logic: "基于海内外光迅及芯片原厂月度批量提货报价综合估算", source: "富创咨询 & SMM" },
        { id: "D02", name: "云巨头AI网络架构各代模块装船数量", desc: "直接展现市场朝3.2T、CPO更替换代的速度", logic: "月度海关通关光通信进出口贸易额拆分算法配给", source: "海关总署 & LightCounting" },
        { id: "D03", name: "CPO封测设备出货与新增产能", desc: "反映CPO产业链中高技术含量的封装端设备资本实力", logic: "核心企业定期订单与调研披露", source: "Yole Developpement" },
        { id: "D04", name: "多通道外置连续半导体激光器平均光效", desc: "表征底层材料技术能否支撑大规模高速并行的硬件阈值", logic: "从领先中研院所及上游厂商公布测试表折算", source: "SPIE光学研讨会成果" }
      ]
    },
    expertPanelFeedback: "专家组意见：\n1. 高速CPO中对光源要求苛刻，请在核心元器件指标中加入‘外置光源（ELS）抗反光反馈容差阈值(dB)’。\n2. 在封装端，急需细化硅通孔（TSV）在重布线层的高频传输电气损耗衰减规律。\n3. 下游渗透中，关于单端口网络适配成本（成本/每100G），应该列为评估技术升级的最核心财务约束指标。",
    isExpertReviewed: false,
    skillsV0: [
      {
        id: "SK-01",
        name: "AI光电互联景气度研判-技术迭代与装船量Skill",
        category: "industry",
        owner: "光电半导体首席分析师",
        version: "V0.0",
        problemSolved: "精准追踪计算CPO、高速硅光模块全球需求、出货时序和向硅光升级转换速率，理清云巨头新一轮硬件资本开支对光芯片的杠杆拉动效能。",
        triggers: "1. 微软、谷歌、亚马逊等北美云厂商资本开支预测调高或调低超10%\n2. 博通、英伟达披露最新一代交换机主控CPO集成进度\n3. 新一代薄膜铌酸锂良率跨跃中试，取得整机重大成果公布",
        scenario: "季度AI硬件投资主题策略会，重点挖掘全球高带宽物理互联需求中，处于关键换代转折点的设备及模块新标的。",
        steps: "1. 获取云大厂算力规模布局及对应光模块配比比例（传统为1:12，CPO趋势由于高密可提升至1:24）;\n2. 依据调制器流片良率进度与外置光源价格周期核算量产成本曲线;\n3. 核定超高速链路抗衰减参数是否达到商用阈值(1.6T商用阈值衰减限值);\n4. 判定行业代差替换周期。",
        metrics: "调制带宽(GHz)、端口价格(美元/100G)、算力卡/光模块配比比率、整机光电能效增幅",
        sources: "LightCounting, Yole, 海关出口数据库, 北美超算大厂设备公示",
        outputRequirements: "未来3年各速率光模块与CPO传输形式市占率预测表，全球核心大厂单端口高速互联采购价值敏感度评估矩阵。",
        markdown: `# AI光电互联景气度研判-技术迭代与装船量Skill V0.0\n\n- **负责人**: 光电半导体首席分析师\n- **版本号**: V0.0\n- **解决问题**: 多速率光模块与CPO需求测算以及升级拐点监控。\n\n### 1. 适用场景\n季度AI算力产业链宏观/微观景气度判断，识别硬件价值链跃迁方向。\n\n### 2. 分析步骤\n1. **算力转配比**: 检索大卡组网形式与高速口需求。\n2. **测算生产成本**: 根据铌酸锂等外置光源流片工艺推导模块报价趋势。\n3. **判别核心优势**: 评估CPO能耗减少、带宽倍增对整机成本的撬动幅度。\n\n### 3. 关键指标与数据来源\n- 调制带宽 (GHz) & 端口单100G均价 (USD)\n- 算力大模配比 ratio\n数据基于 LightCounting, 美商科技媒体追踪等。`
      },
      {
        id: "SK-02",
        name: "薄膜铌酸锂与硅光龙头竞争力-业务与估值Skill",
        category: "subject",
        owner: "光通信资深研究员",
        version: "V0.0",
        problemSolved: "评估特定硅光以及薄膜铌酸锂企业的高流片工艺研发耗费、长定点周期转化为实际主营收入的能力，建立超高预期科技股的阶段性合理折估值模型。",
        triggers: "1. 关键芯片封装良率数据公布或由于设备磨损导致滑坡\n2. 获得英伟达或博通、英特尔下一代CPO样件检验定点或签署批量意向订单\n3. 核心大厂首次实现国产替代TFLN薄膜大尺寸切片突破",
        scenario: "个股项目标的深度剖析，成长型硅光与可插拔设计上市标的估值溢价测定。",
        steps: "1. 拆解企业资产结构中昂贵纳米流片生产线及光纤对合设备的投资周转率;\n2. 对比公司中试线产值并调出合格率系数，防范虚胖毛利率陷阱;\n3. 基于在手定点订单、测试件完成数与出货周期核实未来一年度产能饱和状态;\n4. 对标硅谷巨头，赋予技术路径阶梯型溢价区间（CPO封装溢价、光芯片自研溢价）。",
        metrics: "芯片封装成品率(%)、设备折旧占营业成本比、单客户销售集中度(%)、PEG、在手定点订单价值",
        sources: "招股说明书, 互动易官方回复, 光通信年报, 台积电/日月光等制备厂出片监测",
        outputRequirements: "特定核心股工艺成长红线评级表，以及采用混合期权与PEG对标结合方式的三个季度估值下限与上限动态敏感表。",
        markdown: `# 薄膜铌酸锂与硅光龙头竞争力-业务与估值Skill V0.0\n\n- **负责人**: 光通信资深研究员\n- **版本号**: V0.0\n- **解决问题**: 解决硅光高研发、长周期高溢价标的的防泡沫评判与估值计算。\n\n### 1. 适用场景\n重点成长个股投研分析，中试向批量生产跃动阶段的个股价值边界核算。\n\n### 2. 分析步骤\n1. **工艺流片去水**: 剥离研发资本化对研发实力的掩盖。\n2. **产能定点追踪**: 核验定点函件，剔除不确定框架协议。\n3. **阶梯估值锚定**: 分核心工艺优势（自研光源、无源封装对准等）给予估值中枢溢价。\n\n### 3. 关键指标\n- TSV芯片一次良率 (%)\n- 单GW/单万端口折旧负荷\n- 定点转化为实际产销的周期时比`
      }
    ],
    radarScoresV0: {
      "维度完整度": 85,
      "逻辑严密性": 82,
      "数据覆盖面": 80,
      "可落地实施度": 75,
      "模型可回测性": 70
    },
    skillsV1: null,
    monitoringSignals: [
      {
        id: "SIG-01",
        category: "news",
        source: "EE Times 光通信专栏",
        title: "台积电联合博通展示全面对准3.2T CPO工艺标准，预计明年下半年成熟进入大型算力超算节点选型",
        content: "台积电通过最新的COWOS-R光学变体工艺，首批实现光学调制器与ASIC的4μm极精细对准，解决了过往对准偏差导致光泄露的工艺瓶颈，CPO商用时间比乐观预期提前一个季度。",
        timestamp: "5分钟前",
        severity: "high",
        implications: "说明这一制式演变速度大大提前，1.6T可插拔生命周期中短部分可能受到挤压。在‘技术制式研判’中，必须要对COWOS-R兼容性作为极高权重判断要素。",
        status: "pending"
      },
      {
        id: "SIG-02",
        category: "feedback",
        source: "大型买方私募科技研究主管",
        title: "反馈：研究框架极度缺乏对‘外置光源ELS’抗震动、光反射反馈及热折损对主系统高频传输质量的敏感性分析",
        content: "实际部署中，Els由于是无保护放置，车间微小震动和灰尘导致折射光反射极易烧毁硅光主芯片。若不引入这一环境耐受特征，我们的研究skill仅能停留在实验室幻想层面，无法指导一线投资风控。",
        timestamp: "1小时前",
        severity: "high",
        implications: "非常有价值的人工反馈，须在‘CPO及AI光互联技术迭代Skill’中新增‘环境震动与热耗反馈极限容差指标’及相应的封装防护耐受工艺评定步项。",
        status: "pending"
      }
    ],
    optimizationTargets: [
      {
        id: "OPT-01",
        title: "新增外置连续光源ELS抗震动与光反射极限指标",
        description: "补充ELS反射损伤容纳阈值(dB)与外部防护封装材料的可靠性抗老指标，作为景气度在产品商用硬壁垒评定上的全新分析支柱。",
        skillMatches: ["SK-01"],
        confirmed: false
      },
      {
        id: "OPT-02",
        title: "融合COWOS-R工艺准星与无源精密对准极限",
        description: "在‘标竞争力封装研判与估值Skill’中加入台积电等一线晶圆制备层的高端先进封装配比，并将单端多通道光纤的插损稳定性加入竞争力评级系数。",
        skillMatches: ["SK-02"],
        confirmed: false
      }
    ],
    skillsV1_1: null,
    radarScoresV1_1: null,
    skillsV2: null
  }
};

// Global in-memory dynamic state initializing with PRESETS copies
Object.keys(PRESETS).forEach(presetKey => {
  db.projects[presetKey] = JSON.parse(JSON.stringify(PRESETS[presetKey]));
  db.projects[presetKey].id = presetKey;
});

// App routing setup
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API 0: Get Gemini API key connection status
  app.get("/api/gemini-status", (req, res) => {
    res.json(geminiStatus);
  });

  // API 1: Get list of current active projects or preset key details
  app.get("/api/projects", (req, res) => {
    res.json(Object.values(db.projects).map(p => ({
      id: p.id,
      industry: p.industry,
      theme: p.theme,
      isExpertReviewed: p.isExpertReviewed,
      hasV1_1: p.skillsV1_1 !== null,
      hasV2: p.skillsV2 !== null
    })));
  });

  app.get("/api/projects/:id", (req, res) => {
    const project = db.projects[req.params.id];
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  // API 1.5: Create a brand new project dynamically from manual report upload/metadata
  app.post("/api/projects", (req, res) => {
    const { name, theme, reportsText } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Industry name is required" });
    }

    const sampleId = "project-" + Date.now().toString().slice(-6);

    // Seed domain-specific defaults for maximum industrial precision
    const newProject: ResearchProject = {
      id: sampleId,
      industry: name,
      theme: theme || "技术革新与海内外量产竞争力研判",
      frameworkDraft: {
        domestic: `国内更聚焦于【${name}】的产业链落地与工程制造效率优化。国内制造工艺强调规模化量产的速度和性价比，更深入关注【${name}】相关的本土供应链、替代原料供给和工艺制造指标优化，并能在短时间内将量产良品率拉升。主要难点在于底层核心基础制造装备稳定性及原材料纯度。`,
        foreign: `海外在【${name}】领域注重底层核心专利与关键行业标准指定。海外巨头更早进入原型研发，积累了丰富的物理失效机理库（如温差及摩擦极限、抗疲劳退化参数），其量产验证和实地工况测试极为严苛，但在全球重组生态下同样面临极高研发成本损耗难题。`,
        comparison: `中国突围重心在于释放国内超强的大工业制造与极速适配优势；海外巨头则试图依靠长久以来积累的规则制定权和底层基础专利树限制突破。双重视角的工艺与标准对碰，构成了核心博弈场。`,
        dimensions: [
          { dimension: "工艺与量产稳定性", scope: `对【${name}】高阶制造与极精细封装一次高直通率进行拆解并实施周期性追踪。`, metrics: `装机一次良率(%)、设备高负荷周转率(%)、研发核算转化时间` },
          { dimension: "关键核心元器件突破", scope: "海外独领标准关键环节在本土产业链中工艺对标与国产替代克配比率。", metrics: "物料自研替代率(%)、极限耐受环境性能、克阻抗降" },
          { dimension: "产业链商业供求测算", scope: "下游客户意向定配以及在核心零部件阶梯折溢价下的边际承受度核算。", metrics: "单装机公允成本(元/套)、客户确认定点数、季度出货预测" }
        ],
        formula: `${name}供应链量产折现与盈利安全边际平衡预测模型:\nC_profit = ∑ [ (P_sell(t) - C_cost(t)) * Q_units(t) ] / (1 + r_discount)^t\n\n${name}技术效能退化仿真系数: D_decay(t) = D_base * exp( β * S_load / (K_durability * T_temp) ) * ln(t_runtime)`,
        dataAcquisition: [
          { id: "D01", name: `${name}核心元物料行业现货加权均价`, desc: "反映底层制造耗材与加工开销变化趋势", logic: "加权国内主要供应商大宗合同价，并结合上海有色、百川报价", source: "WIND (万得) & 中试线一手报价录入" },
          { id: "D02", name: `${name}国际新申请专利及冲突案追踪`, desc: "用以判定自主设计合规性与前沿演变风向", logic: "检索全球主要知识产权公开检索词及地方法庭争议", source: "智慧芽 (PatSnap) & 巨潮资讯" },
          { id: "D03", name: `下游领军大厂定配设计/中试联合流片成果`, desc: "验证标的产品真实在手转化率与试装车、装机实效", logic: "季度汇总主要承销方物理流料和系统参数反馈", source: "申万行业数据库 & 一手深度流片访谈" }
        ]
      },
      confirmedFramework: null,
      expertPanelFeedback: `针对【${name}】行业的多位外部顶尖专家交叉评议点：\n1. 行业内装配误差和生产磨损对产品一次良品率影响偏高，在“维度”中建议特强化工程制造容差；\n2. 剥离资本化修饰，由于核心材料/精密组件折旧摊销偏大，应当建立更严苛的公司硬资产去水估算；\n3. 强烈提醒对海外上游设备商的断供风险及全球自主保障比率实施月度级别压力测试监控。`,
      isExpertReviewed: false,
      skillsV0: [
        {
          id: "SK-01",
          name: `${name}行业景气度研判-技术演进与全球出货Skill`,
          category: "industry",
          owner: "科技与前沿工业首席分析师",
          version: "V0.0",
          problemSolved: `应对【${name}】多技术方案并存期的景气度波动，量化跟踪下游采购大厂向核心材料/非标工艺提供商溢价结盟周期，协助投委会合理分配仓位。`,
          triggers: `1. 下游超级整厂发布【${name}】新应用招标量增超30%\n2. 底层关键极性材料或高配装配耗材价格涨/跌超20%\n3. 巨头之间爆发跨国重大技术标准垄断公案`,
          scenario: "中试向批产爬坡过渡期的标的排摸，支持研究组建立针对下代方案胜率的可视化推演和投资底线。",
          steps: `1. 指标解析：爬梳重点供应商产能负荷比例与主流报价阶梯;\n2. 路径对配：对标国外标杆产品规格，折算核心物理参数（良率、抗老化）的代差比率;\n3. 拟合需求：以逻辑生长曲线拟合工艺自给率对国内出货周期的加速边界;\n4. 风控纠偏：跟踪诉讼和断离事件进程，合理扣减不确定溢价。`,
          metrics: "物料一次通过率(%)、单端口折旧压力、代差折损系数、市场供需比",
          sources: "WIND, 特高精工业年鉴, 行业专家背靠背会议, 智慧芽",
          outputRequirements: `提供未来3-5年【${name}】在多重应用中的渗透趋势、量产损益平衡点以及各技术分支抗风险等级评定。`,
          markdown: `# ${name}行业景气度研判-技术演进与全球出货Skill V0.0\n\n- **负责人**: 科技与前沿工业高级分析师\n- **版本号**: V0.0\n- **解决问题**: 解决前沿技术演进与出货拐点的测量。\n\n### 1. 场景与指标\n主要追踪物料制备稼动率、界面封装稳定性。通过WIND、智慧芽等工具获取核心指标。\n\n### 2. 标准实操分析步骤\n1. **数据梳理**: 监控流电厂主流物料采办单价。\n2. **物理/技术代差标定**: 对标海内外标配，分析热耗、良品率指标代差。\n3. **需求和订单测算**: 建立长期出货回归方程预测市场。`
        },
        {
          id: "SK-02",
          name: `${name}标的竞争力剖析-财务与估值模型Skill`,
          category: "subject",
          owner: "前沿装备特高精高级研究员",
          version: "V0.0",
          problemSolved: `评估【${name}】高壁垒个股的资产真实系数、直通毛利并矫正资产虚胖。使用动态折现及对标估值，剥离流片资本化修饰，寻找安全边际。`,
          triggers: `1. 核心个股单度发生大型非标产线采购/定增获批\n2. 主营业务中研发投入资本化比例偏离中位数15%以上\n3. 主力整装厂传出更换核心标的供应商口风`,
          scenario: "成长期企业的投前细致排核、主控估值模型敏感因子测算、防爆标风选。",
          steps: `1. 穿透资产：拆解在建工程中非标测试设备的账面残值，剥离过度研发资产化;\n2. 成本还原：核对主流流片及辅材费用，重估真实一次直通良率下的理论毛利率;\n3. 对标估值：使用修正的PEG、客户依赖度模型，按自主设计合规梯度折算估值公允盈溢;\n4. 形成结论：计算不同应收账款和应收票据扣减损耗下的投资硬性测算。`,
          metrics: "自研替代率(%)、设备高频直通良率、真实毛利率、研发资本化比例、修正PEG",
          sources: "上市公司财报, 海关口径统计数据, 企业线上调研底稿",
          outputRequirements: `提供该行业个股防泡沫财务穿透量级报告，算定低、中、高爆发增长速率假设下的估值敏感公允价格矩阵。`,
          markdown: `# ${name}标的竞争力剖析-财务与估值模型Skill V0.0\n\n- **负责人**: 特高精高级研究员\n- **版本号**: V0.0\n- **解决问题**: 穿透上市公司财务质量，确定估值中枢，识别技术假突破泡沫。\n\n### 1. 核心重点\n重点剥离不合理资本化的研发支出，推测良品率对销售毛利以及安全边际的弹性。\n\n### 2. 标准流程\n1. **去泡沫核算**: 审计高新测试设备的计提折旧合理性。\n2. **多态估值矩阵**: 配置自主保护权重，算定公允折溢价区间。`
        }
      ],
      radarScoresV0: {
        "维度完整度": 80,
        "逻辑严密性": 80,
        "数据覆盖面": 75,
        "可落地实施度": 75,
        "模型可回测性": 70
      },
      skillsV1: null,
      monitoringSignals: [
        {
          id: "SIG-01",
          category: "report",
          source: "海外产业研究中心",
          title: `针对【${name}】的突发：核心制造装备上游材料原厂提价15%，量产成本线迎来新压力`,
          content: "上游前沿零组件和流料因跨国局势引发供货紧张，对国内正处于中试阶段的主体设备一次直通良率提出更高极限要求。",
          timestamp: "刚刚",
          severity: "high",
          implications: "此变局要求我们必须对‘物料一次高直通率’的核心权重加以极高重视，并在雷达质量中加以考核点。",
          status: "pending"
        }
      ],
      optimizationTargets: [
        {
          id: "OPT-01",
          title: `追加在【${name}】重资产流片折旧与关键断离风险下的安全基线`,
          description: "引入材料波动敏感系数，将宏观出货拐点分析与单Wh/单端口物料价格抗震性精密勾联。",
          skillMatches: ["SK-01"],
          confirmed: false
        }
      ],
      skillsV1_1: null,
      radarScoresV1_1: null,
      skillsV2: null
    };

    if (reportsText && reportsText.trim().length > 0) {
      newProject.frameworkDraft.domestic += ` (基于用户手工上传报告提取: ${reportsText.slice(0, 150)}...)`;
    }

    db.projects[sampleId] = newProject;
    console.log(`Successfully created custom project [${sampleId}] for ${name}: ${newProject.theme}`);

    res.json(newProject);
  });

  // API 2: Step 1 & 2 - Generate/Re-generate Research Framework (optionally calls Gemini if key is active)
  app.post("/api/projects/:id/generate-framework", async (req, res) => {
    const { id } = req.params;
    const { reportsText } = req.body;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    // If Gemini is active and verified, let's call the actual AI to synthesize.
    const hasActiveKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && geminiStatus.verified;

    if (hasActiveKey && ai) {
      try {
        console.log(`Calling Gemini API to synthesize framework for: ${project.industry}...`);
        const userPrompt = `
          你是一个顶尖海内外新科技与重工业赛道的高级投资研究员。
          现在需要为行业：“${project.industry}”，特定研究主题：“${project.theme || "技术演进与竞争力评估"}”生成一整套最科学先进、符合海外与国内双重维度的[研究框架初稿]与[数据获取声明]。
          
          输入参考报告/调研材料/会议纪要概要极其背景如下：
          "${reportsText || "使用行业最精尖、最先进的研究规范和前沿商业进展。"}"

          请你务必返回一个极其详尽，技术指标极度可实操、不空洞的JSON。
          输出JSON格式必须为，不要带 markdown wrap 以外的代码前缀，只输出 JSON，格式为：
          {
            "domestic": "国内的研究视角总结（深入，涵盖具体的工艺、供应链优势与国产化替代核心逻辑，约150字）",
            "foreign": "海外的研究视角总结（深入，涵盖硬技术代差、底层标准控制、巨头前瞻路线，约150字）",
            "comparison": "海内外对比总结（涵盖国内产业优势与海外前沿探索的本质不同，约100字）",
            "dimensions": [
              { "dimension": "分析维度1", "scope": "分析范畴", "metrics": "关键指标1, 关键指标2" },
              { "dimension": "分析维度2", "scope": "分析范畴", "metrics": "关键指标3, 关键指标4" },
              { "dimension": "分析维度3", "scope": "分析范畴", "metrics": "关键指标5, 关键指标6" },
              { "dimension": "分析维度4", "scope": "分析范畴", "metrics": "关键指标7, 关键指标8" }
            ],
            "formula": "这里写2个该行业最核心的研究模型或计算指标公式，使用标准 LaTeX 格式或易读的物理公式。写明推导或变量意义。",
            "dataAcquisition": [
              { "id": "D01", "name": "指标名称1", "desc": "描述", "logic": "衍生或加工逻辑", "source": "可能来源方向（如SMM, 钢联, LightCounting, 乘联会）" },
              { "id": "D02", "name": "指标名称2", "desc": "描述", "logic": "—", "source": "可能来源方向" },
              { "id": "D03", "name": "指标名称3", "desc": "描述", "logic": "衍生逻辑", "source": "可能来源方向" },
              { "id": "D04", "name": "指标名称4", "desc": "描述", "logic": "—", "source": "可能来源方向" }
            ]
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        if (response.text) {
          const generatedData = JSON.parse(response.text.trim());
          project.frameworkDraft = generatedData;
          console.log("Gemini Framework successfully generated!");
        }
      } catch (geminiError) {
        console.error("Gemini Generation Error, falling back to comprehensive presets.", geminiError);
        // Fallback already pre-seeded, keeping it.
      }
    } else {
      console.log("No authentic Gemini Key, using pre-loaded high-fidelity dataset.");
      // Just modify tiny parts based on input text to represent simulated process in action
      if (reportsText && reportsText.trim().length > 5) {
        project.frameworkDraft.domestic += ` (基于新导入资料补充: ${reportsText.slice(0, 50)}...)`;
      }
    }

    res.json(project.frameworkDraft);
  });

  // API 3: Save / Confirm Framework from Researcher Front-end (Step 2 & 3)
  app.post("/api/projects/:id/confirm-framework", (req, res) => {
    const { id } = req.params;
    const { framework, isReviewed } = req.body;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.frameworkDraft = framework;
    project.isExpertReviewed = isReviewed;
    project.confirmedFramework = JSON.parse(JSON.stringify(framework));

    res.json({ success: true, project });
  });

  // API 4: Step 4 - Generate atomic research skills V0.0 from confirmed framework
  app.post("/api/projects/:id/generate-skills-v0", async (req, res) => {
    const { id } = req.params;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Compile skills using Gemini or default expert sets
    const hasActiveKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && geminiStatus.verified;

    if (hasActiveKey && ai && project.confirmedFramework) {
      try {
        console.log(`Calling Gemini API to generate deep atomic skills V0.0 for ${project.industry}...`);
        const userPrompt = `
          你是一个严谨且极致的技术专家和投研合伙人。
          基于已经审议通过的行业研究框架：
          "${JSON.stringify(project.confirmedFramework)}"
          
          现在需要根据此框架自动拆解并生成2个最具指导性、原子化（Atomic）的研究Skill V0.0。
          
          这两个Skill的定位如下：
          1. 行业维度（景气度研判Skill）：重点通过行业分析框架，对需求分析、市场竞争格局、工艺革新、宏观走势进行研判。
          2. 主体维度（竞争力研研判Skill）：重点对应财务深度剖析、业务壁垒、商业护城河评估与折现估值模型深度分析。

          请你务必输出这两个完整Skill项的JSON对象数组，每个Skill都必须绝对细化，绝对要覆盖：
          Skill名称、负责人、版本号、解决什么问题、更新触发条件、适用场景、分析步骤、关键指标、数据来源、输出要求。
          并且，每个Skill提供一个单独的“markdown”格式字符串（必须符合专业的投研Markdown，里面详细整理包含这些要素），作为存储的研究Skill markdown成果。

          输出JSON的格式为（只含有最内侧格式，不得有多余包裹字符）：
          [
            {
              "id": "SK-01",
              "name": "Skill名称",
              "category": "industry",
              "owner": "负责人职称/姓名",
              "version": "V0.0",
              "problemSolved": "解决什么现实的投资和产业分析痛点问题（至少80字）",
              "triggers": "触发该Skill更新的具体边际市场、数据或公告条件（至少3个条件）",
              "scenario": "具体的适用实操场景（如周度路演、季度策略会、标的技术突破）",
              "steps": "极端细致可操作的4个核心分析步骤，指导新助理按部就班操作（每步至少40字）",
              "metrics": "5个具体的分析关键高阶核心技术或财务财务指标",
              "sources": "权威具体、可核查的数据或者资源获取源（如百川盈孚、SMM、万得）",
              "outputRequirements": "Skill评估完成后，需要输出什么具体交付成果、报告或敏感性变化系数表（包含严格的输出规范、图表要求）",
              "markdown": "该Skill的完整Markdown表现文档，结构庄雅严密，字数应充足"
            },
            {
              "id": "SK-02",
              "name": "Skill名称",
              "category": "subject",
              "owner": "负责人职称/姓名",
              "version": "V0.0",
              "problemSolved": "针对该行业的企业竞争力、发展质量以及估值安全边际研判（至少80字）",
              "triggers": "财务发生重大变奏、定增、产品定点出局或客户突变等3类触发条件",
              "scenario": "项目投前全方位财务健康审计、首席合伙人立项审理会议等支持",
              "steps": "4个最精细的公司竞争力与财务去水评估步骤，包括研发资本化剥离、重设备折旧压力测试、PEG估值敏感比对等（每步至少40字）",
              "metrics": "具体核心分析指标（如资本开支比率、设备周转等）",
              "sources": "上市公司官方数据库、行业定点调研反馈口径等",
              "outputRequirements": "个股财务防泡沫穿透表与各成长梯度的估值合理区间公允值计算结论",
              "markdown": "该Skill的完整Markdown表现文档，内容丰满、行文精炼、格调高古"
            }
          ]
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });

        if (response.text) {
          const generatedSkills = JSON.parse(response.text.trim());
          project.skillsV0 = generatedSkills;
          console.log("Gemini Skill V0.0 Generation Successful!");
        }
      } catch (e) {
        console.error("Gemini generate-skills-v0 failed. Falling back to default high-fidelity skills V0.0.", e);
        // Pre-loaded mockup in PRESETS is already highly compliant and solid.
      }
    }

    res.json(project.skillsV0);
  });

  // API 5: Step 5 - Evaluation Logic, generating multi-dimensional radar scores
  app.post("/api/projects/:id/evaluate-skills-v0", async (req, res) => {
    const { id } = req.params;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    // In a live scenario we can grade them based on metric checklist, lets generate consistent radar results
    // with light random perturbation to represent dynamic testing or run Gemini to score them!
    const hasActiveKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && geminiStatus.verified;

    if (hasActiveKey && ai) {
      try {
        console.log(`Calling Gemini API to execute strict automated scoring review...`);
        const userPrompt = `
          你是一个极度吹毛求疵的量化回测与风控评测引擎。
          现在需要对下属提交的以下这二份投研Skill进行打分评价：
          ${JSON.stringify(project.skillsV0)}

          请你务必返回一个打分对象。五个核心维度：
          1. 维度完整度 (Dimension Completeness - 满分100)
          2. 逻辑严密性 (Logical Rigor - 满分100)
          3. 数据覆盖面 (Data Coverage - 满分100)
          4. 可落地实施度 (Actionable Feasibility - 满分100)
          5. 模型可回测性 (Backtestability - 满分100)

          同时也请你给出大约120字的全面评语与潜在技术风险漏洞警告。

          输出JSON格式：
          {
            "scores": { "维度完整度": 85, "逻辑严密性": 82, "数据覆盖面": 79, "可落地实施度": 80, "模型可回测性": 72 },
            "verdict": "一针见血的可视化缺陷反馈、优势在哪里、下一步要如何弥补"
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });

        if (response.text) {
          const result = JSON.parse(response.text.trim());
          project.radarScoresV0 = result.scores;
          console.log("Evaluation metrics processed:", result.scores);
          res.json({ scores: project.radarScoresV0, verdict: result.verdict });
          return;
        }
      } catch (err) {
        console.error("Gemini evaluation error, using local quantitative framework.", err);
      }
    }

    // High quality mock review verdict based on industry
    const isBattery = id === "solid-state-battery";
    const verdict = isBattery
      ? "该评测判定V0.0框架极具实操广度。在供应链SMM等关键指标的接入点准确，对中试产线至量产渗透率的路径分析合理。但在全电芯界面的物理退化参数、干法成型残存气泡影响等‘界面物理微观行为’的捕获上明显偏弱。回回测框架缺乏对低温状态下容量突变退化的风险预测指标，建议增加低温全天候循环测试模块。"
      : "该评测引擎评定高速互联V0.0文档逻辑闭环。通过调制器与ASIC重布物理架构展开论述。但在外接光源抗返光、高频高热状态下的机械共振、激光耦合对准环境老化因子覆盖较弱。对于多波长调制过程中的信道折损缺乏高精回测数据流支持，回测可推导性受到微纳芯片工艺流片非连续的干扰。";

    res.json({ scores: project.radarScoresV0, verdict });
  });

  // API 6: Step 6 - Convert V0.0 to V1.0 (manual save and confirm)
  app.post("/api/projects/:id/confirm-v1", (req, res) => {
    const { id } = req.params;
    const { skills } = req.body;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Store skills V1.0 (updated with researcher inputs)
    project.skillsV1 = skills.map((s: any) => ({ ...s, version: "V1.0" }));
    res.json({ success: true, skills: project.skillsV1 });
  });


  // ================= MODULE 2 Routes: MONITORING & ITERATION =================

  // API 7: Fetch currently available optimization targets and signals
  app.get("/api/projects/:id/monitoring", (req, res) => {
    const { id } = req.params;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.json({
      signals: project.monitoringSignals,
      targets: project.optimizationTargets
    });
  });

  // API 8: Update optimization target confirmation
  app.post("/api/projects/:id/targets/:targetId/toggle", (req, res) => {
    const { id, targetId } = req.params;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    const target = project.optimizationTargets.find(t => t.id === targetId);
    if (!target) return res.status(404).json({ error: "Optimization target not found" });

    target.confirmed = !target.confirmed;
    res.json(target);
  });

  // API 9: Automatically iterate V1.0 -> V1.1 (incorporating confirmed optimization signals)
  app.post("/api/projects/:id/iterate-to-v1_1", async (req, res) => {
    const { id } = req.params;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    const activeTargets = project.optimizationTargets.filter(t => t.confirmed);
    const hasActiveKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && geminiStatus.verified;

    // Use current skills as baseline (either V1 or fall back to V0)
    const baseSkills = project.skillsV1 || project.skillsV0;

    if (hasActiveKey && ai) {
      try {
        console.log(`Calling Gemini API to auto-compile iterated Skill V1.1 for ${project.industry}...`);
        const userPrompt = `
          你是一个高阶产业分析迭代引擎。
          现在需要你根据以下已经确认的【研究框架优化方向和市场新鲜信号】：
          ${JSON.stringify(activeTargets)}
          
          将我们原先的研究Skill V1.0：
          ${JSON.stringify(baseSkills)}
          
          进行升级，融合这些最新的重大变化，并自动迭代生成全新的 [研究Skill V1.1]。
          请在Markdown以及指标中完美增加这些细节（必须明确体现在分析步骤、关键指标或数据源中，增加的改动必须十分突出，比如新增的具体专业级参数指标）。
          
          请直接返回升级后的2个Skill对象的JSON数组，格式如下：
          [
            {
              "id": "SK-01",
              "name": "升级后的Skill名称",
              "category": "industry",
              "owner": "负责人",
              "version": "V1.1",
              "problemSolved": "修改后的痛点描述...",
              "triggers": "升级后的触发更新条件...",
              "scenario": "对应场景...",
              "steps": "新增了优化对准/极寒环境监测后的升级版分析步骤-涵盖详细段落...",
              "metrics": "新增了高阶具体硬指标升级后的关键指标汇总...",
              "sources": "新增来源后的数据源...",
              "outputRequirements": "更强、格式更完美的输出规范...",
              "markdown": "升级后的最新Markdown，其中必须包含 [V1.1 自迭代新增：xxxx] 这样的标记以示升级点！"
            },
            {
              "id": "SK-02",
              "name": "升级后的财务竞争力估值Skill",
              "category": "subject",
              "owner": "负责人",
              "version": "V1.1",
              "problemSolved": "修改后的痛点描述...",
              "triggers": "触发更新条件...",
              "scenario": "实操场景...",
              "steps": "包含最新的5档折现率阶梯估值等步骤的分析过程...",
              "metrics": "高阶指标汇总（如WACC环境自适应因子、补贴抗冲击系数等）...",
              "sources": "新增来源...",
              "outputRequirements": "细化后的成果格式...",
              "markdown": "最新升级的Markdown，字数饱满，技术术语精妙，包含 [V1.1 基于买方反馈与阶梯估值新增：xxxx] 的自迭代标识"
            }
          ]
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1
          }
        });

        if (response.text) {
          project.skillsV1_1 = JSON.parse(response.text.trim());
          console.log("Gemini Skill V1.1 successfully generated!");
        }
      } catch (e) {
        console.error("Gemini generate-skills-v1_1 failed. Falling back to built-in dynamic generator.", e);
      }
    }

    // Fallback generator to return top-class V1.1 dynamically:
    if (!project.skillsV1_1) {
      project.skillsV1_1 = JSON.parse(JSON.stringify(baseSkills)).map((s: any) => {
        const isIndustry = s.category === "industry";
        const hasOpt1 = activeTargets.some(t => t.id === "OPT-01");
        const hasOpt2 = activeTargets.some(t => t.id === "OPT-02");

        let upStep = s.steps;
        let upMetrics = s.metrics;
        let upMarkdown = s.markdown;

        if (isIndustry && hasOpt1) {
          upStep = `1. 电流压解配时新增[环境温度极限折减测试]：全方位采集从摄氏-30°C极端全天候至80°C下，全固态电池体系热电性能曲线损耗变化；` + s.steps;
          upMetrics = `低温放电循环效率(在-30°C下, %)、极寒刺刺穿自恢复阻值比率、` + s.metrics;
          upMarkdown = upMarkdown.replace("### 3. 关键指标\n-", "### 3. 关键指标\n- [V1.1 极寒环境监测升级]：低温环境下极宽工作温层放电循环保持率\n-");
        } else if (!isIndustry && hasOpt2) {
          upStep = `1. [核心5阶技术溢价矩阵构建]：根据标的物是属于‘A中试送样-B小批样件-C整车装配定点-D中批量供货-E大面积替代’建立对应估值折旧及折现率加减乘数，使PEG与折算率具备自适应抗高溢价泡沫特征；` + s.steps;
          upMetrics = `阶梯技术成熟WACC修正因子、高能量定点定值权重、` + s.metrics;
          upMarkdown = upMarkdown.replace("### 2. 分析步骤\n1.", "### 2. 分析步骤\n1. **[V1.1 5阶估值更新]**：根据标的产业阶梯分级（1级至5级）精准调整折现率WACC。\n2. **原步骤1**.");
        }

        return {
          ...s,
          version: "V1.1",
          steps: upStep,
          metrics: upMetrics,
          markdown: upMarkdown
        };
      });
    }

    // Evaluate V1.1 immediately to produce comparison scores
    // Typically higher scores in Rigor, Coverage & Feasibility because we integrated the fresh signals
    const baseScores = project.radarScoresV0;
    project.radarScoresV1_1 = {
      "维度完整度": Math.min(98, baseScores["维度完整度"] + (activeTargets.some(t => t.id === "OPT-01") ? 8 : 2)),
      "逻辑严密性": Math.min(98, baseScores["逻辑严密性"] + (activeTargets.some(t => t.id === "OPT-02") ? 9 : 3)),
      "数据覆盖面": Math.min(98, baseScores["数据覆盖面"] + (activeTargets.length > 0 ? 10 : 4)),
      "可落地实施度": Math.min(98, baseScores["可落地实施度"] + 6),
      "模型可回测性": Math.min(98, baseScores["模型可回测性"] + 5)
    };

    // Reflect updates on signal status
    project.monitoringSignals.forEach(sig => {
      if (sig.status === "pending") sig.status = "applied";
    });

    res.json({
      skills: project.skillsV1_1,
      scores: project.radarScoresV1_1
    });
  });

  // API 10: Step 4 of Module 2 - Save V1.1 to V2 final
  app.post("/api/projects/:id/confirm-v2", (req, res) => {
    const { id } = req.params;
    const { skills } = req.body;
    const project = db.projects[id];
    if (!project) return res.status(404).json({ error: "Project not found" });

    project.skillsV2 = skills.map((s: any) => ({ ...s, version: "V2.0" }));
    res.json({ success: true, skills: project.skillsV2 });
  });


  // ================= MODULE 3 Routes: SKILL OPERATION HUB & METRICS =================

  // Mock databases for events and sector factors which gets generated/refrehed by AI
  let eventsDb = [
    {
      id: "EV-01",
      title: "全新全固态电解质干法共挤压成机械设备出口爆单，核心标的订单爆满",
      category: "电池新能源",
      content: "欧美近期数家大型固态标配厂商，大单定点采购国内干电极共挤压成膜及辊压系统，标的公司设备在微细裂隙控制上位居全球领先，标志着中国该设备从国产替代迈向绝对的出海创汇黄金季。",
      relatedSkill: "固态电池核心标竞争力研判-财务与估值Skill",
      time: "10分钟前",
      pushStatus: "sent",
      stancePro: "国内制造产能的全球性外溢、出海订单释放打开设备厂第二成长曲线。",
      stanceCon: "出口订单回款周折，海运安全险增加，以及中试级别小规模毛利率可能偏低。"
    },
    {
      id: "EV-02",
      title: "某超万卡算力中心发布全硅光3.2T CPO网络连通标准框架招标书",
      category: "光电半导体",
      content: "该集团首次要求多波长外置激光光源和COWOS封装设备必须通过极限环境温湿度可靠性抗老振荡检测。此举几乎将许多无自主ELS设计能力的普通组装模块股淘汰出定点首选包外。",
      relatedSkill: "AI光电互联景气度研判-技术迭代与装船量Skill",
      time: "40分钟前",
      pushStatus: "sent",
      stancePro: "高端ELS原厂与高精测试封装厂集中红利，良币淘汰劣币，提高头部企业毛利护城河。",
      stanceCon: "研发与折旧大幅跳升，其余无自研调制芯片标的可能在利润分配上进一步承压。"
    }
  ];

  let catalystsDb = [
    { id: "CAT-01", name: "流延膜均价（元/平方米）", value: "￥68.4", threshold: "< ￥70", status: "met", triggeredDate: "2026-06-10 08:30" },
    { id: "CAT-02", name: "低能耗ELS反射损耗测试（dB）", value: "-22dB", threshold: "< -25dB", status: "pending", triggeredDate: "—" },
    { id: "CAT-03", name: "全温区充放循环保持比（在-30°C）", value: "81%", threshold: "> 80%", status: "met", triggeredDate: "2026-06-10 09:20" }
  ];

  let factorBoard = [
    { id: "FAC-01", sector: "固态电池", name: "硫化锂高压前驱体纯度", weight: "0.22", value: "99.985%", momentum: "+0.035% (周加权)", updateDate: "今日更" },
    { id: "FAC-02", sector: "固态电池", name: "干极片一次辊压厚度均匀差", weight: "0.18", value: "±0.62μm", momentum: "-0.15μm (高精精度提)", updateDate: "周更" },
    { id: "FAC-03", sector: "硅光与CPO", name: "片上有源波导光电边端损耗", weight: "0.25", value: "1.24dB/cm", momentum: "-0.12dB (硅光蚀刻进)", updateDate: "今日更" },
    { id: "FAC-04", sector: "硅光与CPO", name: "ELS大功率外置激光寿命衰退", weight: "0.20", value: "1.12% 每1000h", momentum: "-0.08% (性能更)", updateDate: "周更" }
  ];

  // Operation KPI dashboard analytics
  const dashboardKpis = {
    cumulativeCalls: 48290,
    cumulativeDownloads: 8840,
    pageViews: 125900,
    dau: 1480,
    historicalPerformance: [
      { date: "06-04", PV: 12000, DAU: 1100, calls: 3500, downloads: 680 },
      { date: "06-05", PV: 14500, DAU: 1220, calls: 4100, downloads: 720 },
      { date: "06-06", PV: 13800, DAU: 1180, calls: 3900, downloads: 690 },
      { date: "06-07", PV: 15200, DAU: 1300, calls: 4800, downloads: 880 },
      { date: "06-08", PV: 17800, DAU: 1390, calls: 5200, downloads: 990 },
      { date: "06-09", PV: 19500, DAU: 1450, calls: 6100, downloads: 1150 },
      { date: "06-10", PV: 21100, DAU: 1480, calls: 6790, downloads: 1320 }
    ],
    userFeedbackLogs: [
      { id: "F-01", type: "passive", text: "希望在光互联估值中提供关于薄膜铌酸锂与传统硅光芯片工艺的转换替代弹性计算系数。", date: "06-10", triggerSuggestion: "新增硅光工艺价格转换弹性因子" },
      { id: "F-02", type: "active", text: "全固态高分子和氧化物复合涂层工艺是国内主要落地路线，框架里的‘Dimension 1’要补充混涂比例影响。", date: "06-09", triggerSuggestion: "补充氧化物-高分子复合混涂监测" },
      { id: "F-03", type: "passive", text: "现在的催化通知很赞，但如果能支持自动下载PDF报告就更好了。", date: "06-08", triggerSuggestion: "增加自动一键快讯编撰格式" }
    ],
    competitorList: [
      { id: "COMP-01", platform: "Wind智能研报", lastUpdate: "两小时前", news: "上架了‘中哈贸易高纯化学物硫化材料前置周报’框架与估值系数", rank: "高" },
      { id: "COMP-02", platform: "LightCounting Weekly", lastUpdate: "昨日", news: "更新了‘ELS反射抗疲劳技术标准等级库V3.5’", rank: "中" },
      { id: "COMP-03", platform: "Yole高级半导体", lastUpdate: "3天前", news: "发布关于CPO封测精度瓶颈分析模型", rank: "中" }
    ]
  };

  // API 11: Main operation dashboard endpoint
  app.get("/api/operations/data", (req, res) => {
    res.json({
      events: eventsDb,
      catalysts: catalystsDb,
      factors: factorBoard,
      kpis: dashboardKpis
    });
  });

  // API 12: Trigger live creation of a hot event via Gemini or preset helper
  app.post("/api/operations/trigger-event", async (req, res) => {
    const { title, industryFocus } = req.body;
    const hasActiveKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && geminiStatus.verified;

    let eventResult = {
      id: "EV-" + Date.now().toString().slice(-4),
      title: title || "国内首条400G超带宽高速光计算物理混合系统量产并网",
      category: industryFocus || "光电半导体",
      content: "该示范产线首创抗机械干扰的耦合标准，有效解决了以往震动导致的偶合插损不稳。该系统能耗比此前最先进的架低18%，正式打通商业生产红利。",
      relatedSkill: industryFocus?.includes("电池") ? "固态电池行业景气度研研判Skill" : "AI光电互联景气度研判Skill",
      time: "刚刚",
      pushStatus: "sent",
      stancePro: "超预期能耗指标在算力部署上立竿见影，核心标的出货预期将调增15%。",
      stanceCon: "早期中试系统制造成本仍存在局部溢价，需要观察大批量产线的订单饱和率。"
    };

    if (hasActiveKey && ai) {
      try {
        console.log(`Calling Gemini to construct hot event report for: ${title}`);
        const userPrompt = `
          你是一个高敏锐度的头部公募基金投研AI助手。
          针对最新发生的热点大事件：“${title || eventResult.title}”，所属行业：“${industryFocus || "新能源与高精芯片制造"}”。
          
          请直接分析、调用相关投研框架，生成一篇精干犀利的【热点事件点评】与【正反方观点擂台】。
          
          请务必直接输出JSON结构（只输出最内侧JSON，不要添加markdown以外多余代码），格式为：
          {
            "content": "对此热点事件极具专业水准的情况概述、物理瓶颈突破解释或商业重构点评，涵盖最真实投资链传导，大约150字。",
            "stancePro": "支持该大事件能大幅利好、破冰特定核心公司的核心正面投资逻辑点（精练、直击痛点，大约60字）",
            "stanceCon": "理性中立、针对供应链受限、Capex超标、工艺可靠性不稳定等潜在反方或投资抗折拐点漏洞警告（大约60字）",
            "relatedSkill": "关联的投研分析Skill名称"
          }
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userPrompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        });

        if (response.text) {
          const resObj = JSON.parse(response.text.trim());
          eventResult.content = resObj.content;
          eventResult.stancePro = resObj.stancePro;
          eventResult.stanceCon = resObj.stanceCon;
          eventResult.relatedSkill = resObj.relatedSkill;
        }
      } catch (err) {
        console.error("Gemini event analysis failed. Returning highly detailed preset.", err);
      }
    }

    eventsDb.unshift(eventResult);
    res.json(eventResult);
  });

  // API 13: Push event / simulation notification trigger
  app.post("/api/operations/push-all", (req, res) => {
    res.json({ success: true, message: "推送成功！已推向全平台 1,480 名订阅日活分析师端。" });
  });

  // API 14: Modify variables / factors directly in real-time
  app.post("/api/operations/factors/update", (req, res) => {
    const { id, newValue, newMomentum } = req.body;
    const factor = factorBoard.find(f => f.id === id);
    if (factor) {
      factor.value = newValue;
      if (newMomentum) factor.momentum = newMomentum;
      res.json({ success: true, factor });
    } else {
      res.status(404).json({ error: "Factor not found" });
    }
  });


  // Serve static files in production, integrate Vite dev server in development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting fullstack app in development mode with active Vite routing...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting fullstack app in production mode serving compiled static files...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    verifyGeminiKey();
  });
}

startServer();
