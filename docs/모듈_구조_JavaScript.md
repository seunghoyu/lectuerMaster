# JavaScript 모듈 구조

## 📁 폴더 구조

```
javascript/
├── app.js                    # 메인 애플리케이션 진입점
├── config/
│   └── constants.js          # 설정 상수
├── services/
│   ├── csvService.js         # CSV 파일 로딩
│   ├── dataService.js        # 데이터 정렬 및 처리
│   ├── storageService.js     # 저장소 관리
│   └── automationService.js  # 자동화 기능 (세금계산서, 정산파일 등)
├── components/
│   ├── tableRenderer.js      # 테이블 렌더링
│   ├── paginationRenderer.js # 페이지네이션 렌더링
│   ├── toolbarRenderer.js   # 툴바 렌더링
│   ├── modalRenderer.js     # 저장 모달 렌더링
│   ├── shareModalRenderer.js # 공유 모달 렌더링
│   ├── sharedUsersModalRenderer.js # 공유된 사람 확인 모달 렌더링
│   ├── headerRenderer.js     # 헤더 렌더링
│   ├── pluginBarRenderer.js  # 플러그인 바 렌더링
│   ├── editListNameModalRenderer.js # 리스트 이름 수정 모달 렌더링
│   └── automationModalRenderer.js # 자동화 모달 렌더링
├── handlers/
│   ├── checkboxHandler.js   # 체크박스 이벤트
│   ├── cellSelectionHandler.js # 셀 선택 이벤트
│   ├── dragScrollHandler.js # 드래그 스크롤 이벤트
│   └── paginationHandler.js # 페이지네이션 이벤트
└── utils/
    ├── csvParser.js          # CSV 파서
    └── dateFormatter.js      # 날짜 포맷팅 (YYYY-MM-DD HH:mm 형식)
```

---

## 📄 파일 설명

### **app.js** - 메인 애플리케이션
- 프로그램 시작점
- 전체 기능을 연결하고 관리
- 데이터 로딩, 화면 렌더링, 이벤트 통합

### **config/constants.js** - 설정
- 페이지당 항목 수, 테이블 컬럼 정의 등 고정값
- 한 곳에서 수정하면 전체에 반영

### **services/** - 데이터 처리
- **csvService.js**: CSV 파일 읽기
- **dataService.js**: 데이터 정렬, 페이지 나누기
- **storageService.js**: 강의리스트 저장/불러오기, 공유 기능, 공유된 사람 목록 조회
- **automationService.js**: 자동화 기능 (세금계산서 발행, 정산파일 제작 등)

### **components/** - 화면 그리기
- **tableRenderer.js**: 테이블 HTML 생성
- **paginationRenderer.js**: 페이지 번호 버튼 생성
- **toolbarRenderer.js**: 상단 툴바 생성
- **modalRenderer.js**: 저장 모달 생성 (카테고리별 개수, 선택한 강의 요약 포함)
- **shareModalRenderer.js**: 공유 모달 생성 (자동완성 기능 포함)
- **sharedUsersModalRenderer.js**: 공유된 사람 확인 모달 생성
- **headerRenderer.js**: 헤더 생성 (사용자 정보, 메뉴명 표시 바)
- **pluginBarRenderer.js**: 플러그인 바 생성 (리스트 관리, 공유, 자동화 기능)
- **editListNameModalRenderer.js**: 리스트 이름 수정 모달 생성
- **automationModalRenderer.js**: 자동화 모달 생성 (세금계산서, 정산파일 등)

### **handlers/** - 사용자 동작 처리
- **checkboxHandler.js**: 체크박스 클릭 처리
- **cellSelectionHandler.js**: 셀 클릭/드래그 선택
- **dragScrollHandler.js**: 테이블 드래그로 스크롤
- **paginationHandler.js**: 페이지 번호 클릭 처리

### **utils/** - 유틸리티
- **csvParser.js**: CSV 텍스트를 데이터로 변환
- **dateFormatter.js**: 날짜 형식 변환 (YYYY-MM-DD HH:mm)

---

## 🔗 연결 관계

```
app.js (시작점)
  ├── config/constants.js (설정 읽기)
  ├── services/ (데이터 처리)
  │   ├── csvService.js → utils/csvParser.js
  │   ├── dataService.js
  │   └── storageService.js
  ├── components/ (화면 그리기)
  │   ├── tableRenderer.js
  │   ├── paginationRenderer.js
  │   ├── toolbarRenderer.js
  │   └── modalRenderer.js
  └── handlers/ (동작 처리)
      ├── checkboxHandler.js
      ├── cellSelectionHandler.js
      ├── dragScrollHandler.js
      └── paginationHandler.js
```

---

## 💡 동작 흐름

1. **app.js**가 시작되면
2. **csvService**가 CSV 파일을 읽어서
3. **dataService**가 정렬하고 나누고
4. **tableRenderer**가 화면에 표시하고
5. **handlers**가 사용자 클릭/드래그 등을 처리합니다
