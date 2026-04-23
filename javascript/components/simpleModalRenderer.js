/**
 * confirm/info 용 심플 모달 렌더러
 * - overlay 클릭 / ESC / X 버튼 닫기 지원
 * - 기존 modal.css 스타일(.modal-overlay/.modal-container/.btn-*) 재사용
 */
export class SimpleModalRenderer {
    static confirm({
        id = 'simpleConfirmModalOverlay',
        title = '확인',
        message = '',
        confirmText = '예',
        cancelText = '아니오',
        confirmClass = 'btn-confirm',
        onConfirm,
        onCancel
    }) {
        this._remove(id);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
            <div class="modal-overlay" id="${id}">
                <div class="modal-container" style="max-width: 420px;">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button type="button" class="modal-close" data-role="close" aria-label="닫기">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" data-role="cancel">${cancelText}</button>
                        <button type="button" class="${confirmClass}" data-role="confirm">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        const overlay = tempDiv.firstElementChild;
        document.body.appendChild(overlay);

        const close = () => this._remove(id);

        const handleCancel = () => {
            close();
            if (typeof onCancel === 'function') onCancel();
        };
        const handleConfirm = () => {
            close();
            if (typeof onConfirm === 'function') onConfirm();
        };

        overlay.querySelector('[data-role="cancel"]')?.addEventListener('click', handleCancel);
        overlay.querySelector('[data-role="confirm"]')?.addEventListener('click', handleConfirm);
        overlay.querySelector('[data-role="close"]')?.addEventListener('click', handleCancel);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) handleCancel();
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
        };
        this._addKeydown(id, keyHandler);

        requestAnimationFrame(() => overlay.classList.add('active'));
    }

    static info({
        id = 'simpleInfoModalOverlay',
        title = '안내',
        message = '',
        okText = '확인',
        onOk
    }) {
        this._remove(id);

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `
            <div class="modal-overlay" id="${id}">
                <div class="modal-container" style="max-width: 420px;">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <button type="button" class="modal-close" data-role="close" aria-label="닫기">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-confirm" data-role="ok">${okText}</button>
                    </div>
                </div>
            </div>
        `;

        const overlay = tempDiv.firstElementChild;
        document.body.appendChild(overlay);

        const close = () => this._remove(id);
        const handleOk = () => {
            close();
            if (typeof onOk === 'function') onOk();
        };

        overlay.querySelector('[data-role="ok"]')?.addEventListener('click', handleOk);
        overlay.querySelector('[data-role="close"]')?.addEventListener('click', handleOk);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) handleOk();
        });

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleOk();
            }
        };
        this._addKeydown(id, keyHandler);

        requestAnimationFrame(() => overlay.classList.add('active'));
    }

    static close(id) {
        this._remove(id);
    }

    static _addKeydown(id, handler) {
        if (!this._keydownMap) this._keydownMap = new Map();
        this._removeKeydown(id);
        this._keydownMap.set(id, handler);
        document.addEventListener('keydown', handler);
    }

    static _removeKeydown(id) {
        if (!this._keydownMap) return;
        const handler = this._keydownMap.get(id);
        if (handler) {
            document.removeEventListener('keydown', handler);
            this._keydownMap.delete(id);
        }
    }

    static _remove(id) {
        const overlay = document.getElementById(id);
        if (overlay) overlay.remove();
        this._removeKeydown(id);
    }
}

