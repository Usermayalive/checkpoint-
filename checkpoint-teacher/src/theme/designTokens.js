export const tokens = {
    colors: {
        background: {
            white: '#FFFFFF',
            light: '#F8FAFF',
            card: '#FFFFFF',
            glass: 'rgba(255, 255, 255, 0.75)',
            subtle: '#F1F5F9',
        },
        primary: {
            main: '#7C3AED',
            light: '#A78BFA',
            dark: '#5B21B6',
            glow: 'rgba(124, 58, 237, 0.25)',
            subtle: 'rgba(124, 58, 237, 0.08)',
        },
        secondary: {
            main: '#0EA5E9',
            light: '#38BDF8',
            dark: '#0284C7',
            glow: 'rgba(14, 165, 233, 0.25)',
        },
        accent: {
            pink: '#EC4899',
            emerald: '#10B981',
            amber: '#F59E0B',
            rose: '#F43F5E',
            orange: '#F97316',
        },
        text: {
            primary: '#1E293B',
            secondary: '#64748B',
            subtle: 'rgba(30, 41, 59, 0.5)',
            white: '#FFFFFF',
        },
        error: {
            main: '#EF4444',
        },
        borders: {
            main: 'rgba(0, 0, 0, 0.08)',
            light: 'rgba(0, 0, 0, 0.05)',
        },
        gradient: {
            primary: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)',
            brand: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
            warm: 'linear-gradient(135deg, #F97316 0%, #EC4899 100%)',
            fresh: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
            surface: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)',
            hero: 'linear-gradient(135deg, #F8FAFF 0%, #EDE9FE 30%, #E0F2FE 70%, #FCE7F3 100%)',
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
