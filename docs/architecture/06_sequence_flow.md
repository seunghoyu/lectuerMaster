# 6. 시퀀스 흐름

## 시퀀스: 선택 강의 저장 (F-001) {#seq-save}

<!-- MERMAID_PLACEHOLDER: seq_save -->

[F-001로 이동](#feat-F-001)

---

## 시퀀스: 강의 비교 모달 (F-009) {#seq-compare}

<!-- MERMAID_PLACEHOLDER: seq_compare -->

[F-009로 이동](#feat-F-009)

---

## 시퀀스: 앱 초기 로드·테이블 표시 {#seq-load}

```
1. DOMContentLoaded → init()
2. loadLectureData() 시작
3. Promise.all: UserService, RechampService, SettlementService, AdminLectureService, ChampLectureService, UnifiedLcmsService, JsonService.loadBookList
4. JsonService.loadJsonData() → b2b_lectureList.json
5. DataService.mapSettlementType, sortData → 전체 강의(mainLectureData) / 제외된 강의(excludedLectureData) 분리
6. renderHeader(), renderToolbar(), renderTable(1)
7. bindProfileDropdown(), NestedTableRowHandler 등 바인딩
8. 사용자에게 B2B 강의리스트(전체 강의) 테이블 표시
```

[F-008로 이동](#feat-F-008)
