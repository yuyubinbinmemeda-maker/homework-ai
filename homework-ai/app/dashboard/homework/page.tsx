'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, ArrowLeft, Loader2, BookOpen } from 'lucide-react'

interface Student {
  id: string
  name: string
  grade: string
}

export default function HomeworkPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [subject, setSubject] = useState('数学')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('id, name, grade')
    if (data) setStudents(data)
  }

  const handleSimulateAI = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) {
      alert('请先选择对应的学员')
      return
    }
    setAnalyzing(true)
    setResult(null)

    // 模拟 AI 智能批改延迟
    setTimeout(() => {
      setAnalyzing(false)
      setResult('【AI 批改诊断报告】\n1. 第3题计算失误：分母没有通分直接相加，正确解法应先通分...\n2. 第5题应用题思路正确，但单位换算漏写了。\n【综合评价】：整体完成度良好，需加强异分母加减法练习。')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/dashboard/students')}
              className="flex items-center text-sm text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> 返回学员管理
            </button>
            <h1 className="text-xl font-bold text-gray-900">| AI 智能作业批改</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <form onSubmit={handleSimulateAI} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">选择学员</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">-- 请选择学员 --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">科目</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="数学">数学</option>
                <option value="语文">语文</option>
                <option value="英语">英语</option>
                <option value="物理">物理</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">上传作业照片</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 cursor-pointer">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">点击上传作业图片</span> 或拖拽图片到这里
                  </div>
                  <p className="text-xs text-gray-500">支持 PNG, JPG, JPEG 格式</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
            >
              {analyzing ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" /> AI 正在深度批改中...
                </>
              ) : (
                '开始 AI 智能批改'
              )}
            </button>
          </form>

          {result && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <div className="flex items-center text-blue-800 font-bold">
                <CheckCircle className="w-5 h-5 mr-2" /> 批改完成
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-white p-4 rounded border border-gray-200">
                {result}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}