let allData = [];
let currentPage = 1;
const itemsPerPage = 20;

document.addEventListener('DOMContentLoaded', function() {
    loadJsonData();
});

function loadJsonData() {
    fetch('data/b2b_lectureList.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`JSON 파일을 불러올 수 없습니다. (Status: ${response.status})`);
            }
            return response.json();
        })
        .then(data => {
            allData = data;
            
            // 기본 정렬: 강의생성일 최신순 (내림차순)
            allData.sort((a, b) => {
                const dateA = new Date(a['강의생성일']);
                const dateB = new Date(b['강의생성일']);
                return dateB - dateA;
            });

            renderTable(1);
        })
        .catch(error => console.error('Error loading JSON:', error));
}

function renderTable(page) {
    currentPage = page;
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    // 현재 페이지에 해당하는 데이터 슬라이싱
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = allData.slice(start, end);

    let html = `
        <div class="table-scroll-area">
            <table class="data-table">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAllCheckbox"></th>
                        <th>순번</th>
                        <th>카테고리</th>
                        <th>강의상태</th>
                        <th>강의명</th>
                        <th>강의코드</th>
                        <th>강의 타입</th>
                        <th>강사명</th>
                        <th>업체명</th>
                        <th>생성자</th>
                        <th>생성일시</th>
                    </tr>
                </thead>
                <tbody>
    `;

    pageData.forEach((item, index) => {
        html += `
            <tr>
                <td><input type="checkbox" class="row-checkbox"></td>
                <td>${start + index + 1}</td>
                <td>${item['카테고리'] || ''}</td>
                <td>${item['강의상태'] || ''}</td>
                <td class="text-left">${item['강의명'] || ''}</td>
                <td>${item['강의코드'] || ''}</td>
                <td>${item['자체/외부강의'] || ''}</td>
                <td>${item['강사명'] || ''}</td>
                <td>${item['업체명'] || ''}</td>
                <td></td>
                <td>${item['강의생성일'] || ''}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    // 페이지네이션 추가
    html += renderPagination();

    tableContainer.innerHTML = html;
    
    // 페이지네이션 이벤트 연결
    bindPaginationEvents();
    bindDragScrollEvents();
    bindCheckboxEvents();
    bindCellClickEvents();
}

function renderPagination() {
    const totalPages = Math.ceil(allData.length / itemsPerPage);
    const maxPagesToShow = 10;
    const startPage = Math.floor((currentPage - 1) / maxPagesToShow) * maxPagesToShow + 1;
    const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

    let paginationHtml = '<div class="pagination">';

    if (startPage > 1) {
        paginationHtml += `<button class="btn-page" data-page="${startPage - 1}">&lt;</button>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        // 현재 페이지 강조 스타일 (인라인 스타일 사용)
        const activeStyle = i === currentPage ? 'style="background-color: #714b67; color: white; border-color: #714b67;"' : '';
        paginationHtml += `<button class="btn-page" ${activeStyle} data-page="${i}" ${i === currentPage ? 'disabled' : ''}>${i}</button>`;
    }

    if (endPage < totalPages) {
        paginationHtml += `<button class="btn-page" data-page="${endPage + 1}">&gt;</button>`;
    }

    paginationHtml += '</div>';
    return paginationHtml;
}

function bindPaginationEvents() {
    const buttons = document.querySelectorAll('.btn-page');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page && page !== currentPage) {
                renderTable(page);
            }
        });
    });
}

function bindDragScrollEvents() {
    const slider = document.querySelector('.table-scroll-area');
    if (!slider) return;

    let isDown = false;
    let startX, startY;
    let scrollLeft, scrollTop;

    slider.addEventListener('mousedown', (e) => {
        // 스크롤바 자체를 클릭했을 때는 드래그가 동작하지 않도록 함
        if (e.offsetX > slider.clientWidth || e.offsetY > slider.clientHeight) {
            return;
        }
        // 텍스트 선택을 위해 td 내부 클릭 시 드래그 스크롤 방지
        if (e.target.closest('td')) return;

        isDown = true;
        slider.classList.add('active-drag');
        startX = e.pageX;
        startY = e.pageY;
        scrollLeft = slider.scrollLeft;
        scrollTop = slider.scrollTop;
    });

    const stopDrag = () => {
        isDown = false;
        slider.classList.remove('active-drag');
    };

    slider.addEventListener('mouseleave', stopDrag);
    slider.addEventListener('mouseup', stopDrag);

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const walkX = (e.pageX - startX) * 2; // 스크롤 속도 조절
        const walkY = (e.pageY - startY) * 2;
        slider.scrollLeft = scrollLeft - walkX;
        slider.scrollTop = scrollTop - walkY;
    });
}

function bindCheckboxEvents() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }
}

function bindCellClickEvents() {
    const table = document.querySelector('.data-table');
    if (!table) return;

    table.addEventListener('click', (e) => {
        const cell = e.target.closest('td');
        // 체크박스 셀이나 셀이 아닌 경우 무시
        if (!cell || cell.querySelector('input[type="checkbox"]')) return;

        // 기존 선택 제거
        const prevSelected = table.querySelector('.selected-cell');
        if (prevSelected) prevSelected.classList.remove('selected-cell');

        // 새 선택 추가
        cell.classList.add('selected-cell');
    });
}
