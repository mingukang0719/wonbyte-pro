@echo off
echo ==================================
echo  API Key Setup for EduText Pro
echo ==================================
echo.
echo This tool will help you set up API keys for AI providers.
echo Please have your API keys ready:
echo - OpenAI API Key (starts with sk-proj-)
echo - Claude API Key (starts with sk-ant-api03-)
echo - Gemini API Key (starts with AIzaSy)
echo.
pause

cd backend
node scripts\manage-api-keys.js
pause