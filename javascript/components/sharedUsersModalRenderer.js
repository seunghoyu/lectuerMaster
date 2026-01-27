import { StorageService } from '../services/storageService.js';
import { DateFormatter } from '../utils/dateFormatter.js';

/**
 * 공유된 사람 확인 모달 렌더링 컴포넌트
 */
export class SharedUsersModalRenderer {
    /**
     * 공유된 사람 확인 모달 HTML을 생성합니다.
     * @param {string} listName - 리스트 이름
     * @param {Array<Object>} sharedWithList - 공유된 사람 목록
     * @returns {string} 모달 HTML 문자열
     */
    static render(listName, sharedWithList) {
        const hasSharedUsers = sharedWithList && sharedWithList.length > 0;
        
        let sharedUsersHtml = '';
        if (hasSharedUsers) {
            sharedUsersHtml = sharedWithList.map(item => {
                const sharedDate = item.sharedAt ? DateFormatter.formatDate(new Date(item.sharedAt), 'YYYY-MM-DD HH:mm') : '알 수 없음';
                return `
                    <div class="shared-user-item">
                        <div class="shared-user-info">
                            <div class="shared-user-name">${item.sharedWith}</div>
                            <div class="shared-user-meta">
                                <span class="shared-date">공유일: ${sharedDate}</span>
                                <span class="shared-count">${item.lectureCount}개 강의</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            sharedUsersHtml = `
                <div class="no-shared-users">
                    <i class="fa-solid fa-users"></i>
                    <p>공유된 사람이 없습니다.</p>
                </div>
            `;
        }
        
        return `
            <div class="modal-overlay" id="sharedUsersModalOverlay">
                <div class="modal-container shared-users-modal">
                    <div class="modal-header">
                        <h2>공유된 사람 확인</h2>
                        <button class="modal-close" id="closeSharedUsersModal">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>리스트 이름</label>
                            <div class="form-info">${listName}</div>
                        </div>
                        
                        <div class="form-group">
                            <label>공유된 사람 목록</label>
                            <div class="shared-users-list">
                                ${sharedUsersHtml}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-confirm" id="closeSharedUsersBtn">확인</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 공유된 사람 확인 모달을 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 모달을 렌더링할 컨테이너 요소
     * @param {string} listName - 리스트 이름
     */
    static renderToDOM(container, listName) {
        if (!container) {
            console.error('모달 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 모달 제거
        const existingModal = document.getElementById('sharedUsersModalOverlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 공유된 사람 목록 가져오기
        const sharedWithList = StorageService.getSharedWithList(listName);
        
        const modalHtml = this.render(listName, sharedWithList);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modalElement = tempDiv.firstElementChild;
        
        if (modalElement) {
            container.appendChild(modalElement);
        }
    }
    
    /**
     * 모달을 표시합니다.
     */
    static showModal() {
        const overlay = document.getElementById('sharedUsersModalOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    /**
     * 모달을 숨깁니다.
     */
    static hideModal() {
        const overlay = document.getElementById('sharedUsersModalOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    /**
     * 모달을 제거합니다.
     */
    static removeModal() {
        const overlay = document.getElementById('sharedUsersModalOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}
