import { StorageService } from '../services/storageService.js';

/**
 * 공유 모달 렌더링 컴포넌트
 */
export class ShareModalRenderer {
    /**
     * 공유 모달 HTML을 생성합니다.
     * @param {string} listName - 공유할 리스트 이름
     * @returns {string} 모달 HTML 문자열
     */
    static render(listName) {
        return `
            <div class="modal-overlay" id="shareModalOverlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>강의리스트 공유</h2>
                        <button class="modal-close" id="closeShareModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>공유할 리스트</label>
                            <div class="form-info">${listName}</div>
                        </div>
                        
                        <div class="form-group">
                            <label for="shareInput">공유 대상 (팀/이름/아이디)</label>
                            <div class="share-input-container">
                                <input 
                                    type="text" 
                                    id="shareInput" 
                                    class="share-input" 
                                    placeholder="팀/이름/아이디를 입력하세요"
                                    autocomplete="off"
                                />
                                <div class="share-input-hint">예: 개발팀/김개발/kimdev</div>
                                <div class="autocomplete-dropdown" id="autocompleteDropdown"></div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="cancelShareBtn">취소</button>
                        <button class="btn-confirm" id="confirmShareBtn">공유</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 공유 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {string} listName - 공유할 리스트 이름
     */
    static renderToDOM(container, listName) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 모달 제거
        const existingModal = document.getElementById('shareModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = this.render(listName);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modalElement = tempDiv.firstElementChild;
        
        if (modalElement) {
            container.appendChild(modalElement);
        }
    }
    
    /**
     * 자동완성 드롭다운을 업데이트합니다.
     * @param {Array<Object>} users - 사용자 배열
     * @param {string} query - 검색 쿼리
     * @param {number} selectedIndex - 선택된 인덱스
     * @param {HTMLElement} dropdown - 드롭다운 요소 (선택사항)
     * @param {Array<Object>} allUsers - 전체 사용자 배열 (팀 전체 옵션용, 선택사항)
     */
    static updateAutocomplete(users, query, selectedIndex = -1, dropdown = null, allUsers = null) {
        if (!dropdown) {
            dropdown = document.getElementById('autocompleteDropdown');
        }
        if (!dropdown) return;
        
        if (!query) {
            dropdown.classList.remove('show');
            return;
        }
        
        let itemsHtml = '';
        let currentIndex = 0;
        
        // 팀 이름으로 검색한 경우 "팀 전체" 옵션 추가
        if (allUsers && allUsers.length > 0) {
            const uniqueTeams = [...new Set(allUsers.map(u => u.team).filter(Boolean))];
            const matchingTeam = uniqueTeams.find(team => team.toLowerCase() === query.toLowerCase());
            
            if (matchingTeam) {
                // 해당 팀의 모든 사용자 확인
                const teamUsers = allUsers.filter(u => u.team === matchingTeam);
                if (teamUsers.length > 0) {
                    const isSelected = currentIndex === selectedIndex ? 'selected' : '';
                    itemsHtml += `
                        <div class="autocomplete-item team-option ${isSelected}" data-team="${matchingTeam}" data-type="team">
                            <span class="team"><strong>${matchingTeam}</strong> (팀 전체 - ${teamUsers.length}명)</span>
                        </div>
                    `;
                    currentIndex++;
                }
            }
        }
        
        // 개별 사용자 옵션 추가
        users.forEach((user, userIndex) => {
            const isSelected = currentIndex === selectedIndex ? 'selected' : '';
            itemsHtml += `
                <div class="autocomplete-item ${isSelected}" data-user-id="${user.id}" data-type="user">
                    <span class="team">${user.team}</span>
                    <span class="name">${user.name}</span>
                    <span class="id">(${user.id})</span>
                </div>
            `;
            currentIndex++;
        });
        
        if (itemsHtml === '') {
            dropdown.classList.remove('show');
            return;
        }
        
        dropdown.innerHTML = itemsHtml;
        dropdown.classList.add('show');
    }
    
    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('shareModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            const input = document.getElementById('shareInput');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('shareModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('shareModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
