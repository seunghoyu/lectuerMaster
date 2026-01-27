/**
 * Sidebar Interaction Controller
 * Implemented with Vue.js 3
 */

const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // --- 1. 상태 관리 (State Management) ---
        const isExpanded = ref(false);
        const activeMenu = ref(''); // 초기 메뉴를 비워둠
        const tableHeaders = ref([]);
        const tableRows = ref([]);
        
        // --- 2. 메뉴 데이터 (Menu Data) ---
        const menuItems = [
            { name: 'B2B 강의리스트', icon: 'fa-clipboard-list' }
        ];

        // --- 3. 컴포저블 함수 사용 (Composables) ---
        // 3-1. 테이블 드래그 스크롤 기능
        const { 
            tableContainer, 
            startDrag, 
            stopDrag, 
            onDrag 
        } = useTableDragScroll();
        
        // 3-2. 페이지네이션 기능
        const { 
            currentPage, 
            totalPages, 
            paginatedRows, 
            changePage,
            resetPagination
        } = usePagination(tableRows); // 전체 데이터를 ref로 전달

        // --- 4. 메서드 (Methods) ---
        /**
         * JSON 파일을 비동기적으로 로드하여 테이블 데이터를 업데이트합니다.
         */
        const loadJsonData = async () => {
            try {
                console.log('JSON 데이터 로딩 시작...');
                const response = await fetch('./data/b2b_lectureList.json');
                
                if (!response.ok) {
                    throw new Error(`파일을 찾을 수 없습니다. (Status: ${response.status})`);
                }
                
                const data = await response.json();
                
                // JSON 데이터는 이미 배열 형태이므로 직접 사용
                if (Array.isArray(data) && data.length > 0) {
                    // 헤더는 첫 번째 항목의 키에서 가져오거나 테이블 렌더러에서 처리
                    tableHeaders.value = Object.keys(data[0]);
                    tableRows.value = data;
                    resetPagination(); // 새 데이터 로드 후 페이지네이션을 1페이지로 초기화
                    
                    console.log(`JSON 데이터 로드 완료: 총 ${tableRows.value.length}개 항목`);
                } else {
                    throw new Error('JSON 데이터 형식이 올바르지 않습니다.');
                }
            } catch (error) {
                console.error('JSON 로드 실패:', error);
                alert('데이터 로드 중 오류가 발생했습니다.\n' + error.message + '\n\n개발자 도구(F12)의 콘솔(Console) 탭을 확인해주세요.');
            }
        };

        /**
         * 사이드바 메뉴를 선택하고, 선택된 메뉴에 따라 적절한 동작을 수행합니다.
         * @param {string} name - 선택된 메뉴의 이름
         */
        const selectMenu = (name) => {
            activeMenu.value = name;
            if (name === 'B2B 강의리스트') {
                // 데이터가 아직 로드되지 않았을 경우에만 로드
                if (tableRows.value.length === 0) {
                    loadJsonData();
                }
            } else {
                // 다른 메뉴 선택 시 테이블 데이터 초기화
                tableHeaders.value = [];
                tableRows.value = [];
            }
        };

        // --- 5. 생명주기 훅 (Lifecycle Hooks) ---
        onMounted(() => {
            // 애플리케이션이 마운트될 때 기본 메뉴를 선택하여 데이터를 로드합니다.
            selectMenu('B2B 강의리스트');
        });

        // --- 6. 템플릿에 노출할 데이터 및 메서드 반환 ---
        return {
            // 상태
            isExpanded,
            activeMenu,
            tableHeaders,
            // 메뉴
            menuItems,
            selectMenu,
            // 드래그 스크롤 (from useTableDragScroll)
            tableContainer,
            startDrag,
            stopDrag,
            onDrag,
            // 페이지네이션 (from usePagination)
            currentPage,
            totalPages,
            paginatedRows,
            changePage
        };
    }
}).mount('#app');