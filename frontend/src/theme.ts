import { createTheme } from '@mui/material/styles'

export type Mode = 'light' | 'dark'

export const createAppTheme = (mode: Mode) => createTheme({
  palette: {
    mode,
    primary: { main: '#16a34a', contrastText: '#361f1fff' }, // green
    secondary: { main: '#f59e0b', contrastText: '#ffffffff' }, // orange
    ...(mode === 'light'
      ? {
          background: { default: '#ffffffff', paper: '#fc4b14ff' },
          text: { primary: '#f56f31ff', secondary: '#e55400ff' },
          divider: 'rgba(103, 58, 238, 0.08)'
        }
      : {
          background: { default: '#0a0f0a', paper: '#111827' },
          text: { primary: '#d47720ff', secondary: '#9be6a9ff' },
          divider: 'rgba(77, 255, 23, 0.12)'
        })
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    h3: { fontWeight: 800 },
    h5: { fontWeight: 700 }
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 10 } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { borderRadius: 14 } } }
  }
})

export default createAppTheme
