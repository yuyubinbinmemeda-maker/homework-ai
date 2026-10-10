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
    
    // 【终极修复】加上 -latest 后缀，解决 404 找不到模型的问题
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    const mimeType = image.substring(image.indexOf(':') + 1, image.indexOf(';')) || 'image/jpeg';
    const base64Data = image.split(',')[1];
    
    // 【超级大脑】全科名师提示词
    const prompt = `你现在是一名精通全球知识题库的顶级全科辅导名师。
请仔细观察这张作业照片：
1. 准确识别出这是什么科目（如数学、语文、英语、物理等），绝对不能出错。
2. 找出学生做错的题目，并指出错误原因。
3. 依靠全球知识题库，给出绝对准确的标准答案。
4. 提供保姆级的详细解析过程，帮助学生彻底理解。
请用排版清晰、易于阅读的格式输出。`;

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