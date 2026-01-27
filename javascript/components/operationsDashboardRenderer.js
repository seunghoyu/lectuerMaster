import { TableRenderer } from './tableRenderer.js';
import { PaginationRenderer } from './paginationRenderer.js';
import { PaginationHandler } from '../handlers/paginationHandler.js';
import { DataService } from '../services/dataService.js';

/**
 * 운영 대시보드 렌더링 컴포넌트
 */
export class OperationsDashboardRenderer {
    static currentPage = 1;
    static itemsPerPage = 20;
    static currentData = [];

    /**
     * 대시보드를 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 대시보드를 렌더링할 컨테이너 요소
     * @param {Array<Object>} lectureData - 전체 강의 데이터
     * @param {Array<Object>} unifiedLcmsData - Unified LCMS 데이터
     */
    static renderToDOM(container, lectureData = [], unifiedLcmsData = []) {
        if (!container) {
            console.error('운영 대시보드 컨테이너를 찾을 수 없습니다.');
            return;
        }

        const lecturesWithNoDivision = lectureData.filter(lecture => !lecture['사업부코드']);
        const lecturesWithNoCategory = lectureData.filter(lecture => !lecture['카테고리']);

        // 5년 이상된 강의 계산
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

        const oldB2bLectures = lectureData.filter(lecture => {
            const creationDate = new Date(lecture['강의생성일']);
            return creationDate < fiveYearsAgo;
        });

        const oldB2cLectures = unifiedLcmsData.filter(lecture => {
            const creationDate = new Date(lecture.createdAt);
            return creationDate < fiveYearsAgo;
        });

        const cardsHtml = `
            <div class="operations-dashboard-cards">
                <div class="op-dashboard-card" data-type="no-division">
                    <div class="card-body">
                        <div class="card-stat">
                            <i class="fa-solid fa-building-un"></i>
                            <span>사업부 공란</span>
                        </div>
                        <h3 class="card-title">${lecturesWithNoDivision.length}개</h3>
                    </div>
                </div>
                <div class="op-dashboard-card" data-type="no-category">
                    <div class="card-body">
                        <div class="card-stat">
                            <i class="fa-solid fa-sitemap"></i>
                            <span>카테고리 공란</span>
                        </div>
                        <h3 class="card-title">${lecturesWithNoCategory.length}개</h3>
                    </div>
                </div>
                <div class="op-dashboard-card" data-type="old-b2b">
                    <div class="card-body">
                        <div class="card-stat">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>5년 지난 B2B 강의</span>
                        </div>
                        <h3 class="card-title">${oldB2bLectures.length}개</h3>
                        <p class="card-description">"강의생성일" 기준 5년 초과</p>
                    </div>
                </div>
                <div class="op-dashboard-card" data-type="old-b2c">
                    <div class="card-body">
                        <div class="card-stat">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <span>5년 지난 B2C 연동 강의</span>
                        </div>
                        <h3 class="card-title">${oldB2cLectures.length}개</h3>
                        <p class="card-description">"createdAt" 기준 5년 초과</p>
                    </div>
                </div>
            </div>
            <div id="operationsDashboardTableContainer" class="table-container" style="display: none;"></div>
        `;

        container.innerHTML = `
            <div class="operations-dashboard-container">
                <h2>데이터 모니터링</h2>
                ${cardsHtml}
            </div>
        `;

        this.bindCardEvents(container, {
            'no-division': lecturesWithNoDivision,
            'no-category': lecturesWithNoCategory,
            'old-b2b': oldB2bLectures,
            'old-b2c': oldB2cLectures
        });
    }

    /**
     * 카드에 클릭 이벤트를 바인딩합니다.
     * @param {HTMLElement} container - 대시보드 컨테이너
     * @param {Object} dataMap - 카드 타입과 필터링된 데이터를 매핑한 객체
     */
    static bindCardEvents(container, dataMap) {
        container.querySelectorAll('.op-dashboard-card').forEach(card => {
            card.addEventListener('click', () => {
                const cardType = card.dataset.type;
                this.currentData = dataMap[cardType];
                this.currentPage = 1;
                
                // 모든 카드에서 active 클래스 제거
                container.querySelectorAll('.op-dashboard-card').forEach(c => c.classList.remove('active'));
                // 현재 클릭된 카드에 active 클래스 추가
                card.classList.add('active');

                this.renderTable(this.currentPage);
            });
        });
    }

    /**
     * 데이터를 테이블로 렌더링합니다.
     * @param {number} pageNumber - 렌더링할 페이지 번호
     */
    static renderTable(pageNumber) {
        const tableContainer = document.getElementById('operationsDashboardTableContainer');
        if (!tableContainer) return;

        this.currentPage = pageNumber;
        const data = this.currentData;

        if (data && data.length > 0) {
            tableContainer.style.display = 'block';
            
            const totalPages = DataService.calculateTotalPages(data.length, this.itemsPerPage);
            const pageData = DataService.getPageData(data, this.currentPage, this.itemsPerPage);
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;

            TableRenderer.renderToDOM(tableContainer, pageData, startIndex, new Map(), null);

            const existingPagination = tableContainer.querySelector('.pagination');
            if (existingPagination) existingPagination.remove();

            const paginationContainer = document.createElement('div');
            PaginationRenderer.renderToDOM(paginationContainer, this.currentPage, totalPages);
            tableContainer.appendChild(paginationContainer);

            this.bindPaginationEvents();

        } else {
            tableContainer.style.display = 'none';
            tableContainer.innerHTML = '<p>표시할 데이터가 없습니다.</p>';
        }
    }

    /**
     * 페이지네이션 이벤트를 바인딩합니다.
     */
    static bindPaginationEvents() {
        PaginationHandler.bindEvents((pageNumber) => this.renderTable(pageNumber));
    }
}
