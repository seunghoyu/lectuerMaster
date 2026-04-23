/**
 * 키보드 네비게이션 핸들러
 * 엑셀 스타일의 키보드 네비게이션 지원
 */
export class KeyboardNavigationHandler {
    constructor(appInstance) {
        this.appInstance = appInstance;
        this.currentCell = null;
        this.table = null;
        this.focusedRowIndex = -1;
        this.focusedCellIndex = -1;
        this.isMultiSelectMode = false;
        this.multiSelectStartCell = null;

        // Ctrl+C 시 copy 이벤트로 전달할 버퍼
        this._pendingCopyText = '';
    }
    
    /**
     * 키보드 네비게이션 이벤트를 바인딩합니다.
     */
    bindEvents() {
        this.table = document.querySelector('.data-table');
        
        if (!this.table) {
            return;
        }
        
        // 테이블 클릭 시 포커스 설정 (체크박스 셀도 포함)
        this.table.addEventListener('click', (event) => {
            const clickedCell = event.target.closest('td');
            if (clickedCell) {
                // 체크박스 셀인 경우 체크박스를 직접 클릭했을 때는 포커스 설정하지 않음
                if (event.target.type === 'checkbox') {
                    // 체크박스 셀 자체는 포커스 설정
                    this.setCurrentCell(clickedCell);
                    return;
                }
                this.setCurrentCell(clickedCell);
            }
        });
        
        // 키보드 이벤트
        document.addEventListener('keydown', (event) => {
            // 모달이 열려있는지 확인 (모달이 열려있으면 키보드 이벤트 무시)
            const activeModal = document.querySelector('.modal-overlay.active');
            if (activeModal) {
                // 모달 내부의 입력 필드에서는 Space bar가 정상 작동해야 함
                const target = event.target;
                const isModalInput = target && (
                    target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.tagName === 'SELECT' ||
                    target.isContentEditable
                );
                
                // 모달 내부 입력 필드가 아닐 때만 이벤트 막기 (Space bar, 방향키 등)
                if (!isModalInput) {
                    if (event.key === ' ' || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                        event.preventDefault();
                        return;
                    }
                }
                
                // Ctrl+C는 모달 내부에서도 작동할 수 있도록 허용
                // 하지만 테이블 관련 키보드 이벤트는 모두 막음
                return;
            }
            
            if (!this.table) {
                this.table = document.querySelector('.data-table');
                if (!this.table) return;
            }
            
            // 테이블이 포커스를 받고 있을 때만 처리
            if (!this.currentCell) return;
            
            // Ctrl+C 처리
            if (event.ctrlKey && event.key === 'c' && !event.shiftKey && !event.altKey) {
                event.preventDefault();
                this.copySelectedCells();
                return;
            }
            
            // Space bar 처리 (체크박스 토글) - 체크박스 셀에 있을 때만
            if (event.key === ' ' && !event.ctrlKey && !event.altKey) {
                // 현재 셀이 체크박스 셀인지 확인
                const checkbox = this.currentCell ? this.currentCell.querySelector('input[type="checkbox"]') : null;
                if (checkbox) {
                    event.preventDefault();
                    this.toggleCheckboxes();
                }
                return;
            }
            
            // 방향키 처리 - 체크박스 셀이 아닐 때만
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                // 현재 셀이 체크박스 셀이면 방향키 무시 (체크박스 셀에서는 이동 불가)
                if (this.currentCell && this.currentCell.querySelector('input[type="checkbox"]')) {
                    return;
                }
                
                event.preventDefault();
                
                if (event.shiftKey) {
                    // Shift + 방향키: 다중 선택
                    this.handleMultiSelectNavigation(event.key);
                } else {
                    // 방향키: 단일 이동 (체크박스 셀로는 이동하지 않음)
                    this.resetMultiSelectMode();
                    this.handleSingleNavigation(event.key);
                }
            }
        });

