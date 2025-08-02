import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { config, apiFetch } from '../../config'

const ContentGenerator = () => {
  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [variables, setVariables] = useState({})
  const [provider, setProvider] = useState('claude')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await apiFetch(config.endpoints.adminTemplates)
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const handleTemplateSelect = (templateId) => {
    const template = templates.find(t => t.id === templateId)
    setSelectedTemplate(template)
    
    // 변수 초기화
    if (template) {
      const vars = {}
      template.variables?.forEach(v => {
        vars[v.name] = ''
      })
      setVariables(vars)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      alert('템플릿을 선택해주세요')
      return
    }

    setIsGenerating(true)
    try {
      const response = await apiFetch(config.endpoints.generateFromTemplate, {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          variables,
          provider
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setGeneratedContent(data)
      } else {
        alert('AI 생성에 실패했습니다: ' + (data.error || data.message))
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert('AI 생성에 실패했습니다: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const openInEditor = () => {
    // 생성된 콘텐츠를 세션 스토리지에 저장
    sessionStorage.setItem('generatedContent', JSON.stringify(generatedContent.content))
    navigate('/editor?mode=new&content=generated')
  }

  const copyToClipboard = () => {
    const text = typeof generatedContent.content === 'string' 
      ? generatedContent.content 
      : JSON.stringify(generatedContent.content, null, 2)
    
    navigator.clipboard.writeText(text)
    alert('클립보드에 복사되었습니다')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">지문 즉시 생성</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 왼쪽: 설정 영역 */}
        <div className="space-y-6">
          {/* AI 제공자 선택 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-3">AI 제공자</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="claude"
                  checked={provider === 'claude'}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mr-2"
                />
                Claude 3.5 Sonnet
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="gemini"
                  checked={provider === 'gemini'}
                  onChange={(e) => setProvider(e.target.value)}
                  className="mr-2"
                />
                Google Gemini
              </label>
            </div>
          </div>

          {/* 템플릿 선택 */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="font-semibold mb-3">템플릿 선택</h3>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">템플릿을 선택하세요</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title} ({template.content_type})
                </option>
              ))}
            </select>

            {selectedTemplate && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <p><strong>타입:</strong> {selectedTemplate.content_type}</p>
                <p><strong>난이도:</strong> {selectedTemplate.difficulty}</p>
                <p><strong>대상:</strong> {selectedTemplate.target_age}</p>
              </div>
            )}
          </div>

          {/* 변수 입력 */}
          {selectedTemplate && selectedTemplate.variables?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-3">변수 입력</h3>
              <div className="space-y-3">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium mb-1">
                      {variable.name}
                      {variable.description && (
                        <span className="text-gray-500 font-normal ml-2">
                          ({variable.description})
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={variables[variable.name] || ''}
                      onChange={(e) => setVariables({
                        ...variables,
                        [variable.name]: e.target.value
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={!selectedTemplate || isGenerating}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              !selectedTemplate || isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                생성 중...
              </div>
            ) : (
              '지문 생성하기'
            )}
          </button>
        </div>

        {/* 오른쪽: 결과 영역 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-3">생성된 콘텐츠</h3>
          
          {generatedContent ? (
            <div className="space-y-4">
              {/* 메타데이터 */}
              <div className="bg-gray-50 rounded p-3 text-sm">
                <p><strong>AI 제공자:</strong> {generatedContent.metadata.provider}</p>
                <p><strong>토큰 사용:</strong> {generatedContent.metadata.tokensUsed}</p>
                <p><strong>생성 시간:</strong> {generatedContent.metadata.generationTime}ms</p>
                <p><strong>템플릿:</strong> {generatedContent.metadata.templateUsed}</p>
              </div>

              {/* 콘텐츠 미리보기 */}
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                {renderContent(generatedContent.content)}
              </div>

              {/* 액션 버튼 */}
              <div className="flex space-x-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  클립보드에 복사
                </button>
                <button
                  onClick={openInEditor}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  에디터에서 열기
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-20">
              템플릿을 선택하고 생성 버튼을 클릭하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 콘텐츠 렌더링 함수
function renderContent(content) {
  if (typeof content === 'string') {
    return <pre className="whitespace-pre-wrap font-sans">{content}</pre>
  }

  if (content.title) {
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-bold">{content.title}</h4>
        {content.description && <p className="text-gray-600">{content.description}</p>}
        
        {content.mainContent && (
          <div className="space-y-2">
            <p>{content.mainContent.introduction}</p>
            {content.mainContent.keyPoints && (
              <ul className="list-disc list-inside">
                {content.mainContent.keyPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {content.vocabularyList && (
          <div className="space-y-2">
            {content.vocabularyList.map((vocab, idx) => (
              <div key={idx} className="border-b pb-2">
                <p><strong>{vocab.word}</strong>: {vocab.meaning}</p>
                <p className="text-sm text-gray-600">난이도: {vocab.difficulty}</p>
              </div>
            ))}
          </div>
        )}

        {content.questions && (
          <div className="space-y-3">
            {content.questions.map((q, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{idx + 1}. {q.question}</p>
                <p className="text-sm text-gray-600">({q.type}, {q.points}점)</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(content, null, 2)}</pre>
}

export default ContentGenerator