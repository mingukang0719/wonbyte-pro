/**
 * 디바운스 함수 - 연속적인 호출을 제한하여 성능 최적화
 * @param {Function} func - 디바운스할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} 디바운스된 함수
 */
export function debounce(func, delay = 300) {
  let timeoutId
  
  const debounced = function(...args) {
    clearTimeout(timeoutId)
    
    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
  
  // 즉시 실행 취소 메서드
  debounced.cancel = () => {
    clearTimeout(timeoutId)
  }
  
  return debounced
}

/**
 * 쓰로틀 함수 - 일정 시간 간격으로만 함수 실행
 * @param {Function} func - 쓰로틀할 함수
 * @param {number} limit - 실행 간격 (밀리초)
 * @returns {Function} 쓰로틀된 함수
 */
export function throttle(func, limit = 1000) {
  let inThrottle
  let lastFunc
  let lastRan
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      lastRan = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args)
          lastRan = Date.now()
        }
      }, Math.max(limit - (Date.now() - lastRan), 0))
    }
  }
}