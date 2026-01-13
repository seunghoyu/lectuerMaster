/**
 * 데이터 비교 모달 렌더링 컴포넌트
 */
export class CompareModalRenderer {
    /**
     * 비교 모달 HTML을 생성합니다.
     * @param {Object} b2bData - B2B 강의 데이터
     * @param {Object} rechampData - Rechamp 강의 데이터
     * @returns {string} 모달 HTML 문자열
     */
    static render(b2bData, rechampData) {
        const b2bHtml = this.renderB2BSection(b2bData);
        const rechampHtml = this.renderRechampSection(rechampData);
        
        return `
            <div class="modal-overlay compare-modal-overlay" id="compareModalOverlay">
                <div class="modal-content compare-modal-content">
                    <div class="modal-header">
                        <h2>데이터 비교</h2>
                        <button class="modal-close" id="closeCompareModal">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="modal-body compare-modal-body">
                        <div class="compare-split-view">
                            <div class="compare-section compare-section-b2b">
                                <h3 class="compare-section-title">B2B 강의 데이터</h3>
                                ${b2bHtml}
                            </div>
                            <div class="compare-section compare-section-rechamp">
                                <h3 class="compare-section-title">Rechamp 강의 데이터</h3>
                                ${rechampHtml}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-close" id="closeCompareModalBtn">닫기</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * B2B 섹션 HTML을 생성합니다.
     * @param {Object} data - B2B 데이터
     * @returns {string} B2B 섹션 HTML
     */
    static renderB2BSection(data) {
        if (!data) {
            return '<div class="compare-empty">데이터가 없습니다.</div>';
        }
        
        // 필드를 그룹별로 정렬 (비교를 위해 Rechamp와 매칭)
        const fieldGroups = [
            {
                group: 'basic',
                color: 'group-basic',
                fields: [
                    { key: '강의명', label: '강의명' },
                    { key: '강의코드', label: '강의코드' }
                ]
            },
            {
                group: 'category',
                color: 'group-category',
                fields: [
                    { key: '카테고리', label: '카테고리' },
                    { key: '사업부코드', label: '사업부코드' }
                ]
            },
            {
                group: 'instructor',
                color: 'group-instructor',
                fields: [
                    { key: '강사명', label: '강사명' }
                ]
            },
            {
                group: 'price',
                color: 'group-price',
                fields: [
                    { key: '강의정가', label: '강의정가' },
                    { key: '교재정가', label: '교재정가' }
                ]
            },
            {
                group: 'type',
                color: 'group-type',
                fields: [
                    { key: '자체/외부강의', label: '자체/외부강의' }
                ]
            },
            {
                group: 'other',
                color: 'group-other',
                fields: [
                    { key: '교재명', label: '교재명' },
                    { key: '강의상태', label: '강의상태' },
                    { key: 'B2C강의코드', label: 'B2C강의코드' },
                    { key: '동영상주소(B2B)', label: '동영상주소(B2B)' }
                ]
            }
        ];
        
        let html = '';
        fieldGroups.forEach(group => {
            html += `
                <div class="compare-field-group ${group.color}">
                    ${group.fields.map(field => {
                        const value = data[field.key] || '';
                        const displayValue = value === '' ? '-' : value;
                        return `
                            <div class="compare-data-item">
                                <div class="compare-data-label">${field.label}</div>
                                <div class="compare-data-value">${this.escapeHtml(displayValue)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });
        
        return `<div class="compare-data-list">${html}</div>`;
    }
    
    /**
     * Rechamp 섹션 HTML을 생성합니다.
     * @param {Object} data - Rechamp 데이터
     * @returns {string} Rechamp 섹션 HTML
     */
    static renderRechampSection(data) {
        if (!data) {
            return '<div class="compare-empty">데이터가 없습니다.</div>';
        }
        
        // 필드를 그룹별로 정렬 (B2B와 매칭)
        const fieldGroups = [
            {
                group: 'basic',
                color: 'group-basic',
                fields: [
                    { key: 'lectureTitle', label: '강의명' },
                    { key: 'lectureCode', label: '강의코드' }
                ]
            },
            {
                group: 'category',
                color: 'group-category',
                fields: [
                    { key: 'category1', label: '분류1' },
                    { key: 'category2', label: '분류2' },
                    { key: 'category3', label: '분류3' },
                    { key: 'category4', label: '분류4' }
                ]
            },
            {
                group: 'instructor',
                color: 'group-instructor',
                fields: [
                    { key: 'instructor', label: '선생님' }
                ]
            },
            {
                group: 'price',
                color: 'group-price',
                fields: [
                    { key: 'retailPrice', label: '시가' },
                    { key: 'costPrice', label: '원가' }
                ]
            },
            {
                group: 'type',
                color: 'group-type',
                fields: [
                    { key: 'lectureSource', label: '입점강의' }
                ]
            },
            {
                group: 'other',
                color: 'group-other',
                fields: [
                    { key: 'description', label: '상세정보' },
                    { key: 'settlementType', label: '정산방법' }
                ]
            }
        ];
        
        let html = '';
        fieldGroups.forEach(group => {
            html += `
                <div class="compare-field-group ${group.color}">
                    ${group.fields.map(field => {
                        const value = data[field.key] || '';
                        let displayValue = value === '' ? '-' : value;
                        
                        // 숫자 필드는 포맷팅
                        if ((field.key === 'costPrice' || field.key === 'retailPrice') && value !== '' && !isNaN(value)) {
                            displayValue = parseInt(value).toLocaleString();
                        }
                        
                        return `
                            <div class="compare-data-item">
                                <div class="compare-data-label">${field.label}</div>
                                <div class="compare-data-value">${this.escapeHtml(displayValue)}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });
        
        return `<div class="compare-data-list">${html}</div>`;
    }
    
    /**
     * HTML 이스케이프
     * @param {string} text - 이스케이프할 텍스트
     * @returns {string} 이스케이프된 텍스트
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 비교 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {Object} b2bData - B2B 강의 데이터
     * @param {Object} rechampData - Rechamp 강의 데이터
     */
    static renderToDOM(container, b2bData, rechampData) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const modalHtml = this.render(b2bData, rechampData);
        container.innerHTML = modalHtml;
    }
    
    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('compareModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
            // body 스크롤만 막기 (배경은 보이도록)
            document.body.style.overflow = 'hidden';
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('compareModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('compareModalOverlay');
        if (overlay) {
            overlay.remove();
            // body overflow 복원
            document.body.style.overflow = '';
        }
    }
}
