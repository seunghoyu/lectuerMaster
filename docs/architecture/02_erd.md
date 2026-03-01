# 2. ERD (메인)

lectureMaster에서 사용하는 논리 엔티티와 관계. 실제 저장소는 JSON 파일 및 브라우저 LocalStorage.

<!-- MERMAID_PLACEHOLDER: erd -->

**관계 요약:** 내 강의리스트(lecture_lists) 1:N 강의코드 배열. 공유 목록(shared_lists) N:1 내 강의리스트(리스트 이름). 공유 목록 N:1 사용자(공유 대상). B2B 강의(b2b_lectures)는 JSON 읽기 전용. 정산 상태·교재·Re챔프 강의는 키/코드로 매칭.
