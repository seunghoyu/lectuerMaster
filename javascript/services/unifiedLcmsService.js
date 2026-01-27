/**
 * unifiedLcms.json 데이터 관리 서비스
 */
export class UnifiedLcmsService {
    static lcmsDataMap = null; // 캐시된 데이터 맵 (Key: lectureId)

    /**
     * JSON 파일을 비동기적으로 로드하고 맵을 생성합니다.
     * @returns {Promise<Map<string, Object>>} lectureId를 키로 하는 맵
     */
    static async loadUnifiedLcmsData() {
        if (this.lcmsDataMap) {
            return this.lcmsDataMap;
        }

        try {
            const response = await fetch('data/unifiedLcms.json');
            if (!response.ok) {
                throw new Error(`Unified LCMS JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const jsonData = await response.json();
            
            this.lcmsDataMap = new Map();
            if (Array.isArray(jsonData)) {
                jsonData.forEach(item => {
                    if (item.lectureId) {
                        const key = String(item.lectureId);
                        if (!this.lcmsDataMap.has(key)) {
                            this.lcmsDataMap.set(key, []);
                        }
                        this.lcmsDataMap.get(key).push(item);
                    }
                });
            }
            
            console.log(`Unified LCMS 데이터 로드 완료: ${this.lcmsDataMap.size}개 매핑`);
            return this.lcmsDataMap;
        } catch (error) {
            console.error('Unified LCMS JSON 로드 오류:', error);
            this.lcmsDataMap = new Map(); // 오류 발생 시 빈 맵 반환
            return this.lcmsDataMap;
        }
    }

    /**
     * lectureId로 모든 Unified LCMS 데이터를 조회합니다.
     * @param {string|number} lectureId - 조회할 lectureId
     * @returns {Array<Object>} 데이터 객체 배열 또는 빈 배열
     */
    static getDataByLectureId(lectureId) {
        if (!this.lcmsDataMap) {
            console.warn('Unified LCMS 데이터가 로드되지 않았습니다.');
            return [];
        }
        // lectureId를 문자열로 변환하여 조회
        return this.lcmsDataMap.get(String(lectureId)) || [];
    }

    /**
     * 모든 Unified LCMS 데이터를 단일 배열로 반환합니다.
     * @returns {Array<Object>} 모든 데이터 객체 배열
     */
    static getAllData() {
        if (!this.lcmsDataMap) {
            console.warn('Unified LCMS 데이터가 로드되지 않았습니다.');
            return [];
        }
        return Array.from(this.lcmsDataMap.values()).flat();
    }

    /**
     * 캐시를 초기화합니다.
     */
    static clearCache() {
        this.lcmsDataMap = null;
    }
}
