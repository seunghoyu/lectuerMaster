export class B2CNestedRowHandler {
    constructor(tableContainer, app) {
        this.tableContainer = tableContainer;
        this.app = app;
        this._onTableClick = null;
        this._bound = false;
    }

    bindEvents() {
        if (!this.tableContainer || this._bound) return;

        this._onTableClick = (e) => {
            const toggleIcon = e.target.closest('.toggle-icon');
            if (!toggleIcon) return;
            const tr = toggleIcon.closest('tr.b2c-row');
            if (!tr) return;

            const lectureId = toggleIcon.dataset.lectureId || tr.dataset.lectureId;
            if (!lectureId) return;

            if (e.target.closest('.filter-icon-container')) return;

            e.preventDefault();
            e.stopPropagation();

            const detailsRow = this.tableContainer.querySelector(
                `tr.b2c-details-row[data-details-for="${CSS.escape(lectureId)}"]`
            );
            if (!detailsRow) return;

            const isHidden = detailsRow.style.display === 'none';
            detailsRow.style.display = isHidden ? '' : 'none';
            toggleIcon.classList.toggle('expanded', isHidden);

            if (isHidden && !detailsRow.dataset.loaded) {
                this.renderChain(lectureId, detailsRow);
                detailsRow.dataset.loaded = 'true';
            }
        };

        this.tableContainer.addEventListener('click', this._onTableClick);
        this._bound = true;
    }

    renderChain(b2cLectureId, detailsRow) {
        const container = detailsRow.querySelector('.nested-table-container');
        if (!container) return;

        const rows = typeof this.app.getB2CRelatedRowsForNestedTable === 'function'
            ? this.app.getB2CRelatedRowsForNestedTable(b2cLectureId)
            : [];

        const nested = this.app.nestedTableRowHandler;
        if (!nested || typeof nested.renderNestedTable !== 'function') {
            container.innerHTML = `<p class="no-data-message">중첩 테이블을 렌더링할 수 없습니다.</p>`;
            return;
        }

        if (!rows || rows.length === 0) {
            container.innerHTML = `<p class="no-data-message">연동 데이터가 없습니다.</p>`;
            return;
        }

        container.innerHTML = nested.renderNestedTable(rows);
    }
}
