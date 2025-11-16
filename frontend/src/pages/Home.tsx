import { useNavigate } from 'react-router-dom'
import { useState, ChangeEvent } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  return (
    <Stack alignItems="center" sx={{ pt: { xs: 6, md: 10 }, pb: 6 }}>
      <Paper
        sx={(t) => ({
          width: '100%',
          maxWidth: 1000,
          p: { xs: 3, md: 6 },
          textAlign: 'center',
          background:
            t.palette.mode === 'dark'
              ? t.palette.background.paper
              : 'linear-gradient(135deg, #c3f6deff 0%, #fee8ceff 100%)',
          color: t.palette.text.primary,
          border:
            t.palette.mode === 'dark'
              ? `1px solid ${t.palette.divider}`
              : '1px solid rgba(0,0,0,0.06)',
          boxShadow:
            t.palette.mode === 'dark'
              ? '0 6px 24px rgba(0, 0, 0, 0.35)'
              : '0 8px 28px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        })}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.12,
            img: { position: 'absolute', borderRadius: 2, filter: (t) => t.palette.mode === 'dark' ? 'grayscale(0.2)' : 'none' }
          }}
        >
          <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1200&auto=format&fit=crop" alt="burger" style={{ top: -20, left: -20, width: 220, height: 160, objectFit: 'cover' }} />
          <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1200&auto=format&fit=crop" alt="pasta" style={{ right: -20, top: 40, width: 220, height: 160, objectFit: 'cover' }} />
          <img src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop" alt="sushi" style={{ bottom: -20, left: 120, width: 220, height: 160, objectFit: 'cover' }} />
        </Box>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Discover delicious dishes near you
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
            Search any dish and we’ll find nearby restaurants with availability, pricing and distance.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%', maxWidth: 720 }}>
            <TextField fullWidth size="medium" placeholder="Try “Margherita Pizza”" value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} />
            <Button size="large" variant="contained" onClick={() => navigate(`/search?item=${encodeURIComponent(query)}`)}>
              Search
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Burger','Pasta','Sushi','Dosa','Biryani'].map((ex) => (
              <Chip key={ex} label={ex} onClick={() => navigate(`/search?item=${encodeURIComponent(ex)}`)} variant="outlined" />
            ))}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  )
}
