import { useEffect, useState, ChangeEvent } from 'react'
import api from '@/api/client'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'

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
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[] | null>(null)
  const [tables, setTables] = useState<number>(10)
  const [seats, setSeats] = useState<number>(4)
  const [savingCap, setSavingCap] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [r1, r2, cap] = await Promise.all([
        api.get('/api/reservations/restaurant/mine').catch(() => ({ data: { reservations: [] } } as any)),
        api.get('/api/orders/restaurant/mine').catch(() => ({ data: { results: [] } } as any)),
        api.get('/api/reservations/restaurant/capacity').catch(() => ({ data: { tables_count: 10, seats_per_table: 4 } } as any)),
      ])
      setReservations(r1.data.reservations || [])
      setOrders(r2.data.results || [])
      if (cap?.data) {
        setTables(cap.data.tables_count ?? 10)
        setSeats(cap.data.seats_per_table ?? 4)
      }
      setError(null)
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const saveCapacity = async () => {
    setSavingCap(true)
    try {
      await api.patch('/api/reservations/restaurant/capacity', {
        tables_count: Number(tables),
        seats_per_table: Number(seats),
      })
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to update capacity')
    } finally {
      setSavingCap(false)
    }
  }

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadMsg(null)
    setUploadErrors(null)
    const f = e.target.files?.[0] || null
    setFile(f)
  }

  const downloadTemplate = () => {
    const headers = ['name','category','description','availability','price']
    const rows = [
      ['Spicy Chicken Wings','Appetizer','Crispy wings tossed in a fiery sauce','67','40.45'],
      ['Margherita Pizza','Main Course','Classic pizza with fresh mozzarella and basil','144','23.57']
    ]
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'menu_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const uploadCsv = async () => {
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    setUploadErrors(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post('/api/menu/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadMsg(res.data?.message || 'Upload successful')
      await loadAll()
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Upload failed'
      const details = e?.response?.data?.details
      setUploadMsg(msg)
      if (Array.isArray(details)) setUploadErrors(details)
    } finally {
      setUploading(false)
    }
  }

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
        <Typography variant="h6" gutterBottom>Capacity Settings</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <Stack>
            <Typography variant="body2" color="text.secondary">Tables</Typography>
            <input aria-label="Tables" type="number" min={0} value={tables} onChange={e => setTables(Number(e.target.value))} style={{ padding: 8, width: 120, borderRadius: 8, border: '1px solid #ccc', background: 'transparent', color: 'inherit' }} />
          </Stack>
          <Stack>
            <Typography variant="body2" color="text.secondary">Seats per table</Typography>
            <input aria-label="Seats per table" type="number" min={0} value={seats} onChange={e => setSeats(Number(e.target.value))} style={{ padding: 8, width: 160, borderRadius: 8, border: '1px solid #ccc', background: 'transparent', color: 'inherit' }} />
          </Stack>
          <Button variant="contained" onClick={saveCapacity} disabled={savingCap}>Save</Button>
          <Typography color="text.secondary">Per-slot capacity: {Number(tables) * Number(seats)}</Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Typography variant="h6">Menu Upload</Typography>
            <Button size="small" onClick={downloadTemplate}>Download CSV template</Button>
          </Stack>
          <Typography color="text.secondary">
            Required columns: <b>name</b>, <b>category</b>, <b>description</b>, <b>availability</b>, <b>price</b>. The upload replaces your current menu.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <Button variant="outlined" component="label">
              Choose CSV
              <input type="file" accept=".csv,text/csv" hidden onChange={onPickFile} />
            </Button>
            <Typography>{file ? file.name : 'No file selected'}</Typography>
            <Button variant="contained" disabled={!file || uploading} onClick={uploadCsv}>Upload</Button>
          </Stack>
          {uploading && <LinearProgress />}
          {uploadMsg && <Alert severity={uploadErrors ? 'error' : 'success'}>{uploadMsg}</Alert>}
          {uploadErrors && (
            <Box>
              {uploadErrors.slice(0, 5).map((er, i) => (
                <Typography key={i} color="error">• {er}</Typography>
              ))}
              {uploadErrors.length > 5 && (
                <Typography color="text.secondary">...and {uploadErrors.length - 5} more.</Typography>
              )}
            </Box>
          )}
          <Divider />
          <Typography variant="body2">
            Tip: If you see validation errors, check your headers match exactly and number fields are valid. See the template for examples.
          </Typography>
        </Stack>
      </Paper>

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
              <Typography>Order #{o.id} • total ₹{o.total_amount.toFixed(2)} • {o.status}</Typography>
              <Typography color="text.secondary">{new Date(o.created_at).toLocaleString()}</Typography>
              <Stack pl={1}>
                {o.items.map((it, i) => (
                  <Typography key={i} color="text.secondary">{it.quantity} x {it.name} @ ₹{it.unit_price.toFixed(2)}</Typography>
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
