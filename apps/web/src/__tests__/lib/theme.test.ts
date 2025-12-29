import { theme, lightTheme } from '@/lib/theme';

describe('theme', () => {
    it('exports dark theme configuration', () => {
        expect(theme).toBeDefined();
        expect(theme.colors).toBeDefined();
        expect(theme.colors.primary).toBeDefined();
    });

    it('exports light theme configuration', () => {
        expect(lightTheme).toBeDefined();
        expect(lightTheme.colors).toBeDefined();
        expect(lightTheme.colors.primary).toBeDefined();
    });
});
