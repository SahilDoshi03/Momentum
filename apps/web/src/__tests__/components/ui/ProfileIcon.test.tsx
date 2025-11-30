import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import '@testing-library/jest-dom';

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} />;
    },
}));

describe('ProfileIcon', () => {
    const mockUser = {
        fullName: 'Test User',
        initials: 'TU',
        avatar: null,
    };

    it('renders initials when no avatar', () => {
        render(<ProfileIcon user={mockUser} />);
        expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('renders avatar image when present', () => {
        const userWithAvatar = { ...mockUser, avatar: '/avatar.jpg' };
        render(<ProfileIcon user={userWithAvatar} />);
        const img = screen.getByAltText('Test User');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/avatar.jpg');
    });

    it('applies size classes', () => {
        const { container, rerender } = render(<ProfileIcon user={mockUser} size="xs" />);
        expect(container.firstChild).toHaveClass('h-5', 'w-5');

        rerender(<ProfileIcon user={mockUser} size="lg" />);
        expect(container.firstChild).toHaveClass('h-12', 'w-12');
    });

    it('applies custom className', () => {
        const { container } = render(<ProfileIcon user={mockUser} className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });
});
