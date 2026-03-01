# 4. 기능 목록 / 기능 명세 (JS 포함)

아래 표는 기능 ID별 목적·화면 위치·트리거·입력·검증·JS 동작·연관 테이블·예외 처리를 정리한 것이다. 화면 메뉴명은 실제 앱(상단 툴바·플러그인·사이드바)과 동일하게 표기한다.

| 기능 ID | 목적/화면 | 트리거 | 입력·검증 | JS 동작 | API 호출 | 연관 테이블 | 예외 처리 |
|---------|-----------|--------|-----------|---------|----------|-------------|-----------|
| **F-001** | 테이블에서 체크한 강의를 "내 강의리스트"로 저장. **상단 툴바 [저장]**. | [저장] 버튼 클릭(선택 1개 이상 시 활성화). | 리스트 이름 필수·중복 불가. 계약유형 턴키/인당과금/개별결제. 인당과금 시 금액 매핑 필수·모든 강의코드 매핑·금액 양수. 에러 시 알림. | (1) 선택된 강의코드 Set → 배열 수집. (2) 저장 모달 표시. (3) 확인 시 계약유형·금액 매핑 수집 후 StorageService.saveLectureList. (4) 성공 시 모달 닫기, showAllLectures(), setupSidebar(). | 없음. 브라우저 저장소. | 내 강의리스트 (C), 사용자 (R, 공유 입력 시) | 리스트 이름 중복·인당과금 매핑 누락/유효하지 않은 금액 시 에러. 공유 실패해도 리스트 저장은 유지. |
| **F-002** | **B2B 강의리스트** → **전체 강의** 화면에서 **플러그인 [강의코드로 등록하기]**. 리스트 이름·강의코드(여러 줄)·계약유형·인당과금 시 금액 파싱. | [강의코드로 등록하기] → [강의코드로 등록하기] 클릭. | 리스트 이름·강의코드 필수. 인당과금 시 "금액 파싱 실행" 필수. 공유 입력 시 팀/이름/아이디(자동완성). | (1) 강의코드로 등록 모달 표시. (2) 인당과금 선택 시 금액 매핑 영역 표시. (3) "금액 파싱 실행" 시 PriceParser.parse() → dataset.priceMap. (4) StorageService.saveLectureList. (5) 공유 입력 있으면 shareLectureList. (6) setupSidebar(), loadSavedList(리스트명). | 없음. | 내 강의리스트 (C), 공유 목록 (C, 공유 시), 사용자 (R) | 인당과금인데 파싱 미실행 시 알림. 공유 실패 시 로그만, 리스트 저장은 완료. |
| **F-003** | 미정산 강의 목록에서 선택한 강의코드를 정산 데이터에 추가. **플러그인 [강의코드로 등록하기]** → **[미정산 강의 등록하기]**. | 해당 메뉴 클릭. | 강의코드 목록(텍스트). 빈 목록 시 알림. | (1) 미정산 강의 등록 모달(settlementData) 표시. (2) 확인 시 SettlementService.addUnsettledLectures(codes). (3) 모달 닫기. | - | 정산 상태 관련. *미정* 영구 저장. | - |
| **F-004** | **내 강의리스트** 화면에서 **리스트 관리** → **[리스트 이름 수정]**. | 메뉴 클릭. | 새 이름 필수·중복 불가. | (1) 리스트 이름 수정 모달 표시. (2) StorageService.updateLectureListName(기존명, 새명). (3) 모달 닫기, setupSidebar(), loadSavedList(새명). | 없음. | 내 강의리스트 (U: name, updatedAt) | - |
| **F-005** | **리스트 관리** → **[강의 추가]** 또는 **[리스트 삭제]**. | 각 메뉴 클릭. | - | **강의 추가:** targetListForAdd 설정 후 **전체 강의** 화면으로 전환, "선택한 강의를 [리스트명]에 추가" 버튼 표시. 저장 시 StorageService.addLecturesToList. **삭제:** deleteList → StorageService.deleteLectureList → showAllLectures(), setupSidebar(). | 없음. | 내 강의리스트 (U: lectureCodes, updatedAt / D) | - |
| **F-006** | **공유** → **[공유하기]**. 공유 대상 입력(자동완성: 사용자). | 메뉴 클릭. | 공유 대상(팀/이름/아이디). 이미 공유된 대상 시 에러. | (1) 공유 모달 표시. (2) 자동완성 사용자 데이터. (3) StorageService.shareLectureList(리스트명, 공유대상). (4) 모달 닫기. | 없음. | 공유 목록 (C), 내 강의리스트 (R), 사용자 (R) | - |
| **F-007** | **공유** → **[공유된 사람 확인]**. | 메뉴 클릭. | - | StorageService.getSharedWithList(리스트명) → 공유된 사람 확인 모달로 목록 표시. | 없음. | 공유 목록 (R) | - |
| **F-008** | 메인 테이블: **B2B 강의리스트**(**전체 강의**·**제외된 강의**) 또는 **내 강의리스트** 선택 시 해당 강의만 표시. 컬럼 필터, **강의명 또는 강의코드 검색**, 페이지당 개수·이전/다음. | 페이지 로드, **사이드바** **B2B 강의리스트**·**내 강의리스트**·**운영 대시보드** 메뉴 선택, 검색 Enter/버튼, 필터 아이콘, 페이지 버튼, 페이지당 개수 변경. | - | (1) 데이터 소스 결정(전체 강의/제외된 강의/선택한 리스트, 검색 결과). (2) FilterService.filterData. (3) DataService.getPageData. (4) TableRenderer, PaginationRenderer. (5) 체크박스·셀 선택·드래그 스크롤·키보드 이동·필터 클릭 시 필터 드롭다운 → 적용 후 renderTable(1). | 없음. | B2B 강의 (R), 내 강의리스트 (R), 교재 (R), 정산 상태 (R) | - |
| **F-009** | 테이블 행 **[비교]** 클릭 시 B2B·Re챔프·챔프·통합 LCMS 정보 한 모달에 표시. | [비교] 버튼 클릭. | - | (1) 강의코드·B2C강의코드로 B2B 데이터·RechampService.getRechampDataByB2CCode. (2) skinId → AdminLectureService → champLectureId → ChampLectureService. (3) adminLectureCode → UnifiedLcmsService. (4) SettlementService.getStatusByCode. (5) 비교 모달 renderToDOM, showModal. (6) Esc/오버레이 클릭 시 닫기. | 없음. | B2B 강의 (R), 정산 상태 (R), 교재, rechamp, champ_*, unifiedLcms (R) | - |
| **F-010** | **업무요청** → **[세금계산서 발행요청]**. **운영업무** → **[세금계산서 발행]**, **[강의료 정산파일 제작]**. AutomationModalRenderer. | 각 플러그인 메뉴 클릭. | - | showAutomationModal(유형) → 자동화 모달 표시. 실제 발행·파일 제작 로직 *미정* (API 연동 여부). | *미정* | *미정* (리스트·강의 데이터 참조 가능) | - |

## 문서 내 이동 링크

- F-001: #feat-F-001
- F-002: #feat-F-002
- F-003: #feat-F-003
- F-004: #feat-F-004
- F-005: #feat-F-005
- F-006: #feat-F-006
- F-007: #feat-F-007
- F-008: #feat-F-008
- F-009: #feat-F-009
- F-010: #feat-F-010
