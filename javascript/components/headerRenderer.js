import { StorageService } from '../services/storageService.js';

/**
 * 헤더 렌더링 컴포넌트
 */
export class HeaderRenderer {
    /**
     * 헤더 HTML을 생성합니다.
     * @param {string} menuName - 현재 선택된 메뉴명
     * @param {number} selectedCount - 선택된 항목 수
     * @returns {string} 헤더 HTML 문자열
     */
    static render(menuName = 'B2B 강의리스트', selectedCount = 0) {
        const user = StorageService.getCurrentUser();
        
        return `
            <div class="top-header-row">
                <div class="header-left">
                    <span class="menu-title-text">${menuName}</span>
                    <span class="selected-count-in-header">선택: <strong>${selectedCount}</strong>개</span>
                </div>
                <div class="user-info">
                    <span class="user-name">${user.name}</span>
                    <span class="user-id">(${user.id})</span>
                </div>
            </div>
        `;
    }
    
    /**
     * 헤더를 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 헤더를 렌더링할 컨테이너 요소
     * @param {string} menuName - 현재 선택된 메뉴명
     * @param {number} selectedCount - 선택된 항목 수
     */
    static renderToDOM(container, menuName = 'B2B 강의리스트', selectedCount = 0) {
        if (!container) {
            console.error('헤더 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const headerHtml = this.render(menuName, selectedCount);
        const existingRow = container.querySelector('.top-header-row');
        if (existingRow) {
            existingRow.remove();
        }
        container.insertAdjacentHTML('afterbegin', headerHtml);
        
        // 기존 menu-title-bar 제거 (더 이상 필요 없음)
        const existingMenuBar = document.querySelector('.menu-title-bar');
        if (existingMenuBar) {
            existingMenuBar.remove();
        }
    }
    
    /**
     * 메뉴명 표시 바를 DOM에 렌더링합니다.
     * @deprecated 메뉴명은 이제 top-header-row에 직접 표시됩니다.
     * @param {HTMLElement} container - 메뉴명 표시 바를 렌더링할 컨테이너 요소 (main-content)
     * @param {string} menuName - 현재 선택된 메뉴명
     */
    static renderMenuTitleBarToDOM(container, menuName = 'B2B 강의리스트') {
        // 더 이상 별도로 렌더링하지 않음 (top-header-row에 통합됨)
        // 기존 menu-title-bar 제거
        const existingMenuBar = document.querySelector('.menu-title-bar');
        if (existingMenuBar) {
            existingMenuBar.remove();
        }
    }
    
    /**
     * 헤더 제목을 업데이트합니다.
     * @deprecated 메뉴명을 업데이트하려면 updateMenuNameAndCount를 사용하세요.
     * @param {string} title - 새로운 제목
     */
    static updateTitle(title) {
        // 하위 호환성을 위해 유지 (실제로는 사용하지 않음)
        this.updateMenuNameAndCount(title, 0);
    }
    
    /**
     * 메뉴명을 업데이트합니다.
     * @param {string} menuName - 새로운 메뉴명
     */
    static updateMenuName(menuName) {
        const menuTitleText = document.querySelector('.menu-title-text');
        if (menuTitleText) {
            menuTitleText.textContent = menuName;
        } else {
            // 헤더가 없으면 다시 렌더링
            const headerContainer = document.querySelector('.top-header');
            if (headerContainer) {
                const selectedCount = this.getCurrentSelectedCount();
                this.renderToDOM(headerContainer, menuName, selectedCount);
            }
        }
    }
    
    /**
     * 메뉴명과 선택 개수를 함께 업데이트합니다.
     * @param {string} menuName - 새로운 메뉴명
     * @param {number} selectedCount - 선택된 항목 수
     */
    static updateMenuNameAndCount(menuName, selectedCount = 0) {
        const menuTitleText = document.querySelector('.menu-title-text');
        const selectedCountEl = document.querySelector('.selected-count-in-header');
        
        if (menuTitleText) {
            menuTitleText.textContent = menuName;
        }
        
        if (selectedCountEl) {
            selectedCountEl.innerHTML = `선택: <strong>${selectedCount}</strong>개`;
        } else {
            // 헤더가 없으면 다시 렌더링
            const headerContainer = document.querySelector('.top-header');
            if (headerContainer) {
                this.renderToDOM(headerContainer, menuName, selectedCount);
            }
        }
    }
    
    /**
     * 현재 선택된 개수를 가져옵니다.
     * @returns {number} 선택된 항목 수
     */
    static getCurrentSelectedCount() {
        const selectedCountEl = document.querySelector('.selected-count-in-header');
        if (selectedCountEl) {
            const match = selectedCountEl.textContent.match(/(\d+)개/);
            return match ? parseInt(match[1], 10) : 0;
        }
        return 0;
    }
}
