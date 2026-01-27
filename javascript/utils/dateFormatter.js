/**
 * 날짜 포맷팅 유틸리티
 */
export class DateFormatter {
    /**
     * 날짜 문자열을 YYYY-MM-DD HH:mm 형식으로 변환합니다.
     * @param {string|Date} dateInput - 날짜 문자열 또는 Date 객체
     * @param {string} format - 포맷 형식 (선택사항, 기본값: 'YYYY-MM-DD HH:mm')
     * @returns {string} 포맷된 날짜 문자열
     */
    static formatDate(dateInput, format = 'YYYY-MM-DD HH:mm') {
        if (!dateInput) return '';
        
        try {
            const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
            
            // 유효하지 않은 날짜인 경우 원본 반환
            if (isNaN(date.getTime())) {
                return String(dateInput);
            }
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return String(dateInput);
        }
    }
    
    /**
     * 날짜 문자열을 YYYY-MM-DD HH:mm 형식으로 변환합니다 (하위 호환성).
     * @param {string} dateString - 날짜 문자열
     * @returns {string} 포맷된 날짜 문자열
     */
    static format(dateString) {
        return this.formatDate(dateString);
    }
}
