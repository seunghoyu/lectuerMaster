/**
 * 모달 렌더링 컴포넌트
 */
export class ModalRenderer {
    /**
     * 저장 모달 HTML을 생성합니다.
     * @param {number} selectedCount - 선택된 항목 수
     * @param {Object} categoryCounts - 카테고리별 선택 개수
     * @param {Array<Object>} selectedLectures - 선택된 강의 리스트
     * @returns {string} 모달 HTML 문자열
     */
    static renderSaveModal(selectedCount, categoryCounts, selectedLectures) {
        // 카테고리별 개수 표시
        const categoryHtml = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1]) // 개수 많은 순으로 정렬
            .map(([category, count]) => {
                return `<div class="category-item">${category}: <strong>${count}</strong>개</div>`;
            }).join('');
        
        // 선택한 강의 리스트 표시
        const lectureListHtml = selectedLectures.slice(0, 20).map(lecture => {
            return `
                <tr>
                    <td>${lecture['카테고리'] || '-'}</td>
                    <td class="text-left">${lecture['강의명'] || '-'}</td>
                    <td>${lecture['강의코드'] || '-'}</td>
                </tr>
            `;
        }).join('');
        
        const moreCount = selectedLectures.length > 20 ? selectedLectures.length - 20 : 0;
        
        return `
            <div class="modal-overlay" id="saveModalOverlay">
                <div class="modal-container save-modal-container-large">
                    <div class="modal-header">
                        <h2>강의리스트 저장</h2>
                        <button class="modal-close" id="closeSaveModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body save-modal-body">
                        <div class="save-modal-left">
                            <div class="form-group">
                                <label for="listNameInput">리스트명 <span class="required">*</span></label>
                                <input 
                                    type="text" 
                                    id="listNameInput" 
                                    class="form-input" 
                                    placeholder="리스트 이름을 입력하세요"
                                    maxlength="50"
                                />
                            </div>
                            
                            <div class="form-section">
                                <label class="form-section-title">계약유형 <span class="required">*</span></label>
                                <div class="contract-type-group">
                                    <label class="contract-type-option">
                                        <input type="radio" name="contractType" value="턴키" checked>
                                        <span>턴키</span>
                                    </label>
                                    <label class="contract-type-option">
                                        <input type="radio" name="contractType" value="인당과금">
                                        <span>인당과금</span>
                                    </label>
                                    <label class="contract-type-option">
                                        <input type="radio" name="contractType" value="개별결제">
                                        <span>개별결제</span>
                                    </label>
                                </div>
                            </div>

                            <div class="form-section" id="priceMappingSection" style="display: none;">
                                <label class="form-section-title">강의코드별 금액 매핑</label>
                                <div class="form-help-text">
                                    엑셀에서 복사한 데이터를 그대로 붙여넣어주세요.<br>
                                    형식: 강의코드 [탭 또는 공백] 금액 (예: Ch_L_00046539	30,000)
                                </div>
                                <textarea 
                                    id="priceMappingInput" 
                                    class="form-textarea price-mapping-input"
                                    placeholder="Ch_L_00046539	30,000&#10;Ch_L_00001262	23,000&#10;Ch_L_00008084	23,000"
                                    rows="8"
                                ></textarea>
                                <div class="inline-action-row">
                                    <button type="button" class="btn-execute" id="executePriceMappingBtn">
                                        <i class="fa-solid fa-play"></i> 실행
                                    </button>
                                    <span id="priceMappingStatus" class="inline-status" aria-live="polite"></span>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <div class="form-section-title">카테고리별 선택 개수</div>
                                <div class="category-list">
                                    ${categoryHtml || '<div class="category-item">선택된 강의가 없습니다.</div>'}
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <div class="form-section-title">공유하기</div>
                                <div class="share-section">
                                    <div class="share-input-container">
                                        <input 
                                            type="text" 
                                            id="saveModalShareInput" 
                                            class="share-input" 
                                            placeholder="팀/이름/아이디를 입력하세요 (저장 시 자동 공유)"
                                            autocomplete="off"
                                        />
                                        <div class="share-input-hint">예: 개발팀/김개발/kimdev</div>
                                        <div class="autocomplete-dropdown" id="saveModalAutocompleteDropdown"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="save-modal-right">
                            <div class="form-section">
                                <div class="form-section-title">선택한 강의 요약 (${selectedCount}개)</div>
                                <div class="lecture-summary-table-container">
                                    <table class="lecture-summary-table">
                                        <thead>
                                            <tr>
                                                <th>카테고리</th>
                                                <th>강의명</th>
                                                <th>강의코드</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${lectureListHtml || '<tr><td colspan="3" class="text-center">선택된 강의가 없습니다.</td></tr>'}
                                            ${moreCount > 0 ? `<tr><td colspan="3" class="text-center more-count">외 ${moreCount}개 더...</td></tr>` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="form-section" id="priceMappingLogSection" style="display: none;">
                                <div class="form-section-title">매핑 결과 로그</div>
                                <div class="price-mapping-log-container">
                                    <pre id="priceMappingLog" class="price-mapping-log"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="cancelSaveBtn">취소</button>
                        <button class="btn-confirm" id="confirmSaveBtn" disabled>저장</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 저장 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {number} selectedCount - 선택된 항목 수
     * @param {Object} categoryCounts - 카테고리별 선택 개수
     * @param {Array<Object>} selectedLectures - 선택된 강의 리스트
     */
    static renderSaveModalToDOM(container, selectedCount, categoryCounts, selectedLectures) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 모달 제거
        const existingModal = document.getElementById('saveModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = this.renderSaveModal(selectedCount, categoryCounts, selectedLectures);
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
        const overlay = document.getElementById('saveModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            // 입력 필드에 포커스
            const input = document.getElementById('listNameInput');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('saveModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('saveModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
