/**
 * 필터 서비스
 * 테이블 필터링 로직 관리
 */
export class FilterService {
    /**
     * 지정된 컬럼의 고윳값을 추출합니다.
     * @param {Array<Object>} data - 전체 데이터
     * @param {string} columnKey - 컬럼 키
     * @returns {Array<string>} 고윳값 배열 (정렬됨)
     */
    static getUniqueValues(data, columnKey) {
        if (!data || data.length === 0) {
            return [];
        }
        
        const values = new Set();
        data.forEach(item => {
            let value = item[columnKey];
            
            // 빈 값 처리
            if (value === null || value === undefined || value === '') {
                value = '';
            } else {
                value = String(value).trim();
            }
            
            values.add(value);
        });
        
        // 정렬 (빈 값은 마지막)
        const sortedValues = Array.from(values).sort((a, b) => {
            if (a === '') return 1;
            if (b === '') return -1;
            return a.localeCompare(b, 'ko');
        });
        
        return sortedValues;
    }
    
    /**
     * 데이터를 필터링합니다.
     * @param {Array<Object>} data - 필터링할 데이터
     * @param {Object} filters - 필터 설정 객체 { columnKey: Set<string> }
     * @returns {Array<Object>} 필터링된 데이터
     */
    static filterData(data, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return data;
        }
        
        return data.filter(item => {
            // 모든 필터 조건을 만족해야 함 (AND 조건)
            return Object.entries(filters).every(([columnKey, selectedValues]) => {
                // 선택된 값이 없으면 필터링하지 않음
                if (!selectedValues || selectedValues.size === 0) {
                    return true;
                }
                
                let value = item[columnKey];
                
                // 빈 값 처리
                if (value === null || value === undefined || value === '') {
                    value = '';
                } else {
                    value = String(value).trim();
                }
                
                return selectedValues.has(value);
            });
        });
    }
    
    /**
     * 필터 상태를 초기화합니다.
     * @returns {Object} 초기 필터 상태
     */
    static initializeFilters() {
        return {};
    }
    
    /**
     * 필터를 업데이트합니다.
     * @param {Object} currentFilters - 현재 필터 상태
     * @param {string} columnKey - 컬럼 키
     * @param {Set<string>} selectedValues - 선택된 값들의 Set
     * @returns {Object} 업데이트된 필터 상태
     */
    static updateFilter(currentFilters, columnKey, selectedValues) {
        const newFilters = { ...currentFilters };
        
        if (!selectedValues || selectedValues.size === 0) {
            // 선택된 값이 없으면 필터 제거
            delete newFilters[columnKey];
        } else {
            // 필터 업데이트
            newFilters[columnKey] = selectedValues;
        }
        
        return newFilters;
    }
    
    /**
     * 모든 필터를 제거합니다.
     * @returns {Object} 빈 필터 상태
     */
    static clearAllFilters() {
        return {};
    }
}
