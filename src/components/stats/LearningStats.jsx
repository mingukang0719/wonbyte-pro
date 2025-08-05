import React, { useState, useEffect } from 'react'
import { TrendingUp, Clock, BookOpen, Target, Award, Calendar, Zap } from 'lucide-react'
import { LearningStatsManager } from '../../utils/storage'

export default function LearningStats() {
  const [stats, setStats] = useState(null)
  const [todayStats, setTodayStats] = useState(null)
  const [weeklyStats, setWeeklyStats] = useState([])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = () => {
    setStats(LearningStatsManager.getStats())
    setTodayStats(LearningStatsManager.getTodayStats())
    setWeeklyStats(LearningStatsManager.getWeeklyStats())
  }

  if (!stats) return null

  const accuracyRate = stats.problemsSolved > 0 
    ? Math.round((stats.correctAnswers / stats.problemsSolved) * 100) 
    : 0

  const maxDayValue = Math.max(...weeklyStats.map(d => d.time), 20)

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
          학습 통계
        </h2>
        <div className="flex items-center bg-orange-100 px-3 py-1 rounded-full">
          <Zap className="w-4 h-4 mr-1 text-orange-600" />
          <span className="text-sm font-semibold text-orange-700">
            {stats.weeklyStreak}일 연속
          </span>
        </div>
      </div>

      {/* 오늘의 학습 */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-purple-600" />
          오늘의 학습
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-gray-800">{todayStats.time}</p>
            <p className="text-xs text-gray-600">분</p>
          </div>
          <div className="text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-1 text-green-500" />
            <p className="text-2xl font-bold text-gray-800">{todayStats.texts}</p>
            <p className="text-xs text-gray-600">지문</p>
          </div>
          <div className="text-center">
            <Target className="w-8 h-8 mx-auto mb-1 text-purple-500" />
            <p className="text-2xl font-bold text-gray-800">{todayStats.problems}</p>
            <p className="text-xs text-gray-600">문제</p>
          </div>
          <div className="text-center">
            <Award className="w-8 h-8 mx-auto mb-1 text-yellow-500" />
            <p className="text-2xl font-bold text-gray-800">
              {todayStats.problems > 0 
                ? Math.round((todayStats.correct / todayStats.problems) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-gray-600">정답률</p>
          </div>
          <div className="text-center">
            <span className="text-3xl mb-1">📚</span>
            <p className="text-2xl font-bold text-gray-800">{todayStats.vocabulary}</p>
            <p className="text-xs text-gray-600">단어</p>
          </div>
        </div>
      </div>

      {/* 주간 학습 그래프 */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">주간 학습 시간</h3>
        <div className="flex items-end justify-between h-32 gap-1">
          {weeklyStats.map((day, index) => {
            const height = maxDayValue > 0 ? (day.time / maxDayValue) * 100 : 0
            const isToday = index === weeklyStats.length - 1
            
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="relative w-full">
                  <div 
                    className={`w-full transition-all duration-500 rounded-t ${
                      isToday ? 'bg-blue-500' : 'bg-blue-400'
                    } ${day.time === 0 ? 'bg-gray-300' : ''}`}
                    style={{ height: `${height}px`, minHeight: day.time > 0 ? '4px' : '2px' }}
                  >
                    {day.time > 0 && (
                      <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-700">
                        {day.time}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs mt-1 ${isToday ? 'font-bold' : ''}`}>
                  {day.day}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">총 학습 시간</p>
          <p className="text-xl font-bold text-blue-600">
            {Math.floor(stats.totalTime / 60)}시간 {stats.totalTime % 60}분
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">읽은 지문</p>
          <p className="text-xl font-bold text-green-600">{stats.textsRead}개</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">학습한 어휘</p>
          <p className="text-xl font-bold text-purple-600">{stats.vocabularyLearned}개</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <p className="text-sm text-gray-600">평균 정답률</p>
          <p className="text-xl font-bold text-yellow-600">{accuracyRate}%</p>
        </div>
      </div>
    </div>
  )
}