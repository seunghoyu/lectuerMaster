/**
 * 페이지네이션 로직을 관리하는 Vue Composition 함수
 * @param {Ref<Array>} tableRows - 전체 데이터 행 배열에 대한 ref
 * @param {Ref<number>} [itemsPerPage=Vue.ref(10)] - 페이지당 보여줄 항목 수에 대한 ref
 * @returns {object} 페이지네이션 상태와 메서드를 담은 객체
 */
function usePagination(tableRows, itemsPerPage = Vue.ref(100)) {
    const { ref, computed } = Vue;

    const currentPage = ref(1);

    // 전체 페이지 수 계산
    const totalPages = computed(() => {
        if (!tableRows.value || tableRows.value.length === 0) return 1;
        return Math.ceil(tableRows.value.length / itemsPerPage.value);
    });

    // 현재 페이지에 보여줄 데이터 계산
    const paginatedRows = computed(() => {
        if (!tableRows.value) return [];
        
        // 데이터가 변경되어 현재 페이지가 전체 페이지 수를 초과할 경우 1페이지로 리셋
        if (currentPage.value > totalPages.value) {
            currentPage.value = 1;
        }
        const start = (currentPage.value - 1) * itemsPerPage.value;
        const end = start + itemsPerPage.value;
        return tableRows.value.slice(start, end);
    });

    // 페이지 변경 메서드
    const changePage = (page) => {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page;
        }
    };

    // 페이지네이션 리셋 메서드 (데이터가 새로 로드될 때 사용)
    const resetPagination = () => {
        currentPage.value = 1;
    };

    return {
        currentPage,
        itemsPerPage,
        totalPages,
        paginatedRows,
        changePage,
        resetPagination
    };
}
