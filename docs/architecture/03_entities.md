# 3. 엔티티 (테이블별)

## 3.1 내 강의리스트 (lecture_lists) {#tbl-lecture_lists}

**엔티티 설명:** 사용자가 저장한 "내 강의리스트" 한 건. 생성 시점: 상단 툴바 [저장] 또는 플러그인 [강의코드로 등록하기] 실행 시. 사용처: 사이드바 **내 강의리스트** 목록, 리스트 선택 시 테이블 필터, **리스트 관리**·**공유**·**업무요청**·**운영업무**. 관계: 공유 목록(shared_lists)이 리스트 이름으로 참조.

### 데이터 사전

| 컬럼명 | 타입 | null 허용 | PK/FK | 설명 | 예시 | 비즈니스 규칙 | 데이터 원천 | 개인정보 |
|--------|------|-----------|-------|------|------|---------------|-------------|----------|
| name | string | N | PK | 리스트 이름 | 2025년 1차 계약 | 중복 불가 | StorageService.saveLectureList | N |
| lectureCodes | string[] | N | - | 강의코드 배열 | ["Ch_L_00003134", ...] | 1개 이상 | 동일 | N |
| contractType | string | N | - | 계약유형 | 턴키, 인당과금, 개별결제 | 3종 중 1 | 동일 | N |
| priceMap | object | Y | - | 강의코드별 금액(인당과금 시) | {"Ch_L_001": 50000} | 인당과금 시 필수 | 동일 | N |
| createdAt | datetime(ISO) | N | - | 생성 시각 | 2025-03-01T10:00:00.000Z | - | 저장 시 자동 | N |
| updatedAt | datetime(ISO) | N | - | 수정 시각 | 동일 | - | 수정 시 자동 | N |

**연결 기능:** #feat-F-001, #feat-F-002, #feat-F-003, #feat-F-004, #feat-F-005, #feat-F-006, #feat-F-007

---

## 3.2 공유 목록 (shared_lists) {#tbl-shared_lists}

**엔티티 설명:** 리스트 공유 이력 1건. 생성: **공유** → [공유하기] 실행 시. 사용처: **공유된 사람 확인**, 공유받은 리스트로 보기. 관계: 내 강의리스트(리스트 이름), 사용자(공유한 사람/공유 대상).

### 데이터 사전

| 컬럼명 | 타입 | null 허용 | PK/FK | 설명 | 예시 | 비즈니스 규칙 | 데이터 원천 | 개인정보 |
|--------|------|-----------|-------|------|------|---------------|-------------|----------|
| listName | string | N | FK | 공유된 리스트 이름 | 2025년 1차 계약 | 내 강의리스트.name 참조 | StorageService.shareLectureList | N |
| lectureCodes | string[] | N | - | 공유 시점 강의코드 스냅샷 | ["Ch_L_..."] | - | 동일 | N |
| sharedBy | string | N | FK | 공유한 사용자 id | hong123 | - | getCurrentUser().id | Y |
| sharedWith | string | N | - | 공유 대상(팀/이름/아이디) | B2B서비스전략/김개발/kimdev | 중복 공유 방지 | 동일 | Y |
| sharedWithId | string | Y | - | 공유 대상 id만 | kimdev | - | 파싱 | Y |
| sharedAt | datetime(ISO) | N | - | 공유 시각 | 2025-03-01T10:00:00.000Z | - | 저장 시 자동 | N |

**연결 기능:** #feat-F-006, #feat-F-007

---

## 3.3 사용자 (users) {#tbl-users}

**엔티티 설명:** 사용자 목록(공유 시 자동완성·현재 사용자 표시). 생성: data/users.json 로드. 관계: 공유 목록의 공유한 사람/공유 대상 참조.

### 데이터 사전

| 컬럼명 | 타입 | null 허용 | PK/FK | 설명 | 예시 | 비즈니스 규칙 | 데이터 원천 | 개인정보 |
|--------|------|-----------|-------|------|------|---------------|-------------|----------|
| id | string | N | PK | 사용자 식별자 | yuseungho | - | data/users.json | Y |
| team | string | Y | - | 팀명 | B2B서비스전략 | - | 동일 | N |
| name | string | N | - | 이름 | 유승호 | - | 동일 | Y |

