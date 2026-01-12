/**
 * 테이블 가로 드래그 스크롤 기능을 관리하는 Vue Composition 함수
 * @returns {object} 드래그 스크롤에 필요한 상태와 이벤트 핸들러
 */
function useTableDragScroll() {
    const { ref } = Vue;
    const tableContainer = ref(null);

    // 드래그 상태 관리를 위한 변수
    let isDown = false;
    let startX;
    let startY;
    let scrollLeft;
    let scrollTop;

    const startDrag = (e) => {
        if (!tableContainer.value) return;
        isDown = true;
        // 드래그 중임을 나타내는 클래스 추가
        tableContainer.value.classList.add('active-drag');
        startX = e.pageX;
        startY = e.pageY;
        scrollLeft = tableContainer.value.scrollLeft;
        scrollTop = tableContainer.value.scrollTop;
    };

    const stopDrag = () => {
        if (!tableContainer.value) return;
        isDown = false;
        // 드래그 완료 후 클래스 제거
        tableContainer.value.classList.remove('active-drag');
    };

    const onDrag = (e) => {
        if (!isDown || !tableContainer.value) return;
        e.preventDefault();
        const x = e.pageX;
        const y = e.pageY;
        const walkX = (x - startX) * 2; // 스크롤 속도 조절
        const walkY = (y - startY) * 2;
        tableContainer.value.scrollLeft = scrollLeft - walkX;
        tableContainer.value.scrollTop = scrollTop - walkY;
    };

    return {
        tableContainer,
        startDrag,
        stopDrag,
        onDrag
    };
}
