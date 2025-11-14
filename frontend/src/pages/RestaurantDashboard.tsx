import { useEffect, useState } from 'react'
import api from '@/api/client'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

interface RReservation {
  id: number
  user_id: number
  date: string
  time: string
  party_size: number
  status: string
}

interface ROrderItem { name: string; quantity: number; unit_price: number }
interface ROrder {
  id: number
  user_id: number
  total_amount: number
  status: string
  created_at: string
  items: ROrderItem[]
}

export default function RestaurantDashboard() {
  const [reservations, setReservations] = useState<RReservation[]>([])
  const [orders, setOrders] = useState<ROrder[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        api.get('/api/reservations/restaurant/mine').catch(() => ({ data: { reservations: [] } } as any)),
        api.get('/api/orders/restaurant/mine').catch(() => ({ data: { results: [] } } as any)),
      ])
      setReservations(r1.data.reservations || [])
      setOrders(r2.data.results || [])
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const updateReservationStatus = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      await api.patch(`/api/reservations/restaurant/${id}`, { status })
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update reservation')
    }
  }

  const updateOrderStatus = async (id: number, status: 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled') => {
    try {
      await api.patch(`/api/orders/restaurant/${id}`, { status })
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update order')
    }
  }

  if (loading) return <Typography>Loading…</Typography>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Stack spacing={3} sx={{ pt: 4 }}>
      <Typography variant="h5" fontWeight={700}>Restaurant Dashboard</Typography>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Reservations</Typography>
          <Button size="small" onClick={loadAll}>Refresh</Button>
        </Stack>
        <Stack spacing={1}>
          {reservations.length === 0 && <Typography color="text.secondary">No reservations.</Typography>}
          {reservations.map(r => (
            <Stack key={r.id} spacing={0.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                <Typography>#{r.id} • {r.date} {r.time} • party {r.party_size} • status: {r.status}</Typography>
                <Stack direction="row" spacing={1}>
                  {r.status !== 'confirmed' && <Button size="small" onClick={() => updateReservationStatus(r.id, 'confirmed')}>Confirm</Button>}
                  {r.status !== 'cancelled' && <Button size="small" color="error" onClick={() => updateReservationStatus(r.id, 'cancelled')}>Cancel</Button>}
                </Stack>
              </Stack>
              <Divider />
            </Stack>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">Orders</Typography>
          <Button size="small" onClick={loadAll}>Refresh</Button>
        </Stack>
        <Stack spacing={1}>
          {orders.length === 0 && <Typography color="text.secondary">No orders.</Typography>}
          {orders.map(o => (
            <Stack key={o.id} spacing={0.5}>
              <Typography>Order #{o.id} • total ${o.total_amount.toFixed(2)} • {o.status}</Typography>
              <Typography color="text.secondary">{new Date(o.created_at).toLocaleString()}</Typography>
              <Stack pl={1}>
                {o.items.map((it, i) => (
                  <Typography key={i} color="text.secondary">{it.quantity} x {it.name} @ ${it.unit_price.toFixed(2)}</Typography>
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                {o.status !== 'confirmed' && <Button size="small" onClick={() => updateOrderStatus(o.id, 'confirmed')}>Confirm</Button>}
                {o.status !== 'preparing' && <Button size="small" onClick={() => updateOrderStatus(o.id, 'preparing')}>Preparing</Button>}
                {o.status !== 'ready' && <Button size="small" onClick={() => updateOrderStatus(o.id, 'ready')}>Ready</Button>}
                {o.status !== 'completed' && <Button size="small" onClick={() => updateOrderStatus(o.id, 'completed')}>Completed</Button>}
                {o.status !== 'cancelled' && <Button size="small" color="error" onClick={() => updateOrderStatus(o.id, 'cancelled')}>Cancel</Button>}
              </Stack>
              <Divider />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  )
}
