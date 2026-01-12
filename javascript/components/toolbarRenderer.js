import { CONFIG } from '../config/constants.js';
import { FilterStatusRenderer } from './filterStatusRenderer.js';

/**
 * 상단 툴바 렌더링 컴포넌트
 */
export class ToolbarRenderer {
    /**
     * 툴바 HTML을 생성합니다.
     * @param {number} selectedCount - 선택된 항목 수
     * @param {number} itemsPerPage - 페이지당 항목 수
     * @param {Object} activeFilters - 활성 필터 객체 (선택사항)
     * @param {boolean} showFilterReset - 필터 전체 초기화 버튼 표시 여부
     * @returns {string} 툴바 HTML 문자열
     */
    static render(selectedCount, itemsPerPage, activeFilters = {}, showFilterReset = false) {
        const itemsPerPageOptions = [10, 20, 50, 100, 200, 500, 1000];
        
        const optionsHtml = itemsPerPageOptions.map(option => {
            const selected = option === itemsPerPage ? 'selected' : '';
            return `<option value="${option}" ${selected}>${option}개</option>`;
        }).join('');
        
        // 필터 상태 블록 (필터가 있을 때만)
        const filterStatusHtml = FilterStatusRenderer.render(activeFilters);
        const hasFilters = filterStatusHtml && filterStatusHtml.trim().length > 0;
        
        // 필터 전체 초기화 버튼 (B2B 강의리스트에서만 표시)
        const filterResetBtn = showFilterReset && Object.keys(activeFilters).length > 0 ? `
            <button id="filterResetAllBtn" class="btn-filter-reset" title="필터 전체 초기화">
                <i class="fa-solid fa-filter-circle-xmark"></i>
                필터 전체 초기화
            </button>
        ` : '';
        
        // 필터가 있을 때는 space-between, 없을 때는 flex-end
        const toolbarClass = hasFilters ? 'toolbar toolbar-with-filter' : 'toolbar';
        
        return `
            <div class="${toolbarClass}">
                ${hasFilters ? filterStatusHtml : ''}
                <div class="toolbar-right">
                    ${filterResetBtn}
                    <div id="pluginBarContainer"></div>
                    <select id="itemsPerPageSelect" class="items-per-page-select">
                        ${optionsHtml}
                    </select>
                    <button 
                        id="saveListBtn" 
                        class="btn-save ${selectedCount === 0 ? 'disabled' : ''}"
                        ${selectedCount === 0 ? 'disabled' : ''}
                    >
                        <i class="fa-solid fa-floppy-disk"></i> 저장
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 툴바를 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 툴바를 렌더링할 컨테이너 요소
     * @param {number} selectedCount - 선택된 항목 수
     * @param {number} itemsPerPage - 페이지당 항목 수
     * @param {Object} activeFilters - 활성 필터 객체 (선택사항)
     * @param {boolean} showFilterReset - 필터 전체 초기화 버튼 표시 여부
     */
    static renderToDOM(container, selectedCount, itemsPerPage, activeFilters = {}, showFilterReset = false) {
        if (!container) {
            console.error('툴바 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const toolbarHtml = this.render(selectedCount, itemsPerPage, activeFilters, showFilterReset);
        container.innerHTML = toolbarHtml;
    }
}
