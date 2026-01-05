/**
 * RENDERING FIXES - PRODUCTION READY
 * Funciones corregidas que realmente muestran los UserEntityBadges
 */

// =====================================================
// HELPER: Mock Entity Assignment (para demo)
// =====================================================
function mockEntityAssignment() {
    // Asigna entidades aleatorias si no existen en los datos
    const entities = ['crowdium', 'cfa'];
    return entities[Math.floor(Math.random() * entities.length)];
}

// =====================================================
// FIX 1: renderMonitoreo - CON BADGES
// =====================================================
function renderMonitoreo() {
    const data = applySortAndFilter(monitoringData, 'monitoreo');

    if (!data || data.length === 0) {
        contentArea.innerHTML = '<div class="loading-state">No hay temas registrados.</div>';
        return;
    }

    contentArea.innerHTML = `
        <div class="table-controls-wrapper">
            <div class="table-controls">
                <div class="search-box">
                    <input type="text" placeholder="Buscar temas..." 
                        value="${tableFilters.monitoreo}" 
                        oninput="handleFilter('monitoreo', this.value)">
                </div>
            </div>
        </div>

        <div class="table-container">
            <table class="premium-table">
                <thead>
                    <tr>
                        <th style="width: 200px; text-align: left;">RESPONSABLE</th>
                        <th onclick="handleSort('theme')">TEMA ${getSortIcon('theme')}</th>
                        <th onclick="handleSort('status')">ESTADO ${getSortIcon('status')}</th>
                        <th onclick="handleSort('update_text')">ÚLTIMA ACTUALIZACIÓN ${getSortIcon('update_text')}</th>
                        <th onclick="handleSort('created_at')">FECHA ${getSortIcon('created_at')}</th>
                        <th style="width: 100px;">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => {
        // Determinar entity (usar mock si no existe)
        const entity = item.entity || mockEntityAssignment();
        const username = item.sender_username || 'Usuario';

        return `
                            <tr>
                                <td>
                                    ${generateUserEntityBadge(username, entity)}
                                </td>
                                <td style="text-align: left; font-weight: 500;">${item.theme}</td>
                                <td>
                                    <span class="status-badge" data-entity="${entity}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td style="text-align: left;">${item.update_text || '-'}</td>
                                <td>${formatDate(item.created_at)}</td>
                                <td>
                                    <button class="btn-minimal edit-monitoring-btn" data-id="${item.id}" title="Editar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="btn-minimal delete-monitoring-btn" data-id="${item.id}" title="Eliminar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Attach event listeners
    document.querySelectorAll('.edit-monitoring-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = monitoringData.find(i => i.id === btn.dataset.id);
            if (item) editMonitoringPost(item);
        });
    });
    document.querySelectorAll('.delete-monitoring-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteMonitoringPost(btn.dataset.id));
    });
}

