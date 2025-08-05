// LocalStorage 관리 유틸리티
const STORAGE_KEYS = {
  USER_PROFILE: 'wonbyte_user_profile',
  LEARNING_STATS: 'wonbyte_learning_stats',
  VOCABULARY_LIST: 'wonbyte_vocabulary_list',
  BOOKMARKED_TEXTS: 'wonbyte_bookmarked_texts',
  WRONG_ANSWERS: 'wonbyte_wrong_answers',
  GAME_DATA: 'wonbyte_game_data',
  PREFERENCES: 'wonbyte_preferences'
}

class StorageManager {
  // 데이터 저장
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Storage save error:', error)
      return false
    }
  }

  // 데이터 불러오기
  static load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error('Storage load error:', error)
      return defaultValue
    }
  }

  // 데이터 삭제
  static remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  }

  // 전체 데이터 초기화
  static clear() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  // 저장소 사용량 확인
  static getUsage() {
    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }
    return (totalSize / 1024).toFixed(2) + ' KB'
  }
}

// 학습 통계 관리
class LearningStatsManager {
  static getStats() {
    return StorageManager.load(STORAGE_KEYS.LEARNING_STATS, {
      totalSessions: 0,
      totalTime: 0, // 분 단위
      textsRead: 0,
      vocabularyLearned: 0,
      problemsSolved: 0,
      correctAnswers: 0,
      dailyStats: {}, // { '2025-01-08': { time: 30, problems: 10, correct: 8 } }
      weeklyStreak: 0,
      lastStudyDate: null,
      achievements: []
    })
  }

  static updateStats(updates) {
    const stats = this.getStats()
    const today = new Date().toISOString().split('T')[0]
    
    // 전체 통계 업데이트
    Object.keys(updates).forEach(key => {
      if (typeof stats[key] === 'number') {
        stats[key] += updates[key] || 0
      }
    })

    // 일별 통계 업데이트
    if (!stats.dailyStats[today]) {
      stats.dailyStats[today] = {
        time: 0,
        problems: 0,
        correct: 0,
        texts: 0,
        vocabulary: 0
      }
    }

    if (updates.time) stats.dailyStats[today].time += updates.time
    if (updates.problemsSolved) stats.dailyStats[today].problems += updates.problemsSolved
    if (updates.correctAnswers) stats.dailyStats[today].correct += updates.correctAnswers
    if (updates.textsRead) stats.dailyStats[today].texts += updates.textsRead
    if (updates.vocabularyLearned) stats.dailyStats[today].vocabulary += updates.vocabularyLearned

    // 연속 학습 계산
    stats.lastStudyDate = today
    stats.weeklyStreak = this.calculateStreak(stats.dailyStats)

    StorageManager.save(STORAGE_KEYS.LEARNING_STATS, stats)
    return stats
  }

  static calculateStreak(dailyStats) {
    const dates = Object.keys(dailyStats).sort().reverse()
    if (dates.length === 0) return 0

    let streak = 1
    const today = new Date()
    
    for (let i = 1; i < dates.length && i < 7; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const diffDays = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  static getTodayStats() {
    const stats = this.getStats()
    const today = new Date().toISOString().split('T')[0]
    return stats.dailyStats[today] || {
      time: 0,
      problems: 0,
      correct: 0,
      texts: 0,
      vocabulary: 0
    }
  }

  static getWeeklyStats() {
    const stats = this.getStats()
    const weekStats = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
      
      weekStats.push({
        date: dateStr,
        day: dayName,
        ...(stats.dailyStats[dateStr] || {
          time: 0,
          problems: 0,
          correct: 0,
          texts: 0,
          vocabulary: 0
        })
      })
    }
    
    return weekStats
  }
}

// 어휘 관리
class VocabularyManager {
  static getVocabulary() {
    return StorageManager.load(STORAGE_KEYS.VOCABULARY_LIST, [])
  }

