import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts'
import { Trophy, TrendingUp, Award, Target } from 'lucide-react'

/**
 * 종합 이해도 평가 및 시각화 컴포넌트
 * 다양한 독해력 훈련 결과를 종합하여 분석하고 시각화
 */
export default function ComprehensionAssessment({ userId, assessmentData }) {
  const [overallScore, setOverallScore] = useState(0)
  const [skillRadarData, setSkillRadarData] = useState([])
  const [progressData, setProgressData] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [achievements, setAchievements] = useState([])

  // 평가 데이터 처리
  useEffect(() => {
    if (assessmentData) {
      calculateOverallScore()
      prepareSkillRadarData()
      prepareProgressData()
      generateRecommendations()
      checkAchievements()
    }
  }, [assessmentData])

  // 종합 점수 계산
  const calculateOverallScore = () => {
    const scores = [
      assessmentData.keywordQuizScore || 0,
      assessmentData.sentenceOrderingScore || 0,
      assessmentData.fillBlanksScore || 0,
      assessmentData.summarizationScore || 0,
      assessmentData.inferenceScore || 0,
      assessmentData.vocabularyContextScore || 0,
      assessmentData.logicalConnectionScore || 0,
      assessmentData.speedReadingScore || 0
    ]
    
    const validScores = scores.filter(score => score > 0)
    const average = validScores.length > 0 
      ? Math.round(validScores.reduce((a, b) => a + b) / validScores.length)
      : 0
    
    setOverallScore(average)
  }

  // 스킬별 레이더 차트 데이터 준비
  const prepareSkillRadarData = () => {
    const data = [
      {
        skill: '키워드 이해',
        score: assessmentData.keywordQuizScore || 0,
        fullMark: 100
      },
      {
        skill: '문장 구조',
        score: assessmentData.sentenceOrderingScore || 0,
        fullMark: 100
      },
      {
        skill: '어휘력',
        score: assessmentData.vocabularyContextScore || 0,
        fullMark: 100
      },
      {
        skill: '요약 능력',
        score: assessmentData.summarizationScore || 0,
        fullMark: 100
      },
      {
        skill: '추론 능력',
        score: assessmentData.inferenceScore || 0,
        fullMark: 100
      },
      {
        skill: '논리 이해',
        score: assessmentData.logicalConnectionScore || 0,
        fullMark: 100
      },
      {
        skill: '속독 능력',
        score: assessmentData.speedReadingScore || 0,
        fullMark: 100
      }
    ]
    
    setSkillRadarData(data)
  }

  // 진행도 차트 데이터 준비
  const prepareProgressData = () => {
    // 최근 7일간의 데이터
    const data = assessmentData.recentHistory || []
    setProgressData(data)
  }

  // 개인화된 추천 생성
  const generateRecommendations = () => {
    const recs = []
    
    // 각 영역별 점수에 따른 추천
    if (assessmentData.keywordQuizScore < 70) {
      recs.push({
        area: '키워드 이해',
        suggestion: '지문을 읽을 때 핵심 단어에 집중하는 연습을 해보세요.',
        priority: 'high'
      })
    }
    
    if (assessmentData.inferenceScore < 70) {
      recs.push({
        area: '추론 능력',
        suggestion: '글에 직접 나타나지 않은 의미를 생각해보는 연습이 필요합니다.',
        priority: 'high'
      })
    }
    
    if (assessmentData.summarizationScore < 70) {
      recs.push({
        area: '요약 능력',
        suggestion: '읽은 내용의 핵심을 한두 문장으로 정리하는 연습을 해보세요.',
        priority: 'medium'
      })
    }
    
    if (assessmentData.speedReadingScore < 70) {
      recs.push({
        area: '속독 능력',
        suggestion: '점진적으로 읽기 속도를 높이는 훈련을 시작해보세요.',
        priority: 'low'
      })
    }
    
    setRecommendations(recs)
  }

  // 성취 배지 확인
  const checkAchievements = () => {
    const badges = []
    
    if (overallScore >= 90) {
      badges.push({
        id: 'master_reader',
        name: '독해 마스터',
        description: '모든 영역에서 우수한 성적을 거두었습니다!',
        icon: '🏆',
        color: 'gold'
      })
    }
    
    if (assessmentData.consecutiveDays >= 7) {
      badges.push({
        id: 'consistent_learner',
        name: '꾸준한 학습자',
        description: '일주일 연속 학습을 완료했습니다!',
        icon: '🔥',
        color: 'red'
      })
    }
    
    if (assessmentData.totalBooksRead >= 10) {
      badges.push({
        id: 'bookworm',
        name: '책벌레',
        description: '10개 이상의 지문을 읽었습니다!',
        icon: '📚',
        color: 'blue'
      })
    }
    
    setAchievements(badges)
  }

  return (
    <div className="space-y-6">
      {/* 종합 점수 카드 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">종합 이해도 점수</h2>
            <p className="text-blue-100">모든 훈련 영역의 평균 점수입니다</p>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold">{overallScore}%</div>
            <div className="text-blue-100 mt-2">
              {overallScore >= 80 ? '우수' : overallScore >= 60 ? '양호' : '노력 필요'}
            </div>
          </div>
        </div>
      </div>

      {/* 스킬별 능력 레이더 차트 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">영역별 능력 분석</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={skillRadarData}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="점수"
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.5}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 진행도 추이 차트 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">최근 학습 진행도</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 개인화된 추천 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Target className="w-6 h-6 text-purple-600 mr-2" />
          <h3 className="text-xl font-semibold">맞춤형 학습 추천</h3>
        </div>
        
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                rec.priority === 'high' 
                  ? 'border-red-500 bg-red-50' 
                  : rec.priority === 'medium'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-green-500 bg-green-50'
              }`}
            >
              <h4 className="font-semibold mb-1">{rec.area}</h4>
              <p className="text-gray-700">{rec.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 성취 배지 */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-xl font-semibold">획득한 배지</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map(badge => (
              <div 
                key={badge.id}
                className="text-center p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <h4 className="font-semibold">{badge.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 상세 점수 표 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">상세 평가 결과</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">평가 영역</th>
                <th className="text-center py-2">점수</th>
                <th className="text-center py-2">등급</th>
                <th className="text-left py-2">피드백</th>
              </tr>
            </thead>
            <tbody>
              {skillRadarData.map((skill, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">{skill.skill}</td>
                  <td className="text-center font-semibold">{skill.score}점</td>
                  <td className="text-center">
                    <span className={`px-2 py-1 rounded text-sm ${
                      skill.score >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : skill.score >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {skill.score >= 80 ? '우수' : skill.score >= 60 ? '양호' : '노력 필요'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {skill.score >= 80 
                      ? '훌륭합니다! 계속 유지해주세요.'
                      : skill.score >= 60
                      ? '좋습니다. 조금 더 연습하면 완벽해질 거예요.'
                      : '더 많은 연습이 필요합니다. 포기하지 마세요!'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 다음 단계 안내 */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-8 h-8 mr-3" />
          <h3 className="text-2xl font-bold">다음 단계</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">오늘의 목표</h4>
            <ul className="space-y-1 text-sm">
              <li>• 원바이트 모드로 새로운 지문 읽기</li>
              <li>• 약한 영역 집중 훈련하기</li>
              <li>• 속독 속도 50자 늘리기</li>
            </ul>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">이번 주 목표</h4>
            <ul className="space-y-1 text-sm">
              <li>• 종합 점수 5점 향상시키기</li>
              <li>• 모든 훈련 모듈 1회 이상 완료</li>
              <li>• 연속 7일 학습 달성</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}