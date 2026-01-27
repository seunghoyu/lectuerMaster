/**
 * 체크박스 이벤트 핸들러
 * 선택 상태를 전역으로 관리합니다.
 */
export class CheckboxHandler {
    constructor(selectedLecturesSet, onSelectionChange) {
        this.selectedLectures = selectedLecturesSet; // Set<강의코드>
        this.onSelectionChange = onSelectionChange; // 선택 변경 시 콜백
    }
    
    /**
     * 체크박스 이벤트를 바인딩합니다.
     */
    bindEvents() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        
        // 전체 선택 체크박스
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (event) => {
                const isChecked = event.target.checked;
                rowCheckboxes.forEach((checkbox, index) => {
                    checkbox.checked = isChecked;
                    const row = checkbox.closest('tr');
                    const lectureCode = this.getLectureCodeFromRow(row);
                    
                    if (lectureCode) {
                        if (isChecked) {
                            this.selectedLectures.add(lectureCode);
                        } else {
                            this.selectedLectures.delete(lectureCode);
                        }
                    }
                });
                
                if (this.onSelectionChange) {
                    this.onSelectionChange();
                }
            });
        }
        
        // 개별 체크박스
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const row = event.target.closest('tr');
                const lectureCode = this.getLectureCodeFromRow(row);
                
                if (lectureCode) {
                    if (event.target.checked) {
                        this.selectedLectures.add(lectureCode);
                    } else {
                        this.selectedLectures.delete(lectureCode);
                    }
                }
                
                // 전체 선택 체크박스 상태 업데이트
                this.updateSelectAllCheckbox();
                
                if (this.onSelectionChange) {
                    this.onSelectionChange();
                }
            });
        });
        
        // 현재 페이지의 체크박스 상태 복원
        this.restoreCheckboxStates();
    }
    
    /**
     * 행에서 강의 코드를 추출합니다.
     * @param {HTMLElement} row - 테이블 행 요소
     * @returns {string|null} 강의 코드 또는 null
     */
    getLectureCodeFromRow(row) {
        if (!row) return null;
        
        // data-lecture-code 속성에서 강의코드 추출 (우선)
        const checkbox = row.querySelector('.row-checkbox');
        if (checkbox && checkbox.dataset.lectureCode) {
            return checkbox.dataset.lectureCode;
        }
        
        // 속성이 없으면 강의코드 컬럼 찾기 (강의코드 컬럼의 키를 찾아서 인덱스 확인)
        const cells = row.querySelectorAll('td');
        const headerRow = row.closest('table')?.querySelector('thead tr');
        if (headerRow) {
            const headerCells = headerRow.querySelectorAll('th');
            let codeColumnIndex = -1;
            
            headerCells.forEach((th, index) => {
                const label = th.textContent.trim();
                if (label === '강의코드') {
                    codeColumnIndex = index;
                }
            });
            
            if (codeColumnIndex >= 0 && cells.length > codeColumnIndex) {
                return cells[codeColumnIndex].textContent.trim();
            }
        }
        
        return null;
    }
    
    /**
     * 전체 선택 체크박스 상태를 업데이트합니다.
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        
        if (!selectAllCheckbox || rowCheckboxes.length === 0) return;
        
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        selectAllCheckbox.checked = allChecked;
    }
    
    /**
     * 현재 페이지의 체크박스 상태를 복원합니다.
     */
    restoreCheckboxStates() {
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        
        rowCheckboxes.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const lectureCode = this.getLectureCodeFromRow(row);
            
            if (lectureCode && this.selectedLectures.has(lectureCode)) {
                checkbox.checked = true;
            }
        });
        
        this.updateSelectAllCheckbox();
    }
    
    /**
     * 선택된 강의 코드 배열을 반환합니다.
     * @returns {Array<string>} 선택된 강의 코드 배열
     */
    getSelectedLectureCodes() {
        return Array.from(this.selectedLectures);
    }
    
    /**
     * 선택을 모두 해제합니다.
     */
    clearSelection() {
        this.selectedLectures.clear();
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        
        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
        }
        
        if (this.onSelectionChange) {
            this.onSelectionChange();
        }
    }
}

