import React, { useState, useEffect } from 'react'
import { Trophy, Star, Target, Gift, Zap, TrendingUp, Award, Shield } from 'lucide-react'
import { GameDataManager, LearningStatsManager } from '../../utils/storage'

export default function GameDashboard({ onClose }) {
  const [gameData, setGameData] = useState(null)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [showReward, setShowReward] = useState(null)

  useEffect(() => {
    loadGameData()
    checkDailyLogin()
  }, [])

  const loadGameData = () => {
    setGameData(GameDataManager.getGameData())
  }

  const checkDailyLogin = () => {
    const today = new Date().toISOString().split('T')[0]
    const lastLogin = localStorage.getItem('wonbyte_last_login')
    
    if (lastLogin !== today) {
      localStorage.setItem('wonbyte_last_login', today)
      // 일일 로그인 보상
      const data = GameDataManager.addPoints(10)
      GameDataManager.addExp(5)
      setGameData(data)
      setShowReward({ type: 'daily', points: 10, exp: 5 })
      
      setTimeout(() => setShowReward(null), 3000)
    }
  }

  const badges = [
    { id: 'first_step', name: '첫 걸음', description: '첫 문제 풀기', icon: '👶', unlocked: true },
    { id: 'vocabulary_master', name: '어휘 마스터', description: '어휘 정답률 90% 달성', icon: '📚', unlocked: gameData?.badges?.includes('vocabulary_master') },
    { id: 'perfect_learner', name: '완벽한 학습자', description: '모든 오답 해결', icon: '🎯', unlocked: gameData?.badges?.includes('perfect_learner') },
    { id: 'week_warrior', name: '주간 전사', description: '7일 연속 학습', icon: '🔥', unlocked: false },
    { id: 'speed_reader', name: '속독왕', description: '하루 10개 지문 읽기', icon: '⚡', unlocked: false },
    { id: 'problem_solver', name: '문제 해결사', description: '100문제 풀기', icon: '🧩', unlocked: false },
    { id: 'dedication', name: '성실왕', description: '30일 학습', icon: '💎', unlocked: false },
    { id: 'champion', name: '챔피언', description: '레벨 50 달성', icon: '👑', unlocked: false }
  ]

  const dailyQuests = [
    { id: 'daily_read', name: '오늘의 독서', description: '지문 3개 읽기', progress: 1, total: 3, reward: 20 },
    { id: 'daily_vocab', name: '어휘 학습', description: '새 단어 10개 학습', progress: 5, total: 10, reward: 15 },
    { id: 'daily_problem', name: '문제 풀기', description: '문제 5개 풀기', progress: 2, total: 5, reward: 25 },
    { id: 'daily_time', name: '학습 시간', description: '20분 학습하기', progress: 10, total: 20, reward: 30 }
  ]

  const weeklyQuests = [
    { id: 'weekly_streak', name: '연속 학습', description: '5일 연속 학습', progress: 3, total: 5, reward: 100 },
    { id: 'weekly_accuracy', name: '정확도 마스터', description: '정답률 80% 유지', progress: 75, total: 80, reward: 80 },
    { id: 'weekly_texts', name: '다독왕', description: '지문 20개 읽기', progress: 12, total: 20, reward: 120 },
    { id: 'weekly_review', name: '복습의 달인', description: '어휘 50개 복습', progress: 30, total: 50, reward: 150 }
  ]

  const characters = [
    { id: 'buddy', name: '버디', description: '친근한 학습 친구', icon: '🐶', level: gameData?.characterLevel || 1, unlocked: true },
    { id: 'wizard', name: '마법사', description: '지혜로운 조언자', icon: '🧙', level: 1, unlocked: gameData?.level >= 10 },
    { id: 'robot', name: '로봇', description: '효율적인 도우미', icon: '🤖', level: 1, unlocked: gameData?.level >= 20 },
    { id: 'dragon', name: '드래곤', description: '강력한 동반자', icon: '🐉', level: 1, unlocked: gameData?.level >= 30 }
  ]

  const items = [
    { id: 'exp_boost', name: '경험치 부스터', description: '30분간 경험치 2배', icon: '⚡', cost: 50, owned: 0 },
    { id: 'hint_card', name: '힌트 카드', description: '문제 힌트 제공', icon: '💡', cost: 20, owned: 3 },
    { id: 'shield', name: '실수 방어막', description: '틀려도 연속 기록 유지', icon: '🛡️', cost: 100, owned: 1 },
    { id: 'time_freeze', name: '시간 정지', description: '제한 시간 일시 정지', icon: '⏱️', cost: 30, owned: 2 }
  ]

  const handleQuestClaim = (quest, type) => {
    if (quest.progress >= quest.total) {
      GameDataManager.addPoints(quest.reward)
      GameDataManager.addExp(quest.reward / 2)
      setShowReward({ type: 'quest', points: quest.reward, exp: quest.reward / 2 })
      setTimeout(() => setShowReward(null), 3000)
      loadGameData()
    }
  }

  const handleItemPurchase = (item) => {
    if (gameData.points >= item.cost) {
      GameDataManager.addPoints(-item.cost)
      // 아이템 추가 로직
      setShowReward({ type: 'purchase', item: item.name })
      setTimeout(() => setShowReward(null), 3000)
      loadGameData()
    }
  }

  if (!gameData) return null

  const expForNextLevel = gameData.level * 100
  const expProgress = (gameData.exp / expForNextLevel) * 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              게임 대시보드
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                ×
              </button>
            )}
          </div>
          
          {/* 플레이어 정보 */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">레벨 {gameData.level}</span>
                <Star className="w-4 h-4" />
              </div>
              <div className="bg-white bg-opacity-30 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-full transition-all"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
              <span className="text-xs mt-1 block">
                {gameData.exp} / {expForNextLevel} EXP
              </span>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1" />
              <span className="text-lg font-bold">{gameData.points}</span>
              <span className="text-xs block">포인트</span>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
              <span className="text-2xl">{characters.find(c => c.id === gameData.character)?.icon || '🐶'}</span>
              <span className="text-xs block mt-1">
                {characters.find(c => c.id === gameData.character)?.name || '버디'}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex bg-gray-100">
          {['overview', 'quests', 'badges', 'characters', 'shop'].map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-3 font-medium transition-colors ${
                selectedTab === tab
                  ? 'bg-white text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab === 'overview' && '개요'}
              {tab === 'quests' && '퀘스트'}
              {tab === 'badges' && '배지'}
              {tab === 'characters' && '캐릭터'}
              {tab === 'shop' && '상점'}
            </button>
          ))}
        </div>

        {/* 컨텐츠 영역 */}
        <div className="overflow-y-auto max-h-[calc(90vh-280px)] p-6">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-800">{gameData.level}</p>
                  <p className="text-sm text-gray-600">레벨</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                  <Award className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-800">{gameData.badges?.length || 0}</p>
                  <p className="text-sm text-gray-600">배지</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-gray-800">4/8</p>
                  <p className="text-sm text-gray-600">완료 퀘스트</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                  <p className="text-2xl font-bold text-gray-800">75%</p>
                  <p className="text-sm text-gray-600">성장률</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">최근 획득</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm">일일 로그인 보상</span>
                    <span className="text-sm text-green-600">+10 포인트</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded">
                    <span className="text-sm">문제 풀기 완료</span>
                    <span className="text-sm text-blue-600">+15 EXP</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'quests' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  일일 퀘스트
                </h3>
                <div className="space-y-3">
                  {dailyQuests.map(quest => (
                    <div key={quest.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{quest.name}</h4>
                        <span className="text-sm text-orange-600">+{quest.reward} 포인트</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all"
                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {quest.progress}/{quest.total}
                        </span>
                        {quest.progress >= quest.total && (
                          <button
                            onClick={() => handleQuestClaim(quest, 'daily')}
                            className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                          >
                            받기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-purple-500" />
                  주간 퀘스트
                </h3>
                <div className="space-y-3">
                  {weeklyQuests.map(quest => (
                    <div key={quest.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{quest.name}</h4>
                        <span className="text-sm text-purple-600">+{quest.reward} 포인트</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{quest.description}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-full rounded-full transition-all"
                            style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {quest.progress}/{quest.total}
                        </span>
                        {quest.progress >= quest.total && (
                          <button
                            onClick={() => handleQuestClaim(quest, 'weekly')}
                            className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"
                          >
                            받기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'badges' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`rounded-lg p-4 text-center transition-all ${
                    badge.unlocked
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md'
                      : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <span className="text-4xl block mb-2">{badge.icon}</span>
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  {badge.unlocked && (
                    <div className="mt-2">
                      <Star className="w-4 h-4 inline text-yellow-500" />
                      <span className="text-xs text-yellow-600 ml-1">획득</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'characters' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characters.map(character => (
                <div
                  key={character.id}
                  className={`rounded-lg p-4 text-center transition-all cursor-pointer ${
                    character.unlocked
                      ? gameData.character === character.id
                        ? 'bg-gradient-to-br from-indigo-100 to-purple-100 ring-2 ring-indigo-500'
                        : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
                      : 'bg-gray-100 opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (character.unlocked && character.id !== gameData.character) {
                      GameDataManager.updateGameData({ character: character.id })
                      loadGameData()
                    }
                  }}
                >
                  <span className="text-5xl block mb-2">{character.icon}</span>
                  <h4 className="font-semibold">{character.name}</h4>
                  <p className="text-xs text-gray-600">{character.description}</p>
                  {character.unlocked ? (
                    <p className="text-sm font-medium text-indigo-600 mt-2">
                      Lv.{character.level}
                    </p>
                  ) : (
                    <p className="text-xs text-red-500 mt-2">
                      레벨 {character.id === 'wizard' ? 10 : character.id === 'robot' ? 20 : 30} 필요
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'shop' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <span className="text-3xl block mb-2 text-center">{item.icon}</span>
                  <h4 className="font-semibold text-center">{item.name}</h4>
                  <p className="text-xs text-gray-600 text-center mb-3">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-orange-600">{item.cost} P</span>
                    <button
                      onClick={() => handleItemPurchase(item)}
                      disabled={gameData.points < item.cost}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        gameData.points >= item.cost
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      구매
                    </button>
                  </div>
                  {item.owned > 0 && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      보유: {item.owned}개
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 보상 알림 */}
        {showReward && (
          <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 animate-bounce">
            <div className="flex items-center">
              <Gift className="w-6 h-6 text-orange-500 mr-2" />
              <div>
                <p className="font-semibold">보상 획득!</p>
                {showReward.type === 'daily' && (
                  <p className="text-sm text-gray-600">
                    +{showReward.points} 포인트, +{showReward.exp} EXP
                  </p>
                )}
                {showReward.type === 'quest' && (
                  <p className="text-sm text-gray-600">
                    퀘스트 완료! +{showReward.points} 포인트
                  </p>
                )}
                {showReward.type === 'purchase' && (
                  <p className="text-sm text-gray-600">
                    {showReward.item} 구매 완료!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}