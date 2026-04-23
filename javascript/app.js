import { CONFIG } from './config/constants.js';
import { JsonService } from './services/jsonService.js';
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
import { RegisterByCodeModalRenderer } from './components/registerByCodeModalRenderer.js';
import { UnsettledLecturesModalRenderer } from './components/unsettledLecturesModalRenderer.js';
import { CompareModalRenderer } from './components/compareModalRenderer.js';
import { SimpleModalRenderer } from './components/simpleModalRenderer.js';
import { PermissionsHelpModalRenderer } from './components/permissionsHelpModalRenderer.js';
import { UserService } from './services/userService.js';
import { FilterService } from './services/filterService.js';
import { PriceParser } from './utils/priceParser.js';
import { RechampService } from './services/rechampService.js';
import { SettlementService } from './services/settlementService.js';
import { AdminLectureService } from './services/adminLectureService.js';
import { ChampLectureService } from './services/champLectureService.js';
import { UnifiedLcmsService } from './services/unifiedLcmsService.js';
import { SearchService } from './services/searchService.js';
import { CheckboxHandler } from './handlers/checkboxHandler.js';
import { CellSelectionHandler } from './handlers/cellSelectionHandler.js';
import { DragScrollHandler } from './handlers/dragScrollHandler.js';
import { PaginationHandler } from './handlers/paginationHandler.js';
import { KeyboardNavigationHandler } from './handlers/keyboardNavigationHandler.js';
import { FilterRenderer } from './components/filterRenderer.js';
import { NestedTableRowHandler } from './handlers/nestedTableRowHandler.js';
import { B2CNestedRowHandler } from './handlers/b2cNestedRowHandler.js';
import { DashboardBulkSettlementController } from './controllers/dashboardBulkSettlementController.js';
import { B2C_UNIFIED_COLUMNS } from './config/b2cColumns.js';

/**
 * 메인 애플리케이션 클래스
 */
class LectureMasterApp {
    constructor() {
        this.allLectureData = []; // 모든 강의 데이터 원본
        this.mainLectureData = []; // 메인 뷰에 표시될 강의 데이터
        this.excludedLectureData = []; // 제외된 강의 데이터
        
        this.filteredLectureData = []; // 필터링된 데이터 (저장된 리스트 선택 시)
        this.searchedData = null; // 검색된 데이터 (null이면 검색 안 함)
        this.currentPageNumber = 1;
        this.itemsPerPage = CONFIG.ITEMS_PER_PAGE;
        this.selectedLectures = new Set(); // 선택된 강의 코드 Set
        this.currentListView = null; // 현재 보는 리스트 이름 (null이면 전체)
        this.currentDataView = 'main'; // 현재 데이터 뷰 ('main' 또는 'excluded')
        this.targetListForAdd = null; // 강의 추가 대상 리스트 이름
        this.activeFilters = FilterService.initializeFilters(); // 활성 필터 상태
        this.currentListInfo = null; // 현재 로드된 리스트 정보 (계약유형, priceMap 등)
        this.searchQuery = ''; // 검색어
        this.b2cMissingB2BOnly = false;
        this.b2cUnifiedData = [];

        // 대시보드(카드뷰) 운영업무: 강의료 파일 일괄생성 선택 모드
        this.dashboardBulkSettlement = new DashboardBulkSettlementController({
            getIsOnDashboard: () => this.currentListView === 'dashboard',
            renderDashboard: () => this.renderDashboard(),
            renderPluginBar: () => this.renderPluginBar(),
            showInfoModal: (msg, title) => this.showInfoModal(msg, title)
        });
        
        this.tableContainer = null;
        this.toolbarContainer = null;
        this.cellSelectionHandler = new CellSelectionHandler();
        this.keyboardNavigationHandler = null;
        this.checkboxHandler = null;
        this.nestedTableRowHandler = null;
        this.b2cNestedRowHandler = null;
        this.bookMap = new Map();
        
        this.init();
    }
    
    /**
     * 애플리케이션 초기화
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            // 대시보드/렌더러에서 전역 참조로 사용
            window.appInstance = this;

            this.tableContainer = document.querySelector('.table-container');
            this.toolbarContainer = document.querySelector('.top-header');
            this.loadLectureData();
            this.setupSidebar();
            this.setupModalEvents();
        });
    }
    
    /**
     * 강의 데이터를 로드합니다.
     */
    async loadLectureData() {
        try {
            console.log('강의 데이터 로딩 시작...');
            
            // 필수 데이터 병렬 로드
            const [
                , // users
                , // rechamp
                , // settlement
                , // admin
                , // champ
                , // unified lcms
                bookListData
            ] = await Promise.all([
                UserService.getUsers(),
                RechampService.loadRechampData(),
                SettlementService.loadSettlementData(),
                AdminLectureService.loadAdminLectureData(),
                ChampLectureService.loadChampLectureData(),
                UnifiedLcmsService.loadUnifiedLcmsData(),
                JsonService.loadBookList()
            ]);

            // ISBN을 키로 하는 Map 생성
            this.bookMap = new Map(bookListData.map(book => [book.isbn, book]));
            
            const rawData = await JsonService.loadJsonData();
            
            // settlementType 매핑 추가
            const dataWithSettlement = DataService.mapSettlementType(rawData);
            
            this.allLectureData = DataService.sortData(dataWithSettlement);

            // 데이터를 메인과 제외된 데이터로 분리
            this.mainLectureData = this.allLectureData.filter(lecture =>
                lecture['강의상태'] !== '폐강' && !lecture['강의코드'].includes('daou')
            );
            this.excludedLectureData = this.allLectureData.filter(lecture =>
                lecture['강의상태'] === '폐강' || lecture['강의코드'].includes('daou')
            );
            
            // 초기 렌더링 시에는 메인 데이터를 사용
            this.filteredLectureData = [];
            
            console.log(`데이터 로드 완료: 총 ${this.allLectureData.length}개, 메인 ${this.mainLectureData.length}개, 제외된 ${this.excludedLectureData.length}개`);
            
            this.renderHeader();
            this.toolbarContainer = document.getElementById('headerToolbarContainer') || document.querySelector('.top-header');
            this.renderToolbar();
            this.renderTable(this.currentPageNumber);

            // 중첩 테이블 핸들러를 데이터 로드 후에 초기화
            if (this.tableContainer && !this.nestedTableRowHandler) {
                this.nestedTableRowHandler = new NestedTableRowHandler(this.tableContainer, this, this.bookMap);
            }

        } catch (error) {
            console.error('데이터 로드 오류:', error);
            alert('데이터를 불러오는 중 오류가 발생했습니다.\n' + error.message);
        }
    }

    /**
     * B2C(통합LCMS) 강좌코드 기준으로 연동 체인을 역방향으로 계산합니다.
     * - B2C 강좌코드(lectureId)
     *   -> 챔프 강의창 스킨ID(= champLectureId)
     *   -> re챔프 운영자 강의코드(= lectureCode)
     *   -> B2B 운영자 강의코드(= 강의코드)
     */
    getB2CChain(b2cLectureId) {
        if (!b2cLectureId) return null;

        const key = String(b2cLectureId);
        if (!this.b2cChainCache) this.b2cChainCache = new Map();
        if (this.b2cChainCache.has(key)) return this.b2cChainCache.get(key);

        // 1) 챔프Admin: serviceCategory == '통합LCMS' && adminLectureCode == lectureId 인 champLectureId 수집
        const adminData = (typeof AdminLectureService?.getAdminLectureData === 'function')
            ? null
            : null;
        // AdminLectureService는 내부 캐시를 갖고 있어 getAdminLectureData()로 배열을 얻을 수 있음
        // (비동기 호출 없이, 여기서는 캐시가 로드되어 있다는 전제 하에 사용)
        // 안전을 위해 map이 없으면 빈 처리
        let skinIds = [];
        try {
            // 내부 캐시 접근이 직접 제공되지 않아, getAdminLectureData는 async.
            // 체인 캐시는 showB2CUnifiedLcms에서 프리컴퓨트하도록 하고,
            // 여기서는 프리컴퓨트 결과가 있으면 사용.
            if (this._adminByLcmsCode?.has(key)) {
                skinIds = this._adminByLcmsCode.get(key);
            }
        } catch (_) {
            skinIds = [];
        }

        // 2) 챔프강의창: champLectureId -> champ_lecture.rowNo 확인(동일 값일 가능성이 높지만 체인 명시를 위해 유지)
        const champRowNos = [];
        for (const sid of skinIds) {
            const champMatches = ChampLectureService.getAllDataByRowNo(String(sid));
            if (champMatches && champMatches.length > 0) {
                for (const cm of champMatches) {
                    if (cm?.rowNo != null) champRowNos.push(String(cm.rowNo));
                }
            } else {
                // fallback: rowNo == champLectureId 라고 가정
                champRowNos.push(String(sid));
            }
        }

        // 3) re챔프: skinId == champ_lecture.rowNo 인 lectureCode 수집
        const rechampCodes = [];
        if (this._rechampBySkinId && champRowNos.length > 0) {
            for (const rowNo of champRowNos) {
                const matches = this._rechampBySkinId.get(String(rowNo)) || [];
                for (const m of matches) {
                    if (m?.lectureCode) rechampCodes.push(m.lectureCode);
                }
            }
        }

        // 4) B2B: B2C강의코드 == (re)챔프 lectureCode 인 강의코드 수집
        const rechampCodeSet = new Set(rechampCodes.map(v => String(v)));
        const b2bCodes = this.allLectureData
            .filter(r => rechampCodeSet.has(String(r['B2C강의코드'] || '')))
            .map(r => r['강의코드'])
            .filter(Boolean);

        const result = {
            b2cLectureId: key,
            skinIds: Array.from(new Set(skinIds.map(String))),
            champRowNos: Array.from(new Set(champRowNos.map(String))),
            rechampCodes: Array.from(new Set(rechampCodes.map(String))),
            b2bCodes: Array.from(new Set(b2bCodes.map(String)))
        };

        this.b2cChainCache.set(key, result);
        return result;
    }

