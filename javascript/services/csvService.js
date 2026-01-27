import { CsvParser } from '../utils/csvParser.js';
import { CONFIG } from '../config/constants.js';

/**
 * CSV 파일 로딩 및 파싱 서비스
 */
export class CsvService {
    /**
     * CSV 파일을 비동기적으로 로드하고 파싱합니다.
     * @returns {Promise<Array<Object>>} 파싱된 데이터 배열
     */
    static async loadCsvData() {
        try {
            const response = await fetch(CONFIG.CSV_FILE_PATH);
            
            if (!response.ok) {
                throw new Error(`CSV 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const csvText = await response.text();
            const parsedData = CsvParser.parse(csvText);
            
            return parsedData;
        } catch (error) {
            console.error('CSV 로드 오류:', error);
            throw error;
        }
    }
}

