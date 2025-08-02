# 🚀 EduText Pro GitHub 업로드 가이드

**사용자**: mingukang0719  
**토큰**: 설정 완료 ✅

## 🎯 가장 쉬운 방법: GitHub Desktop 사용

### 1단계: GitHub Desktop 설치
1. [GitHub Desktop](https://desktop.github.com/) 다운로드
2. 설치 후 GitHub 계정으로 로그인
3. mingukang0719 계정 확인

### 2단계: 저장소 생성 및 업로드
1. GitHub Desktop에서 "File" → "Add Local Repository"
2. 프로젝트 폴더 선택: `C:\Users\owner\Downloads\원바이트 Print 모드 웹 애플리케이션 (1)`
3. "create a repository" 클릭
4. 저장소명: `edutext-pro`
5. "Publish repository" 클릭

**완료!** 🎉

## 🌐 방법 2: 웹에서 직접 업로드

### 1단계: GitHub 저장소 생성
1. [GitHub.com](https://github.com) 접속
2. "New repository" 클릭
3. 설정:
   - Repository name: `edutext-pro`
   - Description: `EduText Pro - AI 교육 텍스트 생성 서비스`
   - Public 선택
   - Add README, .gitignore, license 체크 해제
4. "Create repository" 클릭

### 2단계: 파일 업로드
1. "uploading an existing file" 클릭
2. 프로젝트 폴더의 모든 파일을 선택해서 드래그 앤 드롭
3. Commit message: `Initial commit: EduText Pro with Admin System`
4. "Commit changes" 클릭

**완료!** 🎉

## 📋 업로드 완료 후 다음 단계

### 저장소 URL 확인
```
https://github.com/mingukang0719/edutext-pro
```

### Render 백엔드 배포
1. [Render.com](https://render.com) 접속
2. "New Web Service" 선택  
3. GitHub 저장소 연결: `mingukang0719/edutext-pro`
4. 설정:
   ```
   Name: edutext-pro-backend
   Environment: Node
   Root Directory: backend
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

5. 환경변수 추가:
   ```
   SUPABASE_URL=https://xrjrddwrsasjifhghzfl.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyanJkZHdyc2FzamlmaGdoemZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTg1NTIsImV4cCI6MjA2Nzk5NDU1Mn0.pAqrS-9NYXiUZ1lONXlDm8YK-c3zhZj2VIix0_Q36rw
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyanJkZHdyc2FzamlmaGdoemZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjQxODU1MiwiZXhwIjoyMDY3OTk0NTUyfQ.r3X0g1-J7zxDP9sxE7DYiW_o2_78qMbVfdsqEYahd-c
   JWT_SECRET=EduTextProJWTSecret2024!@#$%^&*()
   API_KEY_ENCRYPTION_SECRET=EduTextPro2024SecretKey!@#$%^&*()1234567890
   PORT=10000
   NODE_ENV=production
   ```

### Netlify 프론트엔드 배포  
1. [Netlify.com](https://netlify.com) 접속
2. "Add new site" → "Import an existing project"
3. GitHub 저장소 선택: `mingukang0719/edutext-pro`
4. 빌드 설정:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

5. 환경변수 추가:
   ```
   VITE_SUPABASE_URL=https://xrjrddwrsasjifhghzfl.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyanJkZHdyc2FzamlmaGdoemZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTg1NTIsImV4cCI6MjA2Nzk5NDU1Mn0.pAqrS-9NYXiUZ1lONXlDm8YK-c3zhZj2VIix0_Q36rw
   VITE_API_BASE_URL=https://edutext-pro-backend.onrender.com/api
   ```

## 🎯 배포 완료 후 접속

- **메인 사이트**: `https://edutext-pro.netlify.app`
- **관리자**: `https://edutext-pro.netlify.app/admin/login`  
- **로그인**: admin@edutext.pro / EduTextAdmin2024!

## 💰 총 비용: $0/월 (완전 무료!)

## 🆘 문제 발생 시

1. **파일 업로드 실패**: 파일을 압축해서 업로드
2. **빌드 실패**: 환경변수 설정 확인
3. **CORS 오류**: 백엔드 URL 확인

**도움이 필요하면 언제든 말씀하세요!** 🤝