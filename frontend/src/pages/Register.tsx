import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '@/api/client'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRestaurant, setIsRestaurant] = useState(false)
  const [addressLine, setAddressLine] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      await api.post('/api/auth/register', {
        name,
        email,
        password,
        is_restaurant: isRestaurant,
        address_line: addressLine,
        city,
        state,
        postal_code: postalCode,
        country
      })
      setMessage('Registration successful. Please sign in.')
      setTimeout(() => navigate('/login'), 800)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Stack alignItems="center" sx={{ pt: 6 }}>
      <Paper sx={{ p: 4, width: '100%', maxWidth: 560 }} elevation={1}>
        <Stack spacing={3} component="form" onSubmit={onSubmit}>
          <Typography variant="h5" fontWeight={700}>Create your account</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
          <FormControlLabel control={<Checkbox checked={isRestaurant} onChange={(e) => setIsRestaurant(e.target.checked)} />} label="I am registering a restaurant" />
          <TextField label="Address line" value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} required sx={{ flex: 1 }} />
            <TextField label="State" value={state} onChange={(e) => setState(e.target.value)} required sx={{ flex: 1 }} />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required sx={{ flex: 1 }} />
            <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} required sx={{ flex: 1 }} />
          </Stack>
          <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
          <Typography variant="body2">Have an account? <Link to="/login">Sign in</Link></Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}
