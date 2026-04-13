import { CONFIG } from '../config/constants.js';
import { DateFormatter } from '../utils/dateFormatter.js';
import { FilterRenderer } from './filterRenderer.js';

/**
 * 테이블 렌더링 컴포넌트
 */
export class TableRenderer {
    /**
     * 테이블 HTML을 생성합니다.
     * @param {Array<Object>} pageData - 현재 페이지의 데이터
     * @param {number} startIndex - 시작 인덱스 (순번 계산용)
     * @param {Map<string, Object>} bookMap - ISBN을 키로 하는 도서 데이터 맵
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 테이블 HTML 문자열
     */
    static renderTable(pageData, startIndex, bookMap, listInfo = null) {
        const tableHtml = `
            <div class="table-scroll-area">
                <table class="data-table">
                    <thead>
                        ${this.renderTableHeader({}, listInfo)}
                    </thead>
                    <tbody>
                        ${this.renderTableBody(pageData, startIndex, bookMap, listInfo)}
                    </tbody>
                </table>
            </div>
        `;
        
        return tableHtml;
    }
    
    /**
     * 테이블 헤더 HTML을 생성합니다.
     * @param {Object} filterableColumns - 필터 가능한 컬럼 정보 (columnKey: filterable)
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 헤더 HTML 문자열
     */
    static renderTableHeader(filterableColumns = {}, listInfo = null) {
        let headerCells = CONFIG.TABLE_COLUMNS.map(column => {
            if (column.type === 'checkbox') {
                return `<th class="checkbox-cell"><input type="checkbox" id="selectAllCheckbox"></th>`;
            }
            
            // 필터 가능한 컬럼인지 확인
            const isFilterable = this.isFilterableColumn(column.key);
            const filterIcon = isFilterable ? FilterRenderer.renderFilterIcon(column.key) : '';
            
            // 컬럼별 특별 클래스 추가
            const isSettlementColumn = ['정산여부', 'B2C강의코드'].includes(column.key);
            const isIsbnColumn = column.key === 'ISBN';

            const columnClass = [
                isFilterable ? 'filterable-column' : '',
                isSettlementColumn ? 'settlement-column' : '',
                isIsbnColumn ? 'isbn-column' : ''
            ].filter(Boolean).join(' ');
            
            let headerCellHtml = `
                <th class="${columnClass}">
                    <div class="th-content">
                        <span class="th-label">${column.label}</span>
                        ${filterIcon}
                    </div>
                </th>
            `;

            // ISBN 컬럼 뒤에 교재명과 SAP 자재코드 컬럼 추가
            if (column.key === 'ISBN') {
                headerCellHtml += `
                    <th class="book-title-header">
                        <div class="th-content">
                            <span class="th-label">교재명</span>
                        </div>
                    </th>
                    <th class="sap-code-header">
                        <div class="th-content">
                            <span class="th-label">SAP자재코드</span>
                        </div>
                    </th>
                `;
            }
            return headerCellHtml;
        }).join('');
        
        // 리스트 정보가 있을 때 인당과금 금액 컬럼 추가 (계약유형 컬럼 제거)
        if (listInfo && listInfo.contractType === '인당과금') {
            headerCells += `
                <th class="price-header per-person-price-header">
                    <div class="th-content">
                        <span class="th-label">인당과금 (원)</span>
                    </div>
                </th>
            `;
        }
        
        return `<tr>${headerCells}</tr>`;
    }
    
    /**
     * 컬럼이 필터 가능한지 확인합니다.
     * @param {string} columnKey - 컬럼 키
     * @returns {boolean} 필터 가능 여부
     */
    static isFilterableColumn(columnKey) {
        // 체크박스와 순번은 필터링하지 않음
        const nonFilterableKeys = ['checkbox', 'index'];
        return !nonFilterableKeys.includes(columnKey);
    }
    
    /**
     * 테이블 본문 HTML을 생성합니다.
     * @param {Array<Object>} pageData - 현재 페이지의 데이터
     * @param {number} startIndex - 시작 인덱스
     * @param {Map<string, Object>} bookMap - ISBN을 키로 하는 도서 데이터 맵
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 본문 HTML 문자열
     */
    static renderTableBody(pageData, startIndex, bookMap, listInfo = null) {
        const bodyRows = pageData.map((item, index) => {
            return this.renderTableRow(item, startIndex + index, bookMap, listInfo);
        }).join('');
        
        return bodyRows;
    }
    
