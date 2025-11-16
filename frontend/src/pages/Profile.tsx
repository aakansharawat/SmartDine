import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
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

interface MyReservation {
  id: number
  restaurant_id: number
  date: string
  time: string
  party_size: number
  status: string
}

interface MyOrderItem { name: string; quantity: number; unit_price: number }
interface MyOrder {
  id: number
  restaurant_id: number
  total_amount: number
  status: string
  created_at: string
  items: MyOrderItem[]
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [reservations, setReservations] = useState<MyReservation[]>([])
  const [orders, setOrders] = useState<MyOrder[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/auth/profile')
        setUser(res.data)
        try { localStorage.setItem('user', JSON.stringify(res.data)) } catch {}
        const [r1, r2] = await Promise.all([
          api.get('/api/reservations/mine').catch(() => ({ data: { reservations: [] } } as any)),
          api.get('/api/orders/mine').catch(() => ({ data: { results: [] } } as any)),
        ])
        setReservations(r1.data.reservations || [])
        setOrders(r2.data.results || [])
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

  const cancelReservation = async (id: number) => {
    try {
      await api.patch(`/api/reservations/${id}`, { status: 'cancelled' })
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to cancel reservation')
    }
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
          {user.is_restaurant && (
            <Button component={RouterLink} to="/dashboard" variant="contained" sx={{ mt: 1, alignSelf: 'start' }}>
              Go to Restaurant Dashboard
            </Button>
          )}
        </Stack>
      </Paper>

      <Typography variant="h6">My Reservations</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          {reservations.length === 0 && <Typography color="text.secondary">No reservations yet.</Typography>}
          {reservations.map(r => (
            <Stack key={r.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }}>
              <Typography>#{r.id} • {r.date} {r.time} • party {r.party_size} • status: {r.status}</Typography>
              <Stack direction="row" spacing={1}>
                {r.status !== 'cancelled' && <Button size="small" onClick={() => cancelReservation(r.id)}>Cancel</Button>}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Typography variant="h6">My Orders</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          {orders.length === 0 && <Typography color="text.secondary">No orders placed yet.</Typography>}
          {orders.map(o => (
            <Stack key={o.id} spacing={0.5}>
              <Typography>Order #{o.id} • total ₹{o.total_amount.toFixed(2)} • {o.status}</Typography>
              <Typography color="text.secondary">{new Date(o.created_at).toLocaleString()}</Typography>
              <Stack pl={1}>
                {o.items.map((it, i) => (
                  <Typography key={i} color="text.secondary">{it.quantity} x {it.name} @ ₹{it.unit_price.toFixed(2)}</Typography>
                ))}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Paper>
      <Button color="error" variant="outlined" onClick={deleteAccount} disabled={deleting}>{deleting ? 'Deleting…' : 'Delete account'}</Button>
    </Stack>
  )
}
