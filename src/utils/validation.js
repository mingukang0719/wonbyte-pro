// 유효성 검사 유틸리티
import { CONSTANTS } from './constants'

/**
 * 텍스트 길이 유효성 검사
 * @param {string} text - 검사할 텍스트
 * @param {number} minLength - 최소 길이
 * @param {number} maxLength - 최대 길이
 * @returns {object} 유효성 검사 결과
 */
export const validateTextLength = (text, minLength = CONSTANTS.TEXT_LENGTH.MIN, maxLength = CONSTANTS.TEXT_LENGTH.MAX) => {
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: CONSTANTS.ERROR_MESSAGES.EMPTY_TEXT
    }
  }

  const length = text.trim().length

  if (length < minLength) {
    return {
      isValid: false,
      error: `최소 ${minLength}자 이상 입력해주세요. (현재: ${length}자)`
    }
  }

  if (length > maxLength) {
    return {
      isValid: false,
      error: `최대 ${maxLength}자까지 입력 가능합니다. (현재: ${length}자)`
    }
  }

  return {
    isValid: true,
    length
  }
}

/**
 * 파일 유효성 검사
 * @param {File} file - 검사할 파일
 * @returns {object} 유효성 검사 결과
 */
export const validateFile = (file) => {
  if (!file) {
    return {
      isValid: false,
      error: '파일을 선택해주세요.'
    }
  }

  // 파일 크기 확인
  if (file.size > CONSTANTS.FILE_UPLOAD.MAX_SIZE) {
    return {
      isValid: false,
      error: CONSTANTS.ERROR_MESSAGES.FILE_SIZE
    }
  }

  // 파일 타입 확인
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
  if (!CONSTANTS.FILE_UPLOAD.ACCEPTED_TYPES.includes(fileExtension)) {
    return {
      isValid: false,
      error: `${CONSTANTS.ERROR_MESSAGES.FILE_TYPE} 지원 형식: ${CONSTANTS.FILE_UPLOAD.ACCEPTED_TYPES.join(', ')}`
    }
  }

  return {
    isValid: true,
    fileType: fileExtension,
    fileName: file.name,
    fileSize: file.size
  }
}

/**
 * URL 유효성 검사
 * @param {string} url - 검사할 URL
 * @returns {object} 유효성 검사 결과
 */
export const validateURL = (url) => {
  if (!url || url.trim().length === 0) {
    return {
      isValid: false,
      error: 'URL을 입력해주세요.'
    }
  }

  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: '올바른 URL 형식이 아닙니다. (http:// 또는 https://로 시작해야 합니다)'
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: '올바른 URL 형식이 아닙니다.'
    }
  }

  return {
    isValid: true,
    url: url.trim()
  }
}

/**
 * 문제 개수 유효성 검사
 * @param {number} count - 문제 개수
 * @param {string} type - 문제 유형 ('vocabulary' or 'reading')
 * @returns {object} 유효성 검사 결과
 */
export const validateProblemCount = (count, type) => {
  const limits = type === 'vocabulary' 
    ? CONSTANTS.PROBLEM_COUNT.VOCABULARY 
    : CONSTANTS.PROBLEM_COUNT.READING

  if (!count || count < limits.MIN) {
    return {
      isValid: false,
      error: `최소 ${limits.MIN}개 이상 선택해주세요.`
    }
  }

  if (count > limits.MAX) {
    return {
      isValid: false,
      error: `최대 ${limits.MAX}개까지 선택 가능합니다.`
    }
  }

  return {
    isValid: true,
    count
  }
}

/**
 * 커스텀 길이 유효성 검사
 * @param {string} lengthStr - 입력된 길이 문자열
 * @returns {object} 유효성 검사 결과
 */
export const validateCustomLength = (lengthStr) => {
  const length = parseInt(lengthStr, 10)

  if (isNaN(length)) {
    return {
      isValid: false,
      error: '숫자를 입력해주세요.'
    }
  }

  if (length < CONSTANTS.TEXT_LENGTH.MIN) {
    return {
      isValid: false,
      error: `최소 ${CONSTANTS.TEXT_LENGTH.MIN}자 이상 입력해주세요.`
    }
  }

  if (length > CONSTANTS.TEXT_LENGTH.MAX) {
    return {
      isValid: false,
      error: `최대 ${CONSTANTS.TEXT_LENGTH.MAX}자까지 입력 가능합니다.`
    }
  }

  return {
    isValid: true,
    length
  }
}