**연결 기능:** #feat-F-001, #feat-F-002, #feat-F-006, #feat-F-007

---

## 3.4 B2B 강의 (b2b_lectures) {#tbl-b2b_lectures}

**엔티티 설명:** B2B 강의 마스터(읽기 전용). 생성: data/b2b_lectureList.json. 사용처: **B2B 강의리스트** 테이블 표시·필터·검색, [저장] 시 코드 검증, 비교 모달. 관계: 정산 상태(강의코드), 교재(ISBN), Re챔프(B2C강의코드). 화면 상 **전체 강의**·**제외된 강의** 구분에 사용.

### 데이터 사전 (주요 컬럼)

| 컬럼명 | 타입 | null 허용 | PK/FK | 설명 | 예시 | 비즈니스 규칙 | 데이터 원천 | 개인정보 |
|--------|------|-----------|-------|------|------|---------------|-------------|----------|
| 강의코드 | string | N | PK | 강의 고유 코드 | Ch_L_00003134 | - | JSON | N |
| 강의명 | string | N | - | 강의 제목 | 해커스 토익스피킹... | - | JSON | N |
| 카테고리 | string | Y | - | 카테고리 | 스피킹 | - | JSON | N |
| 강의상태 | string | Y | - | 개강/폐강 등 | 폐강 | 폐강·daou 제외 시 "전체 강의"에서 제외 | JSON | N |
| B2C강의코드 | string | Y | - | Re챔프 연동 코드 | 6190 | - | JSON | N |
| ISBN | string | Y | - | 교재 ISBN | 9791174044969 | - | JSON | N |
| 정산여부 | string | Y | - | 정산 상태 표시용 | - | - | JSON + 정산 매핑 | N |
| 강의생성일 | string | Y | - | 생성일시 | Mon Jun 15 2015... | 기본 정렬 기준 | JSON | N |

**연결 기능:** #feat-F-001, #feat-F-002, #feat-F-003, #feat-F-008, #feat-F-009

---

## 3.5 교재 (book_list) {#tbl-book_list}

**엔티티 설명:** 교재 마스터(ISBN 기준). data/book_list.json. 사용처: 테이블·비교 모달에서 ISBN으로 교재명 등 표시.

### 데이터 사전 (주요)

| 컬럼명 | 타입 | null 허용 | PK/FK | 설명 | 예시 | 비즈니스 규칙 | 데이터 원천 | 개인정보 |
|--------|------|-----------|-------|------|------|---------------|-------------|----------|
| isbn | string | N | PK | 교재 ISBN | 9791174044969 | - | data/book_list.json | N |
| bookTitle | string | Y | - | 교재명 | 해커스 토익 700+ Reading | - | 동일 | N |
| author | string | Y | - | 저자 | 전미정 | - | 동일 | N |
| listPrice | number | Y | - | 정가 | 12000 | - | 동일 | N |

**연결 기능:** #feat-F-008, #feat-F-009

---

## 3.6 정산 상태 (settlement_status) {#tbl-settlement_status}

**엔티티 설명:** 강의코드별 정산 상태. data/lecture_settlement_status.json (키: 강의코드, 값: 상태 문자열). 사용처: 테이블 **정산여부**·비교 모달.

### 데이터 사전

| 컬럼명 | 타입 | null 허용 | PK/FK | 설명 | 예시 | 비즈니스 규칙 | 데이터 원천 | 개인정보 |
|--------|------|-----------|-------|------|------|---------------|-------------|----------|
| 강의코드(키) | string | N | PK | B2B 강의.강의코드와 매칭 | 27684 | - | JSON 객체 키 | N |
| status | string | N | - | 확인불가/미정산/정산 | 미정산 | - | JSON 객체 값 | N |

**연결 기능:** #feat-F-002, #feat-F-008, #feat-F-009

---

**기타 참조 데이터:** rechamp_lecture(rechamp_lectureList_new.json), champ_AdminLecture, champ_lecture, unifiedLcms — 비교 모달·**운영 대시보드**용. 상세 데이터 사전은 *미정*.
