// Supabase Configuration
const SUPABASE_URL = 'https://tbvwbrxrncandxgavmdf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_rI71dgtNbNivQySL2BPj9A_NGTGjjKD';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let currentSection = 'monitoreo';
let monitoringData = [];
let salesData = [];
let muroData = [];
let statusOptions = [];
let salesHistory = {}; // Store history per sale id
let projects = [];
const users = ["Ian", "Sofia", "Juan", "Carlos"];

// =====================================================
// HELPER FUNCTIONS FOR ENTITY BADGES AND FORMATTING
// =====================================================

/**
 * Generate User Entity Badge - CLEAN FLEXBOX
 */
function generateUserEntityBadge(username, entity = 'crowdium', avatarUrl = null) {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
    const avatar = avatarUrl || defaultAvatar;
    const logoPath = entity === 'crowdium' ? 'logo-crowdium.png' : 'logo-cfa.png';

    return `
        <div class="user-badge-row">
            <img src="${avatar}" 
                 alt="${username}" 
                 class="user-avatar"
                 onerror="this.src='https://ui-avatars.com/api/?name=U&background=ccc'"
            />
            <div class="user-info">
                <span class="user-name">${username}</span>
                <img src="${logoPath}" 
                     alt="${entity}" 
                     class="company-logo-mini"
                     onerror="this.style.display='none'"
                />
            </div>
        </div>
    `;
}

/**
 * Format financial amounts
 */
function formatFinancialAmount(amount) {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Get user entity from profile
 */
function getUserEntity(userId) {
    const profile = allProfiles?.find(p => p.id === userId);
    return profile?.entity || 'crowdium';
}

/**
 * Get status type for color coding
 */
function getStatusType(status) {
    const statusLower = status.toLowerCase().trim();
    if (statusLower.includes('listo') || statusLower.includes('completado') || statusLower.includes('terminado')) {
        return 'completed';
    }
    if (statusLower.includes('bloqueado') || statusLower.includes('cancelado')) {
        return 'blocked';
    }
    if (statusLower.includes('progreso') || statusLower.includes('proceso')) {
        return 'en-progreso';
    }
    if (statusLower.includes('revisión') || statusLower.includes('revision') || statusLower.includes('review')) {
        return 'review';
    }
    return 'pending';
}
let attendanceData = [];
let allProfiles = [];
let isStatusManagerOpen = false;
let selectedNewColor = 1; // Default color for new status
let editingItemId = null; // Track if we are editing an item in a modal
let replyingToId = null;  // Track if we are replying to a wall message

// Filtering & Sorting State
let sortConfig = { key: 'created_at', direction: 'desc' };
let tableFilters = { monitoreo: '', distribuciones: '' };


// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authUsername = document.getElementById('auth-username');
const usernameGroup = document.getElementById('username-group');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSubtitle = document.getElementById('auth-subtitle');
// const authToggleLink = document.getElementById('auth-toggle-link'); // Removed

const logoutBtn = document.getElementById('logout-btn');
const authModalOverlay = document.getElementById('auth-modal-overlay');
const closeAuthModalBtn = document.getElementById('close-auth-modal');

const contentArea = document.getElementById('content-area');
const sectionTitle = document.getElementById('section-title');
const sectionSubtitle = document.getElementById('section-subtitle');
const navItems = document.querySelectorAll('.nav-item');
const addItemBtn = document.getElementById('add-item-btn');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal');
const addItemForm = document.getElementById('add-item-form');
const modalTitle = document.getElementById('modal-title');
const userNameDisplay = document.querySelector('.user-name');
const userAvatarDisplay = document.getElementById('user-avatar');
const userRoleDisplay = document.getElementById('user-role');

// 1. Initialize & Auth Listener
// 1. Initialize & Auth Listener
document.addEventListener('DOMContentLoaded', async () => {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hidden');

    // Always fetch data immediately (Public Read)
    fetchData();
    appContainer.classList.remove('hidden'); // Show app by default

    // Check initial session
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleAuthStateChange(session);

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        handleAuthStateChange(session);
    });

    setupRealtime();
});

async function handleAuthStateChange(session) {
    if (session) {
        // User is logged in
        logoutBtn.textContent = 'Cerrar Sesión';
        logoutBtn.classList.remove('btn-login-style');

        // Fetch username from profiles
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .single();

        const username = profile ? profile.username : session.user.email.split('@')[0];
        userNameDisplay.textContent = username;

        // Update initials
        if (userAvatarDisplay) {
            userAvatarDisplay.textContent = getInitials(username);
        }

        // Update role
        if (userRoleDisplay) {
            userRoleDisplay.textContent = 'ADMINISTRADOR'; // Standard for logged in users in this app context
        }

        // Hide auth modal if open
        if (authModalOverlay) authModalOverlay.classList.add('hidden');
        if (authContainer && !authContainer.classList.contains('hidden')) authContainer.classList.add('hidden');
    } else {
        // User is guest
        logoutBtn.textContent = 'Iniciar Sesión';
        logoutBtn.classList.add('btn-login-style');
        userNameDisplay.textContent = 'Invitado';

        if (userAvatarDisplay) userAvatarDisplay.textContent = '?';
        if (userRoleDisplay) userRoleDisplay.textContent = 'VISITANTE';
    }
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// 2. Auth Logic - Toggle disabled as registration is now manual
/*
authToggleLink.addEventListener('click', (e) => {
    ...
});
*/

// Close Auth Modal
closeAuthModalBtn.addEventListener('click', () => {
    authModalOverlay.classList.add('hidden');
});


authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let email = authEmail.value;
    const password = authPassword.value;

    // If it's just a username, append the domain
    if (!email.includes('@')) {
        email = `${email.toLowerCase()}@crowdium.com`;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert('Error al entrar: ' + error.message);
    // On success, onAuthStateChange handles UI
});