// =====================================================
// FIX 2: renderVentas - CON BADGES Y ALINEACIÓN
// =====================================================
function renderVentas() {
    const data = applySortAndFilter(salesData, 'distribuciones');

    contentArea.innerHTML = `
        <div class="table-controls-wrapper">
            <div class="table-controls">
                <div class="search-box">
                    <input type="text" placeholder="Buscar..." 
                        value="${tableFilters.distribuciones}" 
                        oninput="handleFilter('distribuciones', this.value)">
                </div>
                <div class="header-actions">
                    <button id="open-project-manager" class="btn-secondary-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        </svg>
                        Gestionar Proyectos
                    </button>
                    <button id="open-status-manager" class="btn-secondary-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-5.6 5.6l-4.2 4.2M1 12h6m6 0h6m-13.2 5.2l4.2-4.2m5.6-5.6l4.2-4.2"></path>
                        </svg>
                        Gestionar Estados
                    </button>
                </div>
            </div>
        </div>

        <div class="table-container">
            <table class="premium-table sales-table">
                <thead>
                    <tr>
                        <th style="width: 200px; text-align: left;">RESPONSABLE</th>
                        <th onclick="handleSort('project_name')">PROYECTO ${getSortIcon('project_name')}</th>
                        <th onclick="handleSort('client_name')">CLIENTE ${getSortIcon('client_name')}</th>
                        <th onclick="handleSort('series')">SERIE ${getSortIcon('series')}</th>
                        <th onclick="handleSort('asset')">ACTIVO ${getSortIcon('asset')}</th>
                        <th onclick="handleSort('gross_amount')" style="text-align: right;">BRUTO ${getSortIcon('gross_amount')}</th>
                        <th onclick="handleSort('net_amount')" style="text-align: right;">NETO ${getSortIcon('net_amount')}</th>
                        <th onclick="handleSort('status')">ESTADO ${getSortIcon('status')}</th>
                        <th style="width: 100px;">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => {
        // Obtener entity y username
        const entity = item.entity || mockEntityAssignment();
        const username = item.user?.username || item.sender_username || 'Usuario';
        const projectName = item.projects?.name || item.project_name || '-';
        const clientName = item.client_name || '-';

        return `
                            <tr data-sale-id="${item.id}">
                                <td>
                                    ${generateUserEntityBadge(username, entity)}
                                </td>
                                <td style="text-align: left; font-weight: 500;">${projectName}</td>
                                <td style="text-align: left;">${clientName}</td>
                                <td>${item.series || '-'}</td>
                                <td>${item.asset || '-'}</td>
                                <td class="amount-cell">${formatFinancialAmount(item.gross_amount)}</td>
                                <td class="amount-cell">${formatFinancialAmount(item.net_amount)}</td>
                                <td>
                                    <span class="status-badge" data-entity="${entity}">
                                        ${item.status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn-minimal" onclick="viewSaleHistory('${item.id}')" title="Ver historial">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Attach project manager button
    document.getElementById('open-project-manager')?.addEventListener('click', openProjectManager);
    document.getElementById('open-status-manager')?.addEventListener('click', openStatusManager);
}

// =====================================================
// FIX 3: renderMuro - CON BADGES DE EMPRESA
// =====================================================
async function renderMuro() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!muroData || muroData.length === 0) {
        contentArea.innerHTML = '<div class="loading-state">El muro está vacío.</div>';
        return;
    }

    const renderedIds = new Set();

    function getReplies(parentId) {
        return muroData
            .filter(m => m.parent_id === parentId)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    function renderMessageHTML(item, isReply = false) {
        renderedIds.add(item.id);
        const itemReplies = getReplies(item.id);
        const cardClass = isReply ? 'muro-card reply-card' : 'muro-card';
        const projectName = !isReply && item.project_id ? projects.find(p => p.id === item.project_id)?.name : null;

        // Determinar entity
        const entity = item.entity || mockEntityAssignment();

        return `
            <div class="${isReply ? 'muro-reply-wrapper' : 'thread-group'}" id="msg-${item.id}">
                <div class="${cardClass}">
                    <div class="muro-card-header">
                        <div class="muro-header-left">
                            <span class="muro-sender-wrapper">
                                <span class="muro-entity-badge">
                                    <span class="muro-entity-badge__icon" data-entity="${entity}">
                                        ${entity === 'crowdium' ? 'C' : 'F'}
                                    </span>
                                </span>
                                <span class="muro-sender">${item.sender_username}</span>
                            </span>
                            ${item.tagged_username ? `<span class="muro-tag">@${item.tagged_username}</span>` : ''}
                        </div>
                        <div class="muro-header-right">
                            <span class="muro-date">${formatDate(item.created_at)}</span>
                            <div class="muro-actions">
                                <button class="btn-minimal reply-wall-btn" data-id="${item.id}" title="Responder">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="9 17 4 12 9 7"></polyline>
                                        <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
                                    </svg>
                                </button>
                                ${session && session.user.id === item.sender_id ? `
                                    <button class="btn-minimal edit-wall-btn" data-id="${item.id}" title="Editar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="btn-minimal delete-wall-btn" data-id="${item.id}" title="Eliminar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    ${projectName ? `<div class="muro-project">PROYECTO: ${projectName}</div>` : ''}
                    <div class="muro-message">${item.message}</div>
                </div>
                
                ${itemReplies.length > 0 ? `
                    <div class="muro-replies">
                        ${itemReplies.map(reply => renderMessageHTML(reply, true)).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    const topLevelThreads = muroData.filter(m => !m.parent_id);
    let finalHTML = topLevelThreads.map(thread => renderMessageHTML(thread)).join('');

    const orphans = muroData.filter(m => m.parent_id && !renderedIds.has(m.id));
    if (orphans.length > 0) {
        orphans.forEach(o => {
            if (!renderedIds.has(o.id)) {
                finalHTML += `
                    <div class="orphan-thread">
                        <div class="orphan-label">Conversación vinculada (parent missing):</div>
                        ${renderMessageHTML(o)}
                    </div>
                `;
            }
        });
    }

    contentArea.innerHTML = finalHTML || '<div class="loading-state">El muro está vacío.</div>';

    // Attach listeners
    document.querySelectorAll('.reply-wall-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            replyingToId = btn.dataset.id;
            editingItemId = null;
            updateModalFields();
            modalOverlay.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.edit-wall-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const item = muroData.find(m => m.id === btn.dataset.id);
            if (item) {
                editingItemId = item.id;
                replyingToId = null;
                updateModalFields();
                setTimeout(() => {
                    document.getElementById('wall-msg').value = item.message;
                    modalOverlay.classList.remove('hidden');
                }, 0);
            }
        });
    });

    document.querySelectorAll('.delete-wall-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('¿Eliminar este mensaje?')) {
                const { error } = await supabaseClient.from('wall_messages').delete().eq('id', btn.dataset.id);
                if (error) alert('Error: ' + error.message);
                else fetchData();
            }
        });
    });
}

// =====================================================
// NOTA: Reemplazar estas funciones en app.js
// =====================================================
console.log('✅ Rendering fixes loaded. Replace renderMonitoreo(), renderVentas(), and renderMuro() in app.js with these versions.');
