/**
 * 애플리케이션 설정 상수
 */
export const CONFIG = {
    // 페이지네이션 설정
    ITEMS_PER_PAGE: 20,
    MAX_PAGES_TO_SHOW: 10,
    
    // CSV 파일 경로 (레거시, JSON으로 마이그레이션 중)
    CSV_FILE_PATH: 'data/b2b_lectureList.csv',
    
    // JSON 파일 경로
    JSON_FILE_PATH: 'data/b2b_lectureList.json',
    
    // 테이블 컬럼 정의
    TABLE_COLUMNS: [
        { key: 'checkbox', label: '', type: 'checkbox' },
        { key: 'index', label: '순번', type: 'number' },
        { key: '사업부코드', label: '사업부', type: 'text' },
        { key: '카테고리', label: '카테고리', type: 'text' },
        { key: '강의상태', label: '강의상태', type: 'text' },
        { key: '강의명', label: '강의명', type: 'text', align: 'left' },
        { key: '강의코드', label: '강의코드', type: 'text' },
        { key: 'B2C강의코드', label: 're챔프코드', type: 'text' },
        { key: '자체/외부강의', label: '강의 타입', type: 'text' },
        { key: '강사명', label: '강사명', type: 'text' },
        { key: '강의생성일', label: '생성일시', type: 'date' },
        { key: '정산여부', label: '정산여부', type: 'text' },
        { key: 'ISBN', label: 'ISBN', type: 'text' },
        { key: '업체명', label: '업체명', type: 'text' },
        { key: '생성자', label: '생성자', type: 'text' }
    ],
    
    // 정렬 설정
    DEFAULT_SORT_FIELD: '강의생성일',
    DEFAULT_SORT_ORDER: 'desc', // 'asc' or 'desc'
    
    // 드래그 스크롤 속도
    DRAG_SCROLL_MULTIPLIER: 2
};