  static addVocabulary(word) {
    const vocabulary = this.getVocabulary()
    const exists = vocabulary.find(v => v.word === word.word)
    
    if (!exists) {
      vocabulary.push({
        ...word,
        id: `vocab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedDate: new Date().toISOString(),
        reviewCount: 0,
        correctCount: 0,
        lastReviewDate: null,
        mastered: false
      })
      StorageManager.save(STORAGE_KEYS.VOCABULARY_LIST, vocabulary)
    }
    
    return vocabulary
  }

  static updateVocabulary(id, updates) {
    const vocabulary = this.getVocabulary()
    const index = vocabulary.findIndex(v => v.id === id)
    
    if (index !== -1) {
      vocabulary[index] = { ...vocabulary[index], ...updates }
      StorageManager.save(STORAGE_KEYS.VOCABULARY_LIST, vocabulary)
    }
    
    return vocabulary
  }

  static removeVocabulary(id) {
    const vocabulary = this.getVocabulary()
    const filtered = vocabulary.filter(v => v.id !== id)
    StorageManager.save(STORAGE_KEYS.VOCABULARY_LIST, filtered)
    return filtered
  }

  static getUnmasteredVocabulary() {
    return this.getVocabulary().filter(v => !v.mastered)
  }
}

// 북마크 관리
class BookmarkManager {
  static getBookmarks() {
    return StorageManager.load(STORAGE_KEYS.BOOKMARKED_TEXTS, [])
  }

  static addBookmark(text) {
    const bookmarks = this.getBookmarks()
    const bookmark = {
      id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: text.title || text.content.substring(0, 30) + '...',
      content: text.content,
      gradeLevel: text.gradeLevel,
      tags: text.tags || [],
      addedDate: new Date().toISOString(),
      lastUsedDate: new Date().toISOString(),
      useCount: 1
    }
    
    bookmarks.unshift(bookmark)
    StorageManager.save(STORAGE_KEYS.BOOKMARKED_TEXTS, bookmarks)
    return bookmarks
  }

  static updateBookmark(id, updates) {
    const bookmarks = this.getBookmarks()
    const index = bookmarks.findIndex(b => b.id === id)
    
    if (index !== -1) {
      bookmarks[index] = { ...bookmarks[index], ...updates }
      StorageManager.save(STORAGE_KEYS.BOOKMARKED_TEXTS, bookmarks)
    }
    
    return bookmarks
  }

  static removeBookmark(id) {
    const bookmarks = this.getBookmarks()
    const filtered = bookmarks.filter(b => b.id !== id)
    StorageManager.save(STORAGE_KEYS.BOOKMARKED_TEXTS, filtered)
    return filtered
  }
}

// 오답노트 관리
class WrongAnswerManager {
  static getWrongAnswers() {
    return StorageManager.load(STORAGE_KEYS.WRONG_ANSWERS, [])
  }

  static addWrongAnswer(problem) {
    const wrongAnswers = this.getWrongAnswers()
    const wrongAnswer = {
      id: `wrong_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...problem,
      addedDate: new Date().toISOString(),
      reviewCount: 0,
      solved: false,
      lastReviewDate: null
    }
    
    wrongAnswers.unshift(wrongAnswer)
    StorageManager.save(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers)
    return wrongAnswers
  }

  static updateWrongAnswer(id, updates) {
    const wrongAnswers = this.getWrongAnswers()
    const index = wrongAnswers.findIndex(w => w.id === id)
    
    if (index !== -1) {
      wrongAnswers[index] = { ...wrongAnswers[index], ...updates }
      StorageManager.save(STORAGE_KEYS.WRONG_ANSWERS, wrongAnswers)
    }
    
    return wrongAnswers
  }

  static removeWrongAnswer(id) {
    const wrongAnswers = this.getWrongAnswers()
    const filtered = wrongAnswers.filter(w => w.id !== id)
    StorageManager.save(STORAGE_KEYS.WRONG_ANSWERS, filtered)
    return filtered
  }

  static getUnsolvedProblems() {
    return this.getWrongAnswers().filter(w => !w.solved)
  }
}

// 게임 데이터 관리
class GameDataManager {
  static getGameData() {
    return StorageManager.load(STORAGE_KEYS.GAME_DATA, {
      level: 1,
      exp: 0,
      points: 0,
      badges: [],
      character: 'buddy', // 기본 캐릭터
      characterLevel: 1,
      items: [],
      achievements: [],
      dailyQuests: [],
      weeklyQuests: []
    })
  }

  static updateGameData(updates) {
    const gameData = this.getGameData()
    Object.assign(gameData, updates)
    
    // 레벨업 체크
    const expForNextLevel = gameData.level * 100
    if (gameData.exp >= expForNextLevel) {
      gameData.level++
      gameData.exp -= expForNextLevel
      gameData.points += 50 // 레벨업 보상
    }
    
    StorageManager.save(STORAGE_KEYS.GAME_DATA, gameData)
    return gameData
  }

  static addPoints(points) {
    const gameData = this.getGameData()
    gameData.points += points
    StorageManager.save(STORAGE_KEYS.GAME_DATA, gameData)
    return gameData
  }

  static addExp(exp) {
    const gameData = this.getGameData()
    gameData.exp += exp
    
    // 레벨업 체크
    const expForNextLevel = gameData.level * 100
    if (gameData.exp >= expForNextLevel) {
      gameData.level++
      gameData.exp -= expForNextLevel
      gameData.points += 50 // 레벨업 보상
    }
    
    StorageManager.save(STORAGE_KEYS.GAME_DATA, gameData)
    return gameData
  }

  static unlockBadge(badgeId) {
    const gameData = this.getGameData()
    if (!gameData.badges.includes(badgeId)) {
      gameData.badges.push(badgeId)
      gameData.points += 20 // 배지 획득 보상
      StorageManager.save(STORAGE_KEYS.GAME_DATA, gameData)
    }
    return gameData
  }
}

// 사용자 프로필 관리
class UserProfileManager {
  static getProfile() {
    return StorageManager.load(STORAGE_KEYS.USER_PROFILE, {
      nickname: '',
      gradeLevel: 'elem4',
      avatar: null,
      interests: [],
      learningStyle: 'balanced', // visual, auditory, kinesthetic, balanced
      dailyGoal: 20, // 분 단위
      createdDate: new Date().toISOString()
    })
  }

  static updateProfile(updates) {
    const profile = this.getProfile()
    Object.assign(profile, updates)
    StorageManager.save(STORAGE_KEYS.USER_PROFILE, profile)
    return profile
  }
}

export {
  StorageManager,
  LearningStatsManager,
  VocabularyManager,
  BookmarkManager,
  WrongAnswerManager,
  GameDataManager,
  UserProfileManager,
  STORAGE_KEYS
}