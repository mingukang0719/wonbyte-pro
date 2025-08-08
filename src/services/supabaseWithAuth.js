import { supabase } from './supabaseClient'

// 현재 사용자 ID를 데이터베이스 세션에 설정하는 함수
export async function setCurrentUserId(userId) {
  if (!userId) return;
  
  try {
    // PostgreSQL 세션 변수 설정
    const { data, error } = await supabase.rpc('set_config', {
      setting: 'app.current_user_id',
      value: userId,
      is_local: true
    });
    
    if (error) {
      console.error('Failed to set current user ID:', error);
    }
  } catch (error) {
    console.error('Error setting current user ID:', error);
  }
}

// 인증된 Supabase 클라이언트를 반환하는 함수
export function getAuthenticatedSupabase(userId) {
  if (userId) {
    // 새로운 클라이언트 인스턴스 생성 시 현재 사용자 ID 설정
    setCurrentUserId(userId);
  }
  return supabase;
}

// 쿼리 실행 전에 현재 사용자 ID를 설정하는 헬퍼 함수
export async function authenticatedQuery(userId, queryFn) {
  await setCurrentUserId(userId);
  return queryFn();
}