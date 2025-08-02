#!/bin/bash

# Render 환경변수 설정 스크립트
# 사용법: Render 대시보드에서 수동으로 설정해야 합니다.

echo "==================================="
echo "Render 환경변수 설정 가이드"
echo "==================================="
echo ""
echo "1. Render 대시보드 접속: https://dashboard.render.com"
echo "2. 백엔드 서비스 선택 (edutext-pro-backend-1)"
echo "3. Environment 탭 클릭"
echo "4. 다음 환경변수 추가:"
echo ""
echo "CLAUDE_API_KEY"
echo "값: [당신의 Claude API 키]"
echo ""
echo "JWT_SECRET"
echo "값: $(openssl rand -hex 32 2>/dev/null || echo "my-super-secret-jwt-key-$(date +%s)")"
echo ""
echo "API_KEY_ENCRYPTION_SECRET"
echo "값: $(openssl rand -hex 16 2>/dev/null || echo "1234567890abcdef1234567890abcdef")"
echo ""
echo "5. Save Changes 클릭"
echo ""
echo "==================================="
echo "환경변수 예시값이 생성되었습니다!"
echo "==================================="