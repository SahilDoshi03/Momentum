export const PROJECT_PERMISSIONS = {
    DELETE_PROJECT: ['owner'],
    UPDATE_SETTINGS: ['owner', 'admin'],
    MANAGE_MEMBERS: ['owner', 'admin'],
    MANAGE_CONTENT: ['owner', 'admin', 'member'],
    VIEW_CONTENT: ['owner', 'admin', 'member', 'observer'],
};

export const TEAM_PERMISSIONS = {
    DELETE_TEAM: ['owner'],
    UPDATE_SETTINGS: ['owner', 'admin'],
    MANAGE_MEMBERS: ['owner', 'admin'],
    MANAGE_CONTENT: ['owner', 'admin', 'member'],
    VIEW_CONTENT: ['owner', 'admin', 'member', 'observer'],
};
