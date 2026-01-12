import { CONFIG } from '../config/constants.js';

/**
 * 테이블 드래그 스크롤 이벤트 핸들러
 */
export class DragScrollHandler {
    /**
     * 드래그 스크롤 이벤트를 바인딩합니다.
     */
    static bindEvents() {
        const scrollArea = document.querySelector('.table-scroll-area');
        
        if (!scrollArea) {
            return;
        }
        
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let initialScrollLeft = 0;
        let initialScrollTop = 0;
        
        // 마우스 다운 이벤트
        scrollArea.addEventListener('mousedown', (event) => {
            // 스크롤바 자체를 클릭했을 때는 드래그가 동작하지 않도록 함
            if (event.offsetX > scrollArea.clientWidth || 
                event.offsetY > scrollArea.clientHeight) {
                return;
            }
            
            // 텍스트 선택을 위해 td 내부 클릭 시 드래그 스크롤 방지
            if (event.target.closest('td')) {
                return;
            }
            
            isDragging = true;
            scrollArea.classList.add('active-drag');
            startX = event.pageX;
            startY = event.pageY;
            initialScrollLeft = scrollArea.scrollLeft;
            initialScrollTop = scrollArea.scrollTop;
        });
        
        // 드래그 중지 함수
        const stopDragging = () => {
            isDragging = false;
            scrollArea.classList.remove('active-drag');
        };
        
        // 마우스 리브 이벤트
        scrollArea.addEventListener('mouseleave', stopDragging);
        
        // 마우스 업 이벤트
        scrollArea.addEventListener('mouseup', stopDragging);
        
        // 마우스 무브 이벤트
        scrollArea.addEventListener('mousemove', (event) => {
            if (!isDragging) {
                return;
            }
            
            event.preventDefault();
            
            const deltaX = (event.pageX - startX) * CONFIG.DRAG_SCROLL_MULTIPLIER;
            const deltaY = (event.pageY - startY) * CONFIG.DRAG_SCROLL_MULTIPLIER;
            
            scrollArea.scrollLeft = initialScrollLeft - deltaX;
            scrollArea.scrollTop = initialScrollTop - deltaY;
        });
    }
}

