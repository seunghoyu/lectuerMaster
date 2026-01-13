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
     * @param {Object} filterableColumns - 필터 가능한 컬럼 정보
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 테이블 HTML 문자열
     */
    static renderTable(pageData, startIndex, filterableColumns = {}, listInfo = null) {
        const tableHtml = `
            <div class="table-scroll-area">
                <table class="data-table">
                    <thead>
                        ${this.renderTableHeader(filterableColumns, listInfo)}
                    </thead>
                    <tbody>
                        ${this.renderTableBody(pageData, startIndex, listInfo)}
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
                return `<th><input type="checkbox" id="selectAllCheckbox"></th>`;
            }
            
            // 필터 가능한 컬럼인지 확인
            const isFilterable = this.isFilterableColumn(column.key);
            const filterIcon = isFilterable ? FilterRenderer.renderFilterIcon(column.key) : '';
            
            // 정산여부 컬럼에 특별한 클래스 추가
            const isSettlementColumn = column.key === '정산여부';
            const columnClass = [
                isFilterable ? 'filterable-column' : '',
                isSettlementColumn ? 'settlement-column' : ''
            ].filter(Boolean).join(' ');
            
            return `
                <th class="${columnClass}">
                    <div class="th-content">
                        <span class="th-label">${column.label}</span>
                        ${filterIcon}
                    </div>
                </th>
            `;
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
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 본문 HTML 문자열
     */
    static renderTableBody(pageData, startIndex, listInfo = null) {
        const bodyRows = pageData.map((item, index) => {
            return this.renderTableRow(item, startIndex + index, listInfo);
        }).join('');
        
        return bodyRows;
    }
    
    /**
     * 테이블 행 HTML을 생성합니다.
     * @param {Object} item - 행 데이터 객체
     * @param {number} rowNumber - 행 번호 (순번)
     * @param {Object} listInfo - 리스트 정보 (계약유형, priceMap 등)
     * @returns {string} 행 HTML 문자열
     */
    static renderTableRow(item, rowNumber, listInfo = null) {
        let cells = CONFIG.TABLE_COLUMNS.map(column => {
            if (column.type === 'checkbox') {
                const compareBtn = `<button class="btn-compare" data-lecture-code="${this.escapeHtml(item['강의코드'] || '')}" data-b2c-code="${this.escapeHtml(item['B2C강의코드'] || '')}" title="데이터 비교">
                    <i class="fa-solid fa-ellipsis-vertical"></i>
                </button>`;
                return `<td><input type="checkbox" class="row-checkbox" data-lecture-code="${this.escapeHtml(item['강의코드'] || '')}">${compareBtn}</td>`;
            }
            
            if (column.key === 'index') {
                return `<td>${rowNumber + 1}</td>`;
            }
            
            let cellValue = item[column.key] || '';
            
            // 날짜 필드인 경우 포맷팅
            if (column.type === 'date' && cellValue) {
                cellValue = DateFormatter.format(cellValue);
            }
            
            const alignClass = column.align === 'left' ? 'text-left' : '';
            const isSettlementColumn = column.key === '정산여부';
            const cellClass = [
                alignClass,
                isSettlementColumn ? 'settlement-cell' : ''
            ].filter(Boolean).join(' ');
            
            return `<td class="${cellClass}">${cellValue}</td>`;
        }).join('');
        
        // 리스트 정보가 있을 때 인당과금 금액 셀 추가 (계약유형 셀 제거)
        if (listInfo && listInfo.contractType === '인당과금' && listInfo.priceMap) {
            const lectureCode = item['강의코드'] || '';
            const price = listInfo.priceMap[lectureCode];
            const priceDisplay = price ? price.toLocaleString() : '-';
            cells += `<td class="price-cell per-person-price-cell">${priceDisplay}</td>`;
        }
        
        return `<tr>${cells}</tr>`;
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
    static renderToDOM(container, pageData, startIndex, filterableColumns = {}, listInfo = null) {
        if (!container) {
            console.error('테이블 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const tableHtml = this.renderTable(pageData, startIndex, filterableColumns, listInfo);
        container.innerHTML = tableHtml;
    }
}

