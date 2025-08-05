# 원바이트 Print 모드 시스템 아키텍처

## 1. 전체 시스템 개요

원바이트 Print 모드는 AI 기반 한국어 학습 자료 생성 플랫폼으로, 기존 EduText Pro를 확장하여 다음과 같은 핵심 기능을 제공합니다:

- **A4 WYSIWYG 에디터**: 실시간 편집 및 미리보기
- **AI 콘텐츠 생성**: Google Gemini API 기반 지능형 학습 자료 생성
- **블록 기반 레이아웃**: 드래그앤드롭 방식의 유연한 콘텐츠 배치
- **PDF 내보내기**: 고품질 인쇄용 PDF 생성
- **템플릿 시스템**: 재사용 가능한 레이아웃 템플릿

## 2. 시스템 아키텍처

### 2.1 Frontend Architecture (React + Vite)

```
src/
├── components/
│   ├── Editor/
│   │   ├── A4Editor.jsx           # 메인 A4 에디터 컴포넌트
│   │   ├── BlockSystem/           # 블록 기반 시스템
│   │   │   ├── TextBlock.jsx
│   │   │   ├── ImageBlock.jsx
│   │   │   ├── TableBlock.jsx
│   │   │   └── QuizBlock.jsx
│   │   ├── Toolbar.jsx            # 에디터 툴바
│   │   ├── Sidebar.jsx            # 블록 팔레트
│   │   └── PreviewPanel.jsx       # 실시간 미리보기
│   ├── Templates/
│   │   ├── TemplateGrid.jsx       # 템플릿 선택 그리드
│   │   ├── TemplateCard.jsx       # 개별 템플릿 카드
│   │   └── TemplateCreator.jsx    # 템플릿 생성기
│   ├── AI/
│   │   ├── ContentGenerator.jsx   # AI 콘텐츠 생성 UI
│   │   ├── PromptBuilder.jsx      # 프롬프트 빌더
│   │   └── GenerationHistory.jsx  # 생성 히스토리
│   └── Export/
│       ├── PDFExporter.jsx        # PDF 내보내기
│       └── PrintSettings.jsx      # 인쇄 설정
├── pages/
│   ├── EditorPage.jsx             # 메인 에디터 페이지
│   ├── TemplatesPage.jsx          # 템플릿 관리 페이지
│   ├── DashboardPage.jsx          # 사용자 대시보드
│   └── PrintModePage.jsx          # Print 모드 전용 페이지
├── hooks/
│   ├── useEditor.js               # 에디터 상태 관리
│   ├── useAI.js                   # AI 생성 로직
│   └── usePDF.js                  # PDF 생성 로직
├── services/
│   ├── aiService.js               # AI API 호출
│   ├── pdfService.js              # PDF 생성 서비스
│   └── templateService.js         # 템플릿 관리
└── utils/
    ├── blockUtils.js              # 블록 유틸리티
    ├── pdfUtils.js                # PDF 유틸리티
    └── editorUtils.js             # 에디터 유틸리티
```

### 2.2 Backend Architecture (Node.js + Express)

```
backend/
├── routes/
│   ├── auth.js                    # 인증 라우트
│   ├── content.js                 # 콘텐츠 관리
│   ├── ai.js                      # AI 생성 API
│   ├── templates.js               # 템플릿 관리
│   ├── pdf.js                     # PDF 생성
│   └── users.js                   # 사용자 관리
├── services/
│   ├── aiService.js               # AI 통합 서비스
│   │   ├── geminiService.js       # Google Gemini API
│   │   └── claudeService.js       # Anthropic Claude API
│   ├── pdfService.js              # PDF 생성 서비스
│   ├── templateService.js         # 템플릿 서비스
│   └── contentService.js          # 콘텐츠 서비스
├── middleware/
│   ├── auth.js                    # 인증 미들웨어
│   ├── validation.js              # 요청 검증
│   └── rateLimiting.js            # 요청 제한
├── models/
│   ├── User.js                    # 사용자 모델
│   ├── Content.js                 # 콘텐츠 모델
│   ├── Template.js                # 템플릿 모델
│   └── GenerationLog.js           # AI 생성 로그
└── utils/
    ├── aiPrompts.js               # AI 프롬프트 템플릿
    ├── pdfGenerator.js            # PDF 생성 유틸
    └── validators.js              # 데이터 검증
```

