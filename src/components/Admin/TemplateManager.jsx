import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const TemplateManager = () => {
  const [templates, setTemplates] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/templates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 이 템플릿을 삭제하시겠습니까?')) return

    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">템플릿 관리</h2>
        <button
          onClick={() => {
            setEditingTemplate(null)
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          새 템플릿 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {showModal && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false)
            fetchTemplates()
          }}
        />
      )}
    </div>
  )
}

const TemplateCard = ({ template, onEdit, onDelete }) => {
  const contentTypeLabels = {
    reading: '읽기 지문',
    vocabulary: '어휘 학습',
    grammar: '문법 설명',
    quiz: '퀴즈',
    questions: '문제',
    answers: '해설'
  }

  const difficultyLabels = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <h3 className="font-bold text-lg mb-2">{template.title}</h3>
      <div className="space-y-2 text-sm text-gray-600">
        <p>타입: {contentTypeLabels[template.content_type]}</p>
        <p>난이도: {difficultyLabels[template.difficulty]}</p>
        <p>대상: {template.target_age}</p>
      </div>
      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={() => onEdit(template)}
          className="text-blue-600 hover:text-blue-800"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="text-red-600 hover:text-red-800"
        >
          삭제
        </button>
      </div>
    </div>
  )
}

const TemplateModal = ({ template, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    content_type: template?.content_type || 'reading',
    difficulty: template?.difficulty || 'intermediate',
    target_age: template?.target_age || 'adult',
    template_prompt: template?.template_prompt || '',
    variables: template?.variables || []
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('adminToken')
      const url = template 
        ? `/api/admin/templates/${template.id}`
        : '/api/admin/templates'
      
      const response = await fetch(url, {
        method: template ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSave()
      }
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [...formData.variables, { name: '', description: '' }]
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-90vh overflow-y-auto p-6">
        <h3 className="text-xl font-bold mb-4">
          {template ? '템플릿 수정' : '새 템플릿 생성'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">템플릿 이름</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">콘텐츠 타입</label>
            <select
              value={formData.content_type}
              onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="reading">읽기 지문</option>
              <option value="vocabulary">어휘 학습</option>
              <option value="grammar">문법 설명</option>
              <option value="quiz">퀴즈</option>
              <option value="questions">문제</option>
              <option value="answers">해설</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">난이도</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">대상 연령</label>
            <input
              type="text"
              value={formData.target_age}
              onChange={(e) => setFormData({ ...formData, target_age: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: adult, elem1, middle2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">프롬프트 템플릿</label>
            <textarea
              value={formData.template_prompt}
              onChange={(e) => setFormData({ ...formData, template_prompt: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="{{topic}} 주제로 {{difficulty}} 수준의 한국어 읽기 지문을 {{length}}자로 작성해주세요..."
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              변수는 {'{{변수명}}'} 형식으로 작성하세요.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">변수 정의</label>
              <button
                type="button"
                onClick={addVariable}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                변수 추가
              </button>
            </div>
            {formData.variables.map((variable, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="변수명"
                  value={variable.name}
                  onChange={(e) => {
                    const newVars = [...formData.variables]
                    newVars[index].name = e.target.value
                    setFormData({ ...formData, variables: newVars })
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="설명"
                  value={variable.description}
                  onChange={(e) => {
                    const newVars = [...formData.variables]
                    newVars[index].description = e.target.value
                    setFormData({ ...formData, variables: newVars })
                  }}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newVars = formData.variables.filter((_, i) => i !== index)
                    setFormData({ ...formData, variables: newVars })
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {template ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TemplateManager