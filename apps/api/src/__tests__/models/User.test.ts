import { User } from '../../models/User';
import bcrypt from 'bcryptjs';

describe('User Model', () => {
    describe('Schema Validation', () => {
        it('should create a user with valid data', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            };

            const user = new User(userData);
            await user.save();

            expect(user._id).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.email).toBe('test@example.com');
            expect(user.fullName).toBe('Test User');
            expect(user.initials).toBe('TU');
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
        });

        it('should require email', async () => {
            const user = new User({
                password: 'password123',
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require fullName', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require initials', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should require password if googleId is missing', async () => {
            const user = new User({
                email: 'test@example.com',
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });

            await expect(user.save()).rejects.toThrow();
        });

        it('should not require password if googleId is present', async () => {
            const user = new User({
                email: 'test@example.com',
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
                googleId: 'google-id-123',
            });

            await user.save();
            expect(user._id).toBeDefined();
        });

        it('should enforce unique email', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            };

            await new User(userData).save();

            const duplicateUser = new User({
                ...userData,
            });

            await expect(duplicateUser.save()).rejects.toThrow();
        });


    });

    describe('Methods', () => {
        it('should hash password before saving', async () => {
            const password = 'password123';
            const user = new User({
                email: 'test@example.com',
                password,
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });
            await user.save();

            expect(user.password).not.toBe(password);
            const isMatch = await bcrypt.compare(password, user.password);
            expect(isMatch).toBe(true);
        });

        it('should compare password correctly', async () => {
            const password = 'password123';
            const user = new User({
                email: 'test@example.com',
                password,
                fullName: 'Test User',
                initials: 'TU',
                profileIcon: { initials: 'TU', bgColor: '#000000' },
            });
            await user.save();

            const isMatch = await user.comparePassword(password);
            expect(isMatch).toBe(true);

            const isNotMatch = await user.comparePassword('wrongpassword');
            expect(isNotMatch).toBe(false);
        });

        it('should generate initials correctly', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'John Doe',
                initials: 'JD',
                profileIcon: { initials: 'JD', bgColor: '#000000' },
            });

            const initials = user.generateInitials();
            expect(initials).toBe('JD');
        });

        it('should update initials when fullName changes', async () => {
            const user = new User({
                email: 'test@example.com',
                password: 'password123',
                fullName: 'John Doe',
                initials: 'JD',
                profileIcon: { initials: 'JD', bgColor: '#000000' },
            });
            await user.save();

            user.fullName = 'Jane Smith';
            await user.save();

            expect(user.initials).toBe('JS');
        });
    });
});
