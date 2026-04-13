// javascript/handlers/nestedTableRowHandler.js

import { ComparisonModalRenderer } from '../components/comparisonModalRenderer.js';
import { RechampService } from '../services/rechampService.js';
import { AdminLectureService } from '../services/adminLectureService.js';
import { ChampLectureService } from '../services/champLectureService.js';
import { UnifiedLcmsService } from '../services/unifiedLcmsService.js';

/**
 * 중첩 테이블 행의 펼치기/접기 및 데이터 로딩을 처리하는 핸들러
 */
export class NestedTableRowHandler {
    constructor(tableContainer, app, bookMap) {
        if (!tableContainer || !app) {
            throw new Error('Table container and app instance must be provided.');
        }
        this.tableContainer = tableContainer;
        this.app = app;
        this.bookMap = bookMap;
        this.comparisonModal = new ComparisonModalRenderer();
        
        this.tableContainer.addEventListener('click', this.handleTableClick.bind(this));
        console.log('NestedTableRowHandler 초기화 및 이벤트 리스너 설정 완료.');
    }

    /**
     * 테이블 클릭 이벤트를 통합적으로 처리합니다.
     * @param {Event} event 
     */
    handleTableClick(event) {
        const toggleIcon = event.target.closest('.toggle-icon');
        const detailsIcon = event.target.closest('.details-icon');

        if (toggleIcon) {
            this.handleToggleClick(toggleIcon);
        } else if (detailsIcon) {
            this.handleDetailsClick(detailsIcon);
        }
    }

    /**
     * 상세 보기 아이콘 클릭을 처리합니다.
     * @param {HTMLElement} detailsIcon 
     */
    handleDetailsClick(detailsIcon) {
        const itemDataString = detailsIcon.dataset.item;
        if (!itemDataString) return;

        try {
            const itemData = JSON.parse(itemDataString);
            
            // 클릭된 아이콘의 상위 b2c-details-row를 찾아 b2b-lecture-id를 가져옵니다.
            const detailsRow = detailsIcon.closest('tr.b2c-details-row');
            const b2bLectureId = detailsRow ? detailsRow.dataset.detailsFor : null;

            let b2bLectureData = null;
            if (b2bLectureId) {
                b2bLectureData = this.app.allLectureData.find(l => String(l['강의코드']) === String(b2bLectureId));
            } else {
                console.error('B2B 강의 ID를 찾을 수 없습니다.');
            }
            
            this.comparisonModal.show(b2bLectureData, itemData);
        } catch (error) {
            console.error('상세 데이터를 파싱하는 중 오류 발생:', error);
        }
    }

