import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authed, setAuthed] = useState<boolean>(false)
  const [isRestaurant, setIsRestaurant] = useState<boolean>(false)
  const [mode, setMode] = useState<'light'|'dark'>((localStorage.getItem('themeMode') as 'light'|'dark') || 'light')

  useEffect(() => {
    const token = localStorage.getItem('token')
    setAuthed(!!token)
    try {
      const raw = localStorage.getItem('user')
      const u = raw ? JSON.parse(raw) : null
      setIsRestaurant(!!u?.is_restaurant)
    } catch { setIsRestaurant(false) }
  }, [location.pathname])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
    setAuthed(false)
    setIsRestaurant(false)
  }

  return (
    <AppBar position="sticky" color="transparent" elevation={0} sx={{ backdropFilter: 'saturate(180%) blur(8px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, py: 1.5 }}>
          <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none', fontWeight: 800 }}>
            SmartDine
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={mode === 'light' ? 'Switch to dark' : 'Switch to light'}>
              <IconButton
                onClick={() => {
                  const next = mode === 'light' ? 'dark' : 'light'
                  setMode(next)
                  try { (window as any).__toggleThemeMode?.() } catch {}
                }}
                color="inherit"
              >
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
            <Button component={Link} to="/search" color="primary">Search</Button>
            {authed ? (
              <>
                {isRestaurant && <Button component={Link} to="/dashboard" color="primary">Dashboard</Button>}
                <Button component={Link} to="/profile" color="primary">Profile</Button>
                <Button onClick={logout} color="primary" variant="outlined">Logout</Button>
              </>
            ) : (
              <>
                <Button component={Link} to="/login" color="primary">Login</Button>
                <Button component={Link} to="/register" color="primary" variant="contained">Sign up</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}
