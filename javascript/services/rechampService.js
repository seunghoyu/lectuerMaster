import { CONFIG } from '../config/constants.js';

/**
 * Rechamp 강의리스트 JSON 파일 로딩 및 매핑 서비스
 */
export class RechampService {
    static rechampData = null; // 캐시된 데이터
    static settlementTypeMap = null; // lectureCode -> settlementType 매핑 맵

    /**
     * JSON 파일을 비동기적으로 로드하고 매핑 맵을 생성합니다.
     * @returns {Promise<Map<number, string>>} lectureCode -> settlementType 매핑 맵
     */
    static async loadRechampData() {
        // 이미 로드된 경우 캐시 반환
        if (this.settlementTypeMap) {
            return this.settlementTypeMap;
        }

        try {
            const response = await fetch('data/rechamp_lectureList.json');
            
            if (!response.ok) {
                throw new Error(`Rechamp JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const jsonData = await response.json();
            this.rechampData = jsonData;
            
            // lectureCode -> settlementType 매핑 맵 생성
            this.settlementTypeMap = new Map();
            jsonData.forEach(item => {
                if (item.lectureCode && item.settlementType) {
                    // lectureCode를 숫자로 변환하여 저장
                    const code = typeof item.lectureCode === 'string' 
                        ? parseInt(item.lectureCode, 10) 
                        : item.lectureCode;
                    this.settlementTypeMap.set(code, item.settlementType);
                }
            });
            
            console.log(`Rechamp 데이터 로드 완료: ${this.settlementTypeMap.size}개 매핑`);
            return this.settlementTypeMap;
        } catch (error) {
            console.error('Rechamp JSON 로드 오류:', error);
            // 오류 발생 시 빈 맵 반환
            this.settlementTypeMap = new Map();
            return this.settlementTypeMap;
        }
    }

    /**
     * B2C강의코드로 settlementType을 조회합니다.
     * @param {string|number} b2cCode - B2C강의코드
     * @returns {string|null} settlementType 또는 null
     */
    static getSettlementType(b2cCode) {
        if (!b2cCode || b2cCode === '') {
            return null;
        }

        // 맵이 아직 생성되지 않은 경우 null 반환
        if (!this.settlementTypeMap) {
            return null;
        }

        // B2C강의코드를 숫자로 변환
        const code = typeof b2cCode === 'string' 
            ? parseInt(b2cCode, 10) 
            : b2cCode;

        // NaN 체크
        if (isNaN(code)) {
            return null;
        }

        return this.settlementTypeMap.get(code) || null;
    }

    /**
     * B2C강의코드로 Rechamp 데이터를 조회합니다.
     * @param {string|number} b2cCode - B2C강의코드
     * @returns {Object|null} Rechamp 데이터 또는 null
     */
    static getRechampDataByB2CCode(b2cCode) {
        if (!b2cCode || b2cCode === '') {
            return null;
        }

        // 데이터가 아직 로드되지 않은 경우 null 반환
        if (!this.rechampData || !Array.isArray(this.rechampData)) {
            return null;
        }

        // B2C강의코드를 숫자로 변환
        const code = typeof b2cCode === 'string' 
            ? parseInt(b2cCode, 10) 
            : b2cCode;

        // NaN 체크
        if (isNaN(code)) {
            return null;
        }

        // lectureCode로 검색
        const found = this.rechampData.find(item => {
            const itemCode = typeof item.lectureCode === 'string' 
                ? parseInt(item.lectureCode, 10) 
                : item.lectureCode;
            return itemCode === code;
        });

        return found || null;
    }

    /**
     * 매핑 맵을 초기화합니다 (테스트용 또는 재로드용).
     */
    static clearCache() {
        this.rechampData = null;
        this.settlementTypeMap = null;
    }
}
