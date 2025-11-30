import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';

describe('useDebounce', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return the initial value immediately', () => {
        const { result } = renderHook(() => useDebounce('initial', 500));
        expect(result.current).toBe('initial');
    });

    it('should debounce value updates', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 500 },
        });

        rerender({ value: 'updated', delay: 500 });

        // Value should not update immediately
        expect(result.current).toBe('initial');

        // Fast forward time but not enough
        act(() => {
            jest.advanceTimersByTime(200);
        });
        expect(result.current).toBe('initial');

        // Fast forward time to complete delay
        act(() => {
            jest.advanceTimersByTime(300);
        });
        expect(result.current).toBe('updated');
    });

    it('should cancel timeout on unmount or value change', () => {
        const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'initial', delay: 500 },
        });

        rerender({ value: 'updated1', delay: 500 });

        act(() => {
            jest.advanceTimersByTime(200);
        });

        // Change value again before timeout
        rerender({ value: 'updated2', delay: 500 });

        act(() => {
            jest.advanceTimersByTime(300); // Total 500ms from start, but updated2 started 300ms ago
        });

        // Should not be updated1, and not yet updated2 (only 300ms passed for updated2)
        expect(result.current).toBe('initial');

        act(() => {
            jest.advanceTimersByTime(200); // Total 500ms for updated2
        });
        expect(result.current).toBe('updated2');
    });
});