    /**
     * 테이블 행 HTML을 생성합니다.
     * @param {Object} item - 행 데이터 객체
     * @param {number} rowNumber - 행 번호 (순번)
     * @param {Map<string, Object>} bookMap - ISBN을 키로 하는 도서 데이터 맵
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 행 HTML 문자열
     */
    static renderTableRow(item, rowNumber, bookMap, listInfo = null) {
        const lectureId = this.escapeHtml(item['강의코드'] || '');
        let cellsHtml = '';
        let isbnCellIndex = -1;

        CONFIG.TABLE_COLUMNS.forEach((column, index) => {
            if (column.key === 'ISBN') {
                isbnCellIndex = index;
            }

            if (column.type === 'checkbox') {
                const toggleIcon = `<span class="toggle-icon" data-lecture-id="${lectureId}" title="상세 보기">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                    </svg>
                </span>`;
                cellsHtml += `<td class="checkbox-cell">${toggleIcon}<input type="checkbox" class="row-checkbox" data-lecture-code="${lectureId}"></td>`;
                return;
            }
            
            if (column.key === 'index') {
                cellsHtml += `<td>${rowNumber + 1}</td>`;
                return;
            }
            
            let cellValue = item[column.key] || '';
            
            if (column.type === 'date' && cellValue) {
                cellValue = DateFormatter.format(cellValue);
            }
            
            const alignClass = column.align === 'left' ? 'text-left' : '';
            const isSettlementColumn = ['정산여부', 'B2C강의코드'].includes(column.key);
            const isIsbnColumn = column.key === 'ISBN';
            
            const statusClass = column.key === '강의상태' ? this._getStatusClass(cellValue) : '';

            const cellClass = [
                alignClass,
                isSettlementColumn ? 'settlement-cell' : '',
                isIsbnColumn ? 'isbn-column' : '',
                statusClass
            ].filter(Boolean).join(' ');
            
            cellsHtml += `<td class="${cellClass}">${cellValue}</td>`;

            // ISBN 셀 다음에 교재 정보 셀 추가
            if (column.key === 'ISBN') {
                const isbnsRaw = item['ISBN'];
                const isbns = isbnsRaw ? isbnsRaw.split(',').map(s => s.trim()) : [];
                
                let bookTitles = [];
                let sapCodes = [];

                if (isbns.length > 0) {
                    isbns.forEach(isbn => {
                        const book = bookMap.get(isbn);
                        if (book) {
                            bookTitles.push(this.escapeHtml(book.bookTitle));
                            sapCodes.push(this.escapeHtml(book.sapMaterialCode));
                        } else {
                            bookTitles.push('');
                            sapCodes.push('');
                        }
                    });
                }
                
                cellsHtml += `<td class="book-title-cell">${bookTitles.join('<br>')}</td>`;
                cellsHtml += `<td class="sap-code-cell">${sapCodes.join('<br>')}</td>`;
            }
        });
        
        let colspan = CONFIG.TABLE_COLUMNS.length + 2; // 교재명, SAP자재코드 추가

        // 리스트 정보가 있을 때 인당과금 금액 컬럼 추가
        if (listInfo && listInfo.contractType === '인당과금' && listInfo.priceMap) {
            const lectureCode = item['강의코드'] || '';
            const price = listInfo.priceMap[lectureCode];
            const priceDisplay = price ? price.toLocaleString() : '-';
            cellsHtml += `<td class="price-cell per-person-price-cell">${priceDisplay}</td>`;
            colspan += 1;
        }
        
        const mainRow = `<tr class="b2b-row" data-lecture-id="${lectureId}">${cellsHtml}</tr>`;
        const detailsRow = `
            <tr class="b2c-details-row" style="display: none;" data-details-for="${lectureId}">
                <td colspan="${colspan}">
                    <div class="nested-table-container">
                        <p class="loading-message">로딩 중...</p>
                    </div>
                </td>
            </tr>
        `;
        
        return mainRow + detailsRow;
    }

    /**
     * 강의 상태에 따라 CSS 클래스를 반환합니다.
     * @param {string} status - 강의 상태 문자열
     * @returns {string} CSS 클래스명
     */
    static _getStatusClass(status) {
        switch (status) {
            case '순차오픈중':
                return 'status-sequential-open';
            case '오픈예정':
                return 'status-scheduled-open';
            default:
                return '';
        }
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
     * 테이블을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 테이블을 렌더링할 컨테이너 요소
     * @param {Array<Object>} pageData - 현재 페이지의 데이터
     * @param {number} startIndex - 시작 인덱스
     * @param {Object} filterableColumns - 필터 가능한 컬럼 정보
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     */
    static renderToDOM(container, pageData, startIndex, bookMap, listInfo = null) {
        if (!container) {
            console.error('테이블 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const tableHtml = this.renderTable(pageData, startIndex, bookMap, listInfo);
        container.innerHTML = tableHtml;
    }
}

