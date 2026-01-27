/**
 * 테이블 셀 선택 이벤트 핸들러 (클릭 + 드래그)
 */
export class CellSelectionHandler {
    constructor() {
        this.isSelecting = false;
        this.startCell = null;
        this.selectedCells = new Set();
        this.previousSelectionStart = null; // Shift+클릭 시 이전 선택 시작점 저장
    }
    
    /**
     * 셀 선택 이벤트를 바인딩합니다.
     */
    bindEvents() {
        const table = document.querySelector('.data-table');
        
        if (!table) {
            return;
        }
        
        // 마우스 다운 - 선택 시작
        table.addEventListener('mousedown', (event) => {
            const clickedCell = event.target.closest('td');
            
            // 체크박스 셀이거나 셀이 아닌 경우 무시
            if (!clickedCell || clickedCell.querySelector('input[type="checkbox"]')) {
                return;
            }
            
            // 텍스트 선택 방지
            event.preventDefault();
            
            // Shift 키를 누르고 있을 때 다중 선택 모드
            if (event.shiftKey) {
                // 모달이 열려있는지 확인 (모달이 열려있으면 Shift+클릭 무시)
                const activeModal = document.querySelector('.modal-overlay.active');
                if (activeModal) {
                    return;
                }
                
                // 이전에 선택된 셀이 있으면 해당 범위와 새 범위를 모두 선택
                if (this.previousSelectionStart) {
                    // 이전 시작점부터 클릭한 셀까지의 범위 선택 (기존 선택 유지)
                    this.selectCellRange(this.previousSelectionStart, clickedCell, false);
                } else if (this.startCell) {
                    // startCell이 있으면 startCell부터 클릭한 셀까지 범위 선택 (기존 선택 유지)
                    this.selectCellRange(this.startCell, clickedCell, false);
                } else {
                    // 시작점이 없으면 단일 셀만 선택 (기존 선택 유지)
                    this.selectCell(clickedCell);
                }
                this.isSelecting = false;
                // previousSelectionStart 업데이트 (다음 Shift+클릭을 위해)
                this.previousSelectionStart = clickedCell;
                return;
            }
            
            // Shift 키가 아닐 때
            this.isSelecting = true;
            this.startCell = clickedCell;
            this.previousSelectionStart = clickedCell; // 새 선택 시작점 저장
            
            // 기존 선택 모두 해제
            this.clearSelection();
            
            // 시작 셀 선택
            this.selectCell(clickedCell);
        });
        
        // 마우스 무브 - 드래그 중 셀 선택
        table.addEventListener('mousemove', (event) => {
            if (!this.isSelecting || !this.startCell) {
                return;
            }
            
            const currentCell = event.target.closest('td');
            
            if (!currentCell || currentCell.querySelector('input[type="checkbox"]')) {
                return;
            }
            
            // 시작 셀과 현재 셀 사이의 모든 셀 선택
            this.selectCellRange(this.startCell, currentCell);
        });
        
        // 마우스 업 - 선택 종료
        table.addEventListener('mouseup', () => {
            if (this.isSelecting && this.startCell) {
                // 드래그가 끝났을 때 마지막 선택 지점을 previousSelectionStart로 저장
                this.previousSelectionStart = this.startCell;
            }
            this.isSelecting = false;
        });
        
        // 테이블 밖으로 나가면 선택 종료
        table.addEventListener('mouseleave', () => {
            this.isSelecting = false;
            this.startCell = null;
        });
    }
    
    /**
     * 단일 셀을 선택합니다.
     * @param {HTMLElement} cell - 선택할 셀 요소
     */
    selectCell(cell) {
        cell.classList.add('selected-cell');
        this.selectedCells.add(cell);
    }
    
    /**
     * 셀 범위를 선택합니다.
     * @param {HTMLElement} startCell - 시작 셀
     * @param {HTMLElement} endCell - 끝 셀
     * @param {boolean} clearExisting - 기존 선택 해제 여부 (기본값: true)
     */
    selectCellRange(startCell, endCell, clearExisting = true) {
        // 기존 선택 해제 여부에 따라 처리
        if (clearExisting) {
            this.clearSelection();
        }
        
        const startRow = startCell.parentElement;
        const endRow = endCell.parentElement;
        const startRowIndex = Array.from(startRow.parentElement.children).indexOf(startRow);
        const endRowIndex = Array.from(endRow.parentElement.children).indexOf(endRow);
        const startCellIndex = Array.from(startRow.children).indexOf(startCell);
        const endCellIndex = Array.from(endRow.children).indexOf(endCell);
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCell = Math.min(startCellIndex, endCellIndex);
        const maxCell = Math.max(startCellIndex, endCellIndex);
        
        const tbody = startRow.parentElement;
        
        // 범위 내의 모든 셀 선택
        for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
            const row = tbody.children[rowIndex];
            for (let cellIndex = minCell; cellIndex <= maxCell; cellIndex++) {
                const cell = row.children[cellIndex];
                // 체크박스 셀은 제외
                if (cell && !cell.querySelector('input[type="checkbox"]')) {
                    this.selectCell(cell);
                }
            }
        }
    }
    
    /**
     * 모든 선택을 해제합니다.
     */
    clearSelection() {
        this.selectedCells.forEach(cell => {
            cell.classList.remove('selected-cell');
        });
        this.selectedCells.clear();
    }
    
    /**
     * 현재 선택된 셀들을 반환합니다.
     * @returns {Set<HTMLElement>} 선택된 셀들의 Set
     */
    getSelectedCells() {
        return this.selectedCells;
    }
}
