export class DashboardBulkSettlementController {
    constructor({
        getIsOnDashboard,
        renderDashboard,
        renderPluginBar,
        showInfoModal
    }) {
        this._getIsOnDashboard = getIsOnDashboard;
        this._renderDashboard = renderDashboard;
        this._renderPluginBar = renderPluginBar;
        this._showInfoModal = showInfoModal;

        this.selectionMode = false;
        this.selectedLists = new Set();
    }

    startSelection() {
        this.selectionMode = true;
        this.selectedLists.clear();
        this._refreshUI();
    }

    cancelSelection() {
        this.selectionMode = false;
        this.selectedLists.clear();
        this._refreshUI();
    }

    toggleList(listName) {
        if (!this.selectionMode || !listName) return;
        if (this.selectedLists.has(listName)) this.selectedLists.delete(listName);
        else this.selectedLists.add(listName);
        this.updateButtonState();
    }

    updateButtonState() {
        const btn = document.getElementById('dashboardBulkSettlementBtn');
        const countEl = document.getElementById('dashboardBulkSelectedCount');
        const selectedCount = this.selectedLists.size;

        if (countEl) countEl.textContent = `${selectedCount}개 선택됨`;
        if (btn) btn.disabled = selectedCount === 0;
    }

    runGeneration() {
        if (!this.selectionMode) return;
        const selectedCount = this.selectedLists.size;
        if (selectedCount === 0) return;

        this._showInfoModal?.(
            `선택한 리스트 ${selectedCount}개에 대해 강의료 파일 일괄생성을 시작합니다.`,
            '강의료 파일 일괄생성'
        );

        this.cancelSelection();
    }

    _refreshUI() {
        if (!this._getIsOnDashboard?.()) return;
        this._renderDashboard?.();
        this._renderPluginBar?.();
    }
}