logoutBtn.addEventListener('click', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        await supabaseClient.auth.signOut();
    } else {
        // Open Auth Modal
        authModalOverlay.classList.remove('hidden');
    }
});

// 3. Data Logic
async function fetchData() {
    try {
        // Core dependencies for rendering
        const { data: projData } = await supabaseClient.from('projects').select('*').order('name');
        if (projData) projects = projData;

        if (currentSection === 'monitoreo') {
            const { data, error } = await supabaseClient
                .from('monitoring_status')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) { monitoringData = data; renderMonitoreo(); }
        } else if (currentSection === 'distribuciones') {
            // Fetch sales data
            const { data, error } = await supabaseClient
                .from('sales_status')
                .select('*, projects(name)')
                .order('created_at', { ascending: false });
            if (!error && data) { salesData = data; }

            // ALWAYS fetch status options when viewing sales
            const { data: statusOpts, error: statusError } = await supabaseClient
                .from('sales_status_options')
                .select('*')
                .order('display_order');
            if (!statusError && statusOpts) {
                statusOptions = statusOpts;
                console.log('Loaded status options:', statusOptions);
            }

            renderVentas();
        } else if (currentSection === 'muro') {
            const { data, error } = await supabaseClient
                .from('wall_messages')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) { muroData = data; renderMuro(); }
        } else if (currentSection === 'asistencia') {
            const { data: attData, error: attError } = await supabaseClient
                .from('user_attendance')
                .select('*');
            const { data: profData, error: profError } = await supabaseClient
                .from('profiles')
                .select('*')
                .order('username');

            if (!attError && attData) attendanceData = attData;
            if (!profError && profData) allProfiles = profData;

            renderAsistencia();
        }

        if (statusOptions.length === 0) {
            await fetchStatusOptions();
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

async function fetchStatusOptions() {
    const { data, error } = await supabaseClient
        .from('sales_status_options')
        .select('*')
        .order('display_order');
    if (!error && data) statusOptions = data;
}

function setupRealtime() {
    supabaseClient
        .channel('db-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wall_messages' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_status' }, fetchData)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'monitoring_status' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_status_options' }, async () => {
            await fetchStatusOptions();
            if (currentSection === 'distribuciones') renderVentas();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_attendance' }, () => {
            if (currentSection === 'asistencia') fetchData();
        })
        .subscribe();
}

// 4. Navigation & UI Logic
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        if (section === currentSection) return;

        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        currentSection = section;
        updateView();

        // Premium touch: scroll content to top on section change
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

