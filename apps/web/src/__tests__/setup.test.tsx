import React from 'react';
import { render, screen } from '@testing-library/react';

// Simple test to verify Jest and React Testing Library are working
describe('Jest Setup Verification', () => {
    it('can use Jest matchers', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toContain('ell');
        expect([1, 2, 3]).toHaveLength(3);
    });

    it('can mock functions', () => {
        const mockFn = jest.fn();
        mockFn('test');
        expect(mockFn).toHaveBeenCalledWith('test');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});
