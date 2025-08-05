import React, { useState, useEffect } from 'react'
import { User, Settings, Target, Palette, Clock, Award, Save, X } from 'lucide-react'
import { UserProfileManager, LearningStatsManager, GameDataManager } from '../../utils/storage'

export default function UserProfile({ onClose, onProfileUpdate }) {
  const [profile, setProfile] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  const [stats, setStats] = useState(null)
  const [gameData, setGameData] = useState(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = () => {
    const userProfile = UserProfileManager.getProfile()
    const learningStats = LearningStatsManager.getStats()
    const game = GameDataManager.getGameData()
    
    setProfile(userProfile)
    setEditedProfile(userProfile)
    setStats(learningStats)
    setGameData(game)
  }

  const handleSave = () => {
    const updatedProfile = UserProfileManager.updateProfile(editedProfile)
    setProfile(updatedProfile)
    setEditMode(false)
    
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile)
    }

    // 프로필 업데이트 보상
    GameDataManager.addPoints(10)
    GameDataManager.addExp(5)
  }

  const handleInterestToggle = (interest) => {
    const interests = editedProfile.interests || []
    const newInterests = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest]
    
    setEditedProfile({
      ...editedProfile,
      interests: newInterests
    })
  }

  const getAchievementBadge = () => {
    if (!stats) return null
    
    const totalHours = Math.floor(stats.totalTime / 60)
    if (totalHours >= 100) return { name: '독서 마스터', color: 'text-purple-600' }
    if (totalHours >= 50) return { name: '독서 전문가', color: 'text-blue-600' }
    if (totalHours >= 20) return { name: '독서 애호가', color: 'text-green-600' }
    if (totalHours >= 10) return { name: '독서 입문자', color: 'text-yellow-600' }
    return { name: '독서 새싹', color: 'text-gray-600' }
  }

  const getLearningStyleDescription = (style) => {
    const descriptions = {
      visual: '시각적 학습자 - 그림, 도표, 색상을 활용한 학습을 선호합니다',
      auditory: '청각적 학습자 - 소리, 음성, 토론을 통한 학습을 선호합니다',
      kinesthetic: '체험적 학습자 - 실습, 활동, 움직임을 통한 학습을 선호합니다',
      balanced: '균형잡힌 학습자 - 다양한 방법을 골고루 활용합니다'
    }
    return descriptions[style] || ''
  }

  const interestOptions = [
    { id: 'science', label: '과학', icon: '🔬' },
    { id: 'history', label: '역사', icon: '📜' },
    { id: 'literature', label: '문학', icon: '📚' },
    { id: 'art', label: '예술', icon: '🎨' },
    { id: 'sports', label: '스포츠', icon: '⚽' },
    { id: 'technology', label: '기술', icon: '💻' },
    { id: 'nature', label: '자연', icon: '🌿' },
    { id: 'music', label: '음악', icon: '🎵' }
  ]

  if (!profile) return null

  const achievement = getAchievementBadge()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <User className="w-6 h-6 mr-2" />
              내 프로필
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* 프로필 카드 */}
          <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-indigo-200 rounded-full flex items-center justify-center text-3xl">
                  {profile.avatar || '👤'}
                </div>
                <div className="ml-4">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {profile.nickname || '학습자'}
                  </h3>
                  <p className="text-gray-600">
                    {profile.gradeLevel === 'elem1' && '초등학교 1학년'}
                    {profile.gradeLevel === 'elem2' && '초등학교 2학년'}
                    {profile.gradeLevel === 'elem3' && '초등학교 3학년'}
                    {profile.gradeLevel === 'elem4' && '초등학교 4학년'}
                    {profile.gradeLevel === 'elem5' && '초등학교 5학년'}
                    {profile.gradeLevel === 'elem6' && '초등학교 6학년'}
                    {profile.gradeLevel === 'middle1' && '중학교 1학년'}
                    {profile.gradeLevel === 'middle2' && '중학교 2학년'}
                    {profile.gradeLevel === 'middle3' && '중학교 3학년'}
                  </p>
                  {achievement && (
                    <span className={`text-sm font-semibold ${achievement.color}`}>
                      {achievement.name}
                    </span>
                  )}
                </div>
              </div>
              
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  편집
                </button>
              )}
            </div>

            {/* 게임 정보 */}
            {gameData && (
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">레벨</p>
                  <p className="text-xl font-bold text-indigo-600">Lv.{gameData.level}</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">경험치</p>
                  <p className="text-xl font-bold text-purple-600">
                    {gameData.exp}/{gameData.level * 100}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-sm text-gray-600">포인트</p>
                  <p className="text-xl font-bold text-yellow-600">{gameData.points}</p>
                </div>
              </div>
            )}
          </div>

          {/* 프로필 정보 */}
          <div className="p-6 space-y-6">
            {editMode ? (
              // 편집 모드
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    닉네임
                  </label>
                  <input
                    type="text"
                    value={editedProfile.nickname}
                    onChange={(e) => setEditedProfile({ ...editedProfile, nickname: e.target.value })}
                    placeholder="닉네임을 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    아바타
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {['👤', '👦', '👧', '🧑', '👨', '👩', '🦸', '🦹', '🧙', '🧚', '🤖', '👽'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => setEditedProfile({ ...editedProfile, avatar: emoji })}
                        className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                          editedProfile.avatar === emoji
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학년
                  </label>
                  <select
                    value={editedProfile.gradeLevel}
                    onChange={(e) => setEditedProfile({ ...editedProfile, gradeLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <optgroup label="초등학교">
                      <option value="elem1">1학년</option>
                      <option value="elem2">2학년</option>
                      <option value="elem3">3학년</option>
                      <option value="elem4">4학년</option>
                      <option value="elem5">5학년</option>
                      <option value="elem6">6학년</option>
                    </optgroup>
                    <optgroup label="중학교">
                      <option value="middle1">1학년</option>
                      <option value="middle2">2학년</option>
                      <option value="middle3">3학년</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    학습 스타일
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'visual', label: '시각적 학습자' },
                      { value: 'auditory', label: '청각적 학습자' },
                      { value: 'kinesthetic', label: '체험적 학습자' },
                      { value: 'balanced', label: '균형잡힌 학습자' }
                    ].map(style => (
                      <label key={style.value} className="flex items-center">
                        <input
                          type="radio"
                          name="learningStyle"
                          value={style.value}
                          checked={editedProfile.learningStyle === style.value}
                          onChange={(e) => setEditedProfile({ ...editedProfile, learningStyle: e.target.value })}
                          className="mr-2"
                        />
                        <span>{style.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    관심 분야
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {interestOptions.map(interest => (
                      <button
                        key={interest.id}
                        onClick={() => handleInterestToggle(interest.id)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          editedProfile.interests?.includes(interest.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{interest.icon}</span>
                        <p className="text-xs mt-1">{interest.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일일 학습 목표
                  </label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={editedProfile.dailyGoal}
                      onChange={(e) => setEditedProfile({ ...editedProfile, dailyGoal: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="ml-4 text-lg font-semibold text-indigo-600">
                      {editedProfile.dailyGoal}분
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setEditedProfile(profile)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              // 보기 모드
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-indigo-600" />
                    학습 목표
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">일일 목표</span>
                      <span className="font-semibold">{profile.dailyGoal}분</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">오늘 학습</span>
                      <span className="font-semibold">
                        {stats?.dailyStats[new Date().toISOString().split('T')[0]]?.time || 0}분
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            ((stats?.dailyStats[new Date().toISOString().split('T')[0]]?.time || 0) / profile.dailyGoal) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-purple-600" />
                    학습 스타일
                  </h3>
                  <p className="text-gray-700">
                    {getLearningStyleDescription(profile.learningStyle)}
                  </p>
                </div>

                {profile.interests && profile.interests.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">관심 분야</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map(interestId => {
                        const interest = interestOptions.find(i => i.id === interestId)
                        return interest ? (
                          <span
                            key={interestId}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center"
                          >
                            <span className="mr-1">{interest.icon}</span>
                            {interest.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-yellow-600" />
                    학습 통계
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">총 학습 시간</p>
                      <p className="text-lg font-semibold">
                        {Math.floor((stats?.totalTime || 0) / 60)}시간 {(stats?.totalTime || 0) % 60}분
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">읽은 지문</p>
                      <p className="text-lg font-semibold">{stats?.textsRead || 0}개</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">학습한 어휘</p>
                      <p className="text-lg font-semibold">{stats?.vocabularyLearned || 0}개</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">연속 학습</p>
                      <p className="text-lg font-semibold">{stats?.weeklyStreak || 0}일</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}