import React, { useState, useEffect } from 'react'
import { Bookmark, Search, Tag, Calendar, X, Edit3, Save, Trash2 } from 'lucide-react'
import { BookmarkManager as BookmarkStorage } from '../../utils/storage'

export default function BookmarkManager({ onSelectBookmark, onClose }) {
  const [bookmarks, setBookmarks] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingData, setEditingData] = useState({})

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = () => {
    setBookmarks(BookmarkStorage.getBookmarks())
  }

  const getAllTags = () => {
    const tagSet = new Set()
    bookmarks.forEach(bookmark => {
      bookmark.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
  }

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bookmark.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !selectedTag || bookmark.tags?.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const handleEdit = (bookmark) => {
    setEditingId(bookmark.id)
    setEditingData({
      title: bookmark.title,
      tags: bookmark.tags?.join(', ') || ''
    })
  }

  const handleSaveEdit = () => {
    const updatedBookmarks = BookmarkStorage.updateBookmark(editingId, {
      title: editingData.title,
      tags: editingData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    })
    setBookmarks(updatedBookmarks)
    setEditingId(null)
    setEditingData({})
  }

  const handleDelete = (id) => {
    if (window.confirm('이 북마크를 삭제하시겠습니까?')) {
      const updatedBookmarks = BookmarkStorage.removeBookmark(id)
      setBookmarks(updatedBookmarks)
    }
  }

  const handleSelectBookmark = (bookmark) => {
    // 사용 횟수 증가
    BookmarkStorage.updateBookmark(bookmark.id, {
      useCount: bookmark.useCount + 1,
      lastUsedDate: new Date().toISOString()
    })
    
    if (onSelectBookmark) {
      onSelectBookmark(bookmark)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return `${Math.floor(diffDays / 30)}개월 전`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <Bookmark className="w-6 h-6 mr-2" />
              북마크 관리
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

        {/* 검색 및 필터 */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="북마크 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            {getAllTags().length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-600" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">모든 태그</option>
                  {getAllTags().map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            총 {filteredBookmarks.length}개의 북마크
          </div>
        </div>

        {/* 북마크 목록 */}
        <div className="overflow-y-auto max-h-[60vh]">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">저장된 북마크가 없습니다.</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredBookmarks.map(bookmark => (
                <div 
                  key={bookmark.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {editingId === bookmark.id ? (
                    // 편집 모드
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingData.title}
                        onChange={(e) => setEditingData({ ...editingData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="제목"
                      />
                      <input
                        type="text"
                        value={editingData.tags}
                        onChange={(e) => setEditingData({ ...editingData, tags: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="태그 (쉼표로 구분)"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          저장
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null)
                            setEditingData({})
                          }}
                          className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 일반 모드
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <h3 
                          className="font-semibold text-gray-800 cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSelectBookmark(bookmark)}
                        >
                          {bookmark.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(bookmark)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bookmark.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {bookmark.content}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(bookmark.addedDate)}
                        </span>
                        
                        <span className="text-gray-400">•</span>
                        
                        <span className="text-gray-500">
                          {bookmark.gradeLevel === 'elem1' && '초1'}
                          {bookmark.gradeLevel === 'elem2' && '초2'}
                          {bookmark.gradeLevel === 'elem3' && '초3'}
                          {bookmark.gradeLevel === 'elem4' && '초4'}
                          {bookmark.gradeLevel === 'elem5' && '초5'}
                          {bookmark.gradeLevel === 'elem6' && '초6'}
                          {bookmark.gradeLevel === 'middle1' && '중1'}
                          {bookmark.gradeLevel === 'middle2' && '중2'}
                          {bookmark.gradeLevel === 'middle3' && '중3'}
                        </span>
                        
                        <span className="text-gray-400">•</span>
                        
                        <span className="text-gray-500">
                          사용 {bookmark.useCount}회
                        </span>
                        
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <>
                            <span className="text-gray-400">•</span>
                            <div className="flex gap-1">
                              {bookmark.tags.map((tag, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}