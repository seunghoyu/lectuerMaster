/**
 * 페이지네이션 이벤트 핸들러
 */
export class PaginationHandler {
    /**
     * 페이지네이션 이벤트를 바인딩합니다.
     * @param {Function} onPageChange - 페이지 변경 시 호출될 콜백 함수
     */
    static bindEvents(onPageChange) {
        const pageButtons = document.querySelectorAll('.btn-page');
        
        pageButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const targetPage = parseInt(event.target.dataset.page);
                
                if (targetPage && typeof onPageChange === 'function') {
                    onPageChange(targetPage);
                }
            });
        });
    }
}

