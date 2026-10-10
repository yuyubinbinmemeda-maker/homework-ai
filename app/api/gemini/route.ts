import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. 初始化标准的 Gemini API 客户端
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, image, subject } = body;
    const currentSubject = subject || "自动识别";

    // 2. 指定使用 gemini-1.5-pro 视觉大模型
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // 3. 完美保留您昨天编写的严苛全科全能提示词
    const systemPrompt = `你现在是资深的 K12 全科全能名师与 AI 智能作业批改专家（精通数学、物理、化学、生物、语文、英语、历史、地理等所有 K12 学科）。
请使用你顶级的视觉多模态（Vision）能力，对用户上传的【作业/试卷真实图片】进行全盘精准 OCR 扫描与深度解析。

【核心硬性要求（绝对不能违背）】：
1. **智能学科识别**：请首先自动识别并判定该份试卷/作业所属的具体学科（如：数学、物理、化学、英语等），并在报告顶部明确标出。
2. **真实读图，绝对禁止瞎编**：必须精准、逐字逐句地提取图片中实际存在的【所有题目】。试卷上印刷或手写了多少道题，你就必须一题不漏地全部识别出来，题号必须与试卷原图完全一致，绝对不允许减少题数或虚构假题！
3. **完整还原选项与内容**：如果是选择题或客观题，必须完整还原原题文字及所有选项（A、B、C、D）。
4. **精确标准答案**：给出该题的确切标准答案或正确选项。
5. **面向老师课堂讲解的保姆级深度解析**：针对每一道真实提取的题目，必须严格按以下结构输出，供老师上课讲解或学生订正使用：
   - 📌 **题号与学科/题型**：严格对齐试卷序号（如第 1 题、第 2 题...）。
   - 📝 **试卷真实原题与完整选项**。
   - 👤 **学员作答分析**：精准识别并分析学生在图片中写下的作答。
   - ❌/✔️ **批改结果**：判定正确或错误。
   - 🔑 **精确标准答案与选项**。
   - 🧠 **独立核心知识点**：明确指出该题具体考察的专属核心考点（严禁套话）。
   - 💡 **面向老师课堂讲解的保姆级解析**：
     * ① **审题切入点与考点剖析**：老师上课时如何引导学生破题。
     * ② **严密的推导与解答步骤**：一步步的详细演算过程。
     * ③ **课堂板书与易错陷阱警示**：指出学生在此题最容易犯的错误和失分原因。

用户附加要求：${prompt || "请对该试卷图片进行全盘真实读图、一题不漏的逐题多模态精细批改与详解。"}`;

    // 4. 构造发送给 AI 的数据包const parts: any[] = [systemPrompt];

    // 处理前端传来的图片
    if (image) {
      const base64Data = typeof image === 'string' && image.includes(',') ? image.split(',')[1] : image;
      const actualBase64 = base64Data?.inlineData?.data || base64Data; 

      if (actualBase64) {
        parts.push({
          inlineData: {
            data: actualBase64,
            mimeType: "image/jpeg",
          }
        });
      } }

    // 5. 调用大模型并等待结果 (补全了您丢失的这部分核心逻辑！)
    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    // 6. 将结果返回给前端，统一格式为 result
    return NextResponse.json({ result: responseText });

  } catch (error: any) {
    console.error("AI 批改后端报错:", error);
    return NextResponse.json({ error: error.message || "内部服务器错误" }, { status: 500 });
  }
}