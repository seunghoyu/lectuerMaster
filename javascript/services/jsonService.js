import { CONFIG } from '../config/constants.js';

/**
 * JSON 파일 로딩 서비스
 */
export class JsonService {
    /**
     * JSON 파일을 비동기적으로 로드합니다.
     * @returns {Promise<Array<Object>>} 파싱된 데이터 배열
     */
    static async loadJsonData() {
        try {
            const response = await fetch(CONFIG.JSON_FILE_PATH);
            
            if (!response.ok) {
                throw new Error(`JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const jsonData = await response.json();
            
            // 데이터 검증 및 디버깅
            if (Array.isArray(jsonData) && jsonData.length > 0) {
                const firstItem = jsonData[0];
                console.log('JSON 데이터 로드 완료:', jsonData.length, '개 항목');
                console.log('첫 번째 항목 샘플:', {
                    '강의명': firstItem['강의명'],
                    '카테고리': firstItem['카테고리'],
                    '사업부코드': firstItem['사업부코드'],
                    '강의코드': firstItem['강의코드']
                });
                
                // 필수 필드 검증
                if (!firstItem['강의명'] || !firstItem['카테고리']) {
                    console.warn('경고: 첫 번째 항목에 필수 필드가 누락되었습니다.');
                    console.warn('사용 가능한 키:', Object.keys(firstItem));
                }
            } else {
                console.warn('JSON 데이터가 비어있거나 배열이 아닙니다.');
                throw new Error('JSON 데이터가 비어있거나 배열 형식이 아닙니다.');
            }
            
            return jsonData;
        } catch (error) {
            console.error('JSON 로드 오류:', error);
            throw error;
        }
    }

    /**
     * book_list.json 파일을 비동기적으로 로드합니다.
     * @returns {Promise<Array<Object>>} 파싱된 book 데이터 배열
     */
    static async loadBookList() {
        try {
            const response = await fetch('data/book_list.json');
            if (!response.ok) {
                throw new Error(`book_list.json 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            const bookList = await response.json();
            console.log('book_list.json 데이터 로드 완료:', bookList.length, '개 항목');
            return bookList;
        } catch (error) {
            console.error('book_list.json 로드 오류:', error);
            throw error;
        }
    }
}
