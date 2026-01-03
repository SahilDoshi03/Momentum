// Password validation constants and utilities
export const PASSWORD_CONFIG = {
    minLength: 8,
    // Special characters that are allowed in passwords
    specialChars: '@$!%*?&_',
    // Regex pattern for password validation
    // Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char from allowed set
    regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/,
    errorMessage: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&_)',
};

export const validatePassword = (password: string): boolean => {
    return PASSWORD_CONFIG.regex.test(password);
};
