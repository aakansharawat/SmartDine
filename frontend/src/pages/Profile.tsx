import { useEffect, useState } from 'react'
import api from '@/api/client'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

interface UserProfile {
  id: number
  name: string
  email: string
  address: string
  is_restaurant: boolean
  latitude: number | null
  longitude: number | null
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/auth/profile')
        setUser(res.data)
      } catch (e: any) {
        setError(e?.response?.data?.error || 'Failed to load profile')
      } finally { setLoading(false) }
    }
    load()
  }, [])

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete('/api/auth/profile')
      localStorage.removeItem('token')
      window.location.href = '/'
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to delete account')
    } finally { setDeleting(false) }
  }

  if (loading) return <Typography>Loading…</Typography>

  if (error) return <Alert severity="error">{error}</Alert>

  if (!user) return <Alert severity="warning">No profile data.</Alert>

  return (
    <Stack spacing={3} sx={{ pt: 4 }}>
      <Typography variant="h5" fontWeight={700}>Your profile</Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography><strong>Name:</strong> {user.name}</Typography>
          <Typography><strong>Email:</strong> {user.email}</Typography>
          <Typography><strong>Address:</strong> {user.address}</Typography>
          <Typography><strong>Type:</strong> {user.is_restaurant ? 'Restaurant' : 'Customer'}</Typography>
        </Stack>
      </Paper>
      <Button color="error" variant="outlined" onClick={deleteAccount} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete account'}</Button>
    </Stack>
  )
}
