/**
 * LocalStorage 관리 서비스
 * 강의리스트 저장/로드/삭제 기능
 */
export class StorageService {
    static STORAGE_KEY = 'lecture_master_lists';
    static SHARED_LISTS_KEY = 'lecture_master_shared_lists';
    static USERS_KEY = 'lecture_master_users';
    
    /**
     * 강의리스트를 저장합니다.
     * @param {string} listName - 리스트 이름
     * @param {Array<string>} lectureCodes - 강의 코드 배열
     * @param {string} contractType - 계약유형 ('턴키' | '인당과금' | '개별결제')
     * @param {Object} priceMap - 강의코드별 금액 매핑 (인당과금일 경우 필수) { '강의코드': 금액 }
     * @returns {boolean} 저장 성공 여부
     */
    static saveLectureList(listName, lectureCodes, contractType = '턴키', priceMap = {}) {
        try {
            if (!listName || !listName.trim()) {
                throw new Error('리스트 이름을 입력해주세요.');
            }
            
            if (!lectureCodes || lectureCodes.length === 0) {
                throw new Error('저장할 강의를 선택해주세요.');
            }

            // 계약유형 검증
            const validContractTypes = ['턴키', '인당과금', '개별결제'];
            if (!contractType || !validContractTypes.includes(contractType)) {
                throw new Error('유효한 계약유형을 선택해주세요.');
            }

            // 인당과금일 경우 금액 매핑 검증
            if (contractType === '인당과금') {
                const selectedCodesSet = new Set(lectureCodes);
                const mappedCodesSet = new Set(Object.keys(priceMap || {}));
                
                // 모든 선택된 강의코드가 매핑되어 있는지 확인
                const unmappedCodes = lectureCodes.filter(code => !priceMap || !priceMap[code]);
                
                if (unmappedCodes.length > 0) {
                    throw new Error(
                        `인당과금 계약유형은 모든 강의코드에 대한 금액 매핑이 필요합니다.\n` +
                        `매핑되지 않은 강의코드: ${unmappedCodes.slice(0, 10).join(', ')}${unmappedCodes.length > 10 ? ` 외 ${unmappedCodes.length - 10}개` : ''}`
                    );
                }

                // 금액 유효성 검증
                const invalidPrices = Object.entries(priceMap || {}).filter(([code, price]) => {
                    return !price || typeof price !== 'number' || price <= 0;
                });

                if (invalidPrices.length > 0) {
                    throw new Error(
                        `유효하지 않은 금액이 있습니다.\n` +
                        `강의코드: ${invalidPrices.slice(0, 10).map(([code]) => code).join(', ')}`
                    );
                }
            }
            
            const lists = this.loadAllLists();
            
            // 중복 이름 체크
            if (lists.some(list => list.name === listName)) {
                throw new Error('이미 존재하는 리스트 이름입니다.');
            }
            
            const newList = {
                name: listName,
                lectureCodes: [...lectureCodes],
                contractType: contractType, // 계약유형 추가
                priceMap: contractType === '인당과금' ? { ...priceMap } : {}, // 인당과금일 경우만 priceMap 저장
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            lists.push(newList);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
            
            return true;
        } catch (error) {
            console.error('리스트 저장 오류:', error);
            throw error;
        }
    }
    
    /**
     * 저장된 모든 강의리스트를 로드합니다.
     * @returns {Array<Object>} 강의리스트 배열
     */
    static loadAllLists() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('리스트 로드 오류:', error);
            return [];
        }
    }
    
    /**
     * 특정 강의리스트를 로드합니다.
     * @param {string} listName - 리스트 이름
     * @returns {Object|null} 강의리스트 객체 또는 null
     */
    static loadLectureList(listName) {
        const lists = this.loadAllLists();
        return lists.find(list => list.name === listName) || null;
    }
    
    /**
     * 강의리스트를 삭제합니다.
     * @param {string} listName - 삭제할 리스트 이름
     * @returns {boolean} 삭제 성공 여부
     */
    static deleteLectureList(listName) {
        try {
            const lists = this.loadAllLists();
            const filtered = lists.filter(list => list.name !== listName);
            
            if (filtered.length === lists.length) {
                throw new Error('리스트를 찾을 수 없습니다.');
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('리스트 삭제 오류:', error);
            throw error;
        }
    }
    
    /**
     * 강의리스트 이름을 변경합니다.
     * @param {string} oldName - 기존 이름
     * @param {string} newName - 새 이름
     * @returns {boolean} 변경 성공 여부
     */
    static updateLectureListName(oldName, newName) {
        try {
            if (!newName || !newName.trim()) {
                throw new Error('리스트 이름을 입력해주세요.');
            }
            
            const lists = this.loadAllLists();
            const listIndex = lists.findIndex(list => list.name === oldName);
            
            if (listIndex === -1) {
                throw new Error('리스트를 찾을 수 없습니다.');
            }
            
            // 중복 이름 체크
            if (lists.some(list => list.name === newName && list.name !== oldName)) {
                throw new Error('이미 존재하는 리스트 이름입니다.');
            }
            
            lists[listIndex].name = newName;
            lists[listIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
            return true;
        } catch (error) {
            console.error('리스트 이름 변경 오류:', error);
            throw error;
        }
    }
    
    /**
     * 강의리스트에 강의를 추가합니다.
     * @param {string} listName - 리스트 이름
     * @param {Array<string>} lectureCodes - 추가할 강의 코드 배열
     * @returns {boolean} 추가 성공 여부
     */
    static addLecturesToList(listName, lectureCodes) {
        try {
            const lists = this.loadAllLists();
            const listIndex = lists.findIndex(list => list.name === listName);
            
            if (listIndex === -1) {
                throw new Error('리스트를 찾을 수 없습니다.');
            }
            
            const existingCodes = new Set(lists[listIndex].lectureCodes);
            lectureCodes.forEach(code => existingCodes.add(code));
            
            lists[listIndex].lectureCodes = Array.from(existingCodes);
            lists[listIndex].updatedAt = new Date().toISOString();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lists));
            return true;
        } catch (error) {
            console.error('강의 추가 오류:', error);
            throw error;
        }
    }
    
    /**
     * 강의리스트를 공유합니다.
     * @param {string} listName - 공유할 리스트 이름
     * @param {string} sharedWith - 공유 대상 (팀/이름/아이디)
     * @returns {boolean} 공유 성공 여부
     */
    static shareLectureList(listName, sharedWith) {
        try {
            const list = this.loadLectureList(listName);
            if (!list) {
                throw new Error('리스트를 찾을 수 없습니다.');
            }
            
            // sharedWith에서 ID 추출 (팀/이름/아이디 형식에서 아이디만 추출)
            let sharedWithId = sharedWith;
            if (sharedWith.includes('/')) {
                const parts = sharedWith.split('/');
                sharedWithId = parts[parts.length - 1]?.trim() || sharedWith;
            }
            
            const sharedLists = this.loadSharedLists();
            
            // 중복 공유 체크 (같은 리스트를 같은 사람에게 중복 공유 방지)
            const alreadyShared = sharedLists.some(
                shared => shared.listName === listName && shared.sharedWith === sharedWith
            );
            
            if (alreadyShared) {
                throw new Error('이미 공유된 대상입니다.');
            }
            
            const sharedList = {
                listName: listName,
                lectureCodes: [...list.lectureCodes],
                sharedBy: this.getCurrentUser()?.id || 'unknown',
                sharedWith: sharedWith, // 전체 문자열 저장 (팀/이름/아이디)
                sharedWithId: sharedWithId, // ID만 별도 저장
                sharedAt: new Date().toISOString()
            };
            
            sharedLists.push(sharedList);
            localStorage.setItem(this.SHARED_LISTS_KEY, JSON.stringify(sharedLists));
            
            return true;
        } catch (error) {
            console.error('리스트 공유 오류:', error);
            throw error;
        }
    }
    
    /**
     * 공유된 강의리스트를 로드합니다.
     * @returns {Array<Object>} 공유된 강의리스트 배열
     */
    static loadSharedLists() {
        try {
            const stored = localStorage.getItem(this.SHARED_LISTS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('공유 리스트 로드 오류:', error);
            return [];
        }
    }
    
    /**
     * 특정 리스트에 공유된 사람 목록을 가져옵니다.
     * @param {string} listName - 리스트 이름
     * @returns {Array<Object>} 공유된 사람 정보 배열 (sharedWith, sharedAt 포함)
     */
    static getSharedWithList(listName) {
        try {
            const sharedLists = this.loadSharedLists();
            // 현재 사용자가 공유한 리스트만 필터링
            const currentUserId = this.getCurrentUser()?.id || 'unknown';
            
            return sharedLists
                .filter(shared => 
                    shared.listName === listName && 
                    shared.sharedBy === currentUserId
                )
                .map(shared => ({
                    sharedWith: shared.sharedWith,
                    sharedAt: shared.sharedAt,
                    lectureCount: shared.lectureCodes?.length || 0
                }))
                .sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt)); // 최신순 정렬
        } catch (error) {
            console.error('공유된 사람 목록 로드 오류:', error);
            return [];
        }
    }
    
    /**
     * 현재 사용자 정보를 가져옵니다.
     * @returns {Object|null} 사용자 정보
     */
    static getCurrentUser() {
        try {
            const stored = localStorage.getItem('lecture_master_current_user');
            return stored ? JSON.parse(stored) : { name: '홍길동', id: 'hong123' };
        } catch (error) {
            return { name: '홍길동', id: 'hong123' };
        }
    }
    
    /**
     * 사용자 목록을 가져옵니다 (자동완성용).
     * @deprecated UserService.getUsersSync()를 사용하세요.
     * @returns {Array<Object>} 사용자 배열
     */
    static getUsers() {
        // UserService를 동적으로 import하여 사용
        try {
            // 동적 import는 비동기이므로 동기적으로 사용할 수 없음
            // UserService.getUsersSync()를 직접 호출하도록 변경 필요
            // 임시로 localStorage에서 가져오기 (호환성 유지)
            const stored = localStorage.getItem(this.USERS_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // 캐시가 없으면 빈 배열 반환
            console.warn('UserService.getUsersSync()를 사용하세요.');
            return [];
        } catch (error) {
            console.error('사용자 목록 로드 오류:', error);
            return [];
        }
    }
}
