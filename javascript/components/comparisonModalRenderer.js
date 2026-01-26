// javascript/components/detailsModalRenderer.js

export class ComparisonModalRenderer {
    constructor() {
        this.modalOverlay = null;
        this.onClose = null;
        this._createModal();
    }

    _createModal() {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'comparison-modal-overlay';
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.hide();
            }
        });

        const modalContainer = document.createElement('div');
        modalContainer.className = 'comparison-modal-container';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'comparison-modal-header';

        const modalTitle = document.createElement('h2');
        modalTitle.innerHTML = `<i class="fa-solid fa-code-compare"></i> 강의 데이터 비교`;

        const closeButton = document.createElement('button');
        closeButton.className = 'comparison-modal-close';
        closeButton.innerHTML = '<i class="fa-solid fa-times"></i>';
        closeButton.onclick = () => this.hide();

        const modalBody = document.createElement('div');
        modalBody.className = 'comparison-modal-body';
        
        modalHeader.append(modalTitle, closeButton);
        modalContainer.append(modalHeader, modalBody);
        modalOverlay.append(modalContainer);

        document.body.appendChild(modalOverlay);
        this.modalOverlay = modalOverlay;
    }

    show(b2bData, clickedItemData) {
        this.render(b2bData, clickedItemData);
        this.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hide() {
        this.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (this.onClose) {
            this.onClose();
        }
    }

    render(b2bData, clickedItemData) {
        const modalBody = this.modalOverlay.querySelector('.comparison-modal-body');
        modalBody.innerHTML = ''; // Clear previous content

        const comparisonSplitView = document.createElement('div');
        comparisonSplitView.className = 'comparison-split-view';

        // Left Panel for B2B Data
        const leftPanel = document.createElement('div');
        leftPanel.className = 'comparison-panel left-panel';
        leftPanel.innerHTML = '<h3 class="comparison-panel-title">B2B 강의 정보</h3>' + this._renderDataToHtml(b2bData);
        
        // Right Panel for Clicked Item Data
        const rightPanel = document.createElement('div');
        rightPanel.className = 'comparison-panel right-panel';
        rightPanel.innerHTML = `<h3 class="comparison-panel-title">${clickedItemData.platform || '연동 강의'} 정보</h3>` + this._renderDataToHtml(clickedItemData);

        comparisonSplitView.append(leftPanel, rightPanel);
        modalBody.appendChild(comparisonSplitView);
    }

    _renderDataToHtml(data) {
        if (!data) {
            return '<div class="comparison-empty">데이터가 없습니다.</div>';
        }

        let html = '<div class="comparison-data-grid">';
        for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
                let value = data[key];
                
                // 특수 필드 처리 (예: 배열을 쉼표로 연결)
                if (Array.isArray(value)) {
                    value = value.join(', ');
                } else if (value instanceof Date) {
                    value = value.toLocaleString();
                }

                html += `
                    <div class="comparison-item">
                        <span class="comparison-label">${key}</span>
                        <span class="comparison-value">${value !== null && value !== undefined && value !== '' ? ComparisonModalRenderer.escapeHtml(String(value)) : 'N/A'}</span>
                    </div>
                `;
            }
        }
        html += '</div>';
        return html;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
