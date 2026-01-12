/**
 * 우상단 플러그인 바 렌더링 컴포넌트
 * 확장 가능한 플러그인 시스템
 */
export class PluginBarRenderer {
    /**
     * 플러그인 바 HTML을 생성합니다.
     * @param {Array<Object>} plugins - 플러그인 배열
     * @returns {string} 플러그인 바 HTML 문자열
     */
    static render(plugins = []) {
        if (plugins.length === 0) {
            return '';
        }
        
        const pluginsHtml = plugins.map(plugin => {
            const dropdownId = `plugin-dropdown-${plugin.id}`;
            return `
                <div class="plugin-item">
                    <button class="plugin-btn" id="plugin-${plugin.id}" title="${plugin.title}">
                        <i class="${plugin.icon}"></i>
                        <span class="plugin-title">${plugin.title}</span>
                    </button>
                    <div class="plugin-dropdown" id="${dropdownId}">
                        ${this.renderDropdownMenu(plugin.menuItems)}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="plugin-bar">
                ${pluginsHtml}
            </div>
        `;
    }
    
    /**
     * 드롭다운 메뉴 HTML을 생성합니다.
     * @param {Array<Object>} menuItems - 메뉴 아이템 배열
     * @returns {string} 드롭다운 메뉴 HTML 문자열
     */
    static renderDropdownMenu(menuItems = []) {
        if (menuItems.length === 0) {
            return '';
        }
        
        return menuItems.map(item => {
            const dangerClass = item.danger ? 'plugin-menu-item-danger' : '';
            return `
                <div class="plugin-menu-item ${dangerClass}" data-action="${item.action}">
                    <i class="${item.icon || 'fa-solid fa-circle'}"></i>
                    <span>${item.label}</span>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 플러그인 바를 DOM에 렌더링합니다.
     * @param {HTMLElement} container - 플러그인 바를 렌더링할 컨테이너 요소
     * @param {Array<Object>} plugins - 플러그인 배열
     */
    static renderToDOM(container, plugins) {
        if (!container) {
            console.error('플러그인 바 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const pluginBarHtml = this.render(plugins);
        container.innerHTML = pluginBarHtml;
        
        // 드롭다운 이벤트 바인딩
        this.bindDropdownEvents(plugins);
    }
    
    /**
     * 드롭다운 이벤트를 바인딩합니다.
     * @param {Array<Object>} plugins - 플러그인 배열
     */
    static bindDropdownEvents(plugins) {
        plugins.forEach(plugin => {
            const iconBtn = document.getElementById(`plugin-${plugin.id}`);
            const dropdown = document.getElementById(`plugin-dropdown-${plugin.id}`);
            
            if (!iconBtn || !dropdown) return;
            
            // 아이콘 클릭 시 드롭다운 토글
            iconBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 다른 드롭다운 닫기
                document.querySelectorAll('.plugin-dropdown').forEach(dd => {
                    if (dd !== dropdown) {
                        dd.classList.remove('show');
                    }
                });
                
                dropdown.classList.toggle('show');
            });
            
            // 메뉴 아이템 클릭 이벤트
            dropdown.querySelectorAll('.plugin-menu-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    if (plugin.onAction && typeof plugin.onAction === 'function') {
                        plugin.onAction(action);
                    }
                    dropdown.classList.remove('show');
                });
            });
        });
        
        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.plugin-item')) {
                document.querySelectorAll('.plugin-dropdown').forEach(dd => {
                    dd.classList.remove('show');
                });
            }
        });
    }
}
