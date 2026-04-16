export const tokens = {
    colors: {
        background: {
            white: '#FFFFFF',
            dark: '#020617', // Deepest Navy
            card: 'rgba(15, 23, 42, 0.65)', // Glassy Dark Slate
            glass: 'rgba(15, 23, 42, 0.7)',
            subtle: '#0F172A',
        },
        primary: {
            main: '#8B5CF6', // Vibrant Violet
            light: '#C4B5FD',
            dark: '#6D28D9',
            glow: 'rgba(139, 92, 246, 0.4)',
            subtle: 'rgba(139, 92, 246, 0.1)',
        },
        secondary: {
            main: '#06B6D4', // Electric Cyan
            light: '#67E8F9',
            dark: '#0891B2',
            glow: 'rgba(6, 182, 212, 0.4)',
        },
        accent: {
            pink: '#F472B6',
            emerald: '#10B981',
            amber: '#F59E0B',
            rose: '#F43F5E',
            orange: '#FB923C',
            violet: '#8B5CF6',
        },
        text: {
            primary: '#F8FAFC', // Almost White
            secondary: '#94A3B8', // Slate 400
            subtle: 'rgba(148, 163, 184, 0.5)',
            white: '#FFFFFF',
        },
        error: {
            main: '#F43F5E',
        },
        borders: {
            main: 'rgba(255, 255, 255, 0.08)',
            light: 'rgba(255, 255, 255, 0.05)',
        },
        gradient: {
            primary: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
            brand: 'linear-gradient(135deg, #8B5CF6 0%, #F472B6 100%)',
            warm: 'linear-gradient(135deg, #FB923C 0%, #F472B6 100%)',
            fresh: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
            surface: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
            hero: 'linear-gradient(135deg, #020617 0%, #0F172A 100%)',
        }
    },
    typography: {
        fontPrimary: '"Inter", sans-serif',
        fontDisplay: '"Outfit", sans-serif',
    },
    shapes: {
        borderRadius: 16,
        cardRadius: 24,
        glassBorder: '1px solid rgba(0, 0, 0, 0.06)',
    },
    shadows: {
        card: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        cardHover: '0 20px 40px rgba(124, 58, 237, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06)',
        button: '0 4px 14px rgba(124, 58, 237, 0.3)',
        buttonHover: '0 8px 24px rgba(124, 58, 237, 0.4)',
    },
    animations: {
        ease: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
        spring: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }
};
