import { cn } from '../../lib/utils';

describe('cn', () => {
    it('should merge class names correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
        expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });

    it('should handle arrays and objects', () => {
        expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3');
    });

    it('should merge tailwind classes correctly', () => {
        expect(cn('p-4 p-2')).toBe('p-2');
        expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500');
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
});