function updateModalFields() {
    // Completely clear the form first to prevent duplicates
    addItemForm.innerHTML = '';

    if (currentSection === 'monitoreo') {
        modalTitle.textContent = 'Nuevo Tema';
        const fields = document.createElement('div');
        fields.innerHTML = `
            <div class="form-group">
                <label for="item-theme">Tema</label>
                <input type="text" id="item-theme" required placeholder="Ej: Distribucion 2C">
            </div>
            <div class="form-group">
                <label for="item-status">Estado</label>
                <select id="item-status">
                    <option value="OK">OK</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Pendiente">Pendiente</option>
                </select>
            </div>
            <div class="form-group">
                <label for="item-update">Última Novedad</label>
                <textarea id="item-update" required placeholder="Describe el estado actual..."></textarea>
            </div>
        `;
        addItemForm.appendChild(fields);
    } else if (currentSection === 'distribuciones') {
        modalTitle.textContent = 'Nuevo Estado de Venta';
        const fields = document.createElement('div');
        fields.innerHTML = `
            <div class="form-group">
                <label for="sale-project">Proyecto</label>
                <select id="sale-project" required>
                    <option value="">Seleccionar Proyecto...</option>
                    ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="sale-series">Serie</label>
                <input type="text" id="sale-series" placeholder="Ej: Serie A">
            </div>
            <div class="form-group">
                <label for="sale-asset">Activo</label>
                <input type="text" id="sale-asset" placeholder="Ej: Depto 201">
            </div>
            <div class="form-group">
                <label for="sale-gross">Bruto de Venta</label>
                <input type="number" id="sale-gross" placeholder="0.00">
            </div>
            <div class="form-group">
                <label for="sale-net">Neto a Distribuir</label>
                <input type="number" id="sale-net" placeholder="0.00">
            </div>
            <div class="form-group">
                <label for="sale-status">Estado</label>
                <select id="sale-status">
                    ${statusOptions.map(opt => `<option value="${opt.label}">${opt.label}</option>`).join('')}
                </select>
            </div>
        `;
        addItemForm.appendChild(fields);
    } else if (currentSection === 'muro') {
        const isReply = replyingToId !== null;
        const isEdit = editingItemId !== null;

        modalTitle.textContent = isEdit ? 'Editar Mensaje' : (isReply ? 'Responder' : 'Nuevo Mensaje en Muro');

        const fields = document.createElement('div');
        fields.innerHTML = `
            ${isReply ? `
                <div class="reply-context">
                    <span class="reply-label">En respuesta a:</span>
                    <p class="reply-preview">"${muroData.find(m => m.id === replyingToId)?.message.substring(0, 80)}..."</p>
                </div>
            ` : ''}
            <div class="form-group">
                <label for="wall-msg">Mensaje</label>
                <textarea id="wall-msg" required placeholder="Escribe tu mensaje..."></textarea>
            </div>
            ${!isReply ? `
                <div class="form-group">
                    <label for="wall-tag">Etiquetar a (Opcional)</label>
                    <select id="wall-tag" multiple style="height: 100px;">
                        ${users.map(u => `<option value="${u}">${u}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="wall-project">Proyecto Relacionado (Opcional)</label>
                    <select id="wall-project">
                        <option value="">Ninguno</option>
                        ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                    </select>
                </div>
            ` : ''}
        `;
        addItemForm.appendChild(fields);

        // Pre-fill if editing
        if (isEdit) {
            const item = muroData.find(m => m.id === editingItemId);
            if (item) {
                setTimeout(() => {
                    document.getElementById('wall-msg').value = item.message;
                    if (!isReply && document.getElementById('wall-project')) {
                        document.getElementById('wall-project').value = item.project_id || '';
                    }
                }, 0);
            }
        }
    }

    // Single set of buttons added at the end
    const actions = document.createElement('div');
    actions.className = 'modal-actions';
    actions.innerHTML = `
        <button type="button" id="close-modal" class="btn-secondary">Cancelar</button>
        <button type="submit" class="btn-primary">Guardar</button>
    `;
    addItemForm.appendChild(actions);

    document.getElementById('close-modal').onclick = () => modalOverlay.classList.add('hidden');
}

// 5. Utility Logic
function applySortAndFilter(data, section) {
    let filtered = [...data];
    const query = tableFilters[section].toLowerCase();

    if (query) {
        filtered = filtered.filter(item => {
            if (section === 'monitoreo') {
                return item.theme?.toLowerCase().includes(query) ||
                    item.status?.toLowerCase().includes(query) ||
                    item.update_text?.toLowerCase().includes(query) ||
                    item.sender_username?.toLowerCase().includes(query);
            } else if (section === 'distribuciones') {
                return item.projects?.name?.toLowerCase().includes(query) ||
                    item.series?.toLowerCase().includes(query) ||
                    item.asset?.toLowerCase().includes(query) ||
                    item.status?.toLowerCase().includes(query);
            }
            return false;
        });
    }

    if (sortConfig.key) {
        filtered.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            // Resolve nested project name
            if (sortConfig.key === 'project_name') {
                valA = a.projects?.name || '';
                valB = b.projects?.name || '';
            }

            if (typeof valA === 'string') {
                return sortConfig.direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            } else {
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
        });
    }

    return filtered;
}

function handleSort(key) {
    if (sortConfig.key === key) {
        sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.direction = 'asc';
    }
    fetchData(); // Re-render with new sort
}

function handleFilter(section, query) {
    tableFilters[section] = query;
    // We don't need to fetch, just re-render
    if (section === 'monitoreo') renderMonitoreo();
    else if (section === 'distribuciones') renderVentas();
}


function updateView() {
    contentArea.innerHTML = '<div class="loading-state">Cargando datos...</div>';

    // Hide add button in assistance section
    if (addItemBtn) {
        if (currentSection === 'asistencia') {
            addItemBtn.classList.add('hidden');
        } else {
            addItemBtn.classList.remove('hidden');
        }
    }

    if (currentSection === 'monitoreo') {
        sectionTitle.textContent = 'Temas en Curso';
        sectionSubtitle.textContent = 'MONITOREO ESTRATÉGICO';
    } else if (currentSection === 'distribuciones') {
        sectionTitle.textContent = 'Estado de Ventas';
        sectionSubtitle.textContent = 'DISTRIBUCIONES Y CIERRES';
    } else if (currentSection === 'muro') {
        sectionTitle.textContent = 'Muro de Comunidad';
        sectionSubtitle.textContent = 'PREGUNTAS Y RESPUESTAS';
    } else if (currentSection === 'asistencia') {
        sectionTitle.textContent = 'Control de Asistencia';
        sectionSubtitle.textContent = 'PLANIFICACIÓN SEMANAL';
    }
    fetchData();
}

function getSortIcon(key) {
    const isActive = sortConfig.key === key;
    const isDesc = sortConfig.direction === 'desc';
    return `<span class="sort-indicator ${isActive ? 'active' : ''} ${isDesc ? 'desc' : ''}">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 0L7.4641 4.5H0.535898L4 0Z" fill="currentColor"/>
        </svg>
    </span>`;
}

async function renderMonitoreo() {
    const data = applySortAndFilter(monitoringData, 'monitoreo');
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!data || data.length === 0) {
        contentArea.innerHTML = '<div class="loading-state">No hay temas registrados.</div>';
        return;
    }

    // Helper: Mock entity if not exists
    const mockEntity = () => ['crowdium', 'cfa'][Math.floor(Math.random() * 2)];

    // Connect to static header search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.oninput = (e) => handleFilter('monitoreo', e.target.value);
        searchInput.value = tableFilters.monitoreo || '';
    }

    contentArea.innerHTML = `
        <div class="table-container">
            <table class="premium-table monitoring-table">
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
        const entity = item.entity || mockEntity();
        const username = item.sender_username || 'Usuario';

        return `
                            <tr class="premium-row">
                                <td>
                                    ${generateUserEntityBadge(username, entity)}
                                </td>
                                <td style="text-align: left; font-weight: 500;">${item.theme}</td>
                                <td>
                                    ${(() => {
                const statusOption = statusOptions.find(opt => opt.id === item.status_option_id) || {};
                const colorClass = statusOption.color_type ? `st-c-${statusOption.color_type}` : 'st-c-12';
                return `<span class="status-badge ${colorClass}">${item.status}</span>`;
            })()}
                                </td>
                                <td style="text-align: left;">${item.update_text || '-'}</td>
                                <td>${formatDate(item.created_at)}</td>
                                <td>
                                    ${session ? `
                                        <div class="row-actions">
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
                                        </div>
                                    ` : ''}
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Attach listeners
    if (session) {
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
}

async function deleteMonitoringPost(id) {
    if (!confirm('¿Estás seguro de eliminar este tema?')) return;
    const { error } = await supabaseClient.from('monitoring_status').delete().eq('id', id);
    if (error) alert('Error al eliminar: ' + error.message);
    else fetchData();
}

function editMonitoringPost(item) {
    editingItemId = item.id;
    updateModalFields();

    // Fill fields - wait a bit for innerHTML to be processed if needed
    setTimeout(() => {
        const themeInput = document.getElementById('item-theme');
        const statusInput = document.getElementById('item-status');
        const updateInput = document.getElementById('item-update');

        if (themeInput) themeInput.value = item.theme;
        if (statusInput) statusInput.value = item.status;
        if (updateInput) updateInput.value = item.update_text;

        modalTitle.textContent = 'Editar Tema';
        modalOverlay.classList.remove('hidden');
    }, 0);
}


function renderVentas() {
    const data = applySortAndFilter(salesData, 'distribuciones');
    const mockEntity = () => ['crowdium', 'cfa'][Math.floor(Math.random() * 2)];

    // Connect to static header search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.oninput = (e) => handleFilter('distribuciones', e.target.value);
        searchInput.value = tableFilters.distribuciones || '';
    }

    contentArea.innerHTML = `
        <div class="table-controls-wrapper" style="margin-bottom: 20px;">
            <div class="header-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
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

        <div class="table-container">
            <table class="premium-table sales-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th style="width: 200px; text-align: left;">RESPONSABLE</th>
                        <th onclick="handleSort('project_name')">PROYECTO ${getSortIcon('project_name')}</th>
                        <th onclick="handleSort('client_name')">CLIENTE ${getSortIcon('client_name')}</th>
                        <th onclick="handleSort('series')">SERIE ${getSortIcon('series')}</th>
                        <th onclick="handleSort('asset')">ACTIVO ${getSortIcon('asset')}</th>
                        <th onclick="handleSort('gross_amount')" style="text-align: right;">BRUTO ${getSortIcon('gross_amount')}</th>
                        <th onclick="handleSort('net_amount')" style="text-align: right;">NETO ${getSortIcon('net_amount')}</th>
                        <th onclick="handleSort('status')">ESTADO ${getSortIcon('status')}</th>
                        <th style="width: 40px;"></th>
                    </tr>
                </thead>
                <tbody>
                    ${data.length === 0 ? '<tr><td colspan="10" class="empty-msg">No se encontraron ventas</td></tr>' : ''}
                    ${data.map(item => {
        const entity = item.entity || mockEntity();
        const username = item.user?.username || item.sender_username || 'Usuario';
        const projectName = item.projects?.name || item.project_name || '-';
        const clientName = item.client_name || '-';

        return `
                            <tr class="premium-row">
                                <td>
                                    <button class="btn-minimal toggle-history" data-id="${item.id}" title="Historial">
                                        <svg class="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                    </button>
                                </td>
                                <td>
                                    ${generateUserEntityBadge(username, entity)}
                                </td>
                                <td class="theme-column"><span class="theme-name">${projectName}</span></td>
                                <td style="text-align: left;"><span class="text-secondary">${clientName}</span></td>
                                <td><span class="text-secondary">${item.series || '-'}</span></td>
                                <td><span class="text-secondary">${item.asset || '-'}</span></td>
                                <td class="amount-cell">${formatFinancialAmount(item.gross_amount)}</td>
                                <td class="amount-cell">${formatFinancialAmount(item.net_amount)}</td>
                                <td>
                                    ${(() => {
                const statusOption = statusOptions.find(opt => opt.id === item.status_option_id) || {};
                const colorClass = statusOption.color_type ? `st-c-${statusOption.color_type}` : 'st-c-12';
                return `<span class="status-badge ${colorClass}">${item.status}</span>`;
            })()}
                                </td>
                                <td>
                                    <div class="action-cell">
                                        <button class="btn-minimal open-status-updater" data-id="${item.id}" title="Editar">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <div id="status-updater-${item.id}" class="status-updater-popover hidden">
                                            <div class="popover-header">Cambiar Estado</div>
                                            <div class="popover-list">
                                                ${statusOptions.map(opt => `
                                                    <div class="status-opt ${item.status === opt.label ? 'active' : ''}" 
                                                        onclick="updateSaleStatus('${item.id}', '${opt.label}')">
                                                        <span class="dot st-c-${opt.color_type || 1}"></span>
                                                        <span class="opt-label">${opt.label}</span>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr id="history-row-${item.id}" class="history-row hidden">
                                <td colspan="10">
                                    <div class="history-container">
                                        <div class="history-header">Historial de Cambios</div>
                                        <div class="history-timeline" id="history-timeline-${item.id}">
                                            <div class="loading-state">Cargando historial...</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    // Attach event listeners
    document.getElementById('open-project-manager')?.addEventListener('click', openProjectManager);
    document.getElementById('open-status-manager')?.addEventListener('click', openStatusManager);

    // History toggle
    document.querySelectorAll('.toggle-history').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.dataset.id;
            const row = document.getElementById(`history-row-${id}`);
            const arrow = this.querySelector('.arrow-icon');

            if (row.classList.contains('hidden')) {
                row.classList.remove('hidden');
                arrow.style.transform = 'rotate(90deg)';
                await loadSaleHistory(id);
            } else {
                row.classList.add('hidden');
                arrow.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Status updater
    document.querySelectorAll('.open-status-updater').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const popover = document.getElementById(`status-updater-${id}`);

            document.querySelectorAll('.status-updater-popover').forEach(p => {
                if (p.id !== `status-updater-${id}`) p.classList.add('hidden');
            });

            popover.classList.toggle('hidden');
        });
    });

    document.addEventListener('click', function (e) {
        if (!e.target.closest('.open-status-updater') && !e.target.closest('.status-updater-popover')) {
            document.querySelectorAll('.status-updater-popover').forEach(p => p.classList.add('hidden'));
        }
    });
}

async function updateStatusLabel(id, newLabel) {
    if (!newLabel) return;
    const { error } = await supabaseClient
        .from('sales_status_options')
        .update({ label: newLabel })
        .eq('id', id);
    if (error) alert('Error al actualizar: ' + error.message);
    else fetchData(); // Re-fetch to update statusOptions and re-render
}

async function deleteStatusOption(id) {
    if (!confirm('¿Seguro? Esto no borrará ventas, pero el estado ya no estará disponible para nuevas ventas.')) return;
    const { error } = await supabaseClient
        .from('sales_status_options')
        .delete()
        .eq('id', id);
    if (error) alert('Error al eliminar: ' + error.message);
    else fetchData(); // Re-fetch to update statusOptions and re-render
}

async function updateSaleStatus(saleId, newStatus) {
    const { error } = await supabaseClient
        .from('sales_status')
        .update({ status: newStatus })
        .eq('id', saleId);

    if (error) alert('Error: ' + error.message);
    else fetchData();
}

function attachSalesListeners() {
    const statusMgrBtn = document.getElementById('open-status-manager');
    const projectMgrBtn = document.getElementById('open-project-manager');

    if (statusMgrBtn) statusMgrBtn.addEventListener('click', openStatusManagerModal);
    if (projectMgrBtn) projectMgrBtn.addEventListener('click', openProjectManagerModal);

    // History Toggle
    document.querySelectorAll('.toggle-history').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const historyRow = document.getElementById(`history-${id}`);
            const svg = btn.querySelector('svg');

            if (historyRow.classList.contains('hidden')) {
                historyRow.classList.remove('hidden');
                svg.style.transform = 'rotate(90deg)';
                await fetchAndRenderHistory(id);
            } else {
                historyRow.classList.add('hidden');
                svg.style.transform = 'rotate(0deg)';
            }
        });
    });

    // Status Updater Popover Toggle
    document.querySelectorAll('.open-status-updater').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const popover = document.getElementById(`status-updater-${id}`);

            // Close other popovers and reset row z-index
            document.querySelectorAll('.status-updater-popover').forEach(p => {
                if (p.id !== `status-updater-${id}`) {
                    p.classList.add('hidden');
                    p.closest('.premium-row').style.zIndex = '';
                }
            });

            const isOpening = popover.classList.contains('hidden');
            popover.classList.toggle('hidden');

            // Manage parent row z-index to stay on top
            const row = btn.closest('.premium-row');
            if (isOpening) {
                row.style.zIndex = '50';
            } else {
                row.style.zIndex = '';
            }
        });
    });

    // Close popovers on click outside
    document.addEventListener('click', (e) => {
        const isClickInsidePopover = e.target.closest('.status-updater-popover');
        const isClickOnToggleButton = e.target.closest('.open-status-updater');
        const isClickInsideColorPicker = e.target.closest('.color-palette-popover');

        if (!isClickInsidePopover && !isClickOnToggleButton && !isClickInsideColorPicker) {
            document.querySelectorAll('.status-updater-popover').forEach(p => {
                p.classList.add('hidden');
                const row = p.closest('.premium-row');
                if (row) row.style.zIndex = '';
            });
        }
    });
}

