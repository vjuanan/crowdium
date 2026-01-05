/**
 * HELPER FUNCTION: Generate User Entity Badge HTML
 * Creates the avatar + company badge component for table cells
 */
function generateUserEntityBadge(username, entity = 'crowdium', avatarUrl = null) {
    const entityLetter = entity === 'crowdium' ? 'C' : 'F';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
    const avatar = avatarUrl || defaultAvatar;

    return `
        <div class="user-entity-cell">
            <div class="user-entity-badge-table">
                <img src="${avatar}" 
                     alt="${username}" 
                     class="user-entity-badge-table__avatar" 
                     data-entity="${entity}"
                />
                <div class="user-entity-badge-table__entity-icon" data-entity="${entity}">
                    ${entityLetter}
                </div>
            </div>
            <span class="user-entity-badge-table__name">${username}</span>
        </div>
    `;
}

/**
 * HELPER FUNCTION: Format financial amounts
 * Right-aligned, tabular numbers, proper formatting
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
 * HELPER FUNCTION: Get user entity from profile
 * Returns 'crowdium' or 'cfa' based on user profile
 */
function getUserEntity(userId) {
    // This should be populated from the profiles table
    // For now, we'll use a simple check or default
    const profile = allProfiles?.find(p => p.id === userId);
    return profile?.entity || 'crowdium';
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateUserEntityBadge,
        formatFinancialAmount,
        getUserEntity
    };
}
