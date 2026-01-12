import { CONFIG } from './config/constants.js';
import { CsvService } from './services/csvService.js';
import { DataService } from './services/dataService.js';
import { StorageService } from './services/storageService.js';
import { TableRenderer } from './components/tableRenderer.js';
import { PaginationRenderer } from './components/paginationRenderer.js';
import { ToolbarRenderer } from './components/toolbarRenderer.js';
import { ModalRenderer } from './components/modalRenderer.js';
import { HeaderRenderer } from './components/headerRenderer.js';
import { ShareModalRenderer } from './components/shareModalRenderer.js';
import { SharedUsersModalRenderer } from './components/sharedUsersModalRenderer.js';
import { DashboardRenderer } from './components/dashboardRenderer.js';
import { PluginBarRenderer } from './components/pluginBarRenderer.js';
import { EditListNameModalRenderer } from './components/editListNameModalRenderer.js';
import { AutomationModalRenderer } from './components/automationModalRenderer.js';
import { RegisterByCodeModalRenderer } from './components/registerByCodeModalRenderer.js';
import { AutomationService } from './services/automationService.js';
import { UserService } from './services/userService.js';
import { FilterService } from './services/filterService.js';
import { PriceParser } from './utils/priceParser.js';
import { CheckboxHandler } from './handlers/checkboxHandler.js';
import { CellSelectionHandler } from './handlers/cellSelectionHandler.js';
import { DragScrollHandler } from './handlers/dragScrollHandler.js';
import { PaginationHandler } from './handlers/paginationHandler.js';
import { KeyboardNavigationHandler } from './handlers/keyboardNavigationHandler.js';
import { FilterRenderer } from './components/filterRenderer.js';

/**
 * 메인 애플리케이션 클래스
 */
class LectureMasterApp {
    constructor() {
        this.lectureData = [];
        this.filteredLectureData = []; // 필터링된 데이터 (저장된 리스트 선택 시)
        this.currentPageNumber = 1;
        this.itemsPerPage = CONFIG.ITEMS_PER_PAGE;
        this.selectedLectures = new Set(); // 선택된 강의 코드 Set
        this.currentListView = null; // 현재 보는 리스트 이름 (null이면 전체)
        this.targetListForAdd = null; // 강의 추가 대상 리스트 이름
        this.activeFilters = FilterService.initializeFilters(); // 활성 필터 상태
        this.currentListInfo = null; // 현재 로드된 리스트 정보 (계약유형, priceMap 등)
        
        this.tableContainer = null;
        this.toolbarContainer = null;
        this.cellSelectionHandler = new CellSelectionHandler();
        this.keyboardNavigationHandler = null;
        this.checkboxHandler = null;
        
        this.init();
    }
    
    /**
     * 애플리케이션 초기화
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.tableContainer = document.querySelector('.table-container');
            this.toolbarContainer = document.querySelector('.top-header');
            this.loadLectureData();
            this.setupSidebar();
            this.setupModalEvents();
            this.setupB2BMenuClick();
        });
    }
    
    /**
     * 강의 데이터를 로드합니다.
     */
    async loadLectureData() {
        try {
            console.log('강의 데이터 로딩 시작...');
            
            // 사용자 데이터 먼저 로드 (캐시에 저장)
            await UserService.getUsers();
            
            const rawData = await CsvService.loadCsvData();
            this.lectureData = DataService.sortData(rawData);
            this.filteredLectureData = [...this.lectureData];
            
            console.log(`데이터 로드 완료: 총 ${this.lectureData.length}개 항목`);
            
            this.renderHeader();
            this.renderToolbar();
            this.renderTable(this.currentPageNumber);
        } catch (error) {
            console.error('데이터 로드 오류:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.\n' + error.message);
        }
    }
    
    /**
     * 헤더를 렌더링합니다.
     */
    renderHeader() {
        const headerContainer = document.querySelector('.top-header');
        if (headerContainer) {
            const menuName = this.getCurrentMenuName();
            const selectedCount = this.selectedLectures.size;
            HeaderRenderer.renderToDOM(headerContainer, menuName, selectedCount);
        }
    }
    
    /**
     * 현재 메뉴명을 가져옵니다.
     * @returns {string} 메뉴명
     */
    getCurrentMenuName() {
        if (!this.currentListView) {
            return 'B2B 강의리스트';
        }
        
        if (this.currentListView.startsWith('shared_')) {
            const listName = this.currentListView.replace('shared_', '');
            return `${listName} (공유)`;
        }
        
        return this.currentListView;
    }
    
    /**
     * 상단 툴바를 렌더링합니다.
     */
    renderToolbar() {
        if (!this.toolbarContainer) {
            console.error('툴바 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        const selectedCount = this.selectedLectures.size;
        // B2B 강의리스트 화면에서만 필터 전체 초기화 버튼 표시
        const showFilterReset = !this.currentListView || this.currentListView === null;
        
        ToolbarRenderer.renderToDOM(
            this.toolbarContainer, 
            selectedCount, 
            this.itemsPerPage, 
            this.activeFilters,
            showFilterReset
        );
        
        // 헤더의 선택 개수 업데이트
        const menuName = this.getCurrentMenuName();
        HeaderRenderer.updateMenuNameAndCount(menuName, selectedCount);
        
        // 이벤트 바인딩
        this.bindToolbarEvents();
        
        // 필터 전체 초기화 버튼 이벤트 바인딩
        if (showFilterReset) {
            this.bindFilterResetButton();
        }
        
        // 강의 추가 모드인 경우 버튼 다시 렌더링
        if (this.targetListForAdd) {
            this.renderAddLecturesButton(this.targetListForAdd);
        }
        
        // 플러그인 바 렌더링
        this.renderPluginBar();
    }
    
    /**
     * 플러그인 바를 렌더링합니다.
     */
    renderPluginBar() {
        const pluginContainer = document.getElementById('pluginBarContainer');
        if (!pluginContainer) return;
        
        // 대시보드에서는 플러그인 바를 표시하지 않음
        if (this.currentListView === 'dashboard') {
            pluginContainer.innerHTML = '';
            return;
        }
        
        const plugins = [];
        
        // B2B 강의리스트 화면에서만 "강의코드로 등록하기" 플러그인 표시
        if (!this.currentListView || this.currentListView === null) {
            const registerByCodePlugin = {
                id: 'registerByCode',
                title: '강의코드로 등록하기',
                icon: 'fa-solid fa-plus',
                menuItems: [
                    {
                        label: '강의코드로 등록하기',
                        icon: 'fa-solid fa-code',
                        action: 'registerByCode'
                    }
                ],
                onAction: (action) => {
                    if (action === 'registerByCode') {
                        this.showRegisterByCodeModal();
                    }
                }
            };
            
            plugins.push(registerByCodePlugin);
        }
        
        // 내 강의리스트 화면에서만 리스트 관리 플러그인 표시 (대시보드 제외)
        if (this.currentListView && this.currentListView !== 'dashboard' && !this.currentListView.startsWith('shared_')) {
            const listName = this.currentListView;
            
            // 리스트 관리 플러그인 생성
            const listManagePlugin = {
                id: 'listManage',
                title: '리스트 관리',
                icon: 'fa-solid fa-ellipsis-vertical',
                menuItems: [
                    {
                        label: '리스트 이름 수정',
                        icon: 'fa-solid fa-pencil',
                        action: 'editName'
                    },
                    {
                        label: '강의 추가',
                        icon: 'fa-solid fa-plus',
                        action: 'addLectures'
                    },
                    {
                        label: '리스트 삭제',
                        icon: 'fa-solid fa-trash',
                        action: 'delete',
                        danger: true
                    }
                ],
                onAction: (action) => {
                    if (action === 'editName') {
                        this.showEditListNameModal(listName);
                    } else if (action === 'addLectures') {
                        this.showAddLecturesModal(listName);
                    } else if (action === 'delete') {
                        this.deleteList(listName);
                    }
                }
            };
            
            plugins.push(listManagePlugin);
        }
        
        // 내 강의리스트 또는 공유 강의리스트 화면에서 공유 플러그인 표시 (대시보드 제외)
        if (this.currentListView && this.currentListView !== 'dashboard') {
            const listName = this.getCurrentListName();
            if (listName) {
                // 공유 플러그인 생성
                const sharePlugin = {
                    id: 'share',
                    title: '공유',
                    icon: 'fa-solid fa-share-nodes',
                    menuItems: [
                        {
                            label: '공유하기',
                            icon: 'fa-solid fa-share-nodes',
                            action: 'share'
                        },
                        {
                            label: '공유된 사람 확인',
                            icon: 'fa-solid fa-users',
                            action: 'viewSharedUsers'
                        }
                    ],
                    onAction: (action) => {
                        if (action === 'share') {
                            this.showShareModal(listName);
                        } else if (action === 'viewSharedUsers') {
                            this.showSharedUsersModal(listName);
                        }
                    }
                };
                
                plugins.push(sharePlugin);
            }
        }
        
        // 내 강의리스트 화면에서만 자동화 플러그인 표시 (대시보드 제외)
        if (this.currentListView && this.currentListView !== 'dashboard' && !this.currentListView.startsWith('shared_')) {
            // 업무요청 플러그인
            const workRequestPlugin = {
                id: 'workRequest',
                title: '업무요청',
                icon: 'fa-solid fa-file-invoice',
                menuItems: [
                    {
                        label: '세금계산서 발행요청',
                        icon: 'fa-solid fa-receipt',
                        action: 'requestTaxInvoice'
                    }
                ],
                onAction: (action) => {
                    if (action === 'requestTaxInvoice') {
                        this.showAutomationModal('requestTaxInvoice');
                    }
                }
            };
            
            // 운영업무 플러그인
            const operationPlugin = {
                id: 'operation',
                title: '운영업무',
                icon: 'fa-solid fa-briefcase',
                menuItems: [
                    {
                        label: '세금계산서 발행',
                        icon: 'fa-solid fa-receipt',
                        action: 'issueTaxInvoice'
                    },
                    {
                        label: '강의료 정산파일 제작',
                        icon: 'fa-solid fa-file-export',
                        action: 'createSettlementFile'
                    }
                ],
                onAction: (action) => {
                    if (action === 'issueTaxInvoice') {
                        this.showAutomationModal('taxInvoice');
                    } else if (action === 'createSettlementFile') {
                        this.showAutomationModal('settlementFile');
                    }
                }
            };
            
            plugins.push(workRequestPlugin, operationPlugin);
        }
        
        if (plugins.length > 0) {
            PluginBarRenderer.renderToDOM(pluginContainer, plugins);
        } else {
            pluginContainer.innerHTML = '';
        }
    }
    
    /**
     * 현재 리스트 이름을 가져옵니다.
     * @returns {string|null} 리스트 이름 또는 null
     */
    getCurrentListName() {
        if (!this.currentListView) return null;
        
        if (this.currentListView.startsWith('shared_')) {
            return this.currentListView.replace('shared_', '');
        }
        
        return this.currentListView;
    }
    
    /**
     * 툴바 이벤트를 바인딩합니다.
     */
    bindToolbarEvents() {
        // 저장 버튼
        const saveBtn = document.getElementById('saveListBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.selectedLectures.size > 0) {
                    this.showSaveModal();
                }
            });
        }
        
