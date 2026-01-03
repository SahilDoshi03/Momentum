// Centralized validation configuration for user registration and profile
// This ensures frontend and backend validation are always in sync

export const VALIDATION_CONFIG = {
    firstName: {
        minLength: 1,
        maxLength: 50,
        errorMessage: 'First name must be between 1 and 50 characters',
    },
    lastName: {
        minLength: 1,
        maxLength: 50,
        errorMessage: 'Last name must be between 1 and 50 characters',
    },
    fullName: {
        minLength: 2,
        maxLength: 100,
        errorMessage: 'Full name must be between 2 and 100 characters',
    },
    email: {
        errorMessage: 'Please provide a valid email',
    },
    password: {
        minLength: 8,
        specialChars: '@$!%*?&_',
        regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_])[A-Za-z\d@$!%*?&_]{8,}$/,
        errorMessage: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&_)',
    },
    bio: {
        maxLength: 500,
        errorMessage: 'Bio must be less than 500 characters',
    },
};

// Helper function to validate password
export const validatePassword = (password: string): boolean => {
    return VALIDATION_CONFIG.password.regex.test(password);
};

// Export for backward compatibility
export const PASSWORD_CONFIG = VALIDATION_CONFIG.password;
