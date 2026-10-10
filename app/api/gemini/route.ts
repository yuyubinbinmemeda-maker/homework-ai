export const maxDuration = 60;

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
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';')) || 'image/jpeg';
    const base64Data = image.split(',')[1];
    
    const prompt = `你现在是一名精通全球知识题库的顶级全科辅导名师。
请仔细观察这张作业照片：
1. 【学科判定】：首先准确识别出这是什么科目（如数学、语文、英语、物理等）。
2. 【错题批改】：找出学生做错的题目，并指出具体错误原因。
3. 【标准答案】：依靠全球知识题库，给出绝对准确的标准答案。
4. 【深度解析】：提供保姆级的详细推导和解析过程，帮助学生彻底理解知识点。
请使用清晰美观的排版输出你的批改报告。`;

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
    return NextResponse.json({ 
      error: `API 调用失败: ${error.message}` 
    }, { status: 500 });
  }
}
