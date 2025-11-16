import { createTheme } from '@mui/material/styles'

export type Mode = 'light' | 'dark'

export const createAppTheme = (mode: Mode) => createTheme({
  palette: {
    mode,
    // Fresh modern palette: violet + cyan
    primary: { main: '#7c3aed', contrastText: '#ffffff' }, // violet-600
    secondary: { main: '#06b6d4', contrastText: '#062a2e' }, // cyan-500
    ...(mode === 'light'
      ? {
          background: { default: '#f8fafc', paper: '#ffffff' },
          text: { primary: '#0f172a', secondary: '#334155' },
          divider: 'rgba(0, 42, 227, 0.08)'
        }
      : {
          background: { default: '#0b1220', paper: '#111827' },
          text: { primary: '#e5e7eb', secondary: '#94a3b8' },
          divider: 'rgba(100, 170, 212, 0.16)'
        })
  },
  shape: { borderRadius: 12 },
  typography: {
    // Poppins font stack (loaded in index.html)
    fontFamily: 'Poppins, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    fontSize: 17,
    h1: { fontWeight: 800, fontSize: '3.25rem', letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, fontSize: '2.6rem', letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, fontSize: '2.2rem' },
    h4: { fontWeight: 700, fontSize: '1.8rem' },
    h5: { fontWeight: 700, fontSize: '1.5rem' },
    h6: { fontWeight: 600, fontSize: '1.2rem' },
    button: { fontWeight: 600 },
    subtitle1: { fontSize: '1.05rem' },
    body1: { fontSize: '1.05rem' },
    body2: { fontSize: '0.95rem' }
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 10, paddingInline: 16, height: 40 } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 16 } } }
  }
})

export default createAppTheme
