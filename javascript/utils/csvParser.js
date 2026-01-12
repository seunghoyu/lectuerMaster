/**
 * CSV 파싱 유틸리티
 * 큰따옴표로 묶인 필드와 쉼표로 구분된 CSV 형식을 파싱합니다.
 */
export class CsvParser {
    /**
     * CSV 텍스트를 파싱하여 객체 배열로 변환합니다.
     * @param {string} csvText - 파싱할 CSV 형식의 문자열
     * @returns {Array<Object>} 파싱된 데이터 객체 배열
     */
    static parse(csvText) {
        const lines = csvText.replace(/\r/g, '').trim().split('\n');
        
        if (lines.length === 0) {
            return [];
        }
        
        const headers = this.parseLine(lines[0]);
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const currentLine = this.parseLine(lines[i]);
            
            // 헤더와 컬럼 수가 일치하는 경우에만 데이터 추가
            if (currentLine.length === headers.length) {
                const row = {};
                for (let j = 0; j < headers.length; j++) {
                    row[headers[j]] = currentLine[j];
                }
                data.push(row);
            }
        }
        
        return data;
    }
    
    /**
     * CSV 한 줄을 파싱하여 셀 배열로 변환합니다.
     * 큰따옴표 내부의 쉼표는 무시합니다.
     * @param {string} line - 파싱할 한 줄의 문자열
     * @returns {string[]} 셀 데이터 배열
     */
    static parseLine(line) {
        const columns = [];
        let currentValue = '';
        let isInsideQuote = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // 이스케이프된 큰따옴표 처리 ("")
                if (isInsideQuote && line[i + 1] === '"') {
                    currentValue += '"';
                    i++;
                } else {
                    isInsideQuote = !isInsideQuote;
                }
            } else if (char === ',' && !isInsideQuote) {
                columns.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        
        // 마지막 컬럼 추가
        columns.push(currentValue);
        
        return columns;
    }
}