## 3. 핵심 컴포넌트 설계

### 3.1 A4 WYSIWYG Editor 컴포넌트

```javascript
// A4Editor.jsx
const A4Editor = ({
  content,
  template,
  onContentChange,
  onTemplateChange
}) => {
  const {
    blocks,
    selectedBlock,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock
  } = useEditor(content)

  const {
    zoom,
    showGrid,
    showRulers,
    snapToGrid
  } = useEditorSettings()

  return (
    <div className="a4-editor-container">
      <EditorToolbar />
      <div className="editor-workspace">
        <BlockPalette onBlockAdd={addBlock} />
        <A4Canvas
          blocks={blocks}
          zoom={zoom}
          showGrid={showGrid}
          onBlockUpdate={updateBlock}
          onBlockSelect={setSelectedBlock}
        />
        <PropertyPanel
          selectedBlock={selectedBlock}
          onPropertyChange={updateBlock}
        />
      </div>
      <StatusBar />
    </div>
  )
}
```

### 3.2 블록 시스템 아키텍처

```javascript
// Block Base Class
class Block {
  constructor(type, position, size, content) {
    this.id = generateId()
    this.type = type
    this.position = position // { x, y }
    this.size = size         // { width, height }
    this.content = content
    this.style = {}
    this.locked = false
  }

  render() {
    throw new Error('render method must be implemented')
  }

  validate() {
    throw new Error('validate method must be implemented')
  }
}

// Specific Block Types
class TextBlock extends Block {
  constructor(position, size, text) {
    super('text', position, size, { text })
    this.fontSize = 14
    this.fontFamily = 'Noto Sans KR'
    this.textAlign = 'left'
  }
}

class ImageBlock extends Block {
  constructor(position, size, imageUrl) {
    super('image', position, size, { imageUrl })
    this.borderRadius = 0
    this.objectFit = 'cover'
  }
}

class QuizBlock extends Block {
  constructor(position, size, quizData) {
    super('quiz', position, size, quizData)
    this.quizType = 'multiple-choice' // multiple-choice, fill-blank, matching
  }
}
```

### 3.3 AI 콘텐츠 생성 시스템

```javascript
// aiService.js
class AIContentGenerator {
  constructor() {
    this.geminiService = new GeminiService()
    this.claudeService = new ClaudeService()
    this.currentProvider = 'gemini'
  }

  async generateContent(prompt, contentType, options = {}) {
    const enhancedPrompt = this.buildPrompt(prompt, contentType, options)
    
    try {
      let result
      if (this.currentProvider === 'gemini') {
        result = await this.geminiService.generate(enhancedPrompt)
      } else {
        result = await this.claudeService.generate(enhancedPrompt)
      }
      
      return this.parseResponse(result, contentType)
    } catch (error) {
      // Fallback to alternative provider
      console.warn(`${this.currentProvider} failed, trying fallback`)
      return await this.generateWithFallback(enhancedPrompt, contentType)
    }
  }

  buildPrompt(userPrompt, contentType, options) {
    const basePrompts = {
      'vocabulary': '한국어 어휘 학습 자료를 생성해주세요.',
      'grammar': '한국어 문법 설명과 예시를 생성해주세요.',
      'reading': '한국어 읽기 지문과 문제를 생성해주세요.',
      'quiz': '한국어 학습 퀴즈를 생성해주세요.'
    }

    return `${basePrompts[contentType] || ''}

사용자 요청: ${userPrompt}

추가 옵션:
- 난이도: ${options.difficulty || '중급'}
- 대상 연령: ${options.targetAge || '성인'}
- 학습 목표: ${options.learningGoal || '일반적인 한국어 실력 향상'}

