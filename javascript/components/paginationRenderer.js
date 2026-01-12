import { CONFIG } from '../config/constants.js';

/**
 * 페이지네이션 렌더링 컴포넌트
 */
export class PaginationRenderer {
    /**
     * 페이지네이션 HTML을 생성합니다.
     * @param {number} currentPageNumber - 현재 페이지 번호
     * @param {number} totalPages - 전체 페이지 수
     * @returns {string} 페이지네이션 HTML 문자열
     */
    static render(currentPageNumber, totalPages) {
        const maxPagesToShow = CONFIG.MAX_PAGES_TO_SHOW;
        const startPage = Math.floor((currentPageNumber - 1) / maxPagesToShow) * maxPagesToShow + 1;
        const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);
        
        let paginationHtml = '<div class="pagination">';
        
        // 이전 페이지 그룹 버튼
        if (startPage > 1) {
            paginationHtml += `<button class="btn-page" data-page="${startPage - 1}">&lt;</button>`;
        }
        
        // 페이지 번호 버튼들
        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === currentPageNumber;
            const activeStyle = isActive 
                ? 'style="background-color: #6b7280; color: white; border-color: #6b7280;"' 
                : '';
            
            paginationHtml += `
                <button 
                    class="btn-page" 
                    ${activeStyle} 
                    data-page="${i}" 
                    ${isActive ? 'disabled' : ''}
                >
                    ${i}
                </button>
            `;
        }
        
        // 다음 페이지 그룹 버튼
        if (endPage < totalPages) {
            paginationHtml += `<button class="btn-page" data-page="${endPage + 1}">&gt;</button>`;
        }
        
        paginationHtml += '</div>';
        
        return paginationHtml;
    }
    
    /**
     * 페이지네이션을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 페이지네이션을 렌더링할 컨테이너 요소
     * @param {number} currentPageNumber - 현재 페이지 번호
     * @param {number} totalPages - 전체 페이지 수
     */
    static renderToDOM(container, currentPageNumber, totalPages) {
        if (!container) {
            console.error('페이지네이션 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const paginationHtml = this.render(currentPageNumber, totalPages);
        container.innerHTML = paginationHtml;
    }
}

