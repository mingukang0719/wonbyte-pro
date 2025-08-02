import { Link } from 'react-router-dom'
import { FileText, Palette, Zap, Download, ArrowRight, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                원바이트 PRO
              </h1>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                문해력 훈련
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">기능</a>
              <Link 
                to="/reading-trainer" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                문해력 훈련
              </Link>
              <Link 
                to="/editor" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                학습자료 제작
              </Link>
              <Link 
                to="/admin/login" 
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                관리자
              </Link>
              <Link
                to="/reading-trainer"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
              >
                시작하기
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI 기반 맞춤형
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                한국어 문해력 훈련
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              아이들이 좋아하는 주제로 흥미롭게 읽기 실력을 키워요!
              <br />
              AI가 학년별 맞춤 지문과 문제를 자동으로 생성합니다
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/reading-trainer"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 flex items-center"
              >
                문해력 훈련 시작하기
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/editor"
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-blue-300 hover:text-blue-600 transition-all duration-300"
              >
                학습자료 제작하기
              </Link>
            </div>

            {/* Demo Preview */}
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">문해력 훈련 3단계 프로세스</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-inner">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                        <div className="text-blue-600 font-bold text-2xl mb-2">1</div>
                        <p className="font-semibold">지문 준비</p>
                        <p className="text-sm text-gray-600 mt-1">AI 생성 또는 직접 입력</p>
                      </div>
                      <div className="text-center p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                        <div className="text-purple-600 font-bold text-2xl mb-2">2</div>
                        <p className="font-semibold">문해력 분석</p>
                        <p className="text-sm text-gray-600 mt-1">5가지 기준 난이도 평가</p>
                      </div>
                      <div className="text-center p-4 border-2 border-green-200 rounded-lg bg-green-50">
                        <div className="text-green-600 font-bold text-2xl mb-2">3</div>
                        <p className="font-semibold">문제 풀이</p>
                        <p className="text-sm text-gray-600 mt-1">어휘·독해 문제 자동 생성</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold text-gray-900 mb-4">강력한 기능</h3>
              <p className="text-xl text-gray-600">체계적인 한국어 문해력 향상을 위한 핵심 기능</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">맞춤형 지문 생성</h4>
                <p className="text-gray-600">아이의 관심사와 학년에 맞춘 AI 기반 읽기 지문 자동 생성</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Palette className="h-8 w-8 text-purple-600 mx-auto" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">문해력 난이도 분석</h4>
                <p className="text-gray-600">5가지 기준으로 지문의 난이도를 정밀하게 분석</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-green-600 mx-auto" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">자동 문제 생성</h4>
                <p className="text-gray-600">어휘, 독해, 비판적 사고 문제를 AI가 자동으로 생성</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-2xl w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-8 w-8 text-orange-600 mx-auto" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">학습 문제집 출력</h4>
                <p className="text-gray-600">완성된 학습 자료를 PDF로 다운로드하여 활용</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-4xl font-bold text-white mb-6">
              아이의 읽기 실력을 키워주세요
            </h3>
            <p className="text-xl text-blue-100 mb-8">
              흥미로운 주제로 시작하는 체계적인 문해력 훈련
            </p>
            <Link
              to="/reading-trainer"
              className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl transition-all duration-300 group"
            >
              문해력 훈련 시작하기
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-semibold">원바이트 PRO - 문해력 훈련 프로그램</span>
            </div>
            <div className="text-gray-400">
              <p>&copy; 2025 원바이트 PRO. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}