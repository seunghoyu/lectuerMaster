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
        
        let errorCount = 0;
        for (let i = 1; i < lines.length; i++) {
            const currentLine = this.parseLine(lines[i]);
            
            // 헤더와 컬럼 수가 일치하는 경우에만 데이터 추가
            if (currentLine.length === headers.length) {
                const row = {};
                for (let j = 0; j < headers.length; j++) {
                    row[headers[j]] = currentLine[j];
                }
                data.push(row);
            } else {
                errorCount++;
                // 처음 5개 오류만 로그 출력
                if (errorCount <= 5) {
                    console.warn(`CSV 파싱 경고 (Line ${i + 1}): 컬럼 수 불일치 (헤더: ${headers.length}, 데이터: ${currentLine.length})`);
                    console.warn(`  헤더:`, headers);
                    console.warn(`  데이터:`, currentLine);
                }
            }
        }
        
        if (errorCount > 0) {
            console.warn(`CSV 파싱 완료: 총 ${errorCount}개 행이 컬럼 수 불일치로 제외되었습니다.`);
        }
        
        // 파싱 결과 검증 (첫 번째 항목 확인)
        if (data.length > 0) {
            const firstItem = data[0];
            if (!firstItem['강의명'] || !firstItem['카테고리']) {
                console.warn('CSV 파싱 검증 경고: 첫 번째 항목의 필수 필드 확인');
                console.warn('  강의명:', firstItem['강의명']);
                console.warn('  카테고리:', firstItem['카테고리']);
                console.warn('  전체 키:', Object.keys(firstItem));
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
