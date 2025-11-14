import { useEffect, useMemo, useState, ChangeEvent } from 'react'
import { useLocation } from 'react-router-dom'
import api from '@/api/client'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import Grid2 from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import MuiAlert from '@mui/material/Alert'
import Box from '@mui/material/Box'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

interface SearchResultItem {
  item_name: string
  availability: number
  price: number
}
interface SearchResult {
  details: { restaurant_id: number; restaurant_name: string; restaurant_address: string; distance_km: number }
  menu_items: SearchResultItem[]
}

export default function Search() {
  const q = useQuery()
  const [item, setItem] = useState(q.get('item') || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [queried, setQueried] = useState(false)
  const [reserveOpen, setReserveOpen] = useState(false)
  const [reserveRestaurantId, setReserveRestaurantId] = useState<number | null>(null)
  const [reserveDate, setReserveDate] = useState('') // YYYY-MM-DD
  const [reserveTime, setReserveTime] = useState('') // HH:MM
  const [reserveParty, setReserveParty] = useState(2)
  const [snack, setSnack] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({open:false, message:'', severity:'success'})

  // Cart state (single-restaurant cart)
  const [cartRestaurantId, setCartRestaurantId] = useState<number | null>(null)
  const [cartRestaurantName, setCartRestaurantName] = useState<string>('')
  const [cart, setCart] = useState<Record<string, { quantity: number; price: number }>>({})

  useEffect(() => {
    let active = true
    const fetchSuggestions = async () => {
      if (!item || item.length < 2) { setSuggestions([]); return }
      try {
        const res = await api.get('/api/search_menu_prefix', { params: { prefix: item } })
        if (active) setSuggestions(res.data.results || [])
      } catch { /* ignore */ }
    }
    fetchSuggestions()
    return () => { active = false }
  }, [item])

  const handleSearch = async () => {
    if (!item || !address) return
    setLoading(true)
    try {
      const res = await api.post('/api/search_menu_item', { item_name: item, address })
      setResults(res.data.results || [])
    } catch (e) {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (restaurantId: number, restaurantName: string, mi: SearchResultItem) => {
    // If switching restaurant, reset cart
    if (cartRestaurantId !== null && cartRestaurantId !== restaurantId) {
      setCart({})
    }
    setCartRestaurantId(restaurantId)
    setCartRestaurantName(restaurantName)
    setCart(prev => {
      const next = { ...prev }
      const curr = next[mi.item_name]
      const qty = (curr?.quantity || 0) + 1
      next[mi.item_name] = { quantity: qty, price: mi.price }
      return next
    })
  }

  const changeQty = (name: string, delta: number) => {
    setCart(prev => {
      const curr = prev[name]
      if (!curr) return prev
      const nextQty = curr.quantity + delta
      const copy = { ...prev }
      if (nextQty <= 0) {
        delete copy[name]
      } else {
        copy[name] = { ...curr, quantity: nextQty }
      }
      return copy
    })
  }

  const clearCartIfEmpty = () => {
    const hasItems = Object.keys(cart).length > 0
    if (!hasItems) {
      setCartRestaurantId(null)
      setCartRestaurantName('')
    }
  }

  const placeOrder = async () => {
    if (!cartRestaurantId || Object.keys(cart).length === 0) return
    try {
      const items = Object.entries(cart).map(([name, v]) => ({ item_name: name, quantity: v.quantity }))
      await api.post('/api/orders', { restaurant_id: cartRestaurantId, items })
      setSnack({ open: true, message: 'Order placed successfully', severity: 'success' })
      setCart({})
      setCartRestaurantId(null)
      setCartRestaurantName('')
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to place order'
      setSnack({ open: true, message: msg, severity: 'error' })
    }
  }

  return (
    <Stack spacing={3} sx={{ pt: 4 }}>
      <Typography variant="h5" fontWeight={700}>Search restaurants</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Autocomplete
          freeSolo
          options={suggestions}
          sx={{ flex: 2 }}
          value={item}
          onInputChange={(_event: unknown, v: string) => setItem(v)}
          renderInput={(params: any) => <TextField {...params} label="Dish name" placeholder="e.g., Burger" />}
        />
        <TextField label="Your address" sx={{ flex: 3 }} value={address} onChange={(e: ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)} placeholder="123 Main St, City" />
        <Button variant="contained" onClick={runSearch} disabled={loading || !item || !address}>{loading ? 'Searching…' : 'Search'}</Button>
      </Stack>

      {loading && (
        <Grid2 container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid2 size={12} key={i}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Skeleton width={220} height={28} />
                    <Skeleton width={380} />
                    <Skeleton variant="rounded" height={80} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      )}

      {!loading && queried && results.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={1} alignItems="center">
            <Typography variant="h6">No results found</Typography>
            <Typography color="text.secondary">Try a different dish name or another nearby address.</Typography>
            <Stack direction="row" spacing={1}>
              {['Pizza','Burger','Pasta'].map((ex) => (
                <Chip key={ex} label={ex} onClick={() => setItem(ex)} variant="outlined" />
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      {!loading && results.length > 0 && (
      <Grid2 container spacing={2}>
        {results.map((r: SearchResult, idx: number) => (
          <Grid2 size={12} key={idx}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6">{r.details.restaurant_name}</Typography>
                  <Typography color="text.secondary">{r.details.restaurant_address} • {r.details.distance_km} km away</Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1}>
                      {r.menu_items.map((mi: SearchResultItem, i: number) => (
                        <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                          <Typography>{mi.item_name}</Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography color="text.secondary">${mi.price.toFixed(2)} • {mi.availability} available</Typography>
                            <Button size="small" variant="outlined" onClick={() => addToCart(r.details.restaurant_id, r.details.restaurant_name, mi)}>Add</Button>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                  <Stack direction="row" justifyContent="flex-end">
                    <Button variant="contained" color="secondary" onClick={() => { setReserveRestaurantId(r.details.restaurant_id); setReserveOpen(true); }}>
                      Book Table
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>
      )}

      {cartRestaurantId && Object.keys(cart).length > 0 && (
        <Box sx={{ position: 'sticky', bottom: 8, mt: 4 }}>
          <Paper elevation={6} sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1">Cart • {cartRestaurantName}</Typography>
              <Stack spacing={1}>
                {Object.entries(cart).map(([name, v]) => (
                  <Stack key={name} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography>{name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button size="small" variant="outlined" onClick={() => { changeQty(name, -1); setTimeout(clearCartIfEmpty, 0) }}>-</Button>
                      <Typography>{v.quantity}</Typography>
                      <Button size="small" variant="outlined" onClick={() => changeQty(name, 1)}>+</Button>
                      <Typography color="text.secondary">${(v.price * v.quantity).toFixed(2)}</Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography fontWeight={600}>Total</Typography>
                <Typography fontWeight={600}>${Object.values(cart).reduce((acc, v) => acc + v.price * v.quantity, 0).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Button onClick={() => { setCart({}); setCartRestaurantId(null); setCartRestaurantName('') }}>Clear</Button>
                <Button variant="contained" onClick={placeOrder}>Checkout</Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      )}

      <Dialog open={reserveOpen} onClose={() => setReserveOpen(false)}>
        <DialogTitle>Book a table</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <TextField label="Date" type="date" value={reserveDate} onChange={(e: ChangeEvent<HTMLInputElement>) => setReserveDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Time" type="time" value={reserveTime} onChange={(e: ChangeEvent<HTMLInputElement>) => setReserveTime(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Party size" type="number" inputProps={{ min: 1 }} value={reserveParty} onChange={(e: ChangeEvent<HTMLInputElement>) => setReserveParty(parseInt(e.target.value || '1', 10))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReserveOpen(false)}>Close</Button>
          <Button variant="contained" onClick={async () => {
            try {
              if (!reserveRestaurantId || !reserveDate || !reserveTime || reserveParty <= 0) {
                setSnack({open:true, message:'Please fill all fields', severity:'error'}); return
              }
              await api.post('/api/reservations', {
                restaurant_id: reserveRestaurantId,
                date: reserveDate,
                time: reserveTime,
                party_size: reserveParty
              })
              setSnack({open:true, message:'Reservation confirmed', severity:'success'})
              setReserveOpen(false)
              setReserveDate(''); setReserveTime(''); setReserveParty(2)
            } catch (e: any) {
              const msg = e?.response?.data?.error || 'Failed to create reservation'
              setSnack({open:true, message: msg, severity:'error'})
            }
          }}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({...s, open:false}))}>
        <MuiAlert elevation={6} variant="filled" severity={snack.severity} onClose={() => setSnack(s => ({...s, open:false}))}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Stack>
  )
}