function renderStatusBadge(statusLabel) {
    const option = statusOptions.find(o => o.label === statusLabel);
    const color = option ? (option.color_type || 1) : 1;
    return `<span class="status-badge st-c-${color}">${statusLabel}</span>`;
}

function closeStatusManagerModal() {
    const modal = document.getElementById('status-manager-modal');
    modal.classList.add('hidden');
    const existing = document.querySelector('.color-palette-popover');
    if (existing) existing.remove();
}

function renderStatusListInModal() {
    const container = document.getElementById('status-list-container');
    container.innerHTML = statusOptions.sort((a, b) => a.display_order - b.display_order).map(opt => `
        <div class="status-item-row" data-id="${opt.id}">
            <div class="current-color-dot st-c-${opt.color_type || 1}" title="Cambiar color"></div>
            <input type="text" class="status-edit-input" value="${opt.label}" data-id="${opt.id}">
            <button class="btn-delete-status" data-id="${opt.id}" title="Eliminar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `).join('');

    container.querySelectorAll('.current-color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = dot.parentElement.dataset.id;
            showColorPicker(e.clientX, e.clientY, id);
        });
    });

    container.querySelectorAll('.status-edit-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            await updateStatusLabel(e.target.dataset.id, e.target.value);
        });
    });

    container.querySelectorAll('.btn-delete-status').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('¿Eliminar este estado?')) {
                await deleteStatusOption(btn.dataset.id);
            }
        });
    });
}

