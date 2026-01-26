/**
 * 데이터 비교 모달 렌더링 컴포넌트
 */
export class CompareModalRenderer {
    /**
     * 비교 모달 HTML을 생성합니다.
     * @param {Object} b2bData - B2B 강의 데이터
     * @param {Object} rechampData - Rechamp 강의 데이터
     * @param {Object} champData - 챔프강의창 데이터
     * @param {Object} unifiedLcmsData - 통합 LCMS 데이터
     * @returns {string} 모달 HTML 문자열
     */
    static render(b2bData, rechampData, champData, unifiedLcmsData) {
        const b2bHtml = this.renderB2BSection(b2bData);
        const rechampHtml = this.renderRechampSection(rechampData);
        const champHtml = this.renderChampSection(champData);
        const unifiedLcmsHtml = this.renderUnifiedLcmsSection(unifiedLcmsData);
        
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
                        <div class="compare-split-view-4">
                            <div class="compare-section compare-section-b2b">
                                <h3 class="compare-section-title">B2B 강의 데이터</h3>
                                ${b2bHtml}
                            </div>
                            <div class="compare-section compare-section-rechamp">
                                <h3 class="compare-section-title">Rechamp 데이터</h3>
                                ${rechampHtml}
                            </div>
                            <div class="compare-section compare-section-champ">
                                <h3 class="compare-section-title">챔프강의창 데이터</h3>
                                ${champHtml}
                            </div>
                            <div class="compare-section compare-section-lcms">
                                <h3 class="compare-section-title">통합LCMS 데이터</h3>
                                ${unifiedLcmsHtml}
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
     * 공통 섹션 렌더링 헬퍼
     * @param {Object} data - 렌더링할 데이터
     * @param {Array<Object>} fieldGroups - 필드 그룹 설정
     * @returns {string} 섹션 HTML
     */
    static renderSection(data, fieldGroups) {
        if (!data) {
            return '<div class="compare-empty">데이터가 없습니다.</div>';
        }

        let bodyHtml = '';
        fieldGroups.forEach(group => {
            const fieldsInGroup = group.fields.filter(field => data[field.key] !== undefined && data[field.key] !== null);
            if (fieldsInGroup.length === 0) return;

            bodyHtml += `<tbody class="compare-field-group ${group.color}">`;
            fieldsInGroup.forEach(field => {
                const value = data[field.key];
                let displayValue = (value === '' || value === null) ? '-' : value;

                // 특정 필드 포맷팅
                if (field.formatter) {
                    displayValue = field.formatter(displayValue);
                }

                bodyHtml += `
                    <tr>
                        <th>${field.label}</th>
                        <td>${this.escapeHtml(displayValue)}</td>
                    </tr>
                `;
            });
            bodyHtml += `</tbody>`;
        });

        return `<table class="compare-data-table">${bodyHtml}</table>`;
    }
    
    /**
     * B2B 섹션 HTML을 생성합니다.
     * @param {Object} data - B2B 데이터
     * @returns {string} B2B 섹션 HTML
     */
    static renderB2BSection(data) {
        const fieldGroups = [
            {
                group: 'basic', color: 'group-basic', fields: [
                    { key: '강의명', label: '강의명' },
                    { key: '강의코드', label: '강의코드' }
                ]
            },
            {
                group: 'category', color: 'group-category', fields: [
                    { key: '카테고리', label: '카테고리' },
                    { key: '사업부코드', label: '사업부코드' }
                ]
            },
            {
                group: 'instructor', color: 'group-instructor', fields: [
                    { key: '강사명', label: '강사명' }
                ]
            },
            {
                group: 'price', color: 'group-price', fields: [
                    { key: '강의정가', label: '강의정가' },
                    { key: '교재정가', label: '교재정가' }
                ]
            },
            {
                group: 'type', color: 'group-type', fields: [
                    { key: '자체/외부강의', label: '자체/외부강의' }
                ]
            },
            {
                group: 'other', color: 'group-other', fields: [
                    { key: '교재명', label: '교재명' },
                    { key: '강의상태', label: '강의상태' },
                    { key: 'B2C강의코드', label: 'B2C강의코드' },
                    { key: '동영상주소(B2B)', label: '동영상주소(B2B)' }
                ]
            },
            {
                group: 'settlement', color: 'group-settlement', fields: [
                    { key: 'confirmedSettlementStatus', label: '확정 정산방법' }
                ]
            }
        ];

        return this.renderSection(data, fieldGroups);
    }
    
    /**
     * Rechamp 섹션 HTML을 생성합니다.
     * @param {Object} data - Rechamp 데이터
     * @returns {string} Rechamp 섹션 HTML
     */
    static renderRechampSection(data) {
        const fieldGroups = [
            {
                group: 'basic', color: 'group-basic', fields: [
                    { key: 'lectureTitle', label: '강의명' },
                    { key: 'lectureCode', label: '강의코드' }
                ]
            },
            {
                group: 'category', color: 'group-category', fields: [
                    { key: 'category1', label: '분류1' },
                    { key: 'category2', label: '분류2' },
                    { key: 'category3', label: '분류3' },
                    { key: 'category4', label: '분류4' }
                ]
            },
            {
                group: 'instructor', color: 'group-instructor', fields: [
                    { key: 'instructor', label: '선생님' }
                ]
            },
            {
                group: 'price', color: 'group-price', fields: [
                    { key: 'retailPrice', label: '시가', formatter: val => isNaN(parseInt(val)) ? val : parseInt(val).toLocaleString() },
                    { key: 'costPrice', label: '원가', formatter: val => isNaN(parseInt(val)) ? val : parseInt(val).toLocaleString() }
                ]
            },
            {
                group: 'type', color: 'group-type', fields: [
                    { key: 'lectureSource', label: '입점강의' }
                ]
            },
            {
                group: 'other', color: 'group-other', fields: [
                    { key: 'description', label: '상세정보' },
                    { key: 'settlementType', label: '정산방법' },
                    { key: 'skinId', label: 'skinID' }
                ]
            }
        ];
        
        return this.renderSection(data, fieldGroups);
    }

    /**
     * 챔프강의창 섹션 HTML을 생성합니다.
     * @param {Object} data - 챔프강의창 데이터
     * @returns {string} 챔프강의창 섹션 HTML
     */
    static renderChampSection(data) {
        const fieldGroups = [
            {
                group: 'basic', color: 'group-basic', fields: [
                    { key: 'champLectureTitle', label: '강의명' },
                    { key: 'adminLectureCode', label: '어드민 강의코드' },
                    { key: 'adminLectureTitle', label: '어드민 강의명' },
                    { key: 'serviceCategory', label: '서비스 분류' }
                ]
            },
            {
                group: 'category', color: 'group-category', fields: [
                    { key: 'categoryMain', label: '메인 분류' }
                ]
            },
            {
                group: 'status', color: 'group-status', fields: [
                    { key: 'status', label: '상태' },
                    { key: 'usageStatus', label: '사용 상태' },
                    { key: 'autoUpdate', label: '자동 업데이트' }
                ]
            },
            {
                group: 'info', color: 'group-info', fields: [
                    { key: 'lectureCountText', label: '강의 수' },
                    { key: 'createdAt', label: '생성일' }
                ]
            }
        ];

        return this.renderSection(data, fieldGroups);
    }

    /**
     * 통합 LCMS 섹션 HTML을 생성합니다.
     * @param {Object} data - 통합 LCMS 데이터
     * @returns {string} 통합 LCMS 섹션 HTML
     */
    static renderUnifiedLcmsSection(data) {
        const fieldGroups = [
            { 
                group: 'basic', color: 'group-basic', fields: [
                    { key: 'lectureId', label: '강좌코드' },
                    { key: 'lectureTitle', label: '강좌명' }
                ] 
            },
            {
                group: 'category', color: 'group-category', fields: [
                    { key: 'categoryLevel1', label: 'Level 1' },
                    { key: 'categoryLevel2', label: 'Level 2' },
                    { key: 'categoryLevel3', label: 'Level 3' },
                    { key: 'categoryLevel4', label: 'Level 4' }
                ]
            },
            {
                group: 'info', color: 'group-info', fields: [
                    { key: 'lectureCount', label: '강의수' },
                    { key: 'durationDays', label: '수강일수' },
                    { key: 'createdAt', label: '등록일', formatter: val => new Date(val).toLocaleString('ko-KR') },
                ]
            },
            {
                group: 'instructor', color: 'group-instructor', fields: [
                    { key: 'instructors', label: '선생님', formatter: val => Array.isArray(val) ? val.join(', ') : val },
                ]
            },
            {
                group: 'price', color: 'group-price', fields: [
                    { key: 'price', label: '강좌정가', formatter: val => isNaN(parseInt(val)) ? val : parseInt(val).toLocaleString() },
                    { key: 'companyCode', label: '강의 수수료 정산 대상 업체' }
                ]
            },
            {
                group: 'other', color: 'group-other', fields: [
                    { key: 'lectureSource', label: '강좌 제작 주체' },
                    { key: 'bookUid', label: '연결 교재' }
                ]
            }
        ];
        return this.renderSection(data, fieldGroups);
    }
    
    /**
     * HTML 이스케이프
     * @param {string} text - 이스케이프할 텍스트
     * @returns {string} 이스케이프된 텍스트
     */
    static escapeHtml(text) {
        if (text === undefined || text === null) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }
    
    /**
     * 비교 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {Object} b2bData - B2B 강의 데이터
     * @param {Object} rechampData - Rechamp 강의 데이터
     * @param {Object} champData - 챔프강의창 데이터
     * @param {Object} unifiedLcmsData - 통합 LCMS 데이터
     */
    static renderToDOM(container, b2bData, rechampData, champData, unifiedLcmsData) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 이전 모달이 있다면 제거
        const existingModal = document.getElementById('compareModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = this.render(b2bData, rechampData, champData, unifiedLcmsData);
        container.insertAdjacentHTML('beforeend', modalHtml);
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
