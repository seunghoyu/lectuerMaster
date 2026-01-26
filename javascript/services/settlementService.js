/**
 * 정산 상태 데이터 관리 서비스
 */
export class SettlementService {
    static settlementData = null; // 캐시된 데이터

    /**
     * JSON 파일을 비동기적으로 로드합니다.
     * @returns {Promise<Object>} 정산 데이터 객체
     */
    static async loadSettlementData() {
        // 이미 로드된 경우 캐시 반환
        if (this.settlementData) {
            return this.settlementData;
        }

        try {
            const response = await fetch('data/lecture_settlement_status.json');
            
            if (!response.ok) {
                throw new Error(`Settlement JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const jsonData = await response.json();
            this.settlementData = jsonData;
            
            console.log(`정산 상태 데이터 로드 완료: ${Object.keys(this.settlementData).length}개 항목`);
            return this.settlementData;
        } catch (error) {
            console.error('Settlement JSON 로드 오류:', error);
            this.settlementData = {}; // 오류 발생 시 빈 객체 반환
            return this.settlementData;
        }
    }

    /**
     * 강의코드로 정산 상태를 조회합니다.
     * @param {string|number} lectureCode - 강의코드
     * @returns {string|null} 정산 상태 또는 null
     */
    static getStatusByCode(lectureCode) {
        if (!this.settlementData) {
            console.warn('정산 데이터가 로드되지 않았습니다.');
            return null;
        }
        // lectureCode는 문자열일 수 있으므로 그대로 사용
        return this.settlementData[lectureCode] || null;
    }

    /**
     * 새로운 미정산 강의를 추가하는 기능 (시뮬레이션)
     * 실제 파일 쓰기는 서버사이드에서 이루어져야 합니다.
     * @param {Array<string>} lectureCodes - 추가할 강의코드 배열
     */
    static addUnsettledLectures(lectureCodes) {
        if (!this.settlementData) {
            console.error('정산 데이터가 로드되지 않아 추가할 수 없습니다.');
            return;
        }

        const updatedData = { ...this.settlementData };
        let addedCount = 0;
        lectureCodes.forEach(code => {
            if (code && !updatedData[code]) {
                updatedData[code] = '미정산'; // 기본값 '미정산'으로 추가
                addedCount++;
            }
        });

        console.log(`[시뮬레이션] ${addedCount}개의 신규 미정산 강의를 추가합니다.`);
        console.log('[시뮬레이션] 서버로 전송될 데이터:', updatedData);
        
        // 실제 애플리케이션에서는 이 데이터를 서버로 보내 파일 업데이트를 요청해야 합니다.
        // 예: 
        // fetch('/api/update-settlement-status', { 
        //     method: 'POST', 
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(updatedData)
        // });
        
        // 인메모리 데이터 업데이트 (사용자가 앱을 사용하는 동안에는 반영되도록)
        this.settlementData = updatedData;
        alert(`[시뮬레이션] ${addedCount}개의 신규 미정산 강의가 메모리에 추가되었습니다. 실제 파일 저장은 서버 구현이 필요합니다.`);
    }

    /**
     * 캐시를 초기화합니다.
     */
    static clearCache() {
        this.settlementData = null;
    }
}
