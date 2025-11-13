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
  details: { restaurant_name: string; restaurant_address: string; distance_km: number }
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

  const runSearch = async () => {
    setLoading(true)
    setQueried(true)
    try {
      const res = await api.post('/api/search_menu_item', { address, item_name: item })
      setResults(res.data.results || [])
    } catch (e) {
      setResults([])
    } finally { setLoading(false) }
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
                        <Stack key={i} direction="row" justifyContent="space-between">
                          <Typography>{mi.item_name}</Typography>
                          <Typography color="text.secondary">${mi.price.toFixed(2)} • {mi.availability} available</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>
        ))}
      </Grid2>
      )}
    </Stack>
  )
}
