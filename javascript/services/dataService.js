import { CONFIG } from '../config/constants.js';
import { RechampService } from './rechampService.js';

/**
 * 데이터 정렬 및 처리 서비스
 */
export class DataService {
    /**
     * CSV 데이터에 settlementType을 매핑합니다.
     * @param {Array<Object>} data - CSV 데이터 배열
     * @returns {Array<Object>} settlementType이 추가된 데이터 배열
     */
    static mapSettlementType(data) {
        return data.map(item => {
            const b2cCode = item['B2C강의코드'];
            const settlementType = RechampService.getSettlementType(b2cCode);
            
            // 정산여부 필드 추가
            return {
                ...item,
                '정산여부': settlementType || ''
            };
        });
    }
    /**
     * 데이터를 기본 정렬 기준에 따라 정렬합니다.
     * @param {Array<Object>} data - 정렬할 데이터 배열
     * @returns {Array<Object>} 정렬된 데이터 배열
     */
    static sortData(data) {
        const sortedData = [...data];
        const sortField = CONFIG.DEFAULT_SORT_FIELD;
        const sortOrder = CONFIG.DEFAULT_SORT_ORDER;
        
        sortedData.sort((a, b) => {
            const valueA = a[sortField];
            const valueB = b[sortField];
            
            // 날짜 필드인 경우 Date 객체로 변환하여 비교
            if (sortField === '강의생성일') {
                const dateA = new Date(valueA);
                const dateB = new Date(valueB);
                
                if (sortOrder === 'desc') {
                    return dateB - dateA;
                } else {
                    return dateA - dateB;
                }
            }
            
            // 문자열 필드인 경우
            if (sortOrder === 'desc') {
                return valueB.localeCompare(valueA);
            } else {
                return valueA.localeCompare(valueB);
            }
        });
        
        return sortedData;
    }
    
    /**
     * 페이지네이션을 위한 데이터 슬라이싱
     * @param {Array<Object>} data - 전체 데이터 배열
     * @param {number} pageNumber - 페이지 번호 (1부터 시작)
     * @param {number} itemsPerPage - 페이지당 항목 수
     * @returns {Array<Object>} 해당 페이지의 데이터 배열
     */
    static getPageData(data, pageNumber, itemsPerPage) {
        const startIndex = (pageNumber - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
    }
    
    /**
     * 전체 페이지 수 계산
     * @param {number} totalItems - 전체 항목 수
     * @param {number} itemsPerPage - 페이지당 항목 수
     * @returns {number} 전체 페이지 수
     */
    static calculateTotalPages(totalItems, itemsPerPage) {
        return Math.ceil(totalItems / itemsPerPage);
    }
}

