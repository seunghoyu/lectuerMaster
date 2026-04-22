import { StorageService } from '../services/storageService.js';
import { DateFormatter } from '../utils/dateFormatter.js';

/**
 * 대시보드 렌더링 컴포넌트
 */
export class DashboardRenderer {
    /**
     * 대시보드 HTML을 생성합니다.
     * @param {Array<Object>} lists - 리스트 배열 (통계 정보 포함)
     * @returns {string} 대시보드 HTML 문자열
     */
    static render(lists = []) {
        if (lists.length === 0) {
            return `
                <div class="dashboard-empty">
                    <i class="fa-solid fa-folder-open"></i>
                    <h3>저장된 리스트가 없습니다</h3>
                    <p>강의를 선택하고 저장하여 리스트를 만들어보세요.</p>
                    <button class="btn-go-to-b2b" onclick="window.appInstance?.showAllLectures()">
                        <i class="fa-solid fa-clipboard-list"></i> B2B 강의리스트로 이동
                    </button>
                </div>
            `;
        }
        
        const cardsHtml = lists.map(list => {
            const categoryItems = list.categoryDistribution 
                ? Object.entries(list.categoryDistribution)
                    .map(([category, count]) => `<span class="category-tag">${category}: ${count}개</span>`)
                    .join('')
                : '';
            
            const sharedInfo = list.sharedCount > 0 
                ? `<div class="card-shared-info"><i class="fa-solid fa-share-nodes"></i> ${list.sharedCount}명과 공유 중</div>`
                : '';
            
            // 계약유형 정보 표시
            const contractType = list.contractType || '턴키';
            const contractTypeClass = contractType === '인당과금' ? 'per-person-contract' : '';
            const contractTypeDisplay = contractType === '인당과금' 
                ? `<span class="contract-type-badge per-person-badge"><i class="fa-solid fa-dollar-sign"></i> ${contractType}</span>`
                : `<span class="contract-type-badge">${contractType}</span>`;
            
            // 인당과금일 경우 금액 정보 요약
            let priceSummaryHtml = '';
            if (contractType === '인당과금' && list.priceMap && Object.keys(list.priceMap).length > 0) {
                const prices = Object.values(list.priceMap);
                const totalPrice = prices.reduce((sum, price) => sum + (price || 0), 0);
                const avgPrice = prices.length > 0 ? Math.round(totalPrice / prices.length) : 0;
                const minPrice = Math.min(...prices);
                const maxPrice = Math.max(...prices);
                
                priceSummaryHtml = `
                    <div class="card-price-summary">
                        <div class="price-summary-item">
                            <span class="price-label">평균:</span>
                            <span class="price-value">${avgPrice.toLocaleString()}원</span>
                        </div>
                        <div class="price-summary-item">
                            <span class="price-label">범위:</span>
                            <span class="price-value">${minPrice.toLocaleString()} ~ ${maxPrice.toLocaleString()}원</span>
                        </div>
                    </div>
                `;
            }
            
            return `
                <div class="dashboard-card ${contractTypeClass}" data-list-name="${list.name}">
                    <div class="card-header">
                        <h3 class="card-title">${list.name}</h3>
                        ${sharedInfo}
                    </div>
                    <div class="card-body">
                        <div class="card-stat">
                            <i class="fa-solid fa-book"></i>
                            <span>${list.lectureCount}개 강의</span>
                        </div>
                        <div class="card-contract-type">
                            ${contractTypeDisplay}
                        </div>
                        ${priceSummaryHtml}
                        <div class="card-dates">
                            <div class="card-date-item">
                                <span class="date-label">생성:</span>
                                <span class="date-value">${list.createdAt}</span>
                            </div>
                            <div class="card-date-item">
                                <span class="date-label">수정:</span>
                                <span class="date-value">${list.updatedAt}</span>
                            </div>
                        </div>
                        ${categoryItems ? `
                            <div class="card-categories">
                                ${categoryItems}
                            </div>
                        ` : ''}
                    </div>
                    <div class="card-footer">
                    <button class="card-action-btn btn-primary" data-action="open" data-list-name="${list.name}" title="리스트 열기">
                        <i class="fa-solid fa-folder-open"></i> 열기
                    </button>
                    <button class="card-action-btn btn-secondary" data-action="share" data-list-name="${list.name}" title="공유하기">
                        <i class="fa-solid fa-share-nodes"></i> 공유
                    </button>
                    <button class="card-action-btn btn-secondary" data-action="sharedUsers" data-list-name="${list.name}" title="공유현황">
                        <i class="fa-solid fa-users"></i> 공유현황
                    </button>
                    <button class="card-action-btn btn-danger" data-action="delete" data-list-name="${list.name}" title="리스트 삭제">
                        <i class="fa-solid fa-trash"></i> 삭제
                    </button>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="dashboard-container">
                <div class="dashboard-grid">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * 리스트 통계 정보를 계산합니다.
     * @param {Object} list - 리스트 객체
     * @param {Array<Object>} lectureData - 전체 강의 데이터
     * @returns {Object} 통계 정보가 포함된 리스트 객체
     */
    static calculateListStats(list, lectureData) {
        const lectureCodesSet = new Set(list.lectureCodes || []);
        
        // 해당 리스트에 포함된 강의들 필터링
        const listLectures = lectureData.filter(lecture => 
            lectureCodesSet.has(lecture['강의코드'])
        );
        
        // 카테고리별 개수 계산
        const categoryDistribution = {};
        listLectures.forEach(lecture => {
            const category = lecture['카테고리'] || '미분류';
            categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
        });
        
        // 공유된 사람 수 계산
        const sharedWithList = StorageService.getSharedWithList(list.name);
        const sharedCount = sharedWithList.length;
        
        // 날짜 포맷팅
        const createdAt = list.createdAt 
            ? DateFormatter.formatDate(new Date(list.createdAt), 'YYYY-MM-DD HH:mm')
            : '알 수 없음';
        
        const updatedAt = list.updatedAt 
            ? DateFormatter.formatDate(new Date(list.updatedAt), 'YYYY-MM-DD HH:mm')
            : '알 수 없음';
        
        return {
            name: list.name,
            lectureCount: list.lectureCodes?.length || 0,
            createdAt,
            updatedAt,
            categoryDistribution,
            sharedCount,
            lectureCodes: list.lectureCodes,
            contractType: list.contractType || '턴키', // 계약유형 추가
            priceMap: list.priceMap || {} // 인당과금 금액 매핑 추가
        };
    }
    
    /**
     * 대시보드를 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 대시보드를 렌더링할 컨테이너 요소
     * @param {Array<Object>} lectureData - 전체 강의 데이터
     */
    static renderToDOM(container, lectureData) {
        if (!container) {
            console.error('대시보드 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 저장된 모든 리스트 가져오기
        const allLists = StorageService.loadAllLists();
        
        // 각 리스트에 통계 정보 추가
        const listsWithStats = allLists.map(list => 
            this.calculateListStats(list, lectureData)
        ).sort((a, b) => {
            // 최신 수정일 순으로 정렬
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        const dashboardHtml = this.render(listsWithStats);
        container.innerHTML = dashboardHtml;
        
        // 카드 이벤트 바인딩
        this.bindCardEvents(container);
    }
    
    /**
     * 카드 이벤트를 바인딩합니다.
     * @param {HTMLElement} container - 대시보드 컨테이너
     */
    static bindCardEvents(container) {
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.dashboard-card');
            if (!card) return;
            
            const actionBtn = e.target.closest('.card-action-btn');
            
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const listName = actionBtn.dataset.listName || card.dataset.listName;
                
                if (action === 'open') {
                    // 리스트 열기
                    if (window.appInstance) {
                        window.appInstance.loadSavedList(listName);
                    }
                } else if (action === 'share') {
                    // 공유하기
                    if (window.appInstance) {
                        window.appInstance.showShareModal(listName);
                    }
                } else if (action === 'sharedUsers') {
                    // 공유현황(누구와 공유했는지)
                    if (window.appInstance) {
                        window.appInstance.showSharedUsersModal(listName);
                    }
                } else if (action === 'delete') {
                    // 삭제하기
                    if (window.appInstance) {
                        window.appInstance.deleteList(listName);
                        // 삭제 후 대시보드 새로고침
                        setTimeout(() => {
                            const workspace = document.querySelector('.workspace');
                            if (workspace && window.appInstance) {
                                window.appInstance.renderDashboard();
                            }
                        }, 100);
                    }
                }
            } else {
                // 카드 클릭 시 리스트 열기
                const listName = card.dataset.listName;
                if (listName && window.appInstance) {
                    window.appInstance.loadSavedList(listName);
                }
            }
        });
    }
}
