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
    static render(selectedCount, itemsPerPage, activeFilters = {}, showFilterReset = false, options = {}) {
        const {
            hideSearch = false,
            hideSave = false,
            hideItemsPerPage = false,
            hideFilterReset = false,
            hidePluginBar = false
        } = options || {};

        const itemsPerPageOptions = [10, 20, 50, 100, 200, 500, 1000];
        
        const optionsHtml = itemsPerPageOptions.map(option => {
            const selected = option === itemsPerPage ? 'selected' : '';
            return `<option value="${option}" ${selected}>${option}개</option>`;
        }).join('');
        
        // 필터 상태 블록 (필터가 있을 때만)
        const filterStatusHtml = FilterStatusRenderer.render(activeFilters);
        const hasFilters = filterStatusHtml && filterStatusHtml.trim().length > 0;
        
        // 필터 전체 초기화 버튼 (B2B 강의리스트에서만 표시)
        const filterResetBtn = !hideFilterReset && showFilterReset && Object.keys(activeFilters).length > 0 ? `
            <button id="filterResetAllBtn" class="btn-filter-reset" title="필터 전체 초기화">
                <i class="fa-solid fa-filter-circle-xmark"></i>
                필터 전체 초기화
            </button>
        ` : '';
        
        // 검색 입력 필드
        const searchInputHtml = hideSearch ? '' : `
            <div class="toolbar-search">
                <i class="fa-solid fa-magnifying-glass search-icon"></i>
                <input 
                    type="text" 
                    id="searchInput" 
                    class="search-input" 
                    placeholder="강의명 또는 강의코드 검색..."
                    autocomplete="off"
                />
                <button id="clearSearchBtn" class="btn-clear-search" style="display: none;" title="검색 초기화">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <button id="searchBtn" class="btn-search" title="검색">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </button>
            </div>
        `;
        
        // 필터가 있을 때는 space-between, 없을 때는 flex-end
        const toolbarClass = hasFilters ? 'toolbar toolbar-with-filter' : 'toolbar toolbar-with-search';
        
        return `
            <div class="${toolbarClass}">
                <div class="toolbar-left">
                    ${searchInputHtml}
                    ${hasFilters ? filterStatusHtml : ''}
                </div>
                <div class="toolbar-right">
                    ${filterResetBtn}
                    ${hidePluginBar ? '' : '<div id="pluginBarContainer"></div>'}
                    ${hideItemsPerPage ? '' : `
                        <select id="itemsPerPageSelect" class="items-per-page-select">
                            ${optionsHtml}
                        </select>
                    `}
                    ${hideSave ? '' : `
                        <button 
                            id="saveListBtn" 
                            class="btn-save ${selectedCount === 0 ? 'disabled' : ''}"
                            ${selectedCount === 0 ? 'disabled' : ''}
                        >
                            <i class="fa-solid fa-floppy-disk"></i> 저장
                        </button>
                    `}
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
    static renderToDOM(container, selectedCount, itemsPerPage, activeFilters = {}, showFilterReset = false, options = {}) {
        if (!container) {
            console.error('툴바 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const toolbarHtml = this.render(selectedCount, itemsPerPage, activeFilters, showFilterReset, options);
        container.innerHTML = toolbarHtml;
    }
}
