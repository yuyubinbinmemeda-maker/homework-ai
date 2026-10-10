import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

    const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';')) || 'image/jpeg';
    const base64Data = image.split(',')[1];

    const prompt = `你现在是一名精通全球知识题库的顶级全科辅导名师。
请仔细观察这张作业照片：
1. 【学科判定】：首先准确识别出这是什么科目（如数学、语文、英语、物理等）。
2. 【错题批改】：找出学生做错的题目，并指出具体错误原因。
3. 【标准答案】：依靠全球知识题库，给出绝对准确的标准答案。
4. 【深度解析】：提供保姆级的详细推导和解析过程，帮助学生彻底理解知识点。

【极其重要的格式要求】：
绝对禁止使用任何 LaTeX 代码语法（如 $...$, \\frac, \\pm, \\sqrt, \\neq 等）！
前端网页无法解析这些代码，你必须且只能使用“普通纯文本”和“常规 Unicode 符号”来书写所有数学、物理、化学公式。
例如：
- 不要写 \\pm\\sqrt{x}，请直接写 ±√x
- 不要写 x \\neq 1，请直接写 x ≠ 1
- 平方或立方请直接写 x² 或 x³
- 分数不要用 \\frac，请直接用斜杠写，例如 1/x 或 (x+1)/(x-1)
- 乘除号请用 × 和 ÷
请严格遵守此规则，确保你输出的每一个字和符号，学生都能直接看懂。`;

    const maxRetries = 3;
    let lastError: any = null;
    let resultText = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ]);

        resultText = response.response.text();
        break; 
      } catch (err: any) {
        lastError = err;
        const is503 = err.message && (err.message.includes('503') || err.message.includes('high demand'));

        if (is503 && attempt < maxRetries) {
          await sleep(attempt * 1500); 
          continue;
        }
        throw err;
      }
    }

    if (!resultText) {
      throw lastError;
    }

    return NextResponse.json({ result: resultText });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({
      error: `API 调用失败: ${error.message}`
    }, { status: 500 });
  }
}
