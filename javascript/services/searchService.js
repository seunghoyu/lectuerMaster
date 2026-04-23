/**
 * 검색 서비스
 * 강의명, 강의코드 검색 기능
 */
export class SearchService {
    /**
     * 데이터를 검색합니다.
     * @param {Array<Object>} data - 검색할 데이터 배열
     * @param {string} query - 검색어
     * @returns {Array<Object>} 검색된 데이터 배열
     */
    static search(data, query) {
        if (!query || query.trim() === '') {
            return data;
        }

        const searchTerm = query.trim().toLowerCase();

        return data.filter(item => {
            // 강의명 검색
            const lectureName = (item['강의명'] || '').toLowerCase();
            const matchesLectureName = lectureName.includes(searchTerm);

            // 강의코드 검색
            const lectureCode = (item['강의코드'] || '').toLowerCase();
            const matchesLectureCode = lectureCode.includes(searchTerm);

            return matchesLectureName || matchesLectureCode;
        });
    }

    /**
     * B2C(통합LCMS) 데이터를 검색합니다.
     * @param {Array<Object>} data
     * @param {string} query
     * @returns {Array<Object>}
     */
    static searchB2CUnified(data, query) {
        if (!query || query.trim() === '') {
            return data;
        }

        const searchTerm = query.trim().toLowerCase();
        return data.filter(item => {
            const title = (item.lectureTitle || '').toLowerCase();
            const id = (item.lectureId ?? '').toString().toLowerCase();
            return title.includes(searchTerm) || id.includes(searchTerm);
        });
    }

    /**
     * 검색어가 유효한지 확인합니다.
     * @param {string} query - 검색어
     * @returns {boolean} 유효 여부
     */
    static isValidQuery(query) {
        return query && query.trim().length > 0;
    }
}
