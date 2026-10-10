'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Users, Plus, LogOut, Search } from 'lucide-react'

interface Student {
  id: string
  name: string
  grade: string
  parent_phone: string
  created_at: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGrade, setNewGrade] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching students:', error.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('students').insert([
      { name: newName, grade: newGrade, parent_phone: newPhone }
    ])
    if (error) {
      alert('添加失败: ' + error.message)
    } else {
      setNewName('')
      setNewGrade('')
      setNewPhone('')
      setIsModalOpen(false)
      fetchStudents()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.grade.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">K12 托管AI作业订正系统 - 学员管理</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-1" /> 退出登录
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名或年级..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> 添加学员
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">学员姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年级</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">家长联系电话</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">加载中...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">暂无学员数据，请点击右上角添加</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.parent_phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(student.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">添加新学员</h3>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">学员姓名</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    placeholder="例如：张小明"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">年级</label>
                  <input
                    type="text"
                    required
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    placeholder="例如：初二"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">家长联系电话</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    placeholder="请输入手机号"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
                  >
                    确认添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}