    /**
     * 행 펼치기/접기 아이콘 클릭을 처리합니다.
     * @param {HTMLElement} toggleIcon 
     */
    handleToggleClick(toggleIcon) {
        if (!RechampService.rechampData) {
            console.warn("데이터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        
        const lectureId = toggleIcon.dataset.lectureId;
        const detailsRow = this.tableContainer.querySelector(`tr.b2c-details-row[data-details-for="${lectureId}"]`);

        if (!detailsRow) {
            console.error('상세 정보 행을 찾을 수 없습니다:', lectureId);
            return;
        }

        const isHidden = detailsRow.style.display === 'none';
        detailsRow.style.display = isHidden ? '' : 'none';
        toggleIcon.classList.toggle('expanded', isHidden);

        if (isHidden && !detailsRow.dataset.loaded) {
            this.loadAndRenderNestedData(lectureId, detailsRow);
            detailsRow.dataset.loaded = 'true';
        }
    }

    findRelatedData(b2bLectureId) {
        const relatedData = new Map();
        const messages = [];
        const b2bLecture = this.app.allLectureData.find(l => l['강의코드'] === b2bLectureId);

        if (b2bLecture) {
            relatedData.set(`b2b-${b2bLectureId}`, { platform: 'B2B', ...b2bLecture });
            messages.push('B2B 데이터를 추가했습니다.');
        }

        if (!b2bLecture || !b2bLecture['B2C강의코드']) {
            messages.push('B2B 강의에 연결된 B2C강의코드가 없습니다.');
            return { data: relatedData, messages };
        }
        messages.push(`B2C강의코드 '${b2bLecture['B2C강의코드']}'로 연동 시작...`);

        const b2cCode = String(b2bLecture['B2C강의코드']);
        const rechampMatches = RechampService.getAllRechampDataByB2CCode(b2cCode);

        if (!rechampMatches || rechampMatches.length === 0) {
            messages.push(`'${b2cCode}'에 해당하는 (re)챔프스터디 데이터를 찾을 수 없습니다.`);
            return { data: relatedData, messages };
        }
        messages.push(`(re)챔프스터디에서 ${rechampMatches.length}개의 일치 항목을 찾았습니다.`);

        for (const rechampMatch of rechampMatches) {
            relatedData.set(`rechamp-${rechampMatch.lectureCode}-${Math.random()}`, { platform: '(re)챔프스터디', ...rechampMatch });
            
            const skinId = rechampMatch.skinId ? String(rechampMatch.skinId) : null;
            if (!skinId) {
                messages.push(`(re)챔프스터디 강의(코드: ${rechampMatch.lectureCode})에 스킨ID가 없습니다.`);
                continue;
            }
            messages.push(`스킨ID '${skinId}'로 하위 연동 시작...`);

            const champAdminMatches = AdminLectureService.getDataById(skinId);
            if (champAdminMatches && champAdminMatches.length > 0) {
                messages.push(`챔프Admin에서 ${champAdminMatches.length}개의 연동 항목을 찾았습니다.`);
                for (const champAdmin of champAdminMatches) {
                    const champLecId = champAdmin.champLectureId ? String(champAdmin.champLectureId) : null;
                    if (champLecId) {
                        const champMatches = ChampLectureService.getAllDataByRowNo(champLecId);
                        if (champMatches && champMatches.length > 0) {
                            for (const champMatch of champMatches) {
                                relatedData.set(`champ-${champMatch.rowNo}-${Math.random()}`, {
                                    platform: '챔프강의창',
                                    ...champMatch,
                                    '연동강의코드': champAdmin.adminLectureCode,
                                    '연동강의플랫폼': champAdmin.serviceCategory
                                });
                            }
                        }
                    }
        
                    const adminLecCode = champAdmin.adminLectureCode ? String(champAdmin.adminLectureCode) : null;
                    if (adminLecCode && champAdmin.serviceCategory === '통합LCMS') {
                        const lcmsMatches = UnifiedLcmsService.getDataByLectureId(adminLecCode);
                        if (lcmsMatches && lcmsMatches.length > 0) {
                            for (const lcmsMatch of lcmsMatches) {
                                relatedData.set(`lcms-${lcmsMatch.lectureId}-${Math.random()}`, { platform: '통합LCMS', ...lcmsMatch });
                            }
                        }
                    }
                }
            } else {
                messages.push(`챔프Admin에서 스킨ID '${skinId}'를 찾지 못했습니다. 챔프강의창 직접 조회를 시도합니다.`);
                const champMatches = ChampLectureService.getAllDataByRowNo(skinId);
                if (champMatches && champMatches.length > 0) {
                    messages.push(`(Fallback) 챔프강의창에서 rowNo '${skinId}'와 일치하는 항목을 찾았습니다.`);
                    for (const champMatch of champMatches) {
                        relatedData.set(`champ-${champMatch.rowNo}-${Math.random()}`, {
                            platform: '챔프강의창',
                            ...champMatch
                        });
                    }
                } else {
                    messages.push(`(Fallback) 챔프강의창에서 rowNo '${skinId}'에 해당하는 데이터를 찾지 못했습니다.`);
                }
            }
        }
        
        return { data: relatedData, messages };
    }
    
    loadAndRenderNestedData(lectureId, detailsRow) {
        const container = detailsRow.querySelector('.nested-table-container');
        const { data, messages } = this.findRelatedData(lectureId);
        const relatedData = Array.from(data.values());
        const b2bLecture = this.app.allLectureData.find(l => l['강의코드'] === lectureId);

        let contentHtml = '';

        if (relatedData.length === 0) {
            const messageHtml = messages.map(msg => `<p class="no-data-message">${msg}</p>`).join('');
            contentHtml += messageHtml;
        } else {
            // 연동 체인은 표로 보여주되, "상세(돋보기)" 컬럼만 제거합니다.
            contentHtml += this.renderNestedTable(relatedData);
        }

        if (b2bLecture) {
            contentHtml += this._renderBookDetails(b2bLecture['ISBN']);
        }
        
        container.innerHTML = contentHtml;
    }

    /**
     * 교재 정보 HTML을 생성합니다.
     * @param {string} isbn - 교재의 ISBN
     * @returns {string} 교재 정보 HTML 문자열
     * @private
     */
    _renderBookDetails(isbnsRaw) {
        if (!isbnsRaw) {
            return '';
        }

        const isbns = isbnsRaw.split(',').map(s => s.trim()).filter(Boolean);
        if (isbns.length === 0) {
            return '';
        }

        const books = isbns.map(isbn => this.bookMap.get(isbn)).filter(Boolean);
        if (books.length === 0) {
            return '';
        }
        
        const headers = ['ISBN', '자재코드', '교재명', '저자', '정가', '구매가'];
        const headerHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;

        const rowsHtml = books.map(book => {
            const rowData = [
                book.isbn,
                book.sapMaterialCode,
                book.bookTitle,
                book.author,
                book.listPrice ? `${book.listPrice.toLocaleString()}원` : 'N/A',
                book.purchasePrice ? `${book.purchasePrice.toLocaleString()}원` : 'N/A'
            ];
            return `<tr>${rowData.map(d => `<td>${d}</td>`).join('')}</tr>`;
        }).join('');

        const tableHtml = `<table class="nested-data-table book-details-table">${headerHtml}<tbody>${rowsHtml}</tbody></table>`;

        return `<hr class="book-details-divider"><h3 class="book-main-title">교재 정보</h3>${tableHtml}`;
    }
    
    /**
     * 중첩 테이블의 HTML을 생성합니다.
     * @param {Array<Object>} data 
     * @returns {string}
     */
    renderNestedTable(data) {
        const escapeHtml = (value) => {
            const str = value == null ? '' : String(value);
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        // 통합LCMS의 내부강의(자체제작)은 화면에서 제외
        const filteredData = data.filter(item => {
            if (item?.platform !== '통합LCMS') return true;
            const title = item?.lectureTitle == null ? '' : String(item.lectureTitle).trim();
            return title !== '내부강의(자체제작)';
        });

        // 연결 체인 키(코드/스킨ID/연동코드)에서 "같은 값"을 같은 색으로 강조
        const palette = [
            { bg: '#DBEAFE', border: '#60A5FA' }, // blue
            { bg: '#DCFCE7', border: '#34D399' }, // green
            { bg: '#FEF3C7', border: '#F59E0B' }, // amber
            { bg: '#FCE7F3', border: '#F472B6' }, // pink
            { bg: '#EDE9FE', border: '#8B5CF6' }, // violet
            { bg: '#E0F2FE', border: '#38BDF8' }, // sky
            { bg: '#FFEDD5', border: '#FB923C' }, // orange
            { bg: '#FEE2E2', border: '#F87171' }, // red
        ];

        const linkValues = [];
        for (const item of filteredData) {
            switch (item.platform) {
                case 'B2B':
                    linkValues.push(item['강의코드'], item['B2C강의코드']);
                    break;
                case '(re)챔프스터디':
                    linkValues.push(item.lectureCode, item.skinId);
                    break;
                case '챔프강의창':
                    linkValues.push(item.rowNo, item['연동강의코드']);
                    break;
                case '통합LCMS':
                    linkValues.push(item.lectureId);
                    break;
                default:
                    break;
            }
        }

        const counts = new Map();
        for (const v of linkValues) {
            const key = v == null ? '' : String(v).trim();
            if (!key) continue;
            counts.set(key, (counts.get(key) || 0) + 1);
        }

        const highlight = new Map(); // value -> {bg,border}
        let paletteIdx = 0;
        for (const [value, cnt] of counts.entries()) {
            if (cnt < 2) continue; // 같은 값이 여러 번 등장할 때만 강조
            highlight.set(value, palette[paletteIdx % palette.length]);
            paletteIdx += 1;
        }

        const getCellHighlightAttrs = (value) => {
            const raw = value == null ? '' : String(value).trim();
            if (!raw) return { className: '', style: '' };
            const color = highlight.get(raw);
            if (!color) return { className: '', style: '' };
            return {
                className: 'link-highlight-cell',
                style: `--hl-bg:${color.bg};--hl-border:${color.border};`
            };
        };

        const headers = `
            <th>플랫폼</th>
            <th>강의 코드</th>
            <th class="text-left">강의명</th>
            <th>B2C코드 / 스킨ID</th>
            <th>연동 강의 코드</th>
            <th>연동 강의 플랫폼</th>
            <th>상태/생성일</th>
        `;

        const rows = filteredData.map(item => {
            let code = '', title = '', status = '', skinId = '', linkedCode = '', linkedPlatform = '';
            
            // 플랫폼별로 클래스 이름을 생성합니다. (예: '(re)챔프스터디' -> 'platform-rechamp')
            const platformClass = `platform-${item.platform.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

            switch(item.platform) {
                case 'B2B':
                    code = item['강의코드'];
                    title = item['강의명'];
                    status = `상태: ${item['강의상태'] || 'N/A'}`;
                    skinId = item['B2C강의코드'] || '';
                    break;
                case '(re)챔프스터디':
                    code = item.lectureCode;
                    title = item.lectureTitle;
                    status = `상태: ${item.status || 'N/A'}`;
                    skinId = item.skinId || '';
                    break;
                case '챔프강의창':
                    code = item.rowNo;
                    title = item.lectureTitle;
                    status = `상태: ${item.status || 'N/A'}`;
                    linkedCode = item['연동강의코드'] || '';
                    linkedPlatform = item['연동강의플랫폼'] || '';
                    break;
                case '통합LCMS':
                    code = item.lectureId;
                    title = item.lectureTitle;
                    status = `생성일: ${new Date(item.createdAt).toLocaleDateString() || 'N/A'}`;
                    break;
                default:
                    return '';
            }

            const codeHl = getCellHighlightAttrs(code);
            const skinHl = getCellHighlightAttrs(skinId);
            const linkedHl = getCellHighlightAttrs(linkedCode);

            return `
                <tr class="${platformClass}">
                    <td>${item.platform}</td>
                    <td class="${codeHl.className}" style="${codeHl.style}">${escapeHtml(code)}</td>
                    <td class="text-left">${escapeHtml(title)}</td>
                    <td class="${skinHl.className}" style="${skinHl.style}">${escapeHtml(skinId)}</td>
                    <td class="${linkedHl.className}" style="${linkedHl.style}">${escapeHtml(linkedCode)}</td>
                    <td>${linkedPlatform}</td>
                    <td>${escapeHtml(status)}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="nested-data-table">
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }
}
