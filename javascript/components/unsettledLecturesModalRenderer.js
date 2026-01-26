/**
 * 미정산 강의 등록 모달 렌더링 컴포넌트
 */
export class UnsettledLecturesModalRenderer {
    /**
     * 모달 HTML을 생성합니다.
     * @param {Object} unsettledData - 현재 미정산 데이터 (lectureCode: status)
     * @returns {string} 모달 HTML 문자열
     */
    static render(unsettledData) {
        const unsettledListHtml = Object.entries(unsettledData)
            .filter(([code, status]) => status === '미정산')
            .map(([code]) => `<li>${code}</li>`)
            .join('');

        return `
            <div class="modal-overlay" id="unsettledLecturesModalOverlay">
                <div class="modal-container" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>
                            <i class="fa-solid fa-file-circle-plus"></i>
                            미정산 강의 등록하기
                        </h2>
                        <button class="modal-close-btn" id="closeUnsettledModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body" style="display: flex; gap: 20px;">
                        <div class="modal-body-left" style="flex: 1;">
                            <div class="form-section">
                                <label for="unsettledLectureCodesInput" class="form-label">
                                    <i class="fa-solid fa-code"></i>
                                    추가할 강의코드
                                </label>
                                <div class="form-help-text">
                                    <p>• '미정산' 상태로 추가할 강의코드를 입력해주세요.</p>
                                    <p>• 줄바꿈 기준으로 여러 코드를 한 번에 추가할 수 있습니다.</p>
                                </div>
                                <textarea 
                                    id="unsettledLectureCodesInput" 
                                    class="form-textarea code-input" 
                                    rows="15"
                                    placeholder="강의코드를 입력해주세요..."
                                ></textarea>
                            </div>
                        </div>
                        
                        <div class="modal-body-right" style="flex: 1;">
                            <div class="form-section">
                                <label class="form-label">
                                    <i class="fa-solid fa-list-ul"></i>
                                    현재 미정산 강의 목록
                                </label>
                                <div class="result-log-container" style="height: 300px;">
                                    <ul class="unsettled-list">
                                        ${unsettledListHtml || '<li>미정산 강의가 없습니다.</li>'}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary" id="cancelUnsettledBtn">
                            <i class="fa-solid fa-times"></i> 취소
                        </button>
                        <button class="btn-primary" id="confirmUnsettledBtn">
                            <i class="fa-solid fa-plus"></i> 추가하기
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너
     * @param {Object} unsettledData - 현재 미정산 데이터
     */
    static renderToDOM(container, unsettledData) {
        if (!container) return;
        const modalElement = document.createElement('div');
        modalElement.innerHTML = this.render(unsettledData);
        container.appendChild(modalElement.firstElementChild);
    }

    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('unsettledLecturesModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            overlay.querySelector('textarea')?.focus();
        }
    }

    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('unsettledLecturesModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }

    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('unsettledLecturesModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
