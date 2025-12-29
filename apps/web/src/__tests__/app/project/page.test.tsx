import React from 'react';
import { render } from '@testing-library/react';
import ProjectPage from '@/app/project/page';
import { redirect } from 'next/navigation';

// Mock mocks
jest.mock('next/navigation', () => ({
    redirect: jest.fn(),
}));

describe('ProjectPage (Index)', () => {
    it('redirects to home', () => {
        // Since it's a server component (or treated as one for redirect), 
        // in a client test environment calling the component function 
        // is the closest we get for this simple implementation.
        // However, next/navigation redirect throws an error in Next.js, 
        // but here we mocked it to just be a function.
        try {
            ProjectPage();
        } catch (e) {
            // Ignore potential throw from redirect if it was real
        }
        expect(redirect).toHaveBeenCalledWith('/');
    });
});
