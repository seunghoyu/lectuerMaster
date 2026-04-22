/**
 * 강의코드로 등록하기 모달 렌더링 컴포넌트
 */
export class RegisterByCodeModalRenderer {
    /**
     * 모달 HTML을 생성합니다.
     * @returns {string} 모달 HTML 문자열
     */
    static render() {
        return `
            <div class="modal-overlay" id="registerByCodeModalOverlay">
                <div class="modal-container" style="max-width: 1200px;">
                    <div class="modal-header">
                        <h2>
                            <i class="fa-solid fa-plus"></i>
                            강의코드로 등록하기
                        </h2>
                        <button class="modal-close-btn" id="closeRegisterByCodeModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="modal-body-left">
                            <div class="form-section form-section-first">
                                <div class="form-group">
                                    <label for="registerListNameInput" class="form-label">
                                        <i class="fa-solid fa-file-lines"></i>
                                        리스트명
                                    </label>
                                    <input 
                                        type="text" 
                                        id="registerListNameInput" 
                                        class="form-input" 
                                        placeholder="리스트 이름을 입력하세요"
                                        autocomplete="off"
                                    />
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <div class="form-group">
                                    <label for="registerLectureCodesInput" class="form-label">
                                        <i class="fa-solid fa-code"></i>
                                        강의코드
                                    </label>
                                    <div class="form-help-text">
                                        <p><strong>※ 강의코드만 입력하면, 해당 코드를 기준으로 내 강의리스트가 만들어집니다.</strong></p>
                                        <p>• 줄띄움 기준으로 추가됩니다.</p>
                                        <p>• 공백이나 큰따움표 등이 있는 경우에는 자동으로 제거되어 인식됩니다.</p>
                                    </div>
                                    <textarea 
                                        id="registerLectureCodesInput" 
                                        class="form-textarea code-input" 
                                        rows="10"
                                        placeholder="강의코드를 입력해주세요.&#10;&#10;예시:&#10;Ch_L_00003146&#10;Ch_L_00003148&#10;Ch_L_00003149"
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div class="form-section">
                                <div class="form-section-title">계약유형 <span class="required">*</span></div>
                                <div class="contract-type-group">
                                    <label class="contract-type-option">
                                        <input type="radio" name="registerContractType" value="턴키" checked>
                                        <span>턴키</span>
                                    </label>
                                    <label class="contract-type-option">
                                        <input type="radio" name="registerContractType" value="인당과금">
                                        <span>인당과금</span>
                                    </label>
                                    <label class="contract-type-option">
                                        <input type="radio" name="registerContractType" value="개별결제">
                                        <span>개별결제</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-section price-mapping-section" id="registerPriceMappingSection" style="display: none;">
                                <div class="form-section-title">인당과금 금액 매핑</div>
                                <div class="form-help-text">
                                    <p>엑셀에서 복사한 강의코드와 금액 데이터를 붙여넣어주세요.</p>
                                    <p><strong>예시:</strong></p>
                                    <pre><code>Ch_L_00046539	30,000
Ch_L_00001262	23,000</code></pre>
                                    <p>* 한 줄에 하나의 매핑이 들어와야 합니다.</p>
                                    <p>* 탭(Tab) 또는 공백으로 구분됩니다.</p>
                                    <p>* 금액은 숫자만 인식하며, 쉼표(,)는 자동으로 제거됩니다.</p>
                                </div>
                            <textarea
                                id="registerPriceMappingInput"
                                class="form-input form-textarea price-mapping-input"
                                placeholder="강의코드와 금액을 입력하세요 (예: Ch_L_00001234 10000)"
                                rows="8"
                            ></textarea>
                            <div class="inline-action-row">
                                <button type="button" class="btn-execute" id="executeRegisterPriceMappingBtn">
                                    <i class="fa-solid fa-play"></i> 실행
                                </button>
                                <span id="registerPriceMappingStatus" class="inline-status" aria-live="polite"></span>
                            </div>
                            </div>
                            
                            <div class="form-section">
                                <div class="form-group">
                                    <label for="registerShareInput" class="form-label">
                                        <i class="fa-solid fa-share-nodes"></i>
                                        공유하기 (선택사항)
                                    </label>
                                    <input 
                                        type="text" 
                                        id="registerShareInput" 
                                        class="form-input" 
                                        placeholder="팀/이름/아이디 형식으로 입력하세요"
                                        autocomplete="off"
                                    />
                                    <div id="registerAutocompleteDropdown" class="autocomplete-dropdown"></div>
                                </div>
                            </div>
                            
                            <div class="form-section" id="registerResultSection" style="display: none;">
                                <label class="form-label">
                                    <i class="fa-solid fa-terminal"></i>
                                    실행 결과
                                </label>
                                <div class="result-log-container">
                                    <pre class="result-log" id="registerResultLog"></pre>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-body-right">
                            <div class="form-section price-mapping-log-section" id="registerPriceMappingLogSection" style="display: none;">
                                <div class="form-section-title">매핑 결과 로그</div>
                                <div class="result-log-container">
                                    <pre id="registerPriceMappingLog" class="result-log"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-secondary" id="cancelRegisterBtn">
                            <i class="fa-solid fa-times"></i> 취소
                        </button>
                        <button class="btn-primary" id="confirmRegisterBtn">
                            <i class="fa-solid fa-play"></i> 실행
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     */
    static renderToDOM(container) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const modalElement = document.createElement('div');
        modalElement.innerHTML = this.render();
        const modalNode = modalElement.firstElementChild;
        
        container.appendChild(modalNode);
    }
    
    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('registerByCodeModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            // 입력 필드에 포커스
            setTimeout(() => {
                const listNameInput = document.getElementById('registerListNameInput');
                if (listNameInput) {
                    listNameInput.focus();
                }
            }, 100);
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('registerByCodeModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('registerByCodeModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    /**
     * 결과 로그를 업데이트합니다.
     * @param {string} logText - 로그 텍스트
     */
    static updateResultLog(logText) {
        const resultSection = document.getElementById('registerResultSection');
        const resultLog = document.getElementById('registerResultLog');
        
        if (resultSection && resultLog) {
            resultSection.style.display = 'block';
            resultLog.textContent = logText;
            
            // 스크롤을 맨 아래로
            resultLog.scrollTop = resultLog.scrollHeight;
        }
    }
    
    /**
     * 자동완성 드롭다운을 업데이트합니다.
     * @param {Array<Object>} users - 사용자 배열
     * @param {string} query - 검색 쿼리
     * @param {number} selectedIndex - 선택된 인덱스
     */
    static updateAutocomplete(users, query, selectedIndex, allUsers = null) {
        const dropdown = document.getElementById('registerAutocompleteDropdown');
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
}
