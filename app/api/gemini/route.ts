import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: '未收到图片数据' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: '后端环境变量 GOOGLE_API_KEY 未配置' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 继续使用 flash 模型，保证 3-5 秒极速响应，绝对防止 Vercel 10秒断网
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 自动提取前端传来的图片 MIME 类型和 Base64 数据
    const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';')) || 'image/jpeg';
    const base64Data = image.split(',')[1];
    
    // 【核心升级】：注入顶级的全科智能提示词
    const prompt = `你现在是资深的 K12 全科全能名师与 AI 智能作业批改专家。请使用你顶级的视觉多模态能力，连接全球知识题库，对用户上传的【作业/试卷真实图片】进行全盘精准扫描与深度解析。

【核心硬性要求（绝对不能违背）】：
1. 智能学科判定（零容错）：请首先自动识别该图片所属的具体学科（如数学、物理、化学、语文、英语等），并在报告最顶部使用【学科：XXX】醒目标出，绝对不能识别出错。
2. 真实读图提取：精准提取图片中实际存在的所有题目（包含客观题的原题及选项），绝不允许凭空捏造。
3. 学情分析与批改：明确指出学员作答的具体错误位置及原因，并给出最终对错判定。
4. 依托全球题库的精确答案：必须给出确切的标准答案。
5. 面向老师的保姆级深度解析：针对每道题，必须严格按以下结构输出：
   - 📌 题号与题型
   - 📝 试卷真实原题提取
   - ❌/✔️ 批改结果与学员错因
   - 🔑 精确标准答案
   - 🧠 独立核心知识点考查
   - 💡 详细推导与解答步骤（保姆级详解，方便老师直接讲课）`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
    ]);

    const text = result.response.text();
    return NextResponse.json({ result: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 绝不掩盖真实错误，直接将底层报错返回给前端大红字显示
    return NextResponse.json({ 
      error: `API 调用失败: ${error.message}` 
    }, { status: 500 });
  }
}