function showColorPicker(x, y, statusId) {
    const existing = document.querySelector('.color-palette-popover');
    if (existing) existing.remove();

    const popover = document.createElement('div');
    popover.className = 'color-palette-popover';

    // Position adjustments for edge of screen
    const left = Math.min(x, window.innerWidth - 160);
    const top = Math.min(y, window.innerHeight - 120);

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;

    const colors = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    popover.innerHTML = colors.map(c => `<div class="palette-dot st-c-${c}" data-color="${c}"></div>`).join('');

    document.body.appendChild(popover);

    popover.querySelectorAll('.palette-dot').forEach(p => {
        p.addEventListener('click', async () => {
            const color = parseInt(p.dataset.color);
            await updateStatusColor(statusId, color);
            popover.remove();
        });
    });

    const closePicker = (ev) => {
        if (!popover.contains(ev.target)) {
            popover.remove();
            document.removeEventListener('click', closePicker);
        }
    };
    setTimeout(() => document.addEventListener('click', closePicker), 0);
}

function openStatusManagerModal() {
    const modal = document.getElementById('status-manager-modal');
    selectedNewColor = 1;

    // Fixed footer redesign inside modal
    const addPanel = modal.querySelector('.add-status-panel');
    addPanel.innerHTML = `
        <h4>Nuevo Estado</h4>
        <div class="add-status-controls">
            <div id="new-color-indicator" class="current-color-dot st-c-1" title="Elegir color"></div>
            <input type="text" id="new-status-input" placeholder="Nombre (ej: Finalizado)">
            <button id="add-status-btn" class="btn-primary btn-add-status">Agregar</button>
        </div>
    `;

    document.getElementById('new-color-indicator').addEventListener('click', (e) => {
        showColorPicker(e.clientX, e.clientY, 'NEW');
    });

    document.getElementById('add-status-btn').addEventListener('click', addStatusFromModal);
    document.getElementById('close-status-modal').addEventListener('click', closeStatusManagerModal);

    renderStatusListInModal();
    modal.classList.remove('hidden');
}

