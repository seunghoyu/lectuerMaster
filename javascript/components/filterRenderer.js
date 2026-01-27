/**
 * 필터 렌더링 컴포넌트
 * 엑셀 스타일의 필터 기능
 */
export class FilterRenderer {
    /**
     * 필터 아이콘 HTML을 생성합니다.
     * @param {string} columnKey - 컬럼 키
     * @returns {string} 필터 아이콘 HTML
     */
    static renderFilterIcon(columnKey) {
        return `
            <div class="filter-icon-container" data-column-key="${columnKey}">
                <i class="fa-solid fa-filter filter-icon"></i>
            </div>
        `;
    }
    
    /**
     * 필터 드롭다운 HTML을 생성합니다.
     * @param {string} columnKey - 컬럼 키
     * @param {Array<string>} uniqueValues - 고윳값 배열
     * @param {Set<string>} selectedValues - 선택된 값들의 Set
     * @returns {string} 필터 드롭다운 HTML
     */
    static renderFilterDropdown(columnKey, uniqueValues, selectedValues = new Set()) {
        const searchInputId = `filter-search-${columnKey}`;
        const valuesListId = `filter-values-${columnKey}`;
        const selectAllId = `filter-select-all-${columnKey}`;
        const clearFilterId = `filter-clear-${columnKey}`;
        const applyFilterId = `filter-apply-${columnKey}`;
        
        // 선택 상태 확인
        const allSelected = uniqueValues.length > 0 && uniqueValues.every(v => selectedValues.has(v));
        const someSelected = !allSelected && uniqueValues.some(v => selectedValues.has(v));
        
        // 고윳값 체크박스 HTML
        const valuesHtml = uniqueValues.map(value => {
            const checked = selectedValues.has(value) ? 'checked' : '';
            const displayValue = value || '(빈 값)';
            return `
                <label class="filter-value-item">
                    <input type="checkbox" value="${this.escapeHtml(value)}" ${checked}>
                    <span>${this.escapeHtml(displayValue)}</span>
                </label>
            `;
        }).join('');
        
        return `
            <div class="filter-dropdown" id="filter-dropdown-${columnKey}">
                <div class="filter-search">
                    <input 
                        type="text" 
                        id="${searchInputId}" 
                        class="filter-search-input" 
                        placeholder="검색..."
                        autocomplete="off"
                    >
                </div>
                <div class="filter-actions">
                    <label class="filter-select-all-item">
                        <input type="checkbox" id="${selectAllId}" ${allSelected ? 'checked' : ''} ${someSelected ? 'indeterminate' : ''}>
                        <span>모두 선택</span>
                    </label>
                    <button class="filter-action-btn filter-clear-btn" id="${clearFilterId}">초기화</button>
                </div>
                <div class="filter-values" id="${valuesListId}">
                    ${valuesHtml}
                </div>
                <div class="filter-footer">
                    <button class="filter-action-btn filter-cancel-btn" id="filter-cancel-${columnKey}">취소</button>
                    <button class="filter-action-btn filter-apply-btn" id="${applyFilterId}">적용</button>
                </div>
            </div>
        `;
    }
    
    /**
     * HTML 이스케이프
     * @param {string} text - 이스케이프할 텍스트
     * @returns {string} 이스케이프된 텍스트
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 필터 드롭다운을 표시합니다.
     * @param {HTMLElement} container - 컨테이너 요소
     * @param {string} columnKey - 컬럼 키
     * @param {Array<string>} uniqueValues - 고윳값 배열
     * @param {Set<string>} selectedValues - 선택된 값들의 Set
     * @param {Function} onApply - 적용 버튼 클릭 시 콜백
     * @param {Function} onSearch - 검색 입력 시 콜백
     */
    static showFilterDropdown(container, columnKey, uniqueValues, selectedValues, onApply, onSearch) {
        // 기존 드롭다운 제거
        const existingDropdown = document.getElementById(`filter-dropdown-${columnKey}`);
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        // 다른 열의 드롭다운 모두 닫기
        document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
            if (dropdown.id !== `filter-dropdown-${columnKey}`) {
                dropdown.remove();
            }
        });
        
        // 새 드롭다운 생성 (th 요소 안에)
        const th = container.closest('th');
        if (!th) {
            console.error('필터 드롭다운을 표시할 th 요소를 찾을 수 없습니다.');
            return;
        }
        
        const dropdownHtml = this.renderFilterDropdown(columnKey, uniqueValues, selectedValues);
        th.insertAdjacentHTML('beforeend', dropdownHtml);
        
        const dropdown = document.getElementById(`filter-dropdown-${columnKey}`);
        if (!dropdown) return;
        
        // 검색 입력 이벤트
        const searchInput = document.getElementById(`filter-search-${columnKey}`);
        if (searchInput && onSearch) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                onSearch(query, columnKey);
            });
        }
        
        // 모두 선택 체크박스
        const selectAll = document.getElementById(`filter-select-all-${columnKey}`);
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checked = e.target.checked;
                const valuesList = document.getElementById(`filter-values-${columnKey}`);
                if (valuesList) {
                    const checkboxes = valuesList.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        cb.checked = checked;
                    });
                }
            });
        }
        
        // 개별 체크박스 변경 시 "모두 선택" 상태 업데이트
        const valuesList = document.getElementById(`filter-values-${columnKey}`);
        if (valuesList && selectAll) {
            valuesList.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    const checkboxes = valuesList.querySelectorAll('input[type="checkbox"]');
                    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                    
                    if (checkedCount === 0) {
                        selectAll.checked = false;
                        selectAll.indeterminate = false;
                    } else if (checkedCount === checkboxes.length) {
                        selectAll.checked = true;
                        selectAll.indeterminate = false;
                    } else {
                        selectAll.checked = false;
                        selectAll.indeterminate = true;
                    }
                }
            });
        }
        
        // 필터 해제 버튼
        const clearBtn = document.getElementById(`filter-clear-${columnKey}`);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (valuesList) {
                    const checkboxes = valuesList.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(cb => {
                        cb.checked = false;
                    });
                }
                if (selectAll) {
                    selectAll.checked = false;
                    selectAll.indeterminate = false;
                }
                if (searchInput) {
                    searchInput.value = '';
                }
            });
        }
        
        // 취소 버튼
        const cancelBtn = document.getElementById(`filter-cancel-${columnKey}`);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                dropdown.remove();
            });
        }
        
        // 적용 버튼
        const applyBtn = document.getElementById(`filter-apply-${columnKey}`);
        if (applyBtn && onApply) {
            applyBtn.addEventListener('click', () => {
                const selectedValuesSet = new Set();
                if (valuesList) {
                    const checkboxes = valuesList.querySelectorAll('input[type="checkbox"]:checked');
                    checkboxes.forEach(cb => {
                        selectedValuesSet.add(cb.value);
                    });
                }
                onApply(columnKey, selectedValuesSet);
                dropdown.remove();
            });
        }
        
        // ESC 키로 필터 닫기
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && document.contains(dropdown)) {
                dropdown.remove();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        // 드롭다운 외부 클릭 시 닫기
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && !th.contains(e.target) && !container.contains(e.target)) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 0);
    }
    
    /**
     * 필터 값 목록을 필터링합니다 (검색용)
     * @param {string} columnKey - 컬럼 키
     * @param {string} query - 검색 쿼리
     */
    static filterValues(columnKey, query) {
        const valuesList = document.getElementById(`filter-values-${columnKey}`);
        if (!valuesList) return;
        
        const items = valuesList.querySelectorAll('.filter-value-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const text = item.textContent.trim().toLowerCase();
            if (text.includes(lowerQuery)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
}
