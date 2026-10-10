'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeworkPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');

    // 【核心修复】：前端 Canvas 暴力压缩，将几 MB 的照片压至几百 KB，彻底绕过 Vercel 的体积熔断拦截！
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // 保证题目清晰度的最大宽度
        let scale = 1;
        if (img.width > MAX_WIDTH) {
          scale = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 压缩为 JPEG，画质 0.7 即可满足 AI 识别，体积骤降
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setImage(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError('请先上传作业照片');
      return;
    }
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      const responseText = await res.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        // 如果后端崩溃返回了 HTML（比如 504 超时），直接红字爆出
        throw new Error(`服务器底层的真实拦截 (状态码 ${res.status}): ${responseText.substring(0, 150)}...`);
      }

      if (!res.ok) {
        // 直接抛出后端的真实报错，绝不再用废话掩盖
        throw new Error(data.error || `API 拒绝访问 (状态码: ${res.status})`);
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <button
        onClick={() => router.push('/dashboard/students')}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        &larr; 返回学员管理
      </button>

      <h1 className="text-2xl font-bold mb-8 text-gray-800">| AI 全科智能作业批改</h1>

      <div className="bg-white shadow-md rounded-xl p-6 space-y-6 border border-gray-100">
        <form onSubmit={handleSimulateAI} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择学员</label>
              <select className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500">
                <option>余文清 (小学)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">智能科目识别</label>
              <div className="w-full border border-gray-200 bg-gray-50 rounded-md p-2.5 text-gray-500">
                AI 将自动识别图中的学科
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">上传作业照片 (自动防超载压缩)</label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                ref={fileInputRef}
              />
              <div className="text-4xl text-gray-400 mb-3">📸</div>
              {fileName ? (
                <p className="text-blue-600 font-medium">已准备就绪: {fileName}</p>
              ) : (
                <p className="text-gray-600 font-medium">点击此处上传手机拍的作业照片</p>
              )}
              <p className="text-xs text-gray-400 mt-2">支持高清图片，系统将在本地自动极速压缩</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !image}
            className={`w-full py-3.5 rounded-lg text-white font-bold text-lg transition-all shadow-md ${
              loading || !image ? 'bg-blue-300 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {loading ? 'AI 正在连接全球题库，请稍候...' : '开始 AI 智能批改'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-center text-red-700 font-bold mb-2">
              <span className="text-lg mr-2">❌ 侦测到致命错误：</span>
            </div>
            <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono bg-red-100 p-3 rounded">{error}</pre>
            <p className="text-sm text-red-600 mt-3 font-medium">👉 如果您看到了这个红框，请直接截图发给技术人员，真相已经大白了！</p>
          </div>
        )}

        {result && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center text-green-700 font-bold text-lg mb-4 border-b border-green-200 pb-2">
              <span className="mr-2">✨ 批改与解析完成</span>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-100 whitespace-pre-wrap text-gray-800 leading-relaxed text-base shadow-inner font-serif">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}