// Project Manager Modal Logic
function openProjectManagerModal() {
    const modal = document.getElementById('project-manager-modal');

    document.getElementById('add-project-btn').onclick = addProjectFromModal;
    document.getElementById('close-project-modal').onclick = () => modal.classList.add('hidden');

    renderProjectListInModal();
    modal.classList.remove('hidden');
}

function renderProjectListInModal() {
    const container = document.getElementById('project-list-container');
    if (!container) return;

    container.innerHTML = projects.map(p => `
        <div class="status-item-row">
            <div class="status-item-info">
                <span class="theme-name">${p.name}</span>
            </div>
            <div class="status-item-actions">
                <button class="btn-minimal-danger" onclick="deleteProjectFromModal('${p.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function addProjectFromModal() {
    const input = document.getElementById('new-project-input');
    const name = input.value.trim();
    if (!name) return;

    const { error } = await supabaseClient.from('projects').insert([{ name }]);
    if (!error) {
        input.value = '';
        await fetchData();
        renderProjectListInModal();
        if (currentSection === 'distribuciones') renderVentas();
    } else {
        alert('Error: ' + error.message);
    }
}

async function deleteProjectFromModal(id) {
    if (!confirm('¿Eliminar proyecto? Las ventas asociadas quedarán sin proyecto.')) return;
    const { error } = await supabaseClient.from('projects').delete().eq('id', id);
    if (!error) {
        await fetchData();
        renderProjectListInModal();
        if (currentSection === 'distribuciones') renderVentas();
    }
}

async function updateStatusColor(id, color_type) {
    if (id === 'NEW') {
        selectedNewColor = color_type;
        const ind = document.getElementById('new-color-indicator');
        if (ind) ind.className = `current-color-dot st-c-${color_type}`;
        return;
    }

    const { error } = await supabaseClient
        .from('sales_status_options')
        .update({ color_type })
        .eq('id', id);

    if (error) {
        if (error.message.includes('column "color_type"')) {
            alert('Aviso técnico: Debes ejecutar el script SQL actualizado en Supabase para habilitar los colores.');
        } else {
            alert('Error: ' + error.message);
        }
    } else {
        await fetchData();
        renderStatusListInModal();
        renderVentas();
    }
}

async function addStatusFromModal() {
    const input = document.getElementById('new-status-input');
    const label = input.value.trim();
    if (!label) return;

    const { error } = await supabaseClient
        .from('sales_status_options')
        .insert([{
            label,
            color_type: selectedNewColor,
            display_order: statusOptions.length + 1
        }]);

    if (!error) {
        input.value = '';
        await fetchData();
        renderStatusListInModal();
        renderVentas();
    } else {
        alert('Error: ' + error.message);
    }
}

async function fetchAndRenderHistory(saleId) {
    const container = document.querySelector(`#history-${saleId} .history-content`);
    const { data, error } = await supabaseClient
        .from('sales_status_history')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false });

    if (error) {
        container.innerHTML = `<div class="error-text">Error al cargar historial</div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="empty-history">No hay cambios registrados.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="timeline">
            ${data.map(h => `
                <div class="timeline-item">
                    <div class="timeline-date">${formatDate(h.created_at)}</div>
                    <div class="timeline-desc">
                        ${h.old_status ? `Cambió de <b>${h.old_status}</b> a <b>${h.new_status}</b>` : `Estado inicial: <b>${h.new_status}</b>`}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function renderMuro() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!muroData || muroData.length === 0) {
        contentArea.innerHTML = '<div class="loading-state">El muro está vacío.</div>';
        return;
    }

    // Use a Set to keep track of messages that have been rendered to avoid duplicates or orphans
    const renderedIds = new Set();
    const container = document.createElement('div');
    container.className = 'muro-container';

    // Helper to find all replies for a message
    function getReplies(parentId) {
        return muroData
            .filter(m => m.parent_id === parentId)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    // Recursive function to generate message card HTML
    function renderMessageHTML(item, isReply = false) {
        renderedIds.add(item.id);
        const itemReplies = getReplies(item.id);
        const cardClass = isReply ? 'muro-card reply-card' : 'muro-card';
        const projectName = !isReply && item.project_id ? projects.find(p => p.id === item.project_id)?.name : null;

        return `
            <div class="${isReply ? 'muro-reply-wrapper' : 'thread-group'}" id="msg-${item.id}">
                <div class="${cardClass}">
                    <div class="muro-card-header">
                        <div class="muro-header-left">
                            <span class="muro-sender-wrapper">
                                <span class="muro-entity-badge">
                                    <span class="muro-entity-badge__icon" data-entity="${item.entity || (Math.random() > 0.5 ? 'crowdium' : 'cfa')}">
                                        ${(item.entity || (Math.random() > 0.5 ? 'crowdium' : 'cfa')) === 'crowdium' ? 'C' : 'F'}
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                                </button>
                                ${session && session.user.id === item.sender_id ? `
                                    <button class="btn-minimal edit-wall-btn" data-id="${item.id}" title="Editar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    </button>
                                    <button class="btn-minimal delete-wall-btn" data-id="${item.id}" title="Eliminar">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

    // 1. First Pass: Render all top-level threads (messages without a parent or with a missing parent)
    const topLevelThreads = muroData.filter(m => !m.parent_id);
    let finalHTML = topLevelThreads.map(thread => renderMessageHTML(thread)).join('');

    // 2. Second Pass: Check for orphans (messages with a parent_id but whose parent isn't in muroData)
    const orphans = muroData.filter(m => m.parent_id && !renderedIds.has(m.id));
    if (orphans.length > 0) {
        // Find orphans that are not themselves children of other orphans we've handled
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

    contentArea.innerHTML = finalHTML ? finalHTML : '<div class="loading-state">El muro está vacío.</div>';

    // Attach listeners
    document.querySelectorAll('.reply-wall-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            replyingToId = btn.dataset.id;
            editingItemId = null;
            updateModalFields();
            modalOverlay.classList.remove('hidden');
        });
    });

    document.querySelectorAll('.delete-wall-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteWallMessage(btn.dataset.id));
    });

    document.querySelectorAll('.edit-wall-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            editingItemId = btn.dataset.id;
            replyingToId = null;
            updateModalFields();
            modalOverlay.classList.remove('hidden');
        });
    });
}

