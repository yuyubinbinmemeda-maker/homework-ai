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
    
    // 【核心修复】必须使用 flash 模型，其响应时间约 3-4 秒，完美避开 Vercel 的 10 秒强制中断限制
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 自动提取前端传来的图片 MIME 类型 (如 image/jpeg) 和 Base64 数据
    const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';')) || 'image/jpeg';
    const base64Data = image.split(',')[1];
    
    const prompt = "请作为一名专业的数学老师，批改这份数学作业。请明确指出错误的地方，并给出正确的解答过程。";

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
    // 绝不掩盖真实错误，直接将底层报错返回给前端
    return NextResponse.json({ 
      error: `API 调用失败: ${error.message}` 
    }, { status: 500 });
  }
}