        // 페이지당 항목 수 변경
        const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (event) => {
                this.itemsPerPage = parseInt(event.target.value);
                this.currentPageNumber = 1; // 첫 페이지로 이동
                this.renderTable(this.currentPageNumber);
                this.renderToolbar();
            });
        }
    }
    
    /**
     * 필터 전체 초기화 버튼 이벤트를 바인딩합니다.
     */
    bindFilterResetButton() {
        const resetBtn = document.getElementById('filterResetAllBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetAllFilters();
            });
        }
    }
    
    /**
     * 모든 필터를 초기화합니다.
     */
    resetAllFilters() {
        // 모든 필터 제거
        this.activeFilters = FilterService.clearAllFilters();
        
        // 필터 아이콘 상태 업데이트
        const filterIcons = document.querySelectorAll('.filter-icon-container');
        filterIcons.forEach(icon => {
            icon.classList.remove('active');
        });
        
        // 테이블 다시 렌더링
        this.renderTable(1);
        
        // 툴바 다시 렌더링 (필터 상태 블록 업데이트)
        this.renderToolbar();
    }
    
    /**
     * 테이블을 렌더링합니다.
     * @param {number} pageNumber - 렌더링할 페이지 번호
     */
    renderTable(pageNumber) {
        this.currentPageNumber = pageNumber;
        
        if (!this.tableContainer) {
            console.error('테이블 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 현재 표시할 데이터 (필터링된 데이터 또는 전체 데이터)
        let dataToDisplay = this.filteredLectureData.length > 0 
            ? this.filteredLectureData 
            : this.lectureData;
        
        // 필터 적용
        dataToDisplay = FilterService.filterData(dataToDisplay, this.activeFilters);
        
        // 현재 페이지 데이터 가져오기
        const startIndex = (pageNumber - 1) * this.itemsPerPage;
        const pageData = DataService.getPageData(
            dataToDisplay, 
            pageNumber, 
            this.itemsPerPage
        );
        
        // 전체 페이지 수 계산
        const totalPages = DataService.calculateTotalPages(
            dataToDisplay.length, 
            this.itemsPerPage
        );
        
        // 테이블 렌더링 (필터 아이콘 포함, 리스트 정보 포함)
        TableRenderer.renderToDOM(this.tableContainer, pageData, startIndex, {}, this.currentListInfo);
        
        // 기존 페이지네이션 제거 후 새로 렌더링
        const existingPagination = this.tableContainer.querySelector('.pagination');
        if (existingPagination) {
            existingPagination.remove();
        }
        
        // 페이지네이션 렌더링
        const paginationContainer = document.createElement('div');
        PaginationRenderer.renderToDOM(paginationContainer, pageNumber, totalPages);
        this.tableContainer.appendChild(paginationContainer);
        
        // 이벤트 핸들러 바인딩
        this.bindAllEvents();
        
        // 필터 이벤트 바인딩
        this.bindFilterEvents();
        
        // 필터 아이콘 상태 업데이트
        this.updateFilterIconStates();
        
        // 저장된 리스트 조회 시에도 체크박스 활성화 (강의 추가를 위해)
        // 체크박스는 항상 활성화
    }
    
    /**
     * 필터 아이콘 상태를 업데이트합니다.
     */
    updateFilterIconStates() {
        const filterIcons = document.querySelectorAll('.filter-icon-container');
        filterIcons.forEach(iconContainer => {
            const columnKey = iconContainer.dataset.columnKey;
            if (columnKey && this.activeFilters[columnKey] && this.activeFilters[columnKey].size > 0) {
                iconContainer.classList.add('active');
            } else {
                iconContainer.classList.remove('active');
            }
        });
    }
    
    /**
     * 체크박스를 비활성화합니다 (저장된 리스트 조회 전용 모드)
     */
    disableCheckboxes() {
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        
        if (selectAllCheckbox) {
            selectAllCheckbox.disabled = true;
        }
        
        rowCheckboxes.forEach(checkbox => {
            checkbox.disabled = true;
        });
    }
    
    /**
     * 모든 이벤트 핸들러를 바인딩합니다.
     */
    bindAllEvents() {
        // 페이지네이션
        PaginationHandler.bindEvents((pageNumber) => {
            this.renderTable(pageNumber);
        });
        
        // 드래그 스크롤
        DragScrollHandler.bindEvents();
        
        // 셀 선택
        this.cellSelectionHandler.bindEvents();
        
        // 키보드 네비게이션 (엑셀 스타일)
        this.keyboardNavigationHandler = new KeyboardNavigationHandler(this);
        this.keyboardNavigationHandler.bindEvents();
        
        // 체크박스 (선택 상태 전역 관리)
        this.checkboxHandler = new CheckboxHandler(
            this.selectedLectures,
            () => this.onSelectionChange()
        );
        this.checkboxHandler.bindEvents();
    }
    
    /**
     * 선택 상태 변경 시 호출되는 콜백
     */
    onSelectionChange() {
        this.renderToolbar();
    }
    
    /**
     * 필터 이벤트를 바인딩합니다.
     */
    bindFilterEvents() {
        const table = document.querySelector('.data-table');
        if (!table) return;
        
        // 필터 아이콘 클릭 이벤트
        const filterIcons = table.querySelectorAll('.filter-icon-container');
        filterIcons.forEach(iconContainer => {
            iconContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                const columnKey = iconContainer.dataset.columnKey;
                if (columnKey) {
                    this.showFilterDropdown(columnKey, iconContainer);
                }
            });
        });
    }
    
    /**
     * 필터 드롭다운을 표시합니다.
     * @param {string} columnKey - 컬럼 키
     * @param {HTMLElement} iconContainer - 필터 아이콘 컨테이너
     */
    showFilterDropdown(columnKey, iconContainer) {
        // 현재 표시할 데이터 (필터링된 데이터 또는 전체 데이터)
        let dataToDisplay = this.filteredLectureData.length > 0 
            ? this.filteredLectureData 
            : this.lectureData;
        
        // 현재 필터가 적용된 데이터 기준으로 고윳값 추출 (연쇄 필터링)
        dataToDisplay = FilterService.filterData(dataToDisplay, this.activeFilters);
        
        // 해당 컬럼의 고윳값 추출 (필터링된 데이터 기준)
        const uniqueValues = FilterService.getUniqueValues(dataToDisplay, columnKey);
        
        // 현재 선택된 필터 값
        const selectedValues = this.activeFilters[columnKey] || new Set();
        
        // 드롭다운 표시
        FilterRenderer.showFilterDropdown(
            iconContainer,
            columnKey,
            uniqueValues,
            selectedValues,
            (colKey, selected) => this.applyFilter(colKey, selected),
            (query, colKey) => FilterRenderer.filterValues(colKey, query)
        );
        
        // 필터 아이콘 활성화 표시
        iconContainer.classList.add('active');
    }
    
    /**
     * 필터를 적용합니다.
     * @param {string} columnKey - 컬럼 키
     * @param {Set<string>} selectedValues - 선택된 값들의 Set
     */
    applyFilter(columnKey, selectedValues) {
        // 필터 업데이트
        this.activeFilters = FilterService.updateFilter(this.activeFilters, columnKey, selectedValues);
        
        // 필터 아이콘 상태 업데이트
        const filterIcon = document.querySelector(`[data-column-key="${columnKey}"]`);
        if (filterIcon) {
            if (selectedValues && selectedValues.size > 0) {
                filterIcon.classList.add('active');
            } else {
                filterIcon.classList.remove('active');
            }
        }
        
        // 테이블 다시 렌더링
        this.renderTable(1); // 첫 페이지로 이동
        
        // 툴바 다시 렌더링 (필터 상태 블록 업데이트)
        this.renderToolbar();
    }
    
    /**
     * 저장 모달을 표시합니다.
     */
    showSaveModal() {
        const modalContainer = document.body;
        const selectedCount = this.selectedLectures.size;
        
        // 선택된 강의 데이터 가져오기
        const selectedLectures = this.getSelectedLecturesData();
        
        // 카테고리별 개수 계산
        const categoryCounts = {};
        selectedLectures.forEach(lecture => {
            const category = lecture['카테고리'] || '미분류';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        ModalRenderer.renderSaveModalToDOM(modalContainer, selectedCount, categoryCounts, selectedLectures);
        ModalRenderer.showModal();
        
        // 저장 모달 내 공유 자동완성 이벤트 바인딩
        this.setupSaveModalShareAutocomplete();
    }
    
    /**
     * 저장 모달 내 공유 자동완성 이벤트를 설정합니다.
     */
    setupSaveModalShareAutocomplete() {
        const input = document.getElementById('saveModalShareInput');
        const dropdown = document.getElementById('saveModalAutocompleteDropdown');
        if (!input || !dropdown) return;
        
        let selectedIndex = -1;
        let filteredUsers = [];
        let allUsers = UserService.getUsersSync();
        
        input.addEventListener('input', async (e) => {
            const query = e.target.value.trim().toLowerCase();
            selectedIndex = -1;
            
            if (!query) {
                filteredUsers = [];
                dropdown.classList.remove('show');
                return;
            }
            
            // 사용자 데이터가 없으면 다시 로드 시도
            if (!allUsers || allUsers.length === 0) {
                allUsers = await UserService.getUsers();
            }
            
            // 사용자 필터링
            filteredUsers = allUsers.filter(user => {
                const team = (user.team || '').toLowerCase();
                const name = (user.name || '').toLowerCase();
                const id = (user.id || '').toLowerCase();
                return team.includes(query) || name.includes(query) || id.includes(query) ||
                       `${team}/${name}/${id}`.includes(query);
            });
            
            ShareModalRenderer.updateAutocomplete(filteredUsers, query, selectedIndex, dropdown, allUsers);
        });
        
        // 키보드 이벤트
        input.addEventListener('keydown', async (e) => {
            // 사용자 데이터가 없으면 다시 로드 시도
            if (!allUsers || allUsers.length === 0) {
                allUsers = await UserService.getUsers();
            }
            
            const query = input.value.trim().toLowerCase();
            const uniqueTeams = [...new Set(allUsers.map(u => u.team).filter(Boolean))];
            const matchingTeam = uniqueTeams.find(team => team.toLowerCase() === query.toLowerCase());
            const teamUsers = matchingTeam ? allUsers.filter(u => u.team === matchingTeam) : [];
            const hasTeamOption = matchingTeam && teamUsers.length > 0;
            const totalItems = (hasTeamOption ? 1 : 0) + filteredUsers.length;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, totalItems - 1);
                ShareModalRenderer.updateAutocomplete(filteredUsers, input.value, selectedIndex, dropdown, allUsers);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                ShareModalRenderer.updateAutocomplete(filteredUsers, input.value, selectedIndex, dropdown, allUsers);
            } else if (e.key === 'Enter' && selectedIndex >= 0 && totalItems > 0) {
                e.preventDefault();
                
                // 팀 전체 옵션 선택 확인
                if (hasTeamOption && selectedIndex === 0) {
                    input.value = matchingTeam;
                    dropdown.classList.remove('show');
                } else {
                    const userIndex = hasTeamOption ? selectedIndex - 1 : selectedIndex;
                    if (userIndex >= 0 && userIndex < filteredUsers.length) {
                        const selectedUser = filteredUsers[userIndex];
                        input.value = `${selectedUser.team}/${selectedUser.name}/${selectedUser.id}`;
                        dropdown.classList.remove('show');
                    }
                }
            }
        });
        
        // 드롭다운 아이템 클릭
        dropdown.addEventListener('click', async (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                // 사용자 데이터가 없으면 다시 로드 시도
                if (!allUsers || allUsers.length === 0) {
                    allUsers = await UserService.getUsers();
                }
                
                // 팀 전체 옵션 클릭 확인
                if (item.dataset.type === 'team' && item.dataset.team) {
                    input.value = item.dataset.team;
                    dropdown.classList.remove('show');
                } else if (item.dataset.type === 'user' && item.dataset.userId) {
                    const userId = item.dataset.userId;
                    const user = allUsers.find(u => u.id === userId);
                    if (user) {
                        input.value = `${user.team}/${user.name}/${user.id}`;
                        dropdown.classList.remove('show');
                    }
                }
            }
        });
        
        // 공유 버튼 클릭
        const shareBtn = document.getElementById('shareFromSaveBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareFromSaveModal();
            });
        }

        // 계약유형 변경 이벤트
        const contractTypeRadios = document.querySelectorAll('input[name="contractType"]');
        contractTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const contractType = e.target.value;
                const priceMappingSection = document.getElementById('priceMappingSection');
                const priceMappingLogSection = document.getElementById('priceMappingLogSection');
                const confirmSaveBtn = document.getElementById('confirmSaveBtn');

                if (contractType === '인당과금') {
                    // 인당과금 선택 시 금액 매핑 입력 영역 표시
                    if (priceMappingSection) {
                        priceMappingSection.style.display = 'block';
                    }
                    if (priceMappingLogSection) {
                        priceMappingLogSection.style.display = 'block';
                    }
                    // 저장 버튼 비활성화 (파싱 완료 전까지)
                    if (confirmSaveBtn) {
                        confirmSaveBtn.disabled = true;
                    }
                } else {
                    // 턴키 또는 개별결제 선택 시 금액 매핑 입력 영역 숨김
                    if (priceMappingSection) {
                        priceMappingSection.style.display = 'none';
                    }
                    if (priceMappingLogSection) {
                        priceMappingLogSection.style.display = 'none';
                    }
                    // 저장 버튼 활성화 (인당과금이 아니면 바로 저장 가능)
                    if (confirmSaveBtn) {
                        confirmSaveBtn.disabled = false;
                    }
                    // 파싱 로그 초기화
                    const logElement = document.getElementById('priceMappingLog');
                    if (logElement) {
                        logElement.textContent = '';
                    }
                }
            });
        });

        // 파싱 실행 버튼 클릭 이벤트
        const executeBtn = document.getElementById('executePriceMappingBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                this.executePriceMapping();
            });
        }

        // 리스트 이름 입력 시 저장 버튼 활성화 확인
        const listNameInput = document.getElementById('listNameInput');
        if (listNameInput) {
            listNameInput.addEventListener('input', () => {
                this.updateSaveButtonState();
            });
        }
    }

    /**
     * 저장 버튼 상태를 업데이트합니다.
     */
    updateSaveButtonState() {
        const listNameInput = document.getElementById('listNameInput');
        const confirmSaveBtn = document.getElementById('confirmSaveBtn');
        const contractTypeRadio = document.querySelector('input[name="contractType"]:checked');
        const contractType = contractTypeRadio ? contractTypeRadio.value : '턴키';

        if (!confirmSaveBtn) return;

        const listName = listNameInput ? listNameInput.value.trim() : '';

        if (!listName) {
            confirmSaveBtn.disabled = true;
            return;
        }

        // 인당과금이 아닌 경우 리스트 이름만 입력되면 저장 가능
        if (contractType !== '인당과금') {
            confirmSaveBtn.disabled = false;
            return;
        }

        // 인당과금인 경우 파싱이 완료되어야 저장 가능
        const overlay = document.getElementById('saveModalOverlay');
        const priceMapData = overlay ? overlay.dataset.priceMap : '';
        if (priceMapData && priceMapData.trim() !== '') {
            try {
                const priceMap = JSON.parse(priceMapData);
                const selectedCodes = Array.from(this.selectedLectures);
                const unmappedCodes = selectedCodes.filter(code => !priceMap[code]);
                confirmSaveBtn.disabled = unmappedCodes.length > 0;
            } catch (e) {
                confirmSaveBtn.disabled = true;
            }
        } else {
            confirmSaveBtn.disabled = true;
        }
    }

    /**
     * 금액 매핑 파싱을 실행합니다.
     */
    executePriceMapping() {
        const priceMappingInput = document.getElementById('priceMappingInput');
        const logElement = document.getElementById('priceMappingLog');
        const confirmSaveBtn = document.getElementById('confirmSaveBtn');

        if (!priceMappingInput || !logElement) {
            return;
        }

        const inputText = priceMappingInput.value.trim();

        if (!inputText) {
            logElement.textContent = '❌ 입력된 데이터가 없습니다.\n금액 매핑 데이터를 입력해주세요.';
            if (confirmSaveBtn) {
                confirmSaveBtn.disabled = true;
            }
            return;
        }

        // 선택된 강의코드 Set 생성
        const selectedCodes = Array.from(this.selectedLectures);
        const validCodesSet = new Set(selectedCodes);

        // 파싱 실행
        const parseResult = PriceParser.parsePriceMapping(inputText, validCodesSet);

        // 로그 생성 및 표시
        const logText = PriceParser.formatParseLog(parseResult, selectedCodes);
        logElement.textContent = logText;

        // 파싱 상태에 따라 저장 버튼 활성/비활성화
        const contractType = document.querySelector('input[name="contractType"]:checked')?.value;
        const overlay = document.getElementById('saveModalOverlay');
        
        if (contractType === '인당과금') {
            // 인당과금일 경우 모든 선택된 강의코드가 매핑되었는지 확인
            const unmappedCodes = selectedCodes.filter(code => !parseResult.priceMap[code]);
            if (parseResult.success && unmappedCodes.length === 0) {
                // 모든 강의코드가 매핑되었으면 저장 버튼 활성화
                if (confirmSaveBtn) {
                    confirmSaveBtn.disabled = false;
                    // 파싱 결과를 모달에 저장 (나중에 저장 시 사용)
                    if (overlay) {
                        overlay.dataset.priceMap = JSON.stringify(parseResult.priceMap);
                    }
                }
            } else {
                // 매핑이 완료되지 않았으면 저장 버튼 비활성화
                if (confirmSaveBtn) {
                    confirmSaveBtn.disabled = true;
                }
                if (overlay) {
                    overlay.dataset.priceMap = '';
                }
            }
        } else {
            // 인당과금이 아닌 경우 파싱 결과 저장하지 않음
            if (overlay) {
                overlay.dataset.priceMap = '';
            }
        }
    }
    
    /**
     * 선택된 강의의 데이터를 가져옵니다.
     * @returns {Array<Object>} 선택된 강의 데이터 배열
     */
    getSelectedLecturesData() {
        const selectedCodes = Array.from(this.selectedLectures);
        return this.lectureData.filter(lecture => 
            selectedCodes.includes(lecture['강의코드'])
        );
    }
    
    /**
     * 모달 이벤트를 설정합니다.
     */
    setupModalEvents() {
        // ESC 키로 모든 모달 닫기
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                // 열려있는 모달 찾아서 닫기
                if (document.getElementById('saveModalOverlay')?.classList.contains('active')) {
                    this.closeSaveModal();
                } else if (document.getElementById('shareModalOverlay')?.classList.contains('active')) {
                    this.closeShareModal();
                } else if (document.getElementById('editListNameModalOverlay')?.classList.contains('active')) {
                    this.closeEditListNameModal();
                }
            }
        });
    }
    
    /**
     * 저장 모달을 닫습니다.
     */
    closeSaveModal() {
        ModalRenderer.hideModal();
        setTimeout(() => {
            ModalRenderer.removeModal();
        }, 300);
    }
    
    /**
     * 강의리스트를 저장합니다.
     */
    saveLectureList() {
        const listNameInput = document.getElementById('listNameInput');
        const listName = listNameInput ? listNameInput.value.trim() : '';
        
        if (!listName) {
            alert('리스트 이름을 입력해주세요.');
            return;
        }

        // 계약유형 가져오기
        const contractTypeRadio = document.querySelector('input[name="contractType"]:checked');
        const contractType = contractTypeRadio ? contractTypeRadio.value : '턴키';

        // 금액 매핑 가져오기 (인당과금일 경우)
        let priceMap = {};
        if (contractType === '인당과금') {
            const overlay = document.getElementById('saveModalOverlay');
            const priceMapData = overlay ? overlay.dataset.priceMap : '';
            if (priceMapData) {
                try {
                    priceMap = JSON.parse(priceMapData);
                } catch (e) {
                    alert('금액 매핑 데이터를 불러올 수 없습니다. 다시 파싱을 실행해주세요.');
                    return;
                }
            } else {
                alert('인당과금 계약유형은 금액 매핑이 필요합니다. "실행" 버튼을 눌러 매핑을 완료해주세요.');
                return;
            }
        }
        
        try {
            const selectedCodes = Array.from(this.selectedLectures);
            StorageService.saveLectureList(listName, selectedCodes, contractType, priceMap);
            
            // 공유하기도 함께 처리
            const shareInput = document.getElementById('saveModalShareInput');
            const sharedWith = shareInput ? shareInput.value.trim() : '';
            
            if (sharedWith) {
                try {
                    StorageService.shareLectureList(listName, sharedWith);
                } catch (shareError) {
                    console.error('공유 오류:', shareError);
                    // 공유 실패해도 저장은 성공했으므로 계속 진행
                }
            }
            
            alert(`"${listName}" 리스트가 저장되었습니다. (계약유형: ${contractType})${sharedWith ? ' (공유 완료)' : ''}`);
            this.closeSaveModal();
            
            // B2B 강의리스트 화면으로 이동
            this.showAllLectures();
            this.setupSidebar(); // 사이드바 업데이트
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * 저장 모달에서 공유하기를 처리합니다.
     */
    shareFromSaveModal() {
        const shareInput = document.getElementById('saveModalShareInput');
        const sharedWith = shareInput ? shareInput.value.trim() : '';
        
        if (!sharedWith) {
            alert('공유 대상을 입력해주세요.');
            return;
        }
        
        const listNameInput = document.getElementById('listNameInput');
        const listName = listNameInput ? listNameInput.value.trim() : '';
        
        if (!listName) {
            alert('먼저 리스트 이름을 입력해주세요.');
            return;
        }

        // 계약유형 가져오기
        const contractTypeRadio = document.querySelector('input[name="contractType"]:checked');
        const contractType = contractTypeRadio ? contractTypeRadio.value : '턴키';

        // 금액 매핑 가져오기 (인당과금일 경우)
        let priceMap = {};
        if (contractType === '인당과금') {
            const overlay = document.getElementById('saveModalOverlay');
            const priceMapData = overlay ? overlay.dataset.priceMap : '';
            if (priceMapData) {
                try {
                    priceMap = JSON.parse(priceMapData);
                } catch (e) {
                    alert('금액 매핑 데이터를 불러올 수 없습니다. 다시 파싱을 실행해주세요.');
                    return;
                }
            } else {
                alert('인당과금 계약유형은 금액 매핑이 필요합니다. "실행" 버튼을 눌러 매핑을 완료해주세요.');
                return;
            }
        }
        
        try {
            // 먼저 저장 (계약유형과 금액 매핑 포함)
            const selectedCodes = Array.from(this.selectedLectures);
            StorageService.saveLectureList(listName, selectedCodes, contractType, priceMap);
            
            // 그 다음 공유
            StorageService.shareLectureList(listName, sharedWith);
            
            alert(`"${listName}" 리스트가 저장되고 공유되었습니다. (계약유형: ${contractType})`);
            this.closeSaveModal();
            
            // 대시보드가 활성화되어 있으면 대시보드로, 아니면 B2B 강의리스트 화면으로
            if (this.currentListView === 'dashboard' || document.querySelector('.dashboard-container')?.style.display === 'block') {
                this.showDashboard();
            } else {
                this.showAllLectures();
            }
            this.setupSidebar(); // 사이드바 업데이트
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * 사이드바를 설정합니다.
     */
    setupSidebar() {
        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (!sidebarMenu) return;
        
        const savedLists = StorageService.loadAllLists();
        const sharedLists = StorageService.loadSharedLists();
        const currentUserId = StorageService.getCurrentUser()?.id;
        const allUsers = UserService.getUsersSync();
        const currentUser = allUsers.find(u => u.id === currentUserId);
        const currentUserTeam = currentUser?.team;
        
        // 공유받은 리스트 필터링 (개별 사용자 공유 + 팀 전체 공유)
        const receivedLists = sharedLists.filter(list => {
            if (!currentUserId) return false;
            
            const sharedWith = list.sharedWith || '';
            
            // 팀 전체 공유 확인 (sharedWith에 "/"가 없고, 팀 이름인 경우)
            if (sharedWith && !sharedWith.includes('/')) {
                // 팀 이름으로 공유된 경우, 현재 사용자가 그 팀에 속하는지 확인
                if (currentUserTeam && sharedWith === currentUserTeam) {
                    return true;
                }
            }
            
            // 개별 사용자 공유 확인
            if (sharedWith && sharedWith.includes('/')) {
                const parts = sharedWith.split('/');
                const idFromSharedWith = parts[parts.length - 1]?.trim();
                return idFromSharedWith === currentUserId || list.sharedWithId === currentUserId;
            }
            
            return sharedWith === currentUserId || list.sharedWithId === currentUserId;
        });
        
        // 기존 섹션 제거
        const existingSections = document.querySelectorAll('.saved-lists-section, .shared-lists-section');
        existingSections.forEach(section => section.remove());
        
        // "내 강의리스트" 섹션 생성 (드롭다운) - 대시보드를 위해 항상 표시
        const listSection = document.createElement('li');
        listSection.className = 'saved-lists-section';
        listSection.innerHTML = `
            <div class="menu-section-title dropdown-toggle" id="myListsToggle">
                <i class="fa-solid fa-book"></i>
                <span class="link-text">내 강의리스트</span>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
        `;
        
        const listContainer = document.createElement('ul');
        listContainer.className = 'saved-lists dropdown-menu';
        
        // 대시보드 메뉴 항목 추가 (최상단)
        const dashboardItem = document.createElement('li');
        dashboardItem.className = `menu-item dashboard-menu-item ${this.currentListView === 'dashboard' ? 'active' : ''}`;
        dashboardItem.innerHTML = `
            <a href="#" data-dashboard="true">
                <i class="fa-solid fa-gauge-high"></i>
                <span class="link-text">대시보드</span>
            </a>
        `;
        
        dashboardItem.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // 드롭다운 닫기
            const toggle = listSection.querySelector('#myListsToggle');
            toggle?.classList.remove('active');
            listContainer.classList.remove('open');
            // 대시보드 표시
            this.showDashboard();
        });
        
        listContainer.appendChild(dashboardItem);
        
        // 저장된 리스트가 있을 때만 리스트 표시
        if (savedLists.length > 0) {
            savedLists.forEach(list => {
                const listItem = document.createElement('li');
                listItem.className = `menu-item saved-list-item ${this.currentListView === list.name ? 'active' : ''}`;
                listItem.innerHTML = `
                    <a href="#" data-list-name="${list.name}">
                        <i class="fa-solid fa-file-lines"></i>
                        <span class="link-text">${list.name} (${list.lectureCodes.length})</span>
                    </a>
                `;
                
                listItem.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // 드롭다운 닫기
                    const toggle = listSection.querySelector('#myListsToggle');
                    toggle?.classList.remove('active');
                    listContainer.classList.remove('open');
                    // 리스트 열기
                    this.loadSavedList(list.name);
                });
                
                listContainer.appendChild(listItem);
            });
        }
        
        listSection.appendChild(listContainer);
        sidebarMenu.appendChild(listSection);
        
        // 드롭다운 토글
        const toggle = listSection.querySelector('#myListsToggle');
        toggle?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle.classList.toggle('active');
            listContainer.classList.toggle('open');
        });
        
        // "공유 강의리스트" 섹션 생성 (드롭다운)
        if (receivedLists.length > 0) {
            const sharedSection = document.createElement('li');
            sharedSection.className = 'shared-lists-section';
            sharedSection.innerHTML = `
                <div class="menu-section-title dropdown-toggle" id="sharedListsToggle">
                    <i class="fa-solid fa-share-nodes"></i>
                    <span class="link-text">공유 강의리스트</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </div>
            `;
            
            const sharedContainer = document.createElement('ul');
            sharedContainer.className = 'shared-lists dropdown-menu';
            
            receivedLists.forEach(sharedList => {
                const listItem = document.createElement('li');
                listItem.className = 'menu-item shared-list-item';
                listItem.innerHTML = `
                    <a href="#" data-shared-list-name="${sharedList.listName}">
                        <i class="fa-solid fa-file-lines"></i>
                        <span class="link-text">${sharedList.listName} (${sharedList.lectureCodes.length})</span>
                    </a>
                `;
                
                listItem.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadSharedList(sharedList);
                });
                
                sharedContainer.appendChild(listItem);
            });
            
            sharedSection.appendChild(sharedContainer);
            sidebarMenu.appendChild(sharedSection);
            
            // 드롭다운 토글
            const toggle = sharedSection.querySelector('#sharedListsToggle');
            toggle?.addEventListener('click', () => {
                toggle.classList.toggle('active');
                sharedContainer.classList.toggle('open');
            });
        }
    }
    
    /**
     * 공유된 리스트를 로드합니다.
     * @param {Object} sharedList - 공유된 리스트 객체
     */
    loadSharedList(sharedList) {
        const lectureCodesSet = new Set(sharedList.lectureCodes);
        
        // 필터링된 데이터 생성
        this.filteredLectureData = this.lectureData.filter(lecture => 
            lectureCodesSet.has(lecture['강의코드'])
        );
        
        this.currentListView = `shared_${sharedList.listName}`;
        this.selectedLectures.clear();
        
        // 필터 초기화 (공유 리스트 로드 시)
        this.activeFilters = FilterService.clearAllFilters();
        
        const selectedCount = this.selectedLectures.size;
        HeaderRenderer.updateMenuNameAndCount(`${sharedList.listName} (공유)`, selectedCount);
        
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
    }
    
    /**
     * 공유 모달을 표시합니다.
     * @param {string} listName - 공유할 리스트 이름
     */
    showShareModal(listName) {
        const modalContainer = document.body;
        ShareModalRenderer.renderToDOM(modalContainer, listName);
        ShareModalRenderer.showModal();
        
        // 자동완성 이벤트 바인딩
        this.setupShareAutocomplete();
    }
    
    /**
     * 공유 자동완성 이벤트를 설정합니다.
     */
    setupShareAutocomplete() {
        const input = document.getElementById('shareInput');
        const dropdown = document.getElementById('autocompleteDropdown');
        if (!input || !dropdown) return;
        
        let selectedIndex = -1;
        let filteredUsers = [];
        let allUsers = UserService.getUsersSync();
        
        // 총 아이템 수 계산 (팀 전체 + 사용자)
        const getTotalItemsCount = (query) => {
            if (!allUsers || allUsers.length === 0) return filteredUsers.length;
            const uniqueTeams = [...new Set(allUsers.map(u => u.team).filter(Boolean))];
            const matchingTeam = uniqueTeams.find(team => team.toLowerCase() === query.toLowerCase());
            const teamUsers = matchingTeam ? allUsers.filter(u => u.team === matchingTeam) : [];
            return (matchingTeam && teamUsers.length > 0 ? 1 : 0) + filteredUsers.length;
        };
        
        input.addEventListener('input', async (e) => {
            const query = e.target.value.trim().toLowerCase();
            selectedIndex = -1;
            
            if (!query) {
                filteredUsers = [];
                dropdown.classList.remove('show');
                return;
            }
            
            // 사용자 데이터가 없으면 다시 로드 시도
            if (!allUsers || allUsers.length === 0) {
                allUsers = await UserService.getUsers();
            }
            
            // 사용자 필터링
            filteredUsers = allUsers.filter(user => {
                const team = (user.team || '').toLowerCase();
                const name = (user.name || '').toLowerCase();
                const id = (user.id || '').toLowerCase();
                return team.includes(query) || name.includes(query) || id.includes(query) ||
                       `${team}/${name}/${id}`.includes(query);
            });
            
            ShareModalRenderer.updateAutocomplete(filteredUsers, query, selectedIndex, dropdown, allUsers);
        });
        
        // 키보드 이벤트
        input.addEventListener('keydown', async (e) => {
            // 사용자 데이터가 없으면 다시 로드 시도
            if (!allUsers || allUsers.length === 0) {
                allUsers = await UserService.getUsers();
            }
            
            const query = input.value.trim().toLowerCase();
            const uniqueTeams = [...new Set(allUsers.map(u => u.team).filter(Boolean))];
            const matchingTeam = uniqueTeams.find(team => team.toLowerCase() === query.toLowerCase());
            const teamUsers = matchingTeam ? allUsers.filter(u => u.team === matchingTeam) : [];
            const hasTeamOption = matchingTeam && teamUsers.length > 0;
            const totalItems = (hasTeamOption ? 1 : 0) + filteredUsers.length;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, totalItems - 1);
                ShareModalRenderer.updateAutocomplete(filteredUsers, input.value, selectedIndex, dropdown, allUsers);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                ShareModalRenderer.updateAutocomplete(filteredUsers, input.value, selectedIndex, dropdown, allUsers);
            } else if (e.key === 'Enter' && selectedIndex >= 0 && totalItems > 0) {
                e.preventDefault();
                
                // 팀 전체 옵션 선택 확인
                if (hasTeamOption && selectedIndex === 0) {
                    input.value = matchingTeam;
                    dropdown.classList.remove('show');
                } else {
                    const userIndex = hasTeamOption ? selectedIndex - 1 : selectedIndex;
                    if (userIndex >= 0 && userIndex < filteredUsers.length) {
                        const selectedUser = filteredUsers[userIndex];
                        input.value = `${selectedUser.team}/${selectedUser.name}/${selectedUser.id}`;
                        dropdown.classList.remove('show');
                    }
                }
            }
        });
        
        // 드롭다운 아이템 클릭
        dropdown.addEventListener('click', async (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                // 사용자 데이터가 없으면 다시 로드 시도
                if (!allUsers || allUsers.length === 0) {
                    allUsers = await UserService.getUsers();
                }
                
                // 팀 전체 옵션 클릭 확인
                if (item.dataset.type === 'team' && item.dataset.team) {
                    input.value = item.dataset.team;
                    dropdown.classList.remove('show');
                } else if (item.dataset.type === 'user' && item.dataset.userId) {
                    const userId = item.dataset.userId;
                    const user = allUsers.find(u => u.id === userId);
                    if (user) {
                        input.value = `${user.team}/${user.name}/${user.id}`;
                        dropdown.classList.remove('show');
                    }
                }
            }
        });
    }
    
    /**
     * 강의리스트를 공유합니다.
     */
    shareLectureList() {
        const shareInput = document.getElementById('shareInput');
        const sharedWith = shareInput ? shareInput.value.trim() : '';
        
        if (!sharedWith) {
            alert('공유 대상을 입력해주세요.');
            return;
        }
        
        // 모달에서 리스트 이름 가져오기
        const listNameElement = document.querySelector('#shareModalOverlay .form-info');
        const listName = listNameElement ? listNameElement.textContent.trim() : '';
        
        if (!listName) {
            alert('리스트 이름을 찾을 수 없습니다.');
            return;
        }
        
        try {
            StorageService.shareLectureList(listName, sharedWith);
            alert(`"${listName}" 리스트가 공유되었습니다.`);
            this.closeShareModal();
            this.setupSidebar(); // 사이드바 업데이트
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * 공유 모달을 닫습니다.
     */
    closeShareModal() {
        ShareModalRenderer.hideModal();
        setTimeout(() => {
            ShareModalRenderer.removeModal();
        }, 300);
    }
    
    /**
     * 공유된 사람 확인 모달을 표시합니다.
     * @param {string} listName - 리스트 이름
     */
    showSharedUsersModal(listName) {
        const modalContainer = document.body;
        SharedUsersModalRenderer.renderToDOM(modalContainer, listName);
        SharedUsersModalRenderer.showModal();
    }
    
    /**
     * 공유된 사람 확인 모달을 닫습니다.
     */
    closeSharedUsersModal() {
        SharedUsersModalRenderer.hideModal();
        setTimeout(() => {
            SharedUsersModalRenderer.removeModal();
        }, 300);
    }
    
    /**
     * 저장된 리스트를 로드합니다.
     * @param {string} listName - 리스트 이름
     */
    loadSavedList(listName) {
        const list = StorageService.loadLectureList(listName);
        if (!list) {
            alert('리스트를 찾을 수 없습니다.');
            return;
        }
        
        this.currentListView = listName;
        const lectureCodesSet = new Set(list.lectureCodes);
        
        // 리스트 정보 저장 (계약유형, priceMap 등)
        this.currentListInfo = {
            name: list.name,
            contractType: list.contractType || '턴키',
            priceMap: list.priceMap || {}
        };
        
        // 필터링된 데이터 생성
        this.filteredLectureData = this.lectureData.filter(lecture => 
            lectureCodesSet.has(lecture['강의코드'])
        );
        
        // 선택 상태는 초기화 (강의 추가를 위해 체크박스 활성화)
        this.selectedLectures.clear();
        
        // 필터 초기화 (저장된 리스트 로드 시)
        this.activeFilters = FilterService.clearAllFilters();
        
        // 헤더 업데이트
        const selectedCount = this.selectedLectures.size;
        HeaderRenderer.updateMenuNameAndCount(listName, selectedCount);
        
        // 사이드바 활성 상태 업데이트
        document.querySelectorAll('.saved-list-item, .dashboard-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-menu > .menu-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-list-name="${listName}"]`)?.closest('.saved-list-item');
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // 테이블 컨테이너 표시
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.style.display = 'flex';
        }
        
        // 대시보드 숨기기
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }
        
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
        this.renderPluginBar(); // 플러그인 바 렌더링 (리스트 관리 포함)
    }
    
    
    /**
     * 강의 추가 모달을 표시합니다.
     * @param {string} listName - 리스트 이름
     */
    showAddLecturesModal(listName) {
        // B2B 강의리스트로 이동하여 강의 선택 가능하도록
        this.showAllLectures();
        
        // 안내 메시지
        alert(`"${listName}" 리스트에 강의를 추가하려면 강의를 선택한 후 "선택한 강의 추가" 버튼을 클릭하세요.`);
        
        // 현재 리스트 이름 저장 (추가 시 사용)
        this.targetListForAdd = listName;
        
        // 툴바에 "선택한 강의 추가" 버튼 표시
        this.renderAddLecturesButton(listName);
    }
    
    /**
     * 강의 추가 버튼을 툴바에 렌더링합니다.
     * @param {string} listName - 리스트 이름
     */
    renderAddLecturesButton(listName) {
        const toolbarContainer = this.toolbarContainer;
        if (!toolbarContainer) return;
        
        // 기존 추가 버튼 제거
        const existingBtn = toolbarContainer.querySelector('#addToExistingListBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // 추가 버튼 생성
        const addBtn = document.createElement('button');
        addBtn.id = 'addToExistingListBtn';
        addBtn.className = 'btn-add-to-list';
        addBtn.innerHTML = `
            <i class="fa-solid fa-plus"></i> 선택한 강의 추가
        `;
        addBtn.title = `"${listName}" 리스트에 추가`;
        
        addBtn.addEventListener('click', () => {
            this.addLecturesToList(listName);
        });
        
        // 저장 버튼 앞에 추가
        const saveBtn = toolbarContainer.querySelector('#saveListBtn');
        if (saveBtn && saveBtn.parentNode) {
            saveBtn.parentNode.insertBefore(addBtn, saveBtn);
        } else {
            toolbarContainer.querySelector('.toolbar-right')?.appendChild(addBtn);
        }
    }
    
    /**
     * 선택한 강의를 리스트에 추가합니다.
     * @param {string} listName - 리스트 이름
     */
    addLecturesToList(listName) {
        if (this.selectedLectures.size === 0) {
            alert('추가할 강의를 선택해주세요.');
            return;
        }
        
        const selectedCodes = Array.from(this.selectedLectures);
        
        try {
            StorageService.addLecturesToList(listName, selectedCodes);
            
            // 추가 버튼 제거
            const addBtn = document.querySelector('#addToExistingListBtn');
            if (addBtn) {
                addBtn.remove();
            }
            
            this.targetListForAdd = null;
            
            alert(`"${listName}" 리스트에 ${selectedCodes.length}개의 강의가 추가되었습니다.`);
            
            // 리스트 다시 로드
            this.loadSavedList(listName);
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * 리스트를 삭제합니다.
     * @param {string} listName - 리스트 이름
     */
    deleteList(listName) {
        if (!confirm(`"${listName}" 리스트를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }
        
        try {
            StorageService.deleteLectureList(listName);
            
            alert(`"${listName}" 리스트가 삭제되었습니다.`);
            
            // 현재 뷰가 삭제된 리스트인 경우 대시보드 또는 전체 리스트로 이동
            if (this.currentListView === listName) {
                // 대시보드가 활성화되어 있으면 대시보드로, 아니면 전체 리스트로
                if (this.currentListView === 'dashboard' || document.querySelector('.dashboard-container')?.style.display === 'block') {
                    this.showDashboard();
                } else {
                    this.showAllLectures();
                }
            } else if (this.currentListView === 'dashboard') {
                // 대시보드가 표시 중이면 대시보드 새로고침
                this.renderDashboard();
            }
            
            this.setupSidebar(); // 사이드바 업데이트
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * 전체 리스트로 돌아갑니다.
     */
    showAllLectures() {
        this.currentListView = null;
        this.currentListInfo = null; // 리스트 정보 초기화
        this.filteredLectureData = [...this.lectureData];
        this.selectedLectures.clear();
        
        // 필터 초기화 (B2B 강의리스트로 돌아갈 때)
        this.activeFilters = FilterService.clearAllFilters();
        
        const selectedCount = this.selectedLectures.size;
        HeaderRenderer.updateMenuNameAndCount('B2B 강의리스트', selectedCount);
        
        document.querySelectorAll('.saved-list-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const mainMenuItem = document.querySelector('.sidebar-menu > .menu-item');
        if (mainMenuItem) {
            mainMenuItem.classList.add('active');
        }
        
        // 강의 추가 버튼 제거
        const addBtn = document.querySelector('#addToExistingListBtn');
        if (addBtn) {
            addBtn.remove();
        }
        
        this.targetListForAdd = null;
        
        // 테이블 컨테이너 표시
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.style.display = 'flex';
        }
        
        // 대시보드 숨기기
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.style.display = 'none';
        }
        
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
    }
    
    /**
     * 대시보드를 표시합니다.
     */
    showDashboard() {
        this.currentListView = 'dashboard';
        
        const selectedCount = this.selectedLectures.size;
        HeaderRenderer.updateMenuNameAndCount('내 강의리스트 대시보드', selectedCount);
        
        // 사이드바 활성 상태 업데이트
        document.querySelectorAll('.saved-list-item, .dashboard-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.sidebar-menu > .menu-item').forEach(item => {
            item.classList.remove('active');
        });
        const dashboardItem = document.querySelector('[data-dashboard="true"]')?.closest('.dashboard-menu-item');
        if (dashboardItem) {
            dashboardItem.classList.add('active');
        }
        
        // 테이블 컨테이너 숨기기
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) {
            tableContainer.style.display = 'none';
        }
        
        // 대시보드 렌더링
        this.renderDashboard();
        
        // 툴바는 표시 (간소화 가능)
        this.renderToolbar();
    }
    
    /**
     * 대시보드를 렌더링합니다.
     */
    renderDashboard() {
        const workspace = document.querySelector('.workspace');
        if (!workspace) {
            console.error('워크스페이스를 찾을 수 없습니다.');
            return;
        }
        
        // 기존 대시보드 제거
        const existingDashboard = workspace.querySelector('.dashboard-container');
        if (existingDashboard) {
            existingDashboard.remove();
        }
        
        // 대시보드 컨테이너 생성
        const dashboardContainer = document.createElement('div');
        dashboardContainer.className = 'dashboard-container';
        dashboardContainer.style.display = 'block';
        
        workspace.appendChild(dashboardContainer);
        
        // 대시보드 렌더링 (실제 데이터 사용)
        DashboardRenderer.renderToDOM(dashboardContainer, this.lectureData);
        
        // 플러그인 바 숨기기 (대시보드에서는 필요 없음)
        const pluginContainer = document.getElementById('pluginBarContainer');
        if (pluginContainer) {
            pluginContainer.innerHTML = '';
        }
    }
    
    /**
     * B2B 강의리스트 메뉴 클릭 이벤트를 설정합니다.
     */
    setupB2BMenuClick() {
        const b2bMenu = document.querySelector('.sidebar-menu > .menu-item > a');
        if (b2bMenu) {
            b2bMenu.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAllLectures();
            });
        }
    }
    
    /**
     * 리스트 이름 수정 모달을 표시합니다.
     * @param {string} currentName - 현재 리스트 이름
     */
    showEditListNameModal(currentName) {
        const modalContainer = document.body;
        EditListNameModalRenderer.renderToDOM(modalContainer, currentName);
        
        // 현재 이름을 데이터 속성에 저장
        const overlay = document.getElementById('editListNameModalOverlay');
        if (overlay) {
            overlay.dataset.currentName = currentName;
        }
        
        EditListNameModalRenderer.showModal();
    }
    
    /**
     * 리스트 이름을 수정합니다.
     */
    updateListName() {
        const input = document.getElementById('editListNameInput');
        const newName = input ? input.value.trim() : '';
        
        if (!newName) {
            alert('리스트 이름을 입력해주세요.');
            return;
        }
        
        // 모달에서 현재 이름 가져오기
        const overlay = document.getElementById('editListNameModalOverlay');
        const currentName = overlay ? overlay.dataset.currentName : '';
        
        if (!currentName) {
            alert('리스트를 찾을 수 없습니다.');
            return;
        }
        
        if (newName === currentName) {
            this.closeEditListNameModal();
            return;
        }
        
        try {
            StorageService.updateLectureListName(currentName, newName);
            
            // 현재 뷰가 수정된 리스트인 경우 업데이트
            if (this.currentListView === currentName) {
                this.currentListView = newName;
                const selectedCount = this.selectedLectures.size;
                HeaderRenderer.updateMenuNameAndCount(newName, selectedCount);
            }
            
            alert(`리스트 이름이 "${newName}"으로 변경되었습니다.`);
            this.closeEditListNameModal();
            this.setupSidebar(); // 사이드바 업데이트
        } catch (error) {
            alert(error.message);
        }
    }
    
    /**
     * 리스트 이름 수정 모달을 닫습니다.
     */
    closeEditListNameModal() {
        EditListNameModalRenderer.hideModal();
        setTimeout(() => {
            EditListNameModalRenderer.removeModal();
        }, 300);
    }
    
    /**
     * 자동화 모달을 표시합니다.
     * @param {string} actionType - 액션 타입 ('taxInvoice' | 'settlementFile')
     */
    showAutomationModal(actionType) {
        const selectedCount = this.selectedLectures.size;
        
        if (selectedCount === 0) {
            alert('자동화 기능을 사용하려면 강의를 선택해주세요.');
            return;
        }
        
        const modalContainer = document.body;
        AutomationModalRenderer.renderToDOM(modalContainer, actionType, selectedCount);
        AutomationModalRenderer.showModal();
    }
    
    /**
     * 자동화 기능을 실행합니다.
     */
    async executeAutomation() {
        const overlay = document.getElementById('automationModalOverlay');
        if (!overlay) return;
        
        const actionType = overlay.dataset.actionType;
        
        // 내 강의리스트의 모든 강의 코드 가져오기
        const listName = this.currentListView;
        if (!listName || listName.startsWith('shared_')) {
            alert('내 강의리스트에서만 사용할 수 있는 기능입니다.');
            return;
        }
        
        const list = StorageService.loadLectureList(listName);
        if (!list) {
            alert('리스트를 찾을 수 없습니다.');
            return;
        }
        
        const selectedCodes = list.lectureCodes;
        
        if (selectedCodes.length === 0) {
            alert('리스트에 강의가 없습니다.');
            return;
        }
        
        try {
            AutomationModalRenderer.updateStatus('처리 중...', 'info');
            
            let result;
            if (actionType === 'requestTaxInvoice') {
                result = await AutomationService.requestTaxInvoice(selectedCodes);
            } else if (actionType === 'taxInvoice') {
                result = await AutomationService.issueTaxInvoice(selectedCodes);
            } else if (actionType === 'settlementFile') {
                result = await AutomationService.createSettlementFile(selectedCodes);
            } else {
                throw new Error('알 수 없는 액션 타입입니다.');
            }
            
            if (result.success) {
                AutomationModalRenderer.updateStatus('처리 완료', 'success');
                setTimeout(() => {
                    alert(result.message);
                    this.closeAutomationModal();
                }, 1000);
            } else {
                throw new Error(result.message || '처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            AutomationModalRenderer.updateStatus(`오류: ${error.message}`, 'error');
            console.error('자동화 처리 오류:', error);
        }
    }
    
    /**
     * 자동화 모달을 닫습니다.
     */
    closeAutomationModal() {
        AutomationModalRenderer.hideModal();
        setTimeout(() => {
            AutomationModalRenderer.removeModal();
        }, 300);
    }
    
    /**
     * 강의코드로 등록하기 모달을 표시합니다.
     */
    showRegisterByCodeModal() {
        const modalContainer = document.body;
        RegisterByCodeModalRenderer.renderToDOM(modalContainer);
        RegisterByCodeModalRenderer.showModal();
        
        // 자동완성 이벤트 바인딩
        this.setupRegisterByCodeAutocomplete();
        
        // 계약유형 및 금액 매핑 이벤트 바인딩
        this.setupRegisterByCodeContractType();
        
        // 초기 버튼 상태 설정
        setTimeout(() => {
            this.updateRegisterButtonState();
        }, 100);
    }
    
    /**
     * 강의코드로 등록하기 계약유형 및 금액 매핑 이벤트를 설정합니다.
     */
    setupRegisterByCodeContractType() {
        // 계약유형 변경 이벤트
        const contractTypeRadios = document.querySelectorAll('input[name="registerContractType"]');
        contractTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const contractType = e.target.value;
                const priceMappingSection = document.getElementById('registerPriceMappingSection');
                const priceMappingLogSection = document.getElementById('registerPriceMappingLogSection');
                const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');

                if (contractType === '인당과금') {
                    if (priceMappingSection) {
                        priceMappingSection.style.display = 'block';
                    }
                    if (priceMappingLogSection) {
                        priceMappingLogSection.style.display = 'block';
                    }
                    if (confirmRegisterBtn) {
                        confirmRegisterBtn.disabled = true; // 파싱 완료 전까지 비활성화
                    }
                } else {
                    if (priceMappingSection) {
                        priceMappingSection.style.display = 'none';
                    }
                    if (priceMappingLogSection) {
                        priceMappingLogSection.style.display = 'none';
                    }
                    if (confirmRegisterBtn) {
                        confirmRegisterBtn.disabled = false; // 인당과금이 아니면 바로 실행 가능
                    }
                    // 파싱 로그 및 데이터 초기화
                    const logElement = document.getElementById('registerPriceMappingLog');
                    if (logElement) {
                        logElement.textContent = '';
                    }
                    const overlay = document.getElementById('registerByCodeModalOverlay');
                    if (overlay) {
                        delete overlay.dataset.priceMap;
                    }
                }
                this.updateRegisterButtonState();
            });
        });

        // 파싱 실행 버튼 클릭 이벤트
        const executeBtn = document.getElementById('executeRegisterPriceMappingBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => {
                this.executeRegisterPriceMapping();
            });
        }

        // 리스트 이름 및 강의코드 입력 시 버튼 활성화 확인
        const listNameInput = document.getElementById('registerListNameInput');
        const codesInput = document.getElementById('registerLectureCodesInput');
        if (listNameInput) {
            listNameInput.addEventListener('input', () => {
                this.updateRegisterButtonState();
            });
        }
        if (codesInput) {
            codesInput.addEventListener('input', () => {
                this.updateRegisterButtonState();
            });
        }
    }
    
    /**
     * 강의코드로 등록하기 실행 버튼 상태를 업데이트합니다.
     */
    updateRegisterButtonState() {
        const listNameInput = document.getElementById('registerListNameInput');
        const codesInput = document.getElementById('registerLectureCodesInput');
        const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
        const contractTypeRadio = document.querySelector('input[name="registerContractType"]:checked');
        const contractType = contractTypeRadio ? contractTypeRadio.value : '턴키';

        if (!confirmRegisterBtn) return;

        const listName = listNameInput ? listNameInput.value.trim() : '';
        const codesText = codesInput ? codesInput.value.trim() : '';

        // 기본 유효성 검사
        if (!listName || !codesText) {
            confirmRegisterBtn.disabled = true;
            return;
        }
        
        // 강의코드가 유효한지 확인
        const parsedCodes = this.parseLectureCodes(codesText);
        const validCodes = parsedCodes.filter(code => 
            this.lectureData.some(lecture => lecture['강의코드'] === code)
        );
        
        if (validCodes.length === 0) {
            confirmRegisterBtn.disabled = true;
            return;
        }

        // 인당과금이 아닌 경우 리스트 이름과 강의코드만 입력되면 실행 가능
        if (contractType !== '인당과금') {
            confirmRegisterBtn.disabled = false;
            return;
        }

        // 인당과금인 경우 파싱 결과가 있으면 실행 가능 (모든 코드가 매핑되지 않아도 됨)
        const overlay = document.getElementById('registerByCodeModalOverlay');
        const priceMapData = overlay ? overlay.dataset.priceMap : '';

        if (priceMapData && priceMapData.trim() !== '') {
            try {
                const priceMap = JSON.parse(priceMapData);
                // priceMap에 데이터가 있으면 실행 가능 (일부만 매핑되어도 됨)
                confirmRegisterBtn.disabled = Object.keys(priceMap).length === 0;
            } catch (e) {
                confirmRegisterBtn.disabled = true;
            }
        } else {
            confirmRegisterBtn.disabled = true;
        }
    }
    
    /**
     * 강의코드로 등록하기 금액 매핑 파싱을 실행합니다.
     */
    executeRegisterPriceMapping() {
        const priceMappingInput = document.getElementById('registerPriceMappingInput');
        const logElement = document.getElementById('registerPriceMappingLog');
        const confirmRegisterBtn = document.getElementById('confirmRegisterBtn');
        const overlay = document.getElementById('registerByCodeModalOverlay');
        const codesInput = document.getElementById('registerLectureCodesInput');

        if (!priceMappingInput || !logElement || !overlay || !codesInput) {
            return;
        }

        const inputText = priceMappingInput.value.trim();
        const codesText = codesInput.value.trim();

        if (!inputText) {
            logElement.textContent = '❌ 입력된 데이터가 없습니다.\n금액 매핑 데이터를 입력해주세요.';
            if (confirmRegisterBtn) {
                confirmRegisterBtn.disabled = true;
            }
            delete overlay.dataset.priceMap;
            return;
        }

        if (!codesText) {
            logElement.textContent = '❌ 먼저 강의코드를 입력해주세요.';
            if (confirmRegisterBtn) {
                confirmRegisterBtn.disabled = true;
            }
            delete overlay.dataset.priceMap;
            return;
        }

        // 강의코드 파싱 및 유효성 검증
        const parsedCodes = this.parseLectureCodes(codesText);
        const validCodes = parsedCodes.filter(code => 
            this.lectureData.some(lecture => lecture['강의코드'] === code)
        );
        const validCodesSet = new Set(validCodes);

        if (validCodes.length === 0) {
            logElement.textContent = '❌ 유효한 강의코드가 없습니다.\n먼저 유효한 강의코드를 입력해주세요.';
            if (confirmRegisterBtn) {
                confirmRegisterBtn.disabled = true;
            }
            delete overlay.dataset.priceMap;
            return;
        }

        // 파싱 실행
        const parseResult = PriceParser.parsePriceMapping(inputText, validCodesSet);

        // 로그 생성 및 표시
        const logText = PriceParser.formatParseLog(parseResult, Array.from(validCodesSet));
        logElement.textContent = logText;

        // 파싱 결과 저장 (성공한 매핑만 저장)
        if (parseResult.stats.success > 0 && parseResult.priceMap && Object.keys(parseResult.priceMap).length > 0) {
            overlay.dataset.priceMap = JSON.stringify(parseResult.priceMap);
        } else {
            delete overlay.dataset.priceMap;
        }
        this.updateRegisterButtonState();
    }
    
    /**
     * 강의코드로 등록하기 자동완성 이벤트를 설정합니다.
     */
    setupRegisterByCodeAutocomplete() {
        const input = document.getElementById('registerShareInput');
        const dropdown = document.getElementById('registerAutocompleteDropdown');
        if (!input || !dropdown) return;
        
        let selectedIndex = -1;
        let filteredUsers = [];
        let allUsers = UserService.getUsersSync();
        
        input.addEventListener('input', async (e) => {
            const query = e.target.value.trim().toLowerCase();
            selectedIndex = -1;
            
            if (!query) {
                filteredUsers = [];
                dropdown.classList.remove('show');
                return;
            }
            
            // 사용자 데이터가 없으면 다시 로드 시도
            if (!allUsers || allUsers.length === 0) {
                allUsers = await UserService.getUsers();
            }
            
            // 사용자 필터링
            filteredUsers = allUsers.filter(user => {
                const team = (user.team || '').toLowerCase();
                const name = (user.name || '').toLowerCase();
                const id = (user.id || '').toLowerCase();
                return team.includes(query) || name.includes(query) || id.includes(query) ||
                       `${team}/${name}/${id}`.includes(query);
            });
            
            RegisterByCodeModalRenderer.updateAutocomplete(filteredUsers, query, selectedIndex, allUsers);
        });
        
        // 키보드 이벤트
        input.addEventListener('keydown', async (e) => {
            // 사용자 데이터가 없으면 다시 로드 시도
            if (!allUsers || allUsers.length === 0) {
                allUsers = await UserService.getUsers();
            }
            
            const query = input.value.trim().toLowerCase();
            const uniqueTeams = [...new Set(allUsers.map(u => u.team).filter(Boolean))];
            const matchingTeam = uniqueTeams.find(team => team.toLowerCase() === query.toLowerCase());
            const teamUsers = matchingTeam ? allUsers.filter(u => u.team === matchingTeam) : [];
            const hasTeamOption = matchingTeam && teamUsers.length > 0;
            const totalItems = (hasTeamOption ? 1 : 0) + filteredUsers.length;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, totalItems - 1);
                RegisterByCodeModalRenderer.updateAutocomplete(filteredUsers, input.value, selectedIndex, allUsers);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                RegisterByCodeModalRenderer.updateAutocomplete(filteredUsers, input.value, selectedIndex, allUsers);
            } else if (e.key === 'Enter' && selectedIndex >= 0 && totalItems > 0) {
                e.preventDefault();
                
                // 팀 전체 옵션 선택 확인
                if (hasTeamOption && selectedIndex === 0) {
                    input.value = matchingTeam;
                    dropdown.classList.remove('show');
                } else {
                    const userIndex = hasTeamOption ? selectedIndex - 1 : selectedIndex;
                    if (userIndex >= 0 && userIndex < filteredUsers.length) {
                        const selectedUser = filteredUsers[userIndex];
                        input.value = `${selectedUser.team}/${selectedUser.name}/${selectedUser.id}`;
                        dropdown.classList.remove('show');
                    }
                }
            }
        });
        
        // 드롭다운 아이템 클릭
        dropdown.addEventListener('click', async (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (item) {
                // 사용자 데이터가 없으면 다시 로드 시도
                if (!allUsers || allUsers.length === 0) {
                    allUsers = await UserService.getUsers();
                }
                
                // 팀 전체 옵션 클릭 확인
                if (item.dataset.type === 'team' && item.dataset.team) {
                    input.value = item.dataset.team;
                    dropdown.classList.remove('show');
                } else if (item.dataset.type === 'user' && item.dataset.userId) {
                    const userId = item.dataset.userId;
                    const user = allUsers.find(u => u.id === userId);
                    if (user) {
                        input.value = `${user.team}/${user.name}/${user.id}`;
                        dropdown.classList.remove('show');
                    }
                }
            }
        });
    }
    
    /**
     * 강의코드를 파싱합니다.
     * @param {string} codesText - 강의코드 텍스트
     * @returns {Array<string>} 파싱된 강의코드 배열
     */
    parseLectureCodes(codesText) {
        if (!codesText || !codesText.trim()) {
            return [];
        }
        
        // 줄띄움 기준으로 분리
        const lines = codesText.split(/\r?\n/);
        
        // 각 줄에서 강의코드 추출
        const codes = lines
            .map(line => {
                // 공백 제거
                let code = line.trim();
                
                // 큰따움표, 작은따움표 제거
                code = code.replace(/["']/g, '');
                
                // 공백 제거
                code = code.replace(/\s+/g, '');
                
                return code;
            })
            .filter(code => code.length > 0); // 빈 문자열 제거
        
        // 중복 제거
        return [...new Set(codes)];
    }
    
    /**
     * 강의코드로 등록을 실행합니다.
     */
    async registerByCode() {
        const listNameInput = document.getElementById('registerListNameInput');
        const codesInput = document.getElementById('registerLectureCodesInput');
        const shareInput = document.getElementById('registerShareInput');
        
        const listName = listNameInput ? listNameInput.value.trim() : '';
        const codesText = codesInput ? codesInput.value.trim() : '';
        const sharedWith = shareInput ? shareInput.value.trim() : '';
        
        // 유효성 검사
        if (!listName) {
            alert('리스트 이름을 입력해주세요.');
            return;
        }
        
        if (!codesText) {
            alert('강의코드를 입력해주세요.');
            return;
        }
        
        // 강의코드 파싱
        const parsedCodes = this.parseLectureCodes(codesText);
        
        if (parsedCodes.length === 0) {
            alert('유효한 강의코드를 입력해주세요.');
            return;
        }
        
        // 결과 로그 초기화
        RegisterByCodeModalRenderer.updateResultLog('처리 중...\n');
        
        try {
            // 강의코드 검증 및 필터링
            const validCodes = [];
            const invalidCodes = [];
            
            parsedCodes.forEach(code => {
                // 실제 강의 데이터에 존재하는지 확인
                const exists = this.lectureData.some(lecture => 
                    lecture['강의코드'] === code
                );
                
                if (exists) {
                    validCodes.push(code);
                } else {
                    invalidCodes.push(code);
                }
            });
            
            // 로그 업데이트
            let logText = `=== 강의코드 등록 처리 ===\n\n`;
            logText += `입력된 코드 개수: ${parsedCodes.length}개\n`;
            logText += `유효한 코드 개수: ${validCodes.length}개\n`;
            logText += `유효하지 않은 코드 개수: ${invalidCodes.length}개\n\n`;
            
            if (invalidCodes.length > 0) {
                logText += `[유효하지 않은 코드]\n`;
                invalidCodes.forEach(code => {
                    logText += `  - ${code}\n`;
                });
                logText += `\n`;
            }
            
            if (validCodes.length === 0) {
                logText += `❌ 오류: 유효한 강의코드가 없습니다.\n`;
                logText += `모든 코드가 데이터에 존재하지 않습니다.\n`;
                RegisterByCodeModalRenderer.updateResultLog(logText);
                return;
            }
            
            // 계약유형 가져오기
            const contractTypeRadio = document.querySelector('input[name="registerContractType"]:checked');
            const contractType = contractTypeRadio ? contractTypeRadio.value : '턴키';

            // 금액 매핑 가져오기 (인당과금일 경우)
            let priceMap = {};
            let codesToRegister = validCodes;
            if (contractType === '인당과금') {
                const overlay = document.getElementById('registerByCodeModalOverlay');
                const priceMapData = overlay ? overlay.dataset.priceMap : '';
                if (priceMapData) {
                    try {
                        priceMap = JSON.parse(priceMapData);
                        // priceMap에 있는 강의코드만 등록 (실패한 행 제외)
                        codesToRegister = validCodes.filter(code => priceMap[code]);
                        
                        if (codesToRegister.length === 0) {
                            logText += `\n❌ 오류: 매핑된 강의코드가 없습니다.\n`;
                            RegisterByCodeModalRenderer.updateResultLog(logText);
                            alert('매핑된 강의코드가 없습니다. "파싱 실행" 버튼을 눌러 매핑을 완료해주세요.');
                            return;
                        }
                    } catch (e) {
                        logText += `\n❌ 오류: 금액 매핑 데이터를 불러올 수 없습니다.\n`;
                        RegisterByCodeModalRenderer.updateResultLog(logText);
                        alert('금액 매핑 데이터를 불러올 수 없습니다. 다시 파싱을 실행해주세요.');
                        return;
                    }
                } else {
                    logText += `\n❌ 오류: 인당과금 계약유형은 금액 매핑이 필요합니다.\n`;
                    RegisterByCodeModalRenderer.updateResultLog(logText);
                    alert('인당과금 계약유형은 금액 매핑이 필요합니다.\n"파싱 실행" 버튼을 눌러 매핑을 완료해주세요.');
                    return;
                }
            }
            
            // 리스트 저장 (계약유형 및 priceMap 포함, 매핑된 강의코드만 등록)
            StorageService.saveLectureList(listName, codesToRegister, contractType, priceMap);
            
            logText += `[처리 완료]\n`;
            logText += `리스트명: ${listName}\n`;
            logText += `계약유형: ${contractType}\n`;
            if (contractType === '인당과금') {
                logText += `금액 매핑: ${Object.keys(priceMap).length}개\n`;
                if (codesToRegister.length < validCodes.length) {
                    logText += `매핑 실패로 제외된 강의코드: ${validCodes.length - codesToRegister.length}개\n`;
                }
            }
            logText += `추가된 강의: ${codesToRegister.length}개\n`;
            
            // 공유 처리
            if (sharedWith) {
                try {
                    StorageService.shareLectureList(listName, sharedWith);
                    logText += `공유 대상: ${sharedWith}\n`;
                    logText += `✅ 공유 완료\n`;
                } catch (shareError) {
                    logText += `⚠️ 공유 실패: ${shareError.message}\n`;
                }
            }
            
            logText += `\n✅ 성공적으로 완료되었습니다!\n`;
            logText += `총 ${parsedCodes.length}개 입력 → ${codesToRegister.length}개 추가 완료`;
            
            RegisterByCodeModalRenderer.updateResultLog(logText);
            
            // 성공 메시지 후 모달 닫기
            setTimeout(() => {
                alert(`"${listName}" 리스트가 생성되었습니다.\n계약유형: ${contractType}\n${parsedCodes.length}개 입력 → ${codesToRegister.length}개 추가 완료`);
                this.closeRegisterByCodeModal();
                
                // 대시보드가 활성화되어 있으면 대시보드 새로고침, 아니면 사이드바만 업데이트
                if (this.currentListView === 'dashboard') {
                    this.renderDashboard();
                }
                this.setupSidebar();
            }, 1000);
            
        } catch (error) {
            RegisterByCodeModalRenderer.updateResultLog(
                `❌ 오류 발생:\n${error.message}\n\n처리를 완료할 수 없습니다.`
            );
            alert(error.message);
        }
    }
    
    /**
     * 강의코드로 등록하기 모달을 닫습니다.
     */
    closeRegisterByCodeModal() {
        RegisterByCodeModalRenderer.hideModal();
        setTimeout(() => {
            RegisterByCodeModalRenderer.removeModal();
        }, 300);
    }
}

// 전역 함수: 모달에서 호출
window.saveLectureList = function() {
    if (window.appInstance) {
        window.appInstance.saveLectureList();
    }
};

window.closeSaveModal = function() {
    if (window.appInstance) {
        window.appInstance.closeSaveModal();
    }
};

window.shareLectureList = function() {
    if (window.appInstance) {
        window.appInstance.shareLectureList();
    }
};

window.shareFromSaveModal = function() {
    if (window.appInstance) {
        window.appInstance.shareFromSaveModal();
    }
};

window.closeShareModal = function() {
    if (window.appInstance) {
        window.appInstance.closeShareModal();
    }
};

window.closeSharedUsersModal = function() {
    if (window.appInstance) {
        window.appInstance.closeSharedUsersModal();
    }
};

window.updateListName = function() {
    if (window.appInstance) {
        window.appInstance.updateListName();
    }
};

window.closeEditListNameModal = function() {
    if (window.appInstance) {
        window.appInstance.closeEditListNameModal();
    }
};

window.executeAutomation = function() {
    if (window.appInstance) {
        window.appInstance.executeAutomation();
    }
};

window.closeAutomationModal = function() {
    if (window.appInstance) {
        window.appInstance.closeAutomationModal();
    }
};

window.registerByCode = function() {
    if (window.appInstance) {
        window.appInstance.registerByCode();
    }
};

window.closeRegisterByCodeModal = function() {
    if (window.appInstance) {
        window.appInstance.closeRegisterByCodeModal();
    }
};

// 애플리케이션 시작
const app = new LectureMasterApp();
window.appInstance = app;

// 모달 이벤트 바인딩 (동적 생성되므로 이벤트 위임 사용)
document.addEventListener('click', (event) => {
    if (event.target.id === 'closeSaveModal' || event.target.closest('#closeSaveModal')) {
        window.closeSaveModal();
    }
    
    if (event.target.id === 'cancelSaveBtn' || event.target.closest('#cancelSaveBtn')) {
        window.closeSaveModal();
    }
    
    if (event.target.id === 'confirmSaveBtn' || event.target.closest('#confirmSaveBtn')) {
        window.saveLectureList();
    }
});

// Enter 키로 저장
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.id === 'listNameInput') {
        window.saveLectureList();
    }
});

// 공유 모달 이벤트 바인딩
document.addEventListener('click', (event) => {
    if (event.target.id === 'closeShareModal' || event.target.closest('#closeShareModal')) {
        window.closeShareModal();
    }
    
    if (event.target.id === 'cancelShareBtn' || event.target.closest('#cancelShareBtn')) {
        window.closeShareModal();
    }
    
    if (event.target.id === 'confirmShareBtn' || event.target.closest('#confirmShareBtn')) {
        window.shareLectureList();
    }
    
    // 공유된 사람 확인 모달 이벤트
    if (event.target.id === 'closeSharedUsersModal' || event.target.closest('#closeSharedUsersModal')) {
        window.closeSharedUsersModal();
    }
    
    if (event.target.id === 'closeSharedUsersBtn' || event.target.closest('#closeSharedUsersBtn')) {
        window.closeSharedUsersModal();
    }
    
    // 모달 외부 클릭으로 닫기
    const sharedUsersOverlay = document.getElementById('sharedUsersModalOverlay');
    if (sharedUsersOverlay && event.target === sharedUsersOverlay) {
        window.closeSharedUsersModal();
    }
});

// 리스트 이름 수정 모달 이벤트 바인딩
document.addEventListener('click', (event) => {
    if (event.target.id === 'closeEditListNameModal' || event.target.closest('#closeEditListNameModal')) {
        window.closeEditListNameModal();
    }
    
    if (event.target.id === 'cancelEditListNameBtn' || event.target.closest('#cancelEditListNameBtn')) {
        window.closeEditListNameModal();
    }
    
    if (event.target.id === 'confirmEditListNameBtn' || event.target.closest('#confirmEditListNameBtn')) {
        window.updateListName();
    }
    
    // 모달 외부 클릭으로 닫기 (모든 모달에 공통 적용)
    const editOverlay = document.getElementById('editListNameModalOverlay');
    if (editOverlay && event.target === editOverlay) {
        window.closeEditListNameModal();
    }
    
    const saveOverlay = document.getElementById('saveModalOverlay');
    if (saveOverlay && event.target === saveOverlay) {
        window.closeSaveModal();
    }
    
    const shareOverlay = document.getElementById('shareModalOverlay');
    if (shareOverlay && event.target === shareOverlay) {
        window.closeShareModal();
    }
});

// Enter 키로 이름 수정
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.id === 'editListNameInput') {
        window.updateListName();
    }
    
    // ESC 키로 닫기
    if (event.key === 'Escape') {
        if (document.getElementById('editListNameModalOverlay')?.classList.contains('active')) {
            window.closeEditListNameModal();
        } else if (document.getElementById('automationModalOverlay')?.classList.contains('active')) {
            window.closeAutomationModal();
        } else if (document.getElementById('registerByCodeModalOverlay')?.classList.contains('active')) {
            window.closeRegisterByCodeModal();
        }
    }
});

// 자동화 모달 이벤트 바인딩
document.addEventListener('click', (event) => {
    if (event.target.id === 'closeAutomationModal' || event.target.closest('#closeAutomationModal')) {
        window.closeAutomationModal();
    }
    
    if (event.target.id === 'cancelAutomationBtn' || event.target.closest('#cancelAutomationBtn')) {
        window.closeAutomationModal();
    }
    
    if (event.target.id === 'confirmAutomationBtn' || event.target.closest('#confirmAutomationBtn')) {
        window.executeAutomation();
    }
    
    // 모달 외부 클릭으로 닫기
    const automationOverlay = document.getElementById('automationModalOverlay');
    if (automationOverlay && event.target === automationOverlay) {
        window.closeAutomationModal();
    }
    
    // 강의코드로 등록하기 모달 이벤트
    if (event.target.id === 'closeRegisterByCodeModal' || event.target.closest('#closeRegisterByCodeModal')) {
        window.closeRegisterByCodeModal();
    }
    
    if (event.target.id === 'cancelRegisterBtn' || event.target.closest('#cancelRegisterBtn')) {
        window.closeRegisterByCodeModal();
    }
    
    if (event.target.id === 'confirmRegisterBtn' || event.target.closest('#confirmRegisterBtn')) {
        window.registerByCode();
    }
    
    // 모달 외부 클릭으로 닫기
    const registerByCodeOverlay = document.getElementById('registerByCodeModalOverlay');
    if (registerByCodeOverlay && event.target === registerByCodeOverlay) {
        window.closeRegisterByCodeModal();
    }
});