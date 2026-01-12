/**
 * 자동화 기능 모달 렌더링 컴포넌트
 */
export class AutomationModalRenderer {
    /**
     * 자동화 모달 HTML을 생성합니다.
     * @param {string} actionType - 액션 타입 ('requestTaxInvoice' | 'taxInvoice' | 'settlementFile')
     * @param {number} selectedCount - 선택된 항목 수
     * @returns {string} 모달 HTML 문자열
     */
    static render(actionType, selectedCount) {
        let title, description;
        
        if (actionType === 'requestTaxInvoice') {
            title = '세금계산서 발행요청';
            description = '선택한 강의에 대한 세금계산서 발행을 요청합니다.';
        } else if (actionType === 'taxInvoice') {
            title = '세금계산서 발행';
            description = '선택한 강의에 대한 세금계산서를 발행합니다.';
        } else if (actionType === 'settlementFile') {
            title = '강의료 정산파일 제작';
            description = '선택한 강의에 대한 강의료 정산파일을 생성합니다.';
        } else {
            title = '자동화 기능';
            description = '자동화 기능을 실행합니다.';
        }
        
        return `
            <div class="modal-overlay" id="automationModalOverlay">
                <div class="modal-container">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button class="modal-close" id="closeAutomationModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <p class="form-info">${description}</p>
                            <p class="form-info">선택된 강의: <strong>${selectedCount}개</strong></p>
                        </div>
                        <div class="form-group">
                            <label>처리 상태</label>
                            <div id="automationStatus" class="automation-status">
                                대기 중...
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="cancelAutomationBtn">취소</button>
                        <button class="btn-confirm" id="confirmAutomationBtn">실행</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 자동화 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {string} actionType - 액션 타입
     * @param {number} selectedCount - 선택된 항목 수
     */
    static renderToDOM(container, actionType, selectedCount) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 모달 제거
        const existingModal = document.getElementById('automationModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = this.render(actionType, selectedCount);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modalElement = tempDiv.firstElementChild;
        
        if (modalElement) {
            modalElement.dataset.actionType = actionType;
            container.appendChild(modalElement);
        }
    }
    
    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('automationModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('automationModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('automationModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    /**
     * 처리 상태를 업데이트합니다.
     * @param {string} status - 상태 메시지
     * @param {string} type - 상태 타입 ('info' | 'success' | 'error')
     */
    static updateStatus(status, type = 'info') {
        const statusElement = document.getElementById('automationStatus');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `automation-status automation-status-${type}`;
        }
    }
}
