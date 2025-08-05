# 원바이트 PRO - AI 기반 한국어 문해력 훈련 프로그램

## 📖 프로젝트 소개

원바이트 PRO는 초등학생부터 중학생까지를 대상으로 하는 AI 기반 맞춤형 한국어 문해력 훈련 웹 서비스입니다. 학생들의 관심사와 학년 수준에 맞춘 읽기 지문을 자동으로 생성하고, 문해력 향상을 위한 다양한 문제를 제공합니다.

## 🚀 주요 기능

### 1. AI 지문 생성
- 학생 관심사 기반 맞춤형 지문 생성
- 학년별 난이도 자동 조절
- 다양한 주제 카테고리 지원

### 2. 문해력 분석
- 5가지 평가 항목으로 난이도 분석
  - 지문 길이
  - 어휘 수준
  - 문장 구조 복잡성
  - 내용 구성 수준
  - 배경지식 의존도

### 3. 자동 문제 생성
- 어휘 이해 문제
- 독해 이해 문제
- PDF 다운로드 기능 (준비 중)

### 4. 보완 기능
- 학습 통계 및 진도 추적
- 어휘 복습 시스템
- 지문 북마크 관리
- 오답노트 기능
- 개인화 프로필 설정
- 게임화 요소 (포인트, 레벨, 배지)

## 🛠️ 기술 스택

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Webpack 5

### Backend
- Express.js
- Supabase (Database)
- AI APIs (OpenAI, Claude, Gemini)

## 📦 설치 방법

### 필수 요구사항
- Node.js 18.x 이상
- npm 또는 yarn

### 설치 및 실행

1. 저장소 클론
```bash
git clone [repository-url]
cd 원바이트-프로
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
```bash
# .env 파일 생성 후 필요한 환경 변수 설정
cp .env.example .env
```

4. 개발 서버 실행
```bash
npm run dev
```

## 📁 프로젝트 구조

```
원바이트-프로/
├── src/
│   ├── components/
│   │   ├── common/      # 공통 컴포넌트
│   │   └── literacy/    # 문해력 훈련 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   ├── hooks/          # 커스텀 훅
│   ├── services/       # API 서비스
│   ├── utils/          # 유틸리티 함수
│   └── config/         # 설정 파일
├── backend/            # 백엔드 서버
├── database/           # 데이터베이스 스키마
├── docs/               # 프로젝트 문서
└── guides/             # 설치 및 배포 가이드
```

## 🔧 주요 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 실행
npm run lint

# 백엔드 서버 실행
cd backend && npm start
```

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🌐 배포

### Netlify 배포
프로젝트는 Netlify를 통해 배포됩니다.

#### 자동 배포 설정
1. GitHub 저장소를 Netlify에 연결
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Node version: 18

#### 환경 변수 설정
Netlify 대시보드에서 다음 환경 변수를 설정해야 합니다:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (백엔드 API URL)

## 🤝 기여 방법

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

🤖 Generated with [Claude Code](https://claude.ai/code)
