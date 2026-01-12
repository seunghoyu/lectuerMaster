# HTML 구조

## 📄 파일

```
index.html
```

---

## 📋 구조 설명

### **index.html** - 메인 페이지
- 웹사이트의 뼈대가 되는 파일
- CSS와 JavaScript를 연결
- 기본 레이아웃 구조 정의

---

## 🏗️ 페이지 구조

```html
<div id="app">
  <!-- 사이드바 (왼쪽 메뉴) -->
  <nav class="sidebar">
    - 메뉴 헤더
    - B2B 강의리스트 메뉴
    - 내 강의리스트 (드롭다운, 동적 생성)
    - 공유 강의리스트 (드롭다운, 동적 생성)
  </nav>

  <!-- 메인 콘텐츠 -->
  <main class="main-content">
    <!-- 상단 헤더 -->
    <header class="top-header">
      - 제목
      - 사용자 정보 (이름/아이디)
      - 메뉴명 표시 바 (현재 선택된 메뉴명)
      - 툴바 (선택 수, 페이지당 항목 수, 저장 버튼)
      - 플러그인 바 (리스트 관리, 공유, 자동화 기능, 리스트 화면에서만 표시)
    </header>

    <!-- 작업 공간 -->
    <div class="workspace">
      <!-- 테이블 컨테이너 -->
      <div class="table-container">
        - 테이블 (JavaScript로 동적 생성)
        - 페이지네이션 (JavaScript로 동적 생성)
      </div>
    </div>
  </main>
</div>
```

---

## 🔗 연결 관계

```
index.html
  ├── css/layout.css (스타일)
  └── javascript/app.js (기능)
```

---

## 📝 주요 특징

- **정적 구조**: 기본 레이아웃만 정의
- **동적 생성**: 테이블, 툴바, 모달 등은 JavaScript로 생성
- **모듈화**: CSS와 JavaScript는 별도 파일로 분리