async function deleteWallMessage(id) {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;
    const { error } = await supabaseClient.from('wall_messages').delete().eq('id', id);
    if (error) alert('Error al eliminar: ' + error.message);
    else fetchData();
}

async function editWallMessage(id, currentMsg) {
    editingItemId = id;
    replyingToId = null;
    updateModalFields();
    modalOverlay.classList.remove('hidden');
}

// Helper to format currency with thousands separator
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '---';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${day} ${months[date.getMonth()]}`;
}

async function renderAsistencia() {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const { data: { session } } = await supabaseClient.auth.getSession();

    contentArea.innerHTML = `
        <div class="asistencia-container">
            <div class="attendance-legend">
                <div class="legend-item">
                    <span class="legend-icon">🏠</span>
                    <span>Home Office</span>
                </div>
                <div class="legend-item">
                    <span class="legend-icon">🏢</span>
                    <span>Presencial</span>
                </div>
            </div>

            <div class="attendance-grid">
                ${allProfiles.map(profile => {
        const userAtt = attendanceData.filter(a => a.profile_id === profile.id);

        return `
                        <div class="attendance-user-row">
                            <div class="attendance-info">
                                <div class="attendance-avatar">${getInitials(profile.username)}</div>
                                <span class="attendance-name">${profile.username}</span>
                            </div>
                            <div class="attendance-days">
                                ${[0, 1, 2, 3, 4].map(dayIndex => {
            const record = userAtt.find(a => a.day_index === dayIndex);
            const location = record ? record.location : null; // Default null or choose a default
            const icon = location === 'home' ? '🏠' : (location === 'office' ? '🏢' : '❓');
            const classList = location ? `location-toggle is-${location}` : 'location-toggle';

            return `
                                        <div class="day-box">
                                            <span class="day-label">${days[dayIndex].substring(0, 3)}</span>
                                            <div class="${classList}" 
                                                 onclick="toggleAttendance('${profile.id}', ${dayIndex}, '${location}')"
                                                 title="${location === 'home' ? 'Home Office' : (location === 'office' ? 'Presencial' : 'Sin asignar')}">
                                                ${icon}
                                            </div>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

async function toggleAttendance(profileId, dayIndex, currentLocation) {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        authModalOverlay.classList.remove('hidden');
        return;
    }

    // Cycle: null -> office -> home -> null (or just office <-> home)
    let nextLocation;
    if (currentLocation === 'null' || currentLocation === '' || !currentLocation || currentLocation === 'undefined') nextLocation = 'office';
    else if (currentLocation === 'office') nextLocation = 'home';
    else nextLocation = 'office';

    const { error } = await supabaseClient
        .from('user_attendance')
        .upsert({
            profile_id: profileId,
            day_index: dayIndex,
            location: nextLocation,
            updated_at: new Date().toISOString()
        }, { onConflict: 'profile_id, day_index' });

    if (error) {
        console.error('Error toggling attendance:', error);
        alert('Error al actualizar asistencia: ' + error.message);
    } else {
        // Real-time or manual re-fetch
        fetchData();
    }
}

addItemBtn.addEventListener('click', async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        // Gate: Show login modal if not authenticated
        authModalOverlay.classList.remove('hidden');
        return;
    }

    // Proceed if authenticated
    editingItemId = null; // Reset
    replyingToId = null;  // Reset
    updateModalFields();
    modalOverlay.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', () => modalOverlay.classList.add('hidden'));

addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert('Debes iniciar sesión para realizar esta acción.');

    let result;
    if (currentSection === 'monitoreo') {
        const theme = document.getElementById('item-theme').value;
        const status = document.getElementById('item-status').value;
        const update = document.getElementById('item-update').value;

        // Fetch profile for username
        const { data: profile } = await supabaseClient.from('profiles').select('username').eq('id', user.id).single();
        const payload = {
            theme, status, update_text: update, sender_id: user.id,
            sender_username: profile?.username || user.email.split('@')[0]
        };

        if (editingItemId) {
            result = await supabaseClient.from('monitoring_status').update(payload).eq('id', editingItemId);
        } else {
            result = await supabaseClient.from('monitoring_status').insert([payload]);
        }
    } else if (currentSection === 'distribuciones') {
        const project_id = document.getElementById('sale-project').value;
        const series = document.getElementById('sale-series').value;
        const asset = document.getElementById('sale-asset').value;
        const gross_amount = document.getElementById('sale-gross').value;
        const net_amount = document.getElementById('sale-net').value;
        const status = document.getElementById('sale-status').value;
        result = await supabaseClient.from('sales_status').insert([{
            project_id, series, asset, gross_amount, net_amount, status
        }]);
    } else if (currentSection === 'muro') {
        const message = document.getElementById('wall-msg').value;
        const tagSelect = document.getElementById('wall-tag');
        const selectedTags = tagSelect ? Array.from(tagSelect.selectedOptions).map(opt => opt.value) : [];
        const tagged_username = selectedTags.join(', ');
        const project_id = (document.getElementById('wall-project')?.value) || null;

        const { data: profile } = await supabaseClient.from('profiles').select('username').eq('id', user.id).single();

        const wallPayload = {
            sender_id: user.id,
            sender_username: profile?.username || user.email.split('@')[0],
            message: message.trim(),
            tagged_username: tagged_username || null,
            project_id: project_id,
            parent_id: replyingToId
        };

        if (editingItemId) {
            result = await supabaseClient.from('wall_messages').update({
                message: wallPayload.message
            }).eq('id', editingItemId);
        } else {
            result = await supabaseClient.from('wall_messages').insert([wallPayload]);
        }
    }

    if (result && result.error) {
        alert('Error al guardar: ' + result.error.message);
    } else {
        modalOverlay.classList.add('hidden');
        addItemForm.reset();
        await fetchData();
    }
});

