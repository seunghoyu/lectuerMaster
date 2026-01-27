/**
 * 테이블 셀 클릭 이벤트 핸들러
 */
export class CellClickHandler {
    /**
     * 셀 클릭 이벤트를 바인딩합니다.
     */
    static bindEvents() {
        const table = document.querySelector('.data-table');
        
        if (!table) {
            return;
        }
        
        table.addEventListener('click', (event) => {
            const clickedCell = event.target.closest('td');
            
            // 체크박스 셀이거나 셀이 아닌 경우 무시
            if (!clickedCell || clickedCell.querySelector('input[type="checkbox"]')) {
                return;
            }
            
            // 기존 선택된 셀의 선택 해제
            const previouslySelectedCell = table.querySelector('.selected-cell');
            if (previouslySelectedCell) {
                previouslySelectedCell.classList.remove('selected-cell');
            }
            
            // 새로 클릭한 셀에 선택 스타일 적용
            clickedCell.classList.add('selected-cell');
        });
    }
}