    /**
     * B2C(통합LCMS) 강좌코드 기준 연동 행을 B2B 중첩 테이블과 동일한 형태로 만듭니다.
     * 표시 순서: 통합LCMS → 챔프강의창 → (re)챔프스터디 → B2B
     */
    getB2CRelatedRowsForNestedTable(b2cLectureId) {
        if (!b2cLectureId) return [];

        const key = String(b2cLectureId);
        const chain = this.getB2CChain(key);
        if (!chain) return [];

        const lcmsRows = [];
        const champRows = [];
        const rechampRows = [];
        const b2bRows = [];

        const seen = {
            lcms: new Set(),
            champ: new Set(),
            rechamp: new Set(),
            b2b: new Set()
        };

        const addLcms = (m) => {
            const id = String(m?.lectureId || '');
            if (!id || seen.lcms.has(id)) return;
            seen.lcms.add(id);
            lcmsRows.push({ platform: '통합LCMS', ...m });
        };

        const addChamp = (champMatch, champAdmin) => {
            const ro = String(champMatch?.rowNo || '');
            if (!ro || seen.champ.has(ro)) return;
            seen.champ.add(ro);
            const row = {
                platform: '챔프강의창',
                ...champMatch
            };
            if (champAdmin) {
                row['연동강의코드'] = champAdmin.adminLectureCode;
                row['연동강의플랫폼'] = champAdmin.serviceCategory;
            }
            champRows.push(row);
        };

        const addRechamp = (rm) => {
            const k = `${String(rm?.lectureCode || '')}|${String(rm?.skinId || '')}`;
            if (!rm?.lectureCode || seen.rechamp.has(k)) return;
            seen.rechamp.add(k);
            rechampRows.push({ platform: '(re)챔프스터디', ...rm });
        };

        const rootLcms = UnifiedLcmsService.getDataByLectureId(key);
        if (rootLcms && rootLcms.length > 0) {
            for (const m of rootLcms) addLcms(m);
        }

        // 체인: LCMS(lectureId) -> Admin(adminLectureCode) -> champLectureId
        //     -> Champ(rowNo) -> Rechamp(skinId) -> B2B(B2C강의코드)
        for (const skinId of chain.skinIds) {
            const sid = String(skinId);
            const champAdminMatches = AdminLectureService.getDataById(sid);
            if (champAdminMatches && champAdminMatches.length > 0) {
                for (const champAdmin of champAdminMatches) {
                    const champLecId = champAdmin.champLectureId ? String(champAdmin.champLectureId) : null;
                    if (champLecId) {
                        const champMatches = ChampLectureService.getAllDataByRowNo(champLecId);
                        if (champMatches && champMatches.length > 0) {
                            for (const champMatch of champMatches) {
                                addChamp(champMatch, champAdmin);
                                // Champ(rowNo) -> Rechamp(skinId)
                                const rechampMatches = this._rechampBySkinId?.get(String(champMatch?.rowNo ?? '')) || [];
                                for (const rm of rechampMatches) addRechamp(rm);
                            }
                        }
                    }

                    const adminLecCode = champAdmin.adminLectureCode ? String(champAdmin.adminLectureCode) : null;
                    if (adminLecCode && champAdmin.serviceCategory === '통합LCMS') {
                        const lcmsMatches = UnifiedLcmsService.getDataByLectureId(adminLecCode);
                        if (lcmsMatches && lcmsMatches.length > 0) {
                            for (const lcmsMatch of lcmsMatches) addLcms(lcmsMatch);
                        }
                    }
                }
            } else {
                const champMatches = ChampLectureService.getAllDataByRowNo(sid);
                if (champMatches && champMatches.length > 0) {
                    for (const champMatch of champMatches) {
                        addChamp(champMatch, null);
                        const rechampMatches = this._rechampBySkinId?.get(String(champMatch?.rowNo ?? '')) || [];
                        for (const rm of rechampMatches) addRechamp(rm);
                    }
                } else {
                    // fallback: rowNo == skinId 가정
                    const rechampMatches = this._rechampBySkinId?.get(String(sid)) || [];
                    for (const rm of rechampMatches) addRechamp(rm);
                }
            }
        }

        // Rechamp(lectureCode) -> B2B(B2C강의코드)
        const rechampCodes = (chain.rechampCodes || []).map(String);
        const rechampCodeSet = new Set(rechampCodes);
        for (const b2bLecture of (this.allLectureData || [])) {
            const b2cCode = String(b2bLecture?.['B2C강의코드'] ?? '');
            const b2bCode = String(b2bLecture?.['강의코드'] ?? '');
            if (!b2cCode || !b2bCode) continue;
            if (!rechampCodeSet.has(b2cCode)) continue;
            if (seen.b2b.has(b2bCode)) continue;
            seen.b2b.add(b2bCode);
            b2bRows.push({ platform: 'B2B', ...b2bLecture });
        }

        return [...lcmsRows, ...champRows, ...rechampRows, ...b2bRows];
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
            this.bindProfileDropdown();
        }
    }

    hideSettingsContainer() {
        const settingsContainer = document.querySelector('.settings-container');
        if (settingsContainer) settingsContainer.style.display = 'none';
    }
    
    /**
     * 프로필 영역 클릭 시 문서 메뉴 드롭다운 토글
     */
    bindProfileDropdown() {
        const profileBtn = document.getElementById('userProfileBtn');
        const dropdown = document.getElementById('userProfileDropdown');
        if (!profileBtn || !dropdown) return;
        
        profileBtn.onclick = (e) => {
            e.stopPropagation();
            profileBtn.classList.toggle('open');
        };
        
        dropdown.querySelector('#docsLink').onclick = (e) => {
            e.stopPropagation();
            profileBtn.classList.remove('open');
        };
    }
    
    /**
     * 현재 메뉴명을 가져옵니다.
     * @returns {string} 메뉴명
     */
    getCurrentMenuName() {
        if (this.currentDataView === 'excluded') {
            return '제외된 강의리스트';
        }

        if (!this.currentListView) {
            return 'B2B 강의리스트';
        }

        if (this.currentListView === 'b2c-unified') {
            return 'B2C 강의리스트';
        }

        if (this.currentListView === 'settings-permissions') {
            return '권한관리';
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
        const showFilterReset = !this.currentListView;
        const isSettings = typeof this.currentListView === 'string' && this.currentListView.startsWith('settings-');
        const isB2CUnified = this.currentListView === 'b2c-unified';
        
        ToolbarRenderer.renderToDOM(
            this.toolbarContainer, 
            selectedCount, 
            this.itemsPerPage, 
            this.activeFilters,
            showFilterReset,
            isSettings ? {
                hideSearch: true,
                hideSave: true,
                hideItemsPerPage: true,
                hideFilterReset: true
            } : isB2CUnified ? {
                hideSave: true,
                hideFilterReset: true
            } : {}
        );
        
        const menuName = this.getCurrentMenuName();
        HeaderRenderer.updateMenuNameAndCount(menuName, isSettings ? 0 : selectedCount);
        const selectedCountEl = document.querySelector('.selected-count-in-header');
        if (selectedCountEl) selectedCountEl.style.display = isSettings ? 'none' : '';
        
        if (!isSettings) this.bindToolbarEvents();
        
        if (!isSettings && showFilterReset) {
            this.bindFilterResetButton();
        }
        
        if (!isSettings && this.targetListForAdd) {
            this.renderAddLecturesButton(this.targetListForAdd);
        }
        
        this.renderPluginBar();

        if (isB2CUnified) {
            this.renderB2CMissingButton();
        }
    }

    renderB2CMissingButton() {
        const pluginContainer = document.getElementById('pluginBarContainer');
        if (!pluginContainer) return;

        pluginContainer.innerHTML = `
            <button type="button" class="btn-save" id="b2cMissingB2BBtn" title="B2B에 생성되지 않은 강의 보기">
                <i class="fa-solid fa-filter"></i> B2B에 생성되지 않은 강의 보기
            </button>
        `;

        const btn = document.getElementById('b2cMissingB2BBtn');
        if (!btn) return;
        if (this.b2cMissingB2BOnly) btn.classList.add('disabled');

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.b2cMissingB2BOnly = !this.b2cMissingB2BOnly;
            this.currentPageNumber = 1;
            this.renderTable(1);
            this.renderToolbar();
        });
    }
    
    /**
     * 플러그인 바를 렌더링합니다.
     */
    renderPluginBar() {
        const pluginContainer = document.getElementById('pluginBarContainer');
        if (!pluginContainer) return;
        
        if (this.currentDataView === 'excluded') {
            pluginContainer.innerHTML = '';
            return;
        }

        const plugins = this.buildPluginsForCurrentView();
        if (plugins.length > 0) PluginBarRenderer.renderToDOM(pluginContainer, plugins);
        else pluginContainer.innerHTML = '';
    }

    buildPluginsForCurrentView() {
        const plugins = [];
        const isSettings = typeof this.currentListView === 'string' && this.currentListView.startsWith('settings-');

        // 전체 강의(메인) 화면
        if (!this.currentListView) {
            plugins.push({
                id: 'registerByCode',
                title: '강의코드로 등록하기',
                icon: 'fa-solid fa-plus',
                menuItems: [
                    { label: '강의코드로 등록하기', icon: 'fa-solid fa-code', action: 'registerByCode' },
                    { label: '미정산 강의 등록하기', icon: 'fa-solid fa-file-circle-plus', action: 'registerUnsettled' }
                ],
                onAction: (action) => {
                    if (action === 'registerByCode') this.showRegisterByCodeModal();
                    else if (action === 'registerUnsettled') this.showRegisterUnsettledModal();
                }
            });
        }

        // 설정 화면: 플러그인 없음
        if (isSettings) {
            return plugins;
        }

        // 대시보드·리스트 화면: 리스트 관리 / 공유 / 업무요청 / 운영업무 플러그인은 표시하지 않음

        return plugins;
    }

    handleAutomationAction(actionType) {
        const labels = {
            requestTaxInvoice: '세금계산서 발행요청',
            taxInvoice: '세금계산서 발행',
            settlementFile: '강의료 정산파일 제작'
        };
        const label = labels[actionType] || '자동화 기능';
        this.showInfoModal(`${label} 기능은 준비중입니다.`, '준비중');
    }

    startDashboardBulkSettlementSelection() {
        this.dashboardBulkSettlement.startSelection();
    }

    cancelDashboardBulkSettlementSelection() {
        this.dashboardBulkSettlement.cancelSelection();
    }

    toggleDashboardListSelection(listName) {
        this.dashboardBulkSettlement.toggleList(listName);
    }

    updateDashboardBulkSettlementButtonState() {
        this.dashboardBulkSettlement.updateButtonState();
    }

    runDashboardBulkSettlementGeneration() {
        this.dashboardBulkSettlement.runGeneration();
    }
    
    getCurrentListName() {
        if (!this.currentListView) return null;
        return this.currentListView.startsWith('shared_') ? this.currentListView.replace('shared_', '') : this.currentListView;
    }
    
    bindToolbarEvents() {
        const saveBtn = document.getElementById('saveListBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.selectedLectures.size > 0) this.showSaveModal();
            });
        }
        
        const itemsPerPageSelect = document.getElementById('itemsPerPageSelect');
        if (itemsPerPageSelect) {
            itemsPerPageSelect.addEventListener('change', (event) => {
                this.itemsPerPage = parseInt(event.target.value);
                this.currentPageNumber = 1;
                this.renderTable(this.currentPageNumber);
                this.renderToolbar();
            });
        }
        
        this.bindSearchEvents();
    }
    
    bindSearchEvents() {
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const searchBtn = document.getElementById('searchBtn');
        
        const executeSearch = () => {
            if (searchInput) {
                const query = searchInput.value.trim();
                this.searchQuery = query;
                if (clearSearchBtn) clearSearchBtn.style.display = query ? 'flex' : 'none';
                this.applySearch();
            }
        };
        
        if (searchInput) {
            if (this.searchQuery) {
                searchInput.value = this.searchQuery;
                if (clearSearchBtn) clearSearchBtn.style.display = 'flex';
            }
            
            searchInput.addEventListener('input', () => {
                if (clearSearchBtn) clearSearchBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
            });
            
            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    executeSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', (event) => {
                event.preventDefault();
                executeSearch();
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.searchedData = null;
                    clearSearchBtn.style.display = 'none';
                    this.applySearch();
                    searchInput.focus();
                }
            });
        }
    }
    
    applySearch() {
        let baseData;
        if (this.currentListView === 'b2c-unified') {
            baseData = this.b2cUnifiedData || [];
        } else if (this.currentListView) {
            baseData = this.filteredLectureData;
        } else {
            baseData = this.currentDataView === 'main' ? this.mainLectureData : this.excludedLectureData;
        }
        
        if (this.searchQuery) {
            if (this.currentListView === 'b2c-unified') {
                this.searchedData = SearchService.searchB2CUnified(baseData, this.searchQuery);
            } else {
                this.searchedData = SearchService.search(baseData, this.searchQuery);
            }
        } else {
            this.searchedData = null;
        }
        
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
    }
    
    bindFilterResetButton() {
        const resetBtn = document.getElementById('filterResetAllBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAllFilters());
        }
    }
    
    resetAllFilters() {
        this.activeFilters = FilterService.clearAllFilters();
        this.searchQuery = '';
        this.searchedData = null;
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        
        document.querySelectorAll('.filter-icon-container').forEach(icon => icon.classList.remove('active'));
        
        this.renderTable(1);
        this.renderToolbar();
    }
    
    renderTable(pageNumber) {
        this.currentPageNumber = pageNumber;
        
        if (!this.tableContainer) return;
        
        let dataToDisplay;
        if (this.searchedData !== null) {
            dataToDisplay = this.searchedData;
        } else if (this.currentListView === 'b2c-unified') {
            dataToDisplay = this.b2cUnifiedData || [];
        } else if (this.currentListView) {
            dataToDisplay = this.filteredLectureData;
        } else {
            dataToDisplay = this.currentDataView === 'main' ? this.mainLectureData : this.excludedLectureData;
        }
        
        // B2C: 'B2B에 생성되지 않은 강의' 필터는 chain cache 이후 적용(추후 단계에서 캐시 연결)
        if (this.currentListView === 'b2c-unified' && this.b2cMissingB2BOnly && this.b2cChainCache) {
            dataToDisplay = dataToDisplay.filter(r => {
                const chain = this.b2cChainCache.get(String(r.lectureId));
                const b2bCodes = chain?.b2bCodes || [];
                return b2bCodes.length === 0;
            });
        }

        const filteredData = FilterService.filterData(dataToDisplay, this.activeFilters);
        const startIndex = (pageNumber - 1) * this.itemsPerPage;
        const pageData = DataService.getPageData(filteredData, pageNumber, this.itemsPerPage);
        const totalPages = DataService.calculateTotalPages(filteredData.length, this.itemsPerPage);
        
        const columnsOverride = this.currentListView === 'b2c-unified' ? B2C_UNIFIED_COLUMNS : null;
        const listInfo = this.currentListView === 'b2c-unified' ? null : this.currentListInfo;
        TableRenderer.renderToDOM(this.tableContainer, pageData, startIndex, this.bookMap, listInfo, columnsOverride);

        // Twemoji 렌더링 (테이블 헤더의 🔍 등)
        if (window.twemoji) {
            window.twemoji.parse(this.tableContainer, { folder: 'svg', ext: '.svg' });
        }
        
        const existingPagination = this.tableContainer.querySelector('.pagination');
        if (existingPagination) existingPagination.remove();
        
        const paginationContainer = document.createElement('div');
        PaginationRenderer.renderToDOM(paginationContainer, pageNumber, totalPages);
        this.tableContainer.appendChild(paginationContainer);
        
        this.bindAllEvents();
        this.updateFilterIconStates();
    }
    
    updateFilterIconStates() {
        document.querySelectorAll('.filter-icon-container').forEach(iconContainer => {
            const columnKey = iconContainer.dataset.columnKey;
            const isActive = columnKey && this.activeFilters[columnKey]?.size > 0;
            iconContainer.classList.toggle('active', isActive);
        });
    }
    
    bindAllEvents() {
        PaginationHandler.bindEvents((pageNumber) => this.renderTable(pageNumber));
        DragScrollHandler.bindEvents();
        this.cellSelectionHandler.bindEvents();
        this.keyboardNavigationHandler = new KeyboardNavigationHandler(this);
        this.keyboardNavigationHandler.bindEvents();
        this.checkboxHandler = new CheckboxHandler(this.selectedLectures, () => this.onSelectionChange());
        this.checkboxHandler.bindEvents();
        this.bindFilterEvents();

        if (this.currentListView === 'b2c-unified') {
            if (!this.b2cNestedRowHandler) {
                this.b2cNestedRowHandler = new B2CNestedRowHandler(this.tableContainer, this);
            }
            this.b2cNestedRowHandler.bindEvents();
        }
    }
    
    bindCompareEvents() {
        document.querySelectorAll('.btn-compare').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCompareModal(btn.dataset.lectureCode, btn.dataset.b2cCode);
            });
        });
    }
    
    bindCompareEvents() {
        document.querySelectorAll('.btn-compare').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showCompareModal(btn.dataset.lectureCode, btn.dataset.b2cCode);
            });
        });
    }
    
    async showCompareModal(lectureCode, b2cCode) {
        // 1. B2B 데이터 조회
        const b2bData = this.allLectureData.find(item => item['강의코드'] === lectureCode);
        
        // 2. Re-챔프 데이터 조회
        const rechampData = b2cCode ? RechampService.getRechampDataByB2CCode(b2cCode) : null;
        
        // 3. 챔프강의창 데이터 조회 (연쇄 조회)
        let champData = null;
        let unifiedLcmsData = null;
        if (rechampData && rechampData.skinId) {
            const adminLectureData = AdminLectureService.getDataById(rechampData.skinId);
            if (adminLectureData) {
                const champLectureData = adminLectureData.champLectureId 
                    ? ChampLectureService.getDataByRowNo(adminLectureData.champLectureId)
                    : null;
                
                champData = { ...adminLectureData, ...champLectureData };

                // 4. 통합 LCMS 데이터 조회
                if (champData.adminLectureCode) {
                    unifiedLcmsData = UnifiedLcmsService.getDataByLectureId(champData.adminLectureCode);
                }
            }
        }

        // 확정 정산방법 데이터 추가
        if (b2bData) {
            const settlementStatus = SettlementService.getStatusByCode(lectureCode);
            b2bData.confirmedSettlementStatus = settlementStatus || '미등록';
        }
        
        CompareModalRenderer.renderToDOM(document.body, b2bData, rechampData, champData, unifiedLcmsData);
        CompareModalRenderer.showModal();
        this.bindCompareModalEvents();
    }
    
    bindCompareModalEvents() {
        const overlay = document.getElementById('compareModalOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target.id === 'closeCompareModal' || e.target.id === 'closeCompareModalBtn' || e.target === overlay) {
                    this.closeCompareModal();
                }
            });
        }
        
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeCompareModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler, { once: true });
    }
    
        closeCompareModal() {
            CompareModalRenderer.hideModal();
            setTimeout(() => CompareModalRenderer.removeModal(), 300);
        }
    
        showRegisterByCodeModal() {
            RegisterByCodeModalRenderer.renderToDOM(document.body);
            RegisterByCodeModalRenderer.showModal();
            this.bindRegisterByCodeModalEvents();
        }
        
        bindRegisterByCodeModalEvents() {
            const overlay = document.getElementById('registerByCodeModalOverlay');
            if (!overlay) return;
        
            const handleAction = (e) => {
                const targetId = e.target.id;
                const closestButtonId = e.target.closest('button')?.id;
    
                if (closestButtonId === 'closeRegisterByCodeModal' || closestButtonId === 'cancelRegisterBtn' || targetId === 'registerByCodeModalOverlay') {
                    this.closeRegisterByCodeModal();
                } else if (closestButtonId === 'confirmRegisterBtn') {
                    this.registerByCode();
                } else if (closestButtonId === 'executeRegisterPriceMappingBtn') {
                    this.parseAndDisplayPriceMapping();
                }
            };
        
            overlay.addEventListener('click', handleAction);
    
            const contractTypeRadios = overlay.querySelectorAll('input[name="registerContractType"]');
            const priceMappingSection = document.getElementById('registerPriceMappingSection');
            const priceMappingLogSection = document.getElementById('registerPriceMappingLogSection');
    
            contractTypeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    const isPerPerson = radio.value === '인당과금';
                    priceMappingSection.style.display = isPerPerson ? 'block' : 'none';
                    priceMappingLogSection.style.display = isPerPerson ? 'block' : 'none';
                });
            });
    
            const shareInput = document.getElementById('registerShareInput');
            if (shareInput) {
                this.setupAutocomplete(shareInput, 'registerAutocompleteDropdown', (user) => {
                    shareInput.value = `${user.team}/${user.name}/${user.id}`;
                });
            }
        }
    
        closeRegisterByCodeModal() {
            RegisterByCodeModalRenderer.hideModal();
            setTimeout(() => RegisterByCodeModalRenderer.removeModal(), 300);
        }
    
        async registerByCode() {
            const listName = document.getElementById('registerListNameInput')?.value.trim();
            if (!listName) return alert('리스트 이름을 입력해주세요.');
    
            const lectureCodesRaw = document.getElementById('registerLectureCodesInput')?.value.trim();
            if (!lectureCodesRaw) return alert('강의코드를 입력해주세요.');
    
            const lectureCodes = lectureCodesRaw.split('\n')
                .map(code => code.replace(/["'\s]/g, ''))
                .filter(code => code);
    
            if (lectureCodes.length === 0) return alert('유효한 강의코드가 없습니다.');
    
            const contractType = document.querySelector('input[name="registerContractType"]:checked')?.value || '턴키';
            let priceMap = {};
    
            if (contractType === '인당과금') {
                const priceMapData = document.getElementById('registerPriceMappingLog')?.dataset.priceMap;
                if (priceMapData) {
                    priceMap = JSON.parse(priceMapData);
                } else {
                    return alert('인당과금 계약유형은 금액 파싱을 실행해야 합니다.');
                }
            }
            
            try {
                StorageService.saveLectureList(listName, lectureCodes, contractType, priceMap);
                RegisterByCodeModalRenderer.updateResultLog(`'${listName}' 리스트가 성공적으로 등록되었습니다.`);
    
                const sharedWith = document.getElementById('registerShareInput')?.value.trim();
                if (sharedWith) {
                    try {
                        StorageService.shareLectureList(listName, sharedWith);
                    } catch (shareError) {
                        RegisterByCodeModalRenderer.updateResultLog(`리스트 저장 성공. 공유 실패: ${shareError.message}`);
                    }
                }
                
                alert(`'${listName}' 리스트가 저장되었습니다.`);
                this.closeRegisterByCodeModal();
                this.setupSidebar();
                this.loadSavedList(listName);
    
            } catch (error) {
                alert(error.message);
                RegisterByCodeModalRenderer.updateResultLog(`오류: ${error.message}`);
            }
        }
        
        parseAndDisplayPriceMapping() {
            const input = document.getElementById('registerPriceMappingInput')?.value || '';
            const lectureCodesRaw = document.getElementById('registerLectureCodesInput')?.value.trim() || '';
            const lectureCodes = lectureCodesRaw.split('\n')
                .map(code => code.replace(/["'\s]/g, ''))
                .filter(code => code);

            const validCodesSet = new Set(lectureCodes);
            const parseResult = PriceParser.parsePriceMapping(input, validCodesSet);
            const log = PriceParser.formatParseLog(parseResult, lectureCodes);
            const priceMap = parseResult.priceMap || {};

            const logContainer = document.getElementById('registerPriceMappingLog');
            if (logContainer) {
                logContainer.textContent = log;
                logContainer.dataset.priceMap = JSON.stringify(priceMap);
            }

            const statusEl = document.getElementById('registerPriceMappingStatus');
            if (statusEl) {
                const hasInput = !!input.trim();
                if (!hasInput) {
                    statusEl.textContent = '입력된 데이터가 없습니다.';
                    statusEl.classList.add('error');
                } else if (parseResult.errors && parseResult.errors.some(e => e.includes('유효하지 않은 강의코드'))) {
                    const invalidCount = parseResult.errors.filter(e => e.includes('유효하지 않은 강의코드')).length;
                    statusEl.textContent = `유효하지 않은 강의코드가 포함되어 있습니다(${invalidCount}개).`;
                    statusEl.classList.add('error');
                } else if (parseResult.stats?.success > 0) {
                    statusEl.textContent = `매핑 완료(성공 ${parseResult.stats.success}개/실패 ${parseResult.stats.fail}개)`;
                    statusEl.classList.remove('error');
                } else {
                    statusEl.textContent = '매핑에 실패했습니다. 입력 형식을 확인해주세요.';
                    statusEl.classList.add('error');
                }
            }
        }
    
        onSelectionChange() {        this.renderToolbar();
    }
    
    bindFilterEvents() {
        document.querySelectorAll('.filter-icon-container').forEach(iconContainer => {
            iconContainer.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showFilterDropdown(iconContainer.dataset.columnKey, iconContainer);
            });
        });
    }
    
    showFilterDropdown(columnKey, iconContainer) {
        let dataToDisplay;
        if (this.searchedData !== null) {
            dataToDisplay = this.searchedData;
        } else if (this.currentListView === 'b2c-unified') {
            dataToDisplay = this.b2cUnifiedData || [];
        } else if (this.currentListView) {
            dataToDisplay = this.filteredLectureData;
        } else {
            dataToDisplay = this.currentDataView === 'main' ? this.mainLectureData : this.excludedLectureData;
        }
        
        const filteredForDropdown = FilterService.filterData(dataToDisplay, this.activeFilters);
        const uniqueValues = FilterService.getUniqueValues(filteredForDropdown, columnKey);
        const selectedValues = this.activeFilters[columnKey] || new Set();
        
        FilterRenderer.showFilterDropdown(
            iconContainer,
            columnKey,
            uniqueValues,
            selectedValues,
            (colKey, selected) => this.applyFilter(colKey, selected),
            (query, colKey) => FilterRenderer.filterValues(colKey, query)
        );
    }
    
    applyFilter(columnKey, selectedValues) {
        this.activeFilters = FilterService.updateFilter(this.activeFilters, columnKey, selectedValues);
        this.renderTable(1);
        this.renderToolbar();
    }
    
    showSaveModal() {
        if (this.selectedLectures.size === 0) return;
        const selectedLecturesData = this.getSelectedLecturesData();
        const categoryCounts = {};
        selectedLecturesData.forEach(lecture => {
            const category = lecture['카테고리'] || '미분류';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
        
        ModalRenderer.renderSaveModalToDOM(document.body, this.selectedLectures.size, categoryCounts, selectedLecturesData);
        ModalRenderer.showModal();
        this.bindSaveModalEvents();
    }
    
    getSelectedLecturesData() {
        return this.allLectureData.filter(lecture => this.selectedLectures.has(lecture['강의코드']));
    }
    
    setupModalEvents() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const profileBtn = document.getElementById('userProfileBtn');
                if (profileBtn?.classList.contains('open')) {
                    profileBtn.classList.remove('open');
                    return;
                }
                if (document.getElementById('saveModalOverlay')?.classList.contains('active')) this.closeSaveModal();
                else if (document.getElementById('shareModalOverlay')?.classList.contains('active')) this.closeShareModal();
                else if (document.getElementById('editListNameModalOverlay')?.classList.contains('active')) this.closeEditListNameModal();
                else if (document.getElementById('automationModalOverlay')?.classList.contains('active')) this.closeAutomationModal();
                else if (document.getElementById('registerByCodeModalOverlay')?.classList.contains('active')) this.closeRegisterByCodeModal();
                else if (document.getElementById('unsettledLecturesModalOverlay')?.classList.contains('active')) this.closeRegisterUnsettledModal();
            }
        });
        document.addEventListener('click', (e) => {
            const profileBtn = document.getElementById('userProfileBtn');
            if (profileBtn?.classList.contains('open') && !profileBtn.contains(e.target)) {
                profileBtn.classList.remove('open');
            }
        });
    }

    closeSaveModal() {
        ModalRenderer.hideModal();
        setTimeout(() => ModalRenderer.removeModal(), 300);
    }

    showRegisterUnsettledModal() {
        const unsettledData = SettlementService.settlementData || {};
        UnsettledLecturesModalRenderer.renderToDOM(document.body, unsettledData);
        UnsettledLecturesModalRenderer.showModal();
        this.bindRegisterUnsettledModalEvents();
    }

    bindRegisterUnsettledModalEvents() {
        const overlay = document.getElementById('unsettledLecturesModalOverlay');
        if (!overlay) return;

        overlay.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const closestButtonId = e.target.closest('button')?.id;

            if (closestButtonId === 'closeUnsettledModal' || closestButtonId === 'cancelUnsettledBtn' || targetId === 'unsettledLecturesModalOverlay') {
                this.closeRegisterUnsettledModal();
            } else if (closestButtonId === 'confirmUnsettledBtn') {
                const codesText = document.getElementById('unsettledLectureCodesInput').value;
                const codes = codesText.split('\n').map(c => c.trim()).filter(Boolean);
                if (codes.length > 0) {
                    SettlementService.addUnsettledLectures(codes);
                    this.closeRegisterUnsettledModal();
                } else {
                    alert('추가할 강의코드를 입력해주세요.');
                }
            }
        });
    }

    closeRegisterUnsettledModal() {
        UnsettledLecturesModalRenderer.hideModal();
        setTimeout(() => UnsettledLecturesModalRenderer.removeModal(), 300);
    }


    saveLectureList() {
        const listName = document.getElementById('listNameInput')?.value.trim();
        if (!listName) return alert('리스트 이름을 입력해주세요.');

        const contractType = document.querySelector('input[name="contractType"]:checked')?.value || '턴키';
        let priceMap = {};
        if (contractType === '인당과금') {
            const priceMapData = document.getElementById('saveModalOverlay')?.dataset.priceMap;
            if (priceMapData) {
                priceMap = JSON.parse(priceMapData);
            } else {
                return alert('인당과금 계약유형은 금액 매핑이 필요합니다.');
            }
        }
        
        try {
            StorageService.saveLectureList(listName, Array.from(this.selectedLectures), contractType, priceMap);
            const sharedWith = document.getElementById('saveModalShareInput')?.value.trim();
            if (sharedWith) {
                try {
                    StorageService.shareLectureList(listName, sharedWith);
                } catch (shareError) {
                    console.error('공유 오류:', shareError);
                    alert(`리스트 저장 성공. 공유 실패: ${shareError.message}`);
                }
            }
            alert(`"${listName}" 리스트가 저장되었습니다.`);
            this.closeSaveModal();
            this.showAllLectures();
            this.setupSidebar();
        } catch (error) {
            alert(error.message);
        }
    }
    
    setupSidebar() {
        const sidebarMenu = document.querySelector('.sidebar-menu');
        if (!sidebarMenu) return;

        sidebarMenu.innerHTML = ''; // Clear existing menu

        // B2B 강의리스트 드롭다운
        const b2bListSection = document.createElement('li');
        b2bListSection.className = 'b2b-list-section';
        b2bListSection.innerHTML = `
            <div class="menu-section-title dropdown-toggle" id="b2bListToggle">
                <i class="fa-solid fa-clipboard-list"></i><span class="link-text">B2B 강의리스트</span><i class="fa-solid fa-chevron-down"></i>
            </div>
            <ul class="b2b-list-menu dropdown-menu">
                <li class="menu-item b2b-menu-item" data-view-type="b2b-main"><a href="#"><i class="fa-solid fa-list-ul"></i><span class="link-text">전체 강의</span></a></li>
                <li class="menu-item b2b-menu-item" data-view-type="b2b-excluded"><a href="#"><i class="fa-solid fa-ban"></i><span class="link-text">제외된 강의</span></a></li>
            </ul>
        `;
        sidebarMenu.appendChild(b2bListSection);
        

        const b2bToggle = b2bListSection.querySelector('#b2bListToggle');
        const b2bMenu = b2bListSection.querySelector('.b2b-list-menu');
        b2bToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            b2bToggle.classList.toggle('active');
            b2bMenu.classList.toggle('open');
        });

        b2bListSection.querySelectorAll('.b2b-menu-item a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const viewType = item.closest('.b2b-menu-item').dataset.viewType;
                if (viewType === 'b2b-main') this.showAllLectures();
                else if (viewType === 'b2b-excluded') this.showExcludedLectures();
            });
        });

        // B2C 강의리스트 (통합 LCMS 목록 — 단일 메뉴)
        const b2cItem = document.createElement('li');
        b2cItem.className = 'menu-item b2c-menu-item';
        b2cItem.setAttribute('data-view-type', 'b2c-unified');
        b2cItem.innerHTML = `<a href="#"><i class="fa-solid fa-link"></i><span class="link-text">B2C 강의리스트</span></a>`;
        b2cItem.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showB2CUnifiedLcms();
        });
        sidebarMenu.appendChild(b2cItem);

        // 내 강의리스트 드롭다운
        const myLists = StorageService.loadAllLists();
        const listSection = document.createElement('li');
        listSection.className = 'saved-lists-section';
        listSection.innerHTML = `<div class="menu-section-title dropdown-toggle" id="myListsToggle"><i class="fa-solid fa-book"></i><span class="link-text">내 강의리스트</span><i class="fa-solid fa-chevron-down"></i></div>`;
        const listContainer = document.createElement('ul');
        listContainer.className = 'saved-lists dropdown-menu';
        
        const dashboardItem = document.createElement('li');
        dashboardItem.className = 'menu-item dashboard-menu-item';
        dashboardItem.setAttribute('data-view-type', 'dashboard');
        dashboardItem.innerHTML = `<a href="#"><i class="fa-solid fa-gauge-high"></i><span class="link-text">대시보드</span></a>`;
        dashboardItem.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.showDashboard(); });
        listContainer.appendChild(dashboardItem);

        myLists.forEach(list => {
            const listItem = document.createElement('li');
            listItem.className = 'menu-item saved-list-item';
            listItem.setAttribute('data-view-type', list.name);
            listItem.innerHTML = `<a href="#"><i class="fa-solid fa-file-lines"></i><span class="link-text">${list.name} (${list.lectureCodes.length})</span></a>`;
            listItem.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.loadSavedList(list.name); });
            listContainer.appendChild(listItem);
        });
        listSection.appendChild(listContainer);
        sidebarMenu.appendChild(listSection);
        
        const myListsToggle = listSection.querySelector('#myListsToggle');
        myListsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            myListsToggle.classList.toggle('active');
            listContainer.classList.toggle('open');
        });

        // 설정(내 강의리스트 바로 아래)
        const settingsSection = document.createElement('li');
        settingsSection.className = 'settings-section';
        settingsSection.innerHTML = `
            <div class="menu-section-title dropdown-toggle" id="settingsToggle">
                <i class="fa-solid fa-gear"></i><span class="link-text">설정</span><i class="fa-solid fa-chevron-down"></i>
            </div>
            <ul class="dropdown-menu settings-menu" id="settingsMenu">
                <li class="menu-item settings-menu-item" data-view-type="settings-permissions">
                    <a href="#"><i class="fa-solid fa-user-shield"></i><span class="link-text">권한관리</span></a>
                </li>
            </ul>
        `;
        sidebarMenu.appendChild(settingsSection);

        const settingsToggle = settingsSection.querySelector('#settingsToggle');
        const settingsMenu = settingsSection.querySelector('#settingsMenu');
        settingsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            settingsToggle.classList.toggle('active');
            settingsMenu.classList.toggle('open');
        });
        settingsSection.querySelectorAll('.settings-menu-item a').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPermissionManagement();
            });
        });

        // 공유 강의리스트 드롭다운
        // ... (이하 생략 - 공유 리스트 로직은 복잡도를 줄이기 위해 일단 유지)
        
        this.updateSidebarActiveState(this.currentListView || (this.currentDataView === 'excluded' ? 'b2b-excluded' : 'b2b-main'));
    }
    
    updateSidebarActiveState(activeType) {
        document.querySelectorAll('.sidebar-menu .menu-item, .sidebar-menu .dropdown-toggle').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.sidebar-menu .dropdown-menu').forEach(menu => menu.classList.remove('open'));

        const activeItem = document.querySelector(`.menu-item[data-view-type="${activeType}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            const parentDropdown = activeItem.closest('.dropdown-menu');
            if (parentDropdown) {
                parentDropdown.classList.add('open');
                parentDropdown.previousElementSibling?.classList.add('active');
            }
        }
    }
    
    loadSharedList(sharedList) {
        this.hideSettingsContainer();
        const listName = `shared_${sharedList.listName}`;
        this.currentListView = listName;
        this.currentDataView = 'main';
        this.filteredLectureData = DataService.sortData(this.allLectureData.filter(lecture => new Set(sharedList.lectureCodes).has(lecture['강의코드'])));
        this.selectedLectures.clear();
        this.activeFilters = FilterService.clearAllFilters();
        this.searchQuery = '';
        this.searchedData = null;
        
        HeaderRenderer.updateMenuNameAndCount(`${sharedList.listName} (공유)`, 0);
        this.updateSidebarActiveState(listName);
        this.tableContainer.classList.remove('excluded');
        
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
    }

    loadSavedList(listName) {
        this.hideSettingsContainer();
        // 대시보드 일괄 선택 모드 해제
        if (this.dashboardBulkSettlement?.selectionMode) this.dashboardBulkSettlement.cancelSelection();

        const list = StorageService.loadLectureList(listName);
        if (!list) return alert('리스트를 찾을 수 없습니다.');
        
        this.currentListView = listName;
        this.currentDataView = 'main';
        this.currentListInfo = { name: list.name, contractType: list.contractType || '턴키', priceMap: list.priceMap || {} };
        this.filteredLectureData = DataService.sortData(this.allLectureData.filter(lecture => new Set(list.lectureCodes).has(lecture['강의코드'])));
        
        this.selectedLectures.clear();
        this.activeFilters = FilterService.clearAllFilters();
        this.searchQuery = '';
        this.searchedData = null;
        
        HeaderRenderer.updateMenuNameAndCount(listName, 0);
        this.updateSidebarActiveState(listName);
        
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'flex';
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
        this.renderPluginBar();
    }

    showAllLectures() {
        this.hideSettingsContainer();
        this.currentListView = null;
        this.currentListInfo = null;
        this.currentDataView = 'main';
        this.filteredLectureData = [];
        this.selectedLectures.clear();
        this.tableContainer.classList.remove('excluded');
        this.activeFilters = FilterService.clearAllFilters();
        this.searchQuery = '';
        this.searchedData = null;
        
        HeaderRenderer.updateMenuNameAndCount('B2B 강의리스트', 0);
        this.updateSidebarActiveState('b2b-main');
        
        const addBtn = document.querySelector('#addToExistingListBtn');
        if (addBtn) addBtn.remove();
        this.targetListForAdd = null;
        
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'flex';
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'none';
        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
    }

    showExcludedLectures() {
        this.hideSettingsContainer();
        this.currentListView = null;
        this.currentListInfo = null;
        this.currentDataView = 'excluded';
        this.filteredLectureData = [];
        this.selectedLectures.clear();
        this.tableContainer.classList.add('excluded');
        this.activeFilters = FilterService.clearAllFilters();
        this.searchQuery = '';
        this.searchedData = null;

        HeaderRenderer.updateMenuNameAndCount('제외된 강의리스트', 0);
        this.updateSidebarActiveState('b2b-excluded');

        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'flex';
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'none';

        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
    }
    
    showDashboard() {
        this.hideSettingsContainer();
        this.currentListView = 'dashboard';
        HeaderRenderer.updateMenuNameAndCount('내 강의리스트 대시보드', 0);
        this.updateSidebarActiveState('dashboard');
        
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'none';
        
        this.renderDashboard();
        this.renderPluginBar();
    }

    async showB2CUnifiedLcms() {
        this.hideSettingsContainer();
        // 대시보드 일괄 선택 모드 해제
        if (this.dashboardBulkSettlement?.selectionMode) this.dashboardBulkSettlement.cancelSelection();

        this.currentListView = 'b2c-unified';
        this.currentDataView = 'main';
        this.b2cMissingB2BOnly = false;

        HeaderRenderer.updateMenuNameAndCount('B2C 강의리스트', 0);
        this.updateSidebarActiveState('b2c-unified');

        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'flex';
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'none';

        // unified lcms 데이터는 앱 초기 로딩에서 loadUnifiedLcmsData를 수행하므로 캐시 사용
        this.b2cUnifiedData = (UnifiedLcmsService.getAllData() || [])
            .filter(r => UnifiedLcmsService.isRowVisibleInList(r))
            // 강좌명 제외 처리
            .filter(r => r?.lectureTitle !== '내부강의(자체제작)')
            // 등록일(createdAt) 최신순, 없으면 맨 뒤 → 강좌코드 보조 정렬
            .sort((a, b) => {
                const ta = a?.createdAt ? new Date(a.createdAt).getTime() : NaN;
                const tb = b?.createdAt ? new Date(b.createdAt).getTime() : NaN;
                const aOk = !Number.isNaN(ta);
                const bOk = !Number.isNaN(tb);
                if (aOk && bOk && tb !== ta) return tb - ta;
                if (aOk && !bOk) return -1;
                if (!aOk && bOk) return 1;
                const av = Number(a?.lectureId);
                const bv = Number(b?.lectureId);
                if (!Number.isNaN(av) && !Number.isNaN(bv)) return bv - av;
                return String(b?.lectureId ?? '').localeCompare(String(a?.lectureId ?? ''));
            });

        // 연동 체인 프리컴퓨트용 인덱스 구성
        // 1) AdminLecture: lcmsCode(adminLectureCode) -> [champLectureId]
        try {
            const adminAll = await AdminLectureService.getAdminLectureData();
            this._adminByLcmsCode = new Map();
            adminAll
                .filter(r => r?.serviceCategory === '통합LCMS' && r?.adminLectureCode != null && r?.champLectureId != null)
                .forEach(r => {
                    const lcmsCode = String(r.adminLectureCode);
                    const skinId = String(r.champLectureId);
                    if (!this._adminByLcmsCode.has(lcmsCode)) this._adminByLcmsCode.set(lcmsCode, []);
                    this._adminByLcmsCode.get(lcmsCode).push(skinId);
                });
        } catch (_) {
            this._adminByLcmsCode = new Map();
        }

        // 2) re챔프: skinId -> [rows]
        this._rechampBySkinId = new Map();
        try {
            (RechampService.rechampData || []).forEach(r => {
                const sid = r?.skinId != null ? String(r.skinId) : '';
                if (!sid) return;
                if (!this._rechampBySkinId.has(sid)) this._rechampBySkinId.set(sid, []);
                this._rechampBySkinId.get(sid).push(r);
            });
        } catch (_) {
            this._rechampBySkinId = new Map();
        }

        // 체인 캐시 초기화
        this.b2cChainCache = new Map();

        // 테이블/툴바 초기화
        this.selectedLectures.clear(); // 조회 전용이지만 기존 UI 영향 제거
        this.activeFilters = FilterService.clearAllFilters();
        this.searchQuery = '';
        this.searchedData = null;

        this.currentPageNumber = 1;
        this.renderTable(this.currentPageNumber);
        this.renderToolbar();
        this.renderPluginBar();
    }

    showPermissionManagement() {
        // 대시보드 일괄 선택 모드 해제
        if (this.dashboardBulkSettlement?.selectionMode) this.dashboardBulkSettlement.cancelSelection();

        this.currentListView = 'settings-permissions';
        this.currentDataView = 'main';

        HeaderRenderer.updateMenuNameAndCount('권한관리', 0);
        this.updateSidebarActiveState('settings-permissions');

        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.style.display = 'none';
        const dashboardContainer = document.querySelector('.dashboard-container');
        if (dashboardContainer) dashboardContainer.style.display = 'none';

        // settings 화면에서는 settings 컨테이너를 표시
        this.renderPermissionManagementPage();
        this.renderToolbar();
    }

    renderPermissionManagementPage() {
        const workspace = document.querySelector('.workspace');
        if (!workspace) return;

        let container = workspace.querySelector('.settings-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'settings-container';
            workspace.appendChild(container);
        }
        container.style.display = 'block';

        const saved = localStorage.getItem('lecture_master_permissions_dummy');
        const initial = {
            '권민우': 'S',
            '유승호': 'A',
            '홍길동': 'O'
        };
        const roleMap = saved ? { ...initial, ...JSON.parse(saved) } : initial;
        const roleLabel = (k) => (k === 'S' ? '최고관리자' : (k === 'A' ? '관리자' : '운영자'));

        const users = ['권민우', '유승호', '홍길동'].map(name => ({
            name,
            roleKey: roleMap[name] || 'O',
            role: roleLabel(roleMap[name] || 'O')
        }));

        container.innerHTML = `
            <div class="settings-page">
                <div class="settings-page-header">
                    <h2 class="settings-title">권한관리</h2>
                    <button type="button" class="btn-help" id="permissionsHelpBtn" title="권한별 기능 보기">
                        <i class="fa-solid fa-circle-question"></i> 권한별 기능 보기
                    </button>
                </div>

                <div class="settings-card">
                    <h3>사용자(더미)</h3>
                    <table class="settings-users-table">
                        <thead>
                            <tr>
                                <th style="width: 30%;">이름</th>
                                <th style="width: 50%;">역할</th>
                                <th style="width: 20%;">변경</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr data-user-name="${u.name}">
                                    <td>${u.name}</td>
                                    <td>
                                        <span class="role-badge ${u.roleKey === 'O' ? 'role-operator' : (u.roleKey === 'A' ? 'role-admin' : 'role-superadmin')}">
                                            <i class="fa-solid fa-user-shield"></i> ${u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button type="button" class="btn-help" data-action="editRole" style="padding: 6px 10px;">
                                            <i class="fa-solid fa-pen-to-square"></i> 수정
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        const helpBtn = container.querySelector('#permissionsHelpBtn');
        helpBtn?.addEventListener('click', () => this.showPermissionsHelpModal());

        container.querySelectorAll('[data-action="editRole"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('tr[data-user-name]');
                if (!row) return;
                const name = row.dataset.userName;
                const current = roleMap[name] || 'O';

                row.querySelector('td:nth-child(2)').innerHTML = `
                    <select class="form-input" data-role-select style="max-width: 220px;">
                        <option value="S" ${current === 'S' ? 'selected' : ''}>최고관리자</option>
                        <option value="A" ${current === 'A' ? 'selected' : ''}>관리자</option>
                        <option value="O" ${current === 'O' ? 'selected' : ''}>운영자</option>
                    </select>
                `;
                row.querySelector('td:nth-child(3)').innerHTML = `
                    <button type="button" class="btn-confirm" data-action="saveRole" style="padding: 6px 10px;">저장</button>
                `;

                row.querySelector('[data-action="saveRole"]')?.addEventListener('click', () => {
                    const selected = row.querySelector('[data-role-select]')?.value || 'O';
                    const next = { ...roleMap, [name]: selected };
                    localStorage.setItem('lecture_master_permissions_dummy', JSON.stringify(next));
                    this.renderPermissionManagementPage();
                });
            });
        });
    }

    showPermissionsHelpModal() {
        // `docs/권한_기능목록_강의리스트.md`를 기준으로 정리한 권한표(요약)
        const rows = [
            { label: '전체 강의 보기', O: true, A: true, S: true },
            { label: '제외된 강의 보기', O: true, A: true, S: true },
            { label: '내 강의리스트 대시보드 보기', O: true, A: true, S: true },
            { label: '저장된 리스트 열기(내/공유)', O: true, A: true, S: true },
            { label: '검색/필터/페이지 이동', O: true, A: true, S: true },
            { label: '강의리스트 저장', O: true, A: true, S: true },
            { label: '강의코드로 등록(새 리스트)', O: true, A: true, S: true },
            { label: '리스트 이름 수정', O: true, A: true, S: true },
            { label: '강의 추가(리스트에 추가)', O: true, A: true, S: true },
            { label: '리스트 삭제', O: false, A: true, S: true },
            { label: '공유하기/공유된 사람 확인', O: true, A: true, S: true },
            { label: '대시보드 강의료 파일 일괄생성(선택/실행)', O: false, A: true, S: true },
            { label: '세금계산서 발행요청(준비중)', O: false, A: true, S: true },
            { label: '세금계산서 발행(준비중)', O: false, A: true, S: true },
            { label: '강의료 정산파일 제작(준비중)', O: false, A: true, S: true },
            { label: '강의 비교 모달', O: true, A: true, S: true }
        ];

        PermissionsHelpModalRenderer.renderToDOM(document.body, {
            title: '권한별 기능(요약)',
            rows
        });
        PermissionsHelpModalRenderer.showModal();

        const overlay = document.getElementById('permissionsHelpModalOverlay');
        if (!overlay) return;

        const close = () => {
            PermissionsHelpModalRenderer.hideModal();
            setTimeout(() => PermissionsHelpModalRenderer.removeModal(), 200);
        };

        overlay.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const closestButtonId = e.target.closest('button')?.id;
            if (closestButtonId === 'closePermissionsHelpModal' || closestButtonId === 'closePermissionsHelpBtn' || targetId === 'permissionsHelpModalOverlay') {
                close();
            }
        });
    }
    
    renderDashboard() {
        const workspace = document.querySelector('.workspace');
        if (!workspace) return;
        
        let dashboardContainer = workspace.querySelector('.dashboard-container');
        if (!dashboardContainer) {
            dashboardContainer = document.createElement('div');
            dashboardContainer.className = 'dashboard-container';
            workspace.appendChild(dashboardContainer);
        }
        
        dashboardContainer.style.display = 'block';
        DashboardRenderer.renderToDOM(dashboardContainer, this.allLectureData, {
            selectionMode: this.dashboardBulkSettlement.selectionMode,
            selectedLists: this.dashboardBulkSettlement.selectedLists,
            handlers: {
                onCancelBulk: () => this.cancelDashboardBulkSettlementSelection(),
                onRunBulk: () => this.runDashboardBulkSettlementGeneration(),
                onToggleSelect: (listName) => this.toggleDashboardListSelection(listName),
                onOpenList: (listName) => this.loadSavedList(listName),
                onDeleteList: (listName) => this.deleteList(listName),
                onShare: (listName) => this.showShareModal(listName),
                onViewSharedUsers: (listName) => this.showSharedUsersModal(listName)
            }
        });
    }

    /**
     * 리스트 삭제 확인 모달을 띄웁니다. (대시보드·플러그인 바 공통)
     * @param {string} listName
     */
    deleteList(listName) {
        if (!listName) return;
        SimpleModalRenderer.confirm({
            id: 'deleteListConfirmOverlay',
            title: '리스트 삭제',
            message: '삭제하시겠습니까?',
            confirmText: '예',
            cancelText: '아니오',
            confirmClass: 'btn-confirm btn-confirm-danger',
            onConfirm: () => this.executeDeleteList(listName)
        });
    }

    executeDeleteList(listName) {
        if (!listName) return;
        try {
            StorageService.deleteLectureList(listName);
        } catch (error) {
            console.error('리스트 삭제 실패:', error);
            return;
        }

        if (this.targetListForAdd === listName) {
            this.targetListForAdd = null;
            document.querySelector('#addToExistingListBtn')?.remove();
        }

        const onDashboard = this.currentListView === 'dashboard';
        const wasViewingDeleted = this.currentListView === listName;

        this.setupSidebar();
        if (wasViewingDeleted) {
            this.showAllLectures();
        } else if (onDashboard) {
            this.renderDashboard();
        }

        this.showInfoModal('삭제되었습니다.');
    }

    showInfoModal(message, title = '안내') {
        SimpleModalRenderer.info({
            id: 'infoModalOverlay',
            title,
            message,
            okText: '확인'
        });
    }

    /**
     * 자동완성 입력을 설정합니다.
     * - 팀/이름/아이디 검색 지원
     * - '팀 전체' 옵션 선택 시 team/* 형식으로 값 설정
     */
    setupAutocomplete(inputEl, dropdownId, onSelect) {
        if (!inputEl) return;

        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const allUsers = UserService.getUsersSync();
        let filteredUsers = [];
        let selectedIndex = -1;

        const normalize = (s) => (s || '').toString().toLowerCase();

        const filterUsers = (query) => {
            const q = normalize(query);
            if (!q) return [];
            return allUsers
                .filter(u => {
                    const team = normalize(u.team);
                    const name = normalize(u.name);
                    const id = normalize(u.id);
                    return team.includes(q) || name.includes(q) || id.includes(q);
                })
                .slice(0, 20);
        };

        const render = (query) => {
            filteredUsers = filterUsers(query);
            ShareModalRenderer.updateAutocomplete(filteredUsers, query, selectedIndex, dropdown, allUsers);
        };

        const commitSelection = (type, payload) => {
            if (type === 'team') {
                const teamName = payload;
                inputEl.value = `${teamName}/*`;
                if (typeof onSelect === 'function') onSelect({ team: teamName, type: 'team' });
            } else {
                const user = payload;
                inputEl.value = `${user.team}/${user.name}/${user.id}`;
                if (typeof onSelect === 'function') onSelect(user);
            }
            dropdown.classList.remove('show');
            selectedIndex = -1;
        };

        inputEl.addEventListener('input', () => {
            selectedIndex = -1;
            render(inputEl.value.trim());
        });

        inputEl.addEventListener('keydown', (e) => {
            const isOpen = dropdown.classList.contains('show');
            const items = Array.from(dropdown.querySelectorAll('.autocomplete-item'));

            if (e.key === 'Escape') {
                dropdown.classList.remove('show');
                selectedIndex = -1;
                return;
            }

            if (!isOpen || items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                render(inputEl.value.trim());
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                render(inputEl.value.trim());
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedItem = items[selectedIndex];
                if (!selectedItem) return;

                const itemType = selectedItem.dataset.type;
                if (itemType === 'team') {
                    commitSelection('team', selectedItem.dataset.team);
                } else {
                    const userId = selectedItem.dataset.userId;
                    const user = allUsers.find(u => u.id === userId);
                    if (user) commitSelection('user', user);
                }
            }
        });

        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.autocomplete-item');
            if (!item) return;

            const itemType = item.dataset.type;
            if (itemType === 'team') {
                commitSelection('team', item.dataset.team);
            } else {
                const userId = item.dataset.userId;
                const user = allUsers.find(u => u.id === userId);
                if (user) commitSelection('user', user);
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target !== inputEl && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    showShareModal(listName) {
        ShareModalRenderer.renderToDOM(document.body, listName);
        ShareModalRenderer.showModal();
        this.bindShareModalEvents(listName);
    }

    bindShareModalEvents(listName) {
        const overlay = document.getElementById('shareModalOverlay');
        if (!overlay) return;

        const shareInput = document.getElementById('shareInput');
        if (shareInput) {
            this.setupAutocomplete(shareInput, 'autocompleteDropdown', () => {});
        }

        overlay.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const closestButtonId = e.target.closest('button')?.id;

            if (closestButtonId === 'closeShareModal' || closestButtonId === 'cancelShareBtn' || targetId === 'shareModalOverlay') {
                this.closeShareModal();
                return;
            }

            if (closestButtonId === 'confirmShareBtn') {
                const sharedWith = document.getElementById('shareInput')?.value.trim();
                if (!sharedWith) return alert('공유 대상을 입력해주세요.');

                try {
                    StorageService.shareLectureList(listName, sharedWith);
                    alert('공유가 완료되었습니다.');
                    this.closeShareModal();
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    }

    closeShareModal() {
        ShareModalRenderer.hideModal();
        setTimeout(() => ShareModalRenderer.removeModal(), 300);
    }

    showSharedUsersModal(listName) {
        SharedUsersModalRenderer.renderToDOM(document.body, listName);
        SharedUsersModalRenderer.showModal();
        this.bindSharedUsersModalEvents();
    }

    bindSharedUsersModalEvents() {
        const overlay = document.getElementById('sharedUsersModalOverlay');
        if (!overlay) return;

        overlay.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const closestButtonId = e.target.closest('button')?.id;
            if (closestButtonId === 'closeSharedUsersModal' || closestButtonId === 'closeSharedUsersBtn' || targetId === 'sharedUsersModalOverlay') {
                this.closeSharedUsersModal();
            }
        });
    }

    closeSharedUsersModal() {
        SharedUsersModalRenderer.hideModal();
        setTimeout(() => SharedUsersModalRenderer.removeModal(), 300);
    }

    bindSaveModalEvents() {
        const overlay = document.getElementById('saveModalOverlay');
        if (!overlay) return;

        const shareInput = document.getElementById('saveModalShareInput');
        if (shareInput) {
            this.setupAutocomplete(shareInput, 'saveModalAutocompleteDropdown', () => {});
        }

        const listNameInput = document.getElementById('listNameInput');
        const confirmBtn = document.getElementById('confirmSaveBtn');

        const updateContractUI = () => {
            const contractType = document.querySelector('input[name="contractType"]:checked')?.value || '턴키';
            const priceMappingSection = document.getElementById('priceMappingSection');
            const priceMappingLogSection = document.getElementById('priceMappingLogSection');
            const isPerPerson = contractType === '인당과금';
            if (priceMappingSection) priceMappingSection.style.display = isPerPerson ? 'block' : 'none';
            if (priceMappingLogSection) priceMappingLogSection.style.display = isPerPerson ? 'block' : 'none';

            if (!isPerPerson) {
                delete overlay.dataset.priceMap;
                const logEl = document.getElementById('priceMappingLog');
                if (logEl) logEl.textContent = '';
            }
        };

        const validate = () => {
            if (!confirmBtn) return;

            const listName = listNameInput?.value.trim();
            if (!listName) {
                confirmBtn.disabled = true;
                return;
            }

            const contractType = document.querySelector('input[name="contractType"]:checked')?.value || '턴키';
            if (contractType !== '인당과금') {
                confirmBtn.disabled = false;
                return;
            }

            const priceMapData = overlay.dataset.priceMap;
            if (!priceMapData) {
                confirmBtn.disabled = true;
                return;
            }

            try {
                const priceMap = JSON.parse(priceMapData);
                const selectedCodes = Array.from(this.selectedLectures);
                const allMapped = selectedCodes.every(code => priceMap && typeof priceMap[code] === 'number' && priceMap[code] > 0);
                confirmBtn.disabled = !allMapped;
            } catch {
                confirmBtn.disabled = true;
            }
        };

        listNameInput?.addEventListener('input', validate);

        overlay.querySelectorAll('input[name="contractType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                updateContractUI();
                validate();
            });
        });

        const executeBtn = document.getElementById('executePriceMappingBtn');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.parseAndDisplaySavePriceMapping());
        }

        overlay.addEventListener('click', (e) => {
            const targetId = e.target.id;
            const closestButtonId = e.target.closest('button')?.id;

            if (closestButtonId === 'closeSaveModal' || closestButtonId === 'cancelSaveBtn' || targetId === 'saveModalOverlay') {
                this.closeSaveModal();
                return;
            }

            if (closestButtonId === 'confirmSaveBtn') {
                this.saveLectureList();
            }
        });

        updateContractUI();
        validate();
    }

    parseAndDisplaySavePriceMapping() {
        const overlay = document.getElementById('saveModalOverlay');
        if (!overlay) return;

        const input = document.getElementById('priceMappingInput')?.value || '';
        const selectedCodes = Array.from(this.selectedLectures);
        const validCodesSet = new Set(selectedCodes);
        const parseResult = PriceParser.parsePriceMapping(input, validCodesSet);
        const log = PriceParser.formatParseLog(parseResult, selectedCodes);
        const priceMap = parseResult.priceMap || {};

        const logContainer = document.getElementById('priceMappingLog');
        if (logContainer) logContainer.textContent = log;

        overlay.dataset.priceMap = JSON.stringify(priceMap || {});

        // 상태 메시지
        const statusEl = document.getElementById('priceMappingStatus');
        if (statusEl) {
            const hasInput = !!input.trim();
            if (!hasInput) {
                statusEl.textContent = '입력된 데이터가 없습니다.';
                statusEl.classList.add('error');
            } else if (parseResult.errors && parseResult.errors.some(e => e.includes('유효하지 않은 강의코드'))) {
                const invalidCount = parseResult.errors.filter(e => e.includes('유효하지 않은 강의코드')).length;
                statusEl.textContent = `유효하지 않은 강의코드가 포함되어 있습니다(${invalidCount}개).`;
                statusEl.classList.add('error');
            } else if (parseResult.stats?.success > 0) {
                statusEl.textContent = `매핑 완료(성공 ${parseResult.stats.success}개/실패 ${parseResult.stats.fail}개)`;
                statusEl.classList.remove('error');
            } else {
                statusEl.textContent = '매핑에 실패했습니다. 입력 형식을 확인해주세요.';
                statusEl.classList.add('error');
            }
        }

        const confirmBtn = document.getElementById('confirmSaveBtn');
        if (confirmBtn) {
            // 즉시 재검증
            const allMapped = selectedCodes.every(code => priceMap && typeof priceMap[code] === 'number' && priceMap[code] > 0);
            confirmBtn.disabled = !(document.getElementById('listNameInput')?.value.trim() && allMapped);
        }
    }
}

new LectureMasterApp();