다음 JSON 형식으로 응답해주세요:
{
  "title": "제목",
  "content": "주요 내용",
  "examples": ["예시1", "예시2"],
  "exercises": [
    {
      "type": "multiple-choice",
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "correct": 0
    }
  ]
}`
  }
}
```

## 4. 데이터베이스 스키마 (Supabase)

### 4.1 핵심 테이블 구조

```sql
-- 사용자 테이블 (기존 auth.users 확장)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로젝트/문서 테이블
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES templates(id),
  content JSONB NOT NULL, -- 블록 데이터
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 템플릿 테이블
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  category TEXT,
  blocks JSONB NOT NULL, -- 템플릿 블록 구조
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 생성 로그 테이블
CREATE TABLE generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  prompt TEXT NOT NULL,
  content_type TEXT NOT NULL,
  ai_provider TEXT NOT NULL, -- 'gemini' or 'claude'
  generated_content JSONB NOT NULL,
  tokens_used INTEGER,
  generation_time INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF 생성 로그 테이블
CREATE TABLE pdf_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  export_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. PDF 생성 시스템

### 5.1 PDF 생성 파이프라인

```javascript
// pdfService.js
class PDFGenerator {
  constructor() {
    this.puppeteer = require('puppeteer')
    this.handlebars = require('handlebars')
  }

  async generatePDF(projectData, settings = {}) {
    const browser = await this.puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
      const page = await browser.newPage()
      
      // A4 크기 설정
      await page.setViewport({
        width: 794,  // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
        deviceScaleFactor: 2
      })

      // HTML 콘텐츠 생성
      const htmlContent = await this.generateHTML(projectData)
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

      // PDF 생성
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: true
      })

      return pdfBuffer
    } finally {
      await browser.close()
    }
  }

  async generateHTML(projectData) {
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans KR', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 20mm;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .block {
          position: absolute;
          margin-bottom: 1em;
        }
        
        .text-block {
          /* 텍스트 블록 스타일 */
        }
        
        .image-block {
          /* 이미지 블록 스타일 */
        }
        
        .quiz-block {
          /* 퀴즈 블록 스타일 */
          border: 1px solid #ddd;
          padding: 1em;
          border-radius: 4px;
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        
        @media print {
          body { margin: 0; }
          .page { box-shadow: none; margin: 0; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        {{#each blocks}}
          <div class="block {{type}}-block" style="{{style}}">
            {{{content}}}
          </div>
        {{/each}}
      </div>
    </body>
    </html>
    `

    const compiledTemplate = this.handlebars.compile(template)
    return compiledTemplate(projectData)
  }
}
```

## 6. 보안 및 성능 고려사항

### 6.1 보안

- **API 키 관리**: 환경 변수로 안전하게 관리
- **사용자 인증**: Supabase Auth 활용
- **요청 제한**: Rate limiting으로 남용 방지
- **데이터 검증**: 모든 입력 데이터 검증
- **CORS 설정**: 적절한 도메인 제한

### 6.2 성능 최적화

- **지연 로딩**: 큰 템플릿과 이미지는 필요시 로드
- **캐싱**: AI 생성 결과와 템플릿 캐싱
- **CDN**: 정적 자산 CDN 배포
- **압축**: Gzip 압축 활성화
- **번들 최적화**: 코드 스플리팅과 트리 쉐이킹

## 7. 배포 아키텍처

### 7.1 프로덕션 환경

```
Frontend (Netlify)
├── React App (정적 호스팅)
├── CDN (이미지, 폰트)
└── 환경별 설정

Backend (Render/Railway)
├── Node.js API 서버
├── PDF 생성 서비스
└── 환경 변수 관리

Database (Supabase)
├── PostgreSQL 데이터베이스
├── 실시간 구독
├── 인증 서비스
└── 파일 스토리지
```

이 아키텍처는 확장 가능하고 유지보수가 용이하도록 설계되었으며, 사용자의 요구사항에 맞는 고품질 한국어 학습 자료를 생성할 수 있는 강력한 플랫폼을 제공합니다.