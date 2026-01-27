# CSS 모듈 구조

## 📁 폴더 구조

```
css/
├── layout.css                # 메인 레이아웃 (모든 모듈 import)
├── base/
│   ├── variables.css        # CSS 변수 정의
│   └── reset.css           # 리셋 스타일
└── components/
    ├── sidebar.css         # 사이드바 스타일
    ├── table.css           # 테이블 스타일
    ├── pagination.css      # 페이지네이션 스타일
    ├── toolbar.css         # 툴바 스타일
    ├── modal.css           # 모달 스타일
    ├── header.css          # 헤더 스타일
    ├── dropdown.css        # 드롭다운 스타일
    ├── share.css           # 공유 기능 스타일 (공유된 사람 확인 모달 포함)
    └── pluginBar.css       # 플러그인 바 스타일
```

---

## 📄 파일 설명

### **layout.css** - 메인 레이아웃
- 모든 CSS 파일을 하나로 모아주는 역할
- 앱 전체 레이아웃 스타일 정의
- 헤더, 워크스페이스 등 기본 구조

### **base/variables.css** - CSS 변수
- 색상, 간격, 폰트 크기 등 디자인 값들을 변수로 정의
- 한 곳에서 수정하면 전체에 반영됨
- 예: `--color-primary`, `--spacing-md` 등

### **base/reset.css** - 리셋 스타일
- 브라우저마다 다른 기본 스타일을 초기화
- 일관된 디자인을 위한 기본 설정

### **components/sidebar.css** - 사이드바
- 왼쪽 메뉴 바 스타일
- 호버 시 확장되는 애니메이션

### **components/table.css** - 테이블
- 강의 리스트 테이블 스타일
- 셀 선택, 호버 효과

### **components/pagination.css** - 페이지네이션
- 페이지 번호 버튼 스타일
- 현재 페이지 강조

### **components/toolbar.css** - 툴바
- 상단 도구 모음 스타일
- 선택 수 표시, 저장 버튼, 항목 수 설정

### **components/modal.css** - 모달
- 팝업 창 스타일
- 저장 모달, 공유 모달 스타일
- 배경 오버레이 (딤 처리)

### **components/header.css** - 헤더
- 상단 헤더 스타일
- 사용자 정보 표시

### **components/dropdown.css** - 드롭다운
- 드롭다운 메뉴 스타일
- 사이드바 메뉴 확장/축소

### **components/share.css** - 공유 기능
- 공유 입력 필드 스타일
- 자동완성 드롭다운
- 공유된 사람 확인 모달 스타일

### **components/pluginBar.css** - 플러그인 바
- 우상단 플러그인 아이콘 스타일
- 플러그인 드롭다운 메뉴

---

## 🔗 연결 관계

```
layout.css
  ├── base/variables.css (변수 정의)
  ├── base/reset.css (기본 리셋)
  └── components/
      ├── sidebar.css
      ├── table.css
      ├── pagination.css
      ├── toolbar.css
      └── modal.css
```

`layout.css`가 모든 파일을 import하여 하나의 스타일시트로 만듭니다.
