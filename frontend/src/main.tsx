import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import { ThemeProvider, CssBaseline } from '@mui/material'
import createAppTheme from './theme'

type Mode = 'light' | 'dark'

function Root() {
  const [mode, setMode] = React.useState<Mode>(() => (localStorage.getItem('themeMode') as Mode) || 'light')
  const theme = React.useMemo(() => createAppTheme(mode), [mode])

  const toggleMode = React.useCallback(() => {
    setMode((m) => {
      const next = m === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', next)
      return next
    })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* Expose toggle via window for NavBar to call if needed */}
      <ScriptlessToggle setMode={setMode} />
    </ThemeProvider>
  )
}

function ScriptlessToggle({ setMode }: { setMode: React.Dispatch<React.SetStateAction<Mode>> }) {
  React.useEffect(() => {
    // Attach a global toggler reference for components that want to toggle theme without prop drilling
    ;(window as any).__toggleThemeMode = () => setMode((m: Mode) => {
      const next = m === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', next)
      return next
    })
  }, [setMode])
  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
