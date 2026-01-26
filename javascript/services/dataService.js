import { CONFIG } from '../config/constants.js';
import { RechampService } from './rechampService.js';

/**
 * 데이터 정렬 및 처리 서비스
 */
export class DataService {
    /**
     * 강의 데이터에 settlementType을 매핑합니다.
     * @param {Array<Object>} data - 강의 데이터 배열 (JSON 또는 CSV에서 로드)
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
     * 정렬 순서: 강의생성일(최신순) → 사업부코드 → 카테고리 → 강의명
     * @param {Array<Object>} data - 정렬할 데이터 배열
     * @returns {Array<Object>} 정렬된 데이터 배열
     */
    static sortData(data) {
        const sortedData = [...data];
        
        sortedData.sort((a, b) => {
            // 1순위: 강의생성일 (최신순, 내림차순)
            const dateA = a['강의생성일'];
            const dateB = b['강의생성일'];
            
            if (dateA && dateB) {
                const dateObjA = new Date(dateA);
                const dateObjB = new Date(dateB);
                
                // 유효한 날짜인지 확인
                if (!isNaN(dateObjA.getTime()) && !isNaN(dateObjB.getTime())) {
                    const dateCompare = dateObjB.getTime() - dateObjA.getTime(); // 내림차순 (최신순)
                    if (dateCompare !== 0) {
                        return dateCompare;
                    }
                } else {
                    // 날짜 파싱 실패 시 문자열 비교
                    const dateStrCompare = String(dateB).localeCompare(String(dateA), 'ko');
                    if (dateStrCompare !== 0) {
                        return dateStrCompare;
                    }
                }
            } else if (dateA && !dateB) {
                return -1; // dateA가 있으면 앞으로
            } else if (!dateA && dateB) {
                return 1; // dateB가 있으면 앞으로
            }
            
            // 2순위: 사업부코드
            const deptA = String(a['사업부코드'] || '').trim();
            const deptB = String(b['사업부코드'] || '').trim();
            const deptCompare = deptA.localeCompare(deptB, 'ko');
            if (deptCompare !== 0) {
                return deptCompare;
            }
            
            // 3순위: 카테고리
            const categoryA = String(a['카테고리'] || '').trim();
            const categoryB = String(b['카테고리'] || '').trim();
            const categoryCompare = categoryA.localeCompare(categoryB, 'ko');
            if (categoryCompare !== 0) {
                return categoryCompare;
            }
            
            // 4순위: 강의명
            const titleA = String(a['강의명'] || '').trim();
            const titleB = String(b['강의명'] || '').trim();
            return titleA.localeCompare(titleB, 'ko');
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

