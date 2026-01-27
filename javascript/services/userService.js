/**
 * 사용자 데이터 관리 서비스
 * data/users.json에서 사용자 목록을 로드합니다.
 */
export class UserService {
    static USERS_DATA_PATH = './data/users.json';
    static USERS_CACHE = null;
    
    /**
     * 사용자 목록을 가져옵니다.
     * @returns {Promise<Array<Object>>} 사용자 배열
     */
    static async getUsers() {
        // 캐시가 있으면 캐시 반환
        if (this.USERS_CACHE !== null) {
            return this.USERS_CACHE;
        }
        
        try {
            const response = await fetch(this.USERS_DATA_PATH);
            
            if (!response.ok) {
                throw new Error(`사용자 데이터를 불러올 수 없습니다. (Status: ${response.status})`);
            }
            
            const users = await response.json();
            
            // 유효성 검사
            if (!Array.isArray(users)) {
                throw new Error('사용자 데이터 형식이 올바르지 않습니다.');
            }
            
            // 캐시에 저장
            this.USERS_CACHE = users;
            
            return users;
        } catch (error) {
            console.error('사용자 데이터 로드 오류:', error);
            // 오류 발생 시 빈 배열 반환
            return [];
        }
    }
    
    /**
     * 동기적으로 사용자 목록을 가져옵니다 (캐시 사용).
     * getUsers()가 먼저 호출되어 캐시가 있어야 합니다.
     * @returns {Array<Object>} 사용자 배열
     */
    static getUsersSync() {
        if (this.USERS_CACHE === null) {
            console.warn('사용자 캐시가 없습니다. getUsers()를 먼저 호출하세요.');
            return [];
        }
        return this.USERS_CACHE;
    }
    
    /**
     * 캐시를 초기화합니다.
     */
    static clearCache() {
        this.USERS_CACHE = null;
    }
}
