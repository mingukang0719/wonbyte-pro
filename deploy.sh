#!/bin/bash

# 원바이트 Print 모드 배포 스크립트

echo "🚀 원바이트 Print 모드 배포 시작..."

# 1. 프론트엔드 빌드
echo "📦 프론트엔드 빌드 중..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 프론트엔드 빌드 성공"
else
    echo "❌ 프론트엔드 빌드 실패"
    exit 1
fi

# 2. Git 커밋 및 푸시
echo "📤 Git 커밋 및 푸시..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin master

if [ $? -eq 0 ]; then
    echo "✅ Git 푸시 성공"
else
    echo "❌ Git 푸시 실패"
    exit 1
fi

# 3. 배포 상태 확인
echo "🔍 배포 상태 확인 중..."
echo "프론트엔드: Netlify에서 자동 배포가 시작됩니다."
echo "백엔드: Railway에서 자동 배포가 시작됩니다."

echo ""
echo "🎉 배포 프로세스 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Netlify 대시보드에서 배포 상태 확인"
echo "2. Railway 대시보드에서 백엔드 배포 상태 확인"
echo "3. 환경변수가 모두 설정되었는지 확인"
echo "4. 배포된 사이트에서 기능 테스트"
echo ""
echo "🔗 유용한 링크:"
echo "- Netlify: https://app.netlify.com"
echo "- Railway: https://railway.app"
echo "- Supabase: https://app.supabase.com"