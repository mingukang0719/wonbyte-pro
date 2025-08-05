# 원바이트 PRO 설정 가이드

## 🚀 배포 완료!

사이트가 성공적으로 배포되었습니다: https://extraordinary-bublanina-2886c0.netlify.app

## 📋 다음 단계: Supabase 데이터베이스 설정

### 1. Supabase 대시보드 접속
https://supabase.com/dashboard/project/jqlouemxgafrbzdxyojl

### 2. SQL Editor에서 테이블 생성
1. 왼쪽 메뉴에서 "SQL Editor" 클릭
2. "New query" 버튼 클릭
3. `database/setup_complete.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행

### 3. 테이블 생성 확인
- Table Editor에서 다음 테이블들이 생성되었는지 확인:
  - profiles
  - reading_materials
  - problems
  - assignments
  - daily_learning_stats
  - learning_achievements

## 🔐 보안 설정 확인

### RLS (Row Level Security) 정책
모든 테이블에 RLS가 활성화되어 있으며, 적절한 권한 정책이 설정되어 있습니다:
- 학생: 자신의 데이터만 열람/수정 가능
- 교사: 자신의 학생 데이터 열람 가능
- 부모: 자신의 자녀 데이터 열람 가능
- 관리자: 모든 데이터 접근 가능

## 🎯 사용 방법

### 1. 회원가입
- 이메일, 비밀번호, 이름, 학년, 학교, 연락처 입력
- 역할 선택 (학생/교사/학부모)

### 2. 이메일 인증
- 가입 후 이메일로 전송된 인증 링크 클릭

### 3. 로그인
- 인증 완료 후 로그인 가능
- 역할에 따라 적절한 대시보드로 자동 이동

## 🛠️ 관리자 기능

### 교사/관리자 대시보드
- 학생 관리: 학생 목록 조회 및 학습 현황 확인
- 과제 관리: AI 지문 생성 및 과제 배정
- 분석: 학습 통계 및 진도 확인

### 과제 생성 프로세스
1. "새 과제 만들기" 버튼 클릭
2. AI를 활용한 지문 생성
3. 자동 문제 생성 (객관식 + 서술형)
4. 학생 선택 및 배정

## 📧 문의사항

배포나 설정에 문제가 있다면 아래 정보를 확인하세요:

- Netlify 대시보드: https://app.netlify.com/projects/extraordinary-bublanina-2886c0
- Supabase 대시보드: https://supabase.com/dashboard/project/jqlouemxgafrbzdxyojl
- GitHub 저장소: https://github.com/mingukang0719/wonbyte-pro