import { CONFIG } from '../config/constants.js';

/**
 * 필터 상태 표시 렌더러
 */
export class FilterStatusRenderer {
    /**
     * 필터 상태 텍스트를 생성합니다.
     * @param {Object} activeFilters - 활성 필터 객체 { columnKey: Set<string> }
     * @returns {string} 필터 상태 텍스트
     */
    static generateFilterStatusText(activeFilters) {
        if (!activeFilters || Object.keys(activeFilters).length === 0) {
            return '';
        }
        
        const filterItems = [];
        
        // 각 컬럼별로 필터 정보 수집
        Object.entries(activeFilters).forEach(([columnKey, selectedValues]) => {
            if (!selectedValues || selectedValues.size === 0) {
                return;
            }
            
            // 컬럼 정보 찾기
            const column = CONFIG.TABLE_COLUMNS.find(col => col.key === columnKey);
            const columnLabel = column ? column.label : columnKey;
            
            // 선택된 값들을 배열로 변환 및 정렬
            const valuesArray = Array.from(selectedValues).sort();
            
            filterItems.push({
                columnKey,
                columnLabel,
                values: valuesArray
            });
        });
        
        if (filterItems.length === 0) {
            return '';
        }
        
        // 단일 컬럼 필터
        if (filterItems.length === 1) {
            const item = filterItems[0];
            if (item.values.length === 1) {
                // 단일 값
                return `${item.values[0]} ${item.columnLabel}만 표시중`;
            } else {
                // 여러 값 (같은 컬럼)
                return `${item.values.join(', ')} ${item.columnLabel}만 표시중`;
            }
        } else {
            // 여러 컬럼 필터: {값1} {컬럼명1} | {값2} {컬럼명2} 만 표시중
            // 또는 같은 컬럼에 여러 값: {값1}, {값2} {컬럼명1} | {값3} {컬럼명2} 만 표시중
            const parts = filterItems.map(item => {
                if (item.values.length === 1) {
                    return `${item.values[0]} ${item.columnLabel}`;
                } else {
                    return `${item.values.join(', ')} ${item.columnLabel}`;
                }
            });
            return `${parts.join(' | ')} 만 표시중`;
        }
    }
    
    /**
     * 필터 상태 블록 HTML을 생성합니다.
     * @param {Object} activeFilters - 활성 필터 객체
     * @returns {string} 필터 상태 블록 HTML
     */
    static render(activeFilters) {
        const statusText = this.generateFilterStatusText(activeFilters);
        
        if (!statusText) {
            return '';
        }
        
        return `
            <div class="filter-status-block">
                <span class="filter-status-text">${this.escapeHtml(statusText)}</span>
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
     * 필터 상태를 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 컨테이너 요소 (toolbar)
     * @param {Object} activeFilters - 활성 필터 객체
     */
    static renderToDOM(container, activeFilters) {
        if (!container) {
            console.error('필터 상태 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 필터 상태 블록 제거
        const existingStatus = container.querySelector('.filter-status-block');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const statusHtml = this.render(activeFilters);
        if (statusHtml) {
            // toolbar의 시작 부분에 삽입
            container.insertAdjacentHTML('afterbegin', statusHtml);
        }
    }
}