        // 클립보드 복사 이벤트 (파일/HTTP 환경에서도 안정적으로 동작)
        document.addEventListener('copy', (event) => {
            if (!this._pendingCopyText) return;
            try {
                event.preventDefault();
                event.clipboardData?.setData('text/plain', this._pendingCopyText);
                event.clipboardData?.setData('text/tab-separated-values', this._pendingCopyText);
            } finally {
                this._pendingCopyText = '';
            }
        });
    }
    
    /**
     * 현재 셀을 설정합니다.
     * @param {HTMLElement} cell - 현재 셀 요소
     */
    setCurrentCell(cell) {
        // 기존 포커스 제거
        if (this.currentCell) {
            this.currentCell.classList.remove('keyboard-focused');
        }
        
        this.currentCell = cell;
        
        // 포커스 표시 (시각적 피드백)
        if (cell) {
            cell.classList.add('keyboard-focused');
            this.updateFocusIndices(cell);
            
            // 셀을 뷰포트로 스크롤
            cell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }
    
    /**
     * 셀의 행/열 인덱스를 업데이트합니다.
     * @param {HTMLElement} cell - 셀 요소
     */
    updateFocusIndices(cell) {
        const row = cell.parentElement;
        const tbody = row.parentElement;
        
        this.focusedRowIndex = Array.from(tbody.children).indexOf(row);
        this.focusedCellIndex = Array.from(row.children).indexOf(cell);
    }
    
    /**
     * 단일 네비게이션 처리 (방향키만)
     * @param {string} key - 방향키 ('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')
     */
    handleSingleNavigation(key) {
        if (!this.currentCell || this.focusedRowIndex < 0 || this.focusedCellIndex < 0) {
            return;
        }
        
        const row = this.currentCell.parentElement;
        const tbody = row.parentElement;
        const rows = Array.from(tbody.children);
        const cells = Array.from(row.children);
        
        let newRowIndex = this.focusedRowIndex;
        let newCellIndex = this.focusedCellIndex;
        
        switch (key) {
            case 'ArrowUp':
                if (newRowIndex > 0) {
                    newRowIndex--;
                }
                break;
            case 'ArrowDown':
                if (newRowIndex < rows.length - 1) {
                    newRowIndex++;
                }
                break;
            case 'ArrowLeft':
                // 체크박스 셀은 건너뛰기
                if (newCellIndex > 1) {
                    newCellIndex--;
                } else if (newCellIndex === 1 && newRowIndex > 0) {
                    // 첫 번째 데이터 셀에서 위로 이동
                    newRowIndex--;
                    const prevRow = rows[newRowIndex];
                    newCellIndex = prevRow.children.length - 1;
                }
                break;
            case 'ArrowRight':
                if (newCellIndex < cells.length - 1) {
                    newCellIndex++;
                } else if (newRowIndex < rows.length - 1) {
                    // 마지막 셀에서 오른쪽 이동 시 다음 행의 첫 번째 데이터 셀로
                    newRowIndex++;
                    newCellIndex = 1; // 체크박스 다음
                }
                break;
        }
        
        // 새 셀 선택
        if (newRowIndex >= 0 && newRowIndex < rows.length) {
            const newRow = rows[newRowIndex];
            if (newCellIndex >= 0 && newCellIndex < newRow.children.length) {
                const newCell = newRow.children[newCellIndex];
                // 체크박스 셀이 아닌 경우에만 이동
                if (!newCell.querySelector('input[type="checkbox"]')) {
                    // 단일 선택 모드: 기존 선택 해제 후 새 셀 선택
                    this.clearSelection();
                    this.resetMultiSelectMode();
                    this.setCurrentCell(newCell);
                    newCell.classList.add('selected-cell');
                } else {
                    // 체크박스 셀로 이동하려고 하면 건너뛰기
                    if (key === 'ArrowLeft' && newCellIndex > 0) {
                        newCellIndex--;
                        const skipCell = newRow.children[newCellIndex];
                        if (skipCell && !skipCell.querySelector('input[type="checkbox"]')) {
                            this.clearSelection();
                            this.resetMultiSelectMode();
                            this.setCurrentCell(skipCell);
                            skipCell.classList.add('selected-cell');
                        }
                    } else if (key === 'ArrowRight' && newCellIndex < newRow.children.length - 1) {
                        newCellIndex++;
                        const skipCell = newRow.children[newCellIndex];
                        if (skipCell && !skipCell.querySelector('input[type="checkbox"]')) {
                            this.clearSelection();
                            this.resetMultiSelectMode();
                            this.setCurrentCell(skipCell);
                            skipCell.classList.add('selected-cell');
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 다중 선택 네비게이션 처리 (Shift + 방향키)
     * @param {string} key - 방향키
     */
    handleMultiSelectNavigation(key) {
        if (!this.currentCell || this.focusedRowIndex < 0 || this.focusedCellIndex < 0) {
            return;
        }
        
        // 다중 선택 모드 시작
        if (!this.isMultiSelectMode) {
            this.isMultiSelectMode = true;
            this.multiSelectStartCell = this.currentCell;
        }
        
        const row = this.currentCell.parentElement;
        const tbody = row.parentElement;
        const rows = Array.from(tbody.children);
        
        let newRowIndex = this.focusedRowIndex;
        let newCellIndex = this.focusedCellIndex;
        
        switch (key) {
            case 'ArrowUp':
                if (newRowIndex > 0) {
                    newRowIndex--;
                }
                break;
            case 'ArrowDown':
                if (newRowIndex < rows.length - 1) {
                    newRowIndex++;
                }
                break;
            case 'ArrowLeft':
                // 체크박스 셀은 건너뛰기 (인덱스 0)
                if (newCellIndex > 1) {
                    newCellIndex--;
                }
                break;
            case 'ArrowRight':
                if (newCellIndex < rows[newRowIndex].children.length - 1) {
                    newCellIndex++;
                }
                break;
        }
        
        // 새 셀 선택 (체크박스 셀 건너뛰기)
        if (newRowIndex >= 0 && newRowIndex < rows.length) {
            const newRow = rows[newRowIndex];
            if (newCellIndex >= 0 && newCellIndex < newRow.children.length) {
                const newCell = newRow.children[newCellIndex];
                // 체크박스 셀이 아닌 경우에만 선택
                if (!newCell.querySelector('input[type="checkbox"]')) {
                    this.setCurrentCell(newCell);
                    // 범위 선택
                    this.selectRange(this.multiSelectStartCell, this.currentCell);
                } else {
                    // 체크박스 셀로 이동하려고 하면 건너뛰기
                    if (key === 'ArrowRight' && newCellIndex < newRow.children.length - 1) {
                        newCellIndex++;
                        const skipCell = newRow.children[newCellIndex];
                        if (skipCell && !skipCell.querySelector('input[type="checkbox"]')) {
                            this.setCurrentCell(skipCell);
                            this.selectRange(this.multiSelectStartCell, this.currentCell);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 범위 선택 (다중 선택 모드)
     * @param {HTMLElement} startCell - 시작 셀
     * @param {HTMLElement} endCell - 끝 셀
     */
    selectRange(startCell, endCell) {
        // 기존 선택 해제
        this.clearSelection();
        
        const startRow = startCell.parentElement;
        const endRow = endCell.parentElement;
        const tbody = startRow.parentElement;
        
        const startRowIndex = Array.from(tbody.children).indexOf(startRow);
        const endRowIndex = Array.from(tbody.children).indexOf(endRow);
        const startCellIndex = Array.from(startRow.children).indexOf(startCell);
        const endCellIndex = Array.from(endRow.children).indexOf(endCell);
        
        const minRow = Math.min(startRowIndex, endRowIndex);
        const maxRow = Math.max(startRowIndex, endRowIndex);
        const minCell = Math.min(startCellIndex, endCellIndex);
        const maxCell = Math.max(startCellIndex, endCellIndex);
        
        // 범위 내의 모든 셀 선택
        for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex++) {
            const row = tbody.children[rowIndex];
            for (let cellIndex = minCell; cellIndex <= maxCell; cellIndex++) {
                const cell = row.children[cellIndex];
                if (cell && !cell.querySelector('input[type="checkbox"]')) {
                    cell.classList.add('selected-cell');
                }
            }
        }
    }
    
    /**
     * 모든 선택을 해제합니다.
     */
    clearSelection() {
        const selectedCells = this.table.querySelectorAll('.selected-cell');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected-cell');
        });
    }
    
    /**
     * 선택된 셀들의 체크박스를 토글합니다.
     */
    toggleCheckboxes() {
        if (!this.appInstance) return;
        
        const selectedCells = this.table.querySelectorAll('.selected-cell');
        
        if (selectedCells.length === 0 && this.currentCell) {
            // 선택된 셀이 없으면 현재 셀이 있는 행의 체크박스만 토글
            const row = this.currentCell.parentElement;
            const checkbox = row.querySelector('input[type="checkbox"].row-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            // 선택된 모든 셀이 속한 행들의 체크박스 토글
            const processedRows = new Set();
            selectedCells.forEach(cell => {
                const row = cell.parentElement;
                if (!processedRows.has(row)) {
                    processedRows.add(row);
                    const checkbox = row.querySelector('input[type="checkbox"].row-checkbox');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
        }
    }
    
    /**
     * 선택된 셀들을 복사합니다 (Ctrl+C)
     */
    copySelectedCells() {
        const selectedCellsArray = Array.from(this.table.querySelectorAll('.selected-cell'));

        // 선택된 셀이 없으면 현재 셀만 복사
        if (selectedCellsArray.length === 0) {
            if (this.currentCell) {
                const text = this.currentCell.textContent.trim();
                this.copyToClipboard(text);
            }
            return;
        }

        // 선택 범위를 직사각형으로 계산해서 엑셀/스프레드시트 호환 TSV 생성
        const tbody = this.table.querySelector('tbody');
        if (!tbody) return;

        // B2B/B2C 모두 지원: 상세행(.b2c-details-row) 등은 제외
        const dataRows = Array.from(tbody.querySelectorAll('tr.b2b-row, tr.b2c-row'));
        const rowIndexMap = new Map(dataRows.map((r, i) => [r, i]));

        const positions = selectedCellsArray
            .map(cell => {
                const row = cell.parentElement;
                if (!rowIndexMap.has(row)) return null; // 상세행 등 제외
                return {
                    cell,
                    r: rowIndexMap.get(row),
                    c: Array.from(row.children).indexOf(cell)
                };
            })
            .filter(Boolean);

        if (positions.length === 0) return;

        const minR = Math.min(...positions.map(p => p.r));
        const maxR = Math.max(...positions.map(p => p.r));
        const minC = Math.min(...positions.map(p => p.c));
        const maxC = Math.max(...positions.map(p => p.c));

        const cellMap = new Map(positions.map(p => [`${p.r}:${p.c}`, p.cell]));
        const rowsData = [];
        for (let r = minR; r <= maxR; r++) {
            const row = dataRows[r];
            const rowCells = [];
            for (let c = minC; c <= maxC; c++) {
                const cell = cellMap.get(`${r}:${c}`);
                const text = cell ? cell.textContent.trim() : '';
                rowCells.push(text);
            }
            rowsData.push(rowCells);
        }

        const text = rowsData.map(row => row.join('\t')).join('\n');
        this.copyToClipboard(text);
    }
    
    /**
     * 클립보드에 텍스트를 복사합니다.
     * @param {string} text - 복사할 텍스트
     */
    async copyToClipboard(text) {
        // 1) copy 이벤트 기반(가장 호환성 좋음)
        this._pendingCopyText = text;
        const ok = document.execCommand('copy');
        if (ok) return;

        // 2) Clipboard API (보안 컨텍스트에서만)
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (err) {
            console.error('복사 실패:', err);
        }

        // 3) 최종 fallback: 임시 textarea로 선택 후 copy
        this._pendingCopyText = '';
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.setAttribute('readonly', 'true');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    /**
     * 다중 선택 모드를 초기화합니다.
     */
    resetMultiSelectMode() {
        this.isMultiSelectMode = false;
        this.multiSelectStartCell = null;
    }
    
    /**
     * 포커스를 초기화합니다.
     */
    reset() {
        if (this.currentCell) {
            this.currentCell.classList.remove('keyboard-focused');
        }
        this.currentCell = null;
        this.focusedRowIndex = -1;
        this.focusedCellIndex = -1;
        this.resetMultiSelectMode();
    }
}
