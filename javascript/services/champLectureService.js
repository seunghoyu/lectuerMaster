/**
 * champ_lecture.json 데이터 관리 서비스
 */
export class ChampLectureService {
    static champLectureMap = null; // 캐시된 데이터 맵 (Key: rowNo)

    /**
     * JSON 파일을 비동기적으로 로드하고 맵을 생성합니다.
     * @returns {Promise<Map<string, Object>>} rowNo를 키로 하는 맵
     */
    static async loadChampLectureData() {
        if (this.champLectureMap) {
            return this.champLectureMap;
        }

        try {
            const response = await fetch('data/champ_lecture.json');
            if (!response.ok) {
                throw new Error(`ChampLecture JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const jsonData = await response.json();
            
            this.champLectureMap = new Map();
            if (Array.isArray(jsonData)) {
                jsonData.forEach(item => {
                    if (item.rowNo) {
                        const key = String(item.rowNo);
                        if (!this.champLectureMap.has(key)) {
                            this.champLectureMap.set(key, []);
                        }
                        this.champLectureMap.get(key).push(item);
                    }
                });
            }
            
            console.log(`ChampLecture 데이터 로드 완료: ${this.champLectureMap.size}개 매핑`);
            return this.champLectureMap;
        } catch (error) {
            console.error('ChampLecture JSON 로드 오류:', error);
            this.champLectureMap = new Map(); // 오류 발생 시 빈 맵 반환
            return this.champLectureMap;
        }
    }

    /**
     * rowNo로 모든 ChampLecture 데이터를 조회합니다.
     * @param {string|number} rowNo - 조회할 rowNo
     * @returns {Array<Object>} 데이터 객체 배열 또는 빈 배열
     */
    static getAllDataByRowNo(rowNo) {
        if (!this.champLectureMap) {
            console.warn('ChampLecture 데이터가 로드되지 않았습니다.');
            return [];
        }
        // rowNo를 문자열로 변환하여 조회
        return this.champLectureMap.get(String(rowNo)) || [];
    }

    /**
     * 캐시를 초기화합니다.
     */
    static clearCache() {
        this.champLectureMap = null;
    }
}
