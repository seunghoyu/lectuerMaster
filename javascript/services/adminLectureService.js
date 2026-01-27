// javascript/services/adminLectureService.js

import { JsonService } from './jsonService.js';

const ADMIN_LECTURE_DATA_PATH = 'data/champ_AdminLecture.json';

let adminLectureDataCache = null;
let adminLectureMapById = null;

/**
 * Champ Admin Lecture 데이터를 관리하는 서비스
 */
export class AdminLectureService {
    /**
     * app.js에서 호출하여 데이터를 미리 로드하고 캐시하는 메서드
     */
    static async loadAdminLectureData() {
        if (adminLectureDataCache) {
            return;
        }
        try {
            const response = await fetch(ADMIN_LECTURE_DATA_PATH);
            if (!response.ok) {
                throw new Error(`AdminLecture JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            const data = await response.json();
            
            adminLectureDataCache = data;
            adminLectureMapById = new Map();
            data.forEach(item => {
                const id = String(item.champLectureId);
                if (!adminLectureMapById.has(id)) {
                    adminLectureMapById.set(id, []);
                }
                adminLectureMapById.get(id).push(item);
            });
            console.log(`AdminLecture 데이터 로드 완료: ${data.length}개`);
        } catch (error) {
            console.error('Admin lecture 데이터를 가져오는 중 오류 발생:', error);
            adminLectureDataCache = [];
            adminLectureMapById = new Map();
        }
    }

    /**
     * 캐시된 전체 데이터를 반환합니다.
     * @returns {Promise<Array<Object>>} admin lecture 데이터 배열
     */
    static async getAdminLectureData() {
        if (!adminLectureDataCache) {
            await this.loadAdminLectureData();
        }
        return adminLectureDataCache;
    }

    /**
     * ID로 캐시된 데이터를 조회합니다.
     * @param {string} id - 조회할 champLectureId
     * @returns {Array<Object>|null}
     */
    static getDataById(id) {
        if (!adminLectureMapById) return null;
        return adminLectureMapById.get(String(id)) || null;
    }
}