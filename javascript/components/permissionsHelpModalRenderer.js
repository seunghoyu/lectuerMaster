export class PermissionsHelpModalRenderer {
    static render({ title, rows }) {
        const rowsHtml = rows.map(r => `
            <tr>
                <td>${r.label}</td>
                <td>${r.O ? '<span class="perm-check">O</span>' : '<span class="perm-empty">-</span>'}</td>
                <td>${r.A ? '<span class="perm-check">O</span>' : '<span class="perm-empty">-</span>'}</td>
                <td>${r.S ? '<span class="perm-check">O</span>' : '<span class="perm-empty">-</span>'}</td>
            </tr>
        `).join('');

        return `
            <div class="modal-overlay" id="permissionsHelpModalOverlay">
                <div class="modal-container" style="max-width: 900px;">
                    <div class="modal-header">
                        <h2>${title || '권한 안내'}</h2>
                        <button class="modal-close" id="closePermissionsHelpModal" aria-label="닫기">
                            <i class="fa-solid fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <table class="permissions-help-table">
                            <thead>
                                <tr>
                                    <th style="width: 55%;">기능</th>
                                    <th style="width: 15%;">운영자(O)</th>
                                    <th style="width: 15%;">관리자(A)</th>
                                    <th style="width: 15%;">최고관리자(S)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-confirm" id="closePermissionsHelpBtn">확인</button>
                    </div>
                </div>
            </div>
        `;
    }

    static renderToDOM(container, payload) {
        const existing = document.getElementById('permissionsHelpModalOverlay');
        if (existing) existing.remove();

        const temp = document.createElement('div');
        temp.innerHTML = this.render(payload);
        const el = temp.firstElementChild;
        if (el) container.appendChild(el);
    }

    static showModal() {
        const overlay = document.getElementById('permissionsHelpModalOverlay');
        if (overlay) overlay.classList.add('active');
    }

    static hideModal() {
        const overlay = document.getElementById('permissionsHelpModalOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    static removeModal() {
        const overlay = document.getElementById('permissionsHelpModalOverlay');
        if (overlay) overlay.remove();
    }
}

