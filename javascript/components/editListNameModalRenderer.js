/**
 * 리스트 이름 수정 모달 렌더링 컴포넌트
 */
export class EditListNameModalRenderer {
    /**
     * 이름 수정 모달 HTML을 생성합니다.
     * @param {string} currentName - 현재 리스트 이름
     * @returns {string} 모달 HTML 문자열
     */
    static render(currentName) {
        return `
            <div class="modal-overlay" id="editListNameModalOverlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>리스트 이름 수정</h2>
                        <button class="modal-close" id="closeEditListNameModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="editListNameInput">리스트명</label>
                            <input 
                                type="text" 
                                id="editListNameInput" 
                                class="form-input" 
                                placeholder="리스트 이름을 입력하세요"
                                value="${currentName}"
                                maxlength="50"
                            />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="cancelEditListNameBtn">취소</button>
                        <button class="btn-confirm" id="confirmEditListNameBtn">수정</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 이름 수정 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {string} currentName - 현재 리스트 이름
     */
    static renderToDOM(container, currentName) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 모달 제거
        const existingModal = document.getElementById('editListNameModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = this.render(currentName);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modalElement = tempDiv.firstElementChild;
        
        if (modalElement) {
            container.appendChild(modalElement);
        }
    }
    
    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('editListNameModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            // 입력 필드에 포커스 및 전체 선택
            const input = document.getElementById('editListNameInput');
            if (input) {
                setTimeout(() => {
                    input.focus();
                    input.select();
                }, 100);
            }
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('editListNameModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('editListNameModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
