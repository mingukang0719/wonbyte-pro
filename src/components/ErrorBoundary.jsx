import React from 'react'
import { AlertCircle } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">페이지 로드 중 오류가 발생했습니다</h1>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">다음과 같은 문제가 발생했습니다:</p>
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="font-mono text-sm text-red-800">
                  {this.state.error && this.state.error.toString()}
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mb-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  개발자용 상세 정보 보기
                </summary>
                <pre className="mt-2 bg-gray-100 p-4 rounded text-xs overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">해결 방법:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>페이지를 새로고침 해보세요</li>
                <li>브라우저 캐시를 지우고 다시 시도해보세요</li>
                <li>문제가 계속되면 관리자에게 문의하세요</li>
              </ul>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                페이지 새로고침
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                이전 페이지로
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary