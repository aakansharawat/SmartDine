import axios from 'axios'

const api = axios.create({
  baseURL: '' // proxied by Vite to http://localhost:5000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
  }
  return config
})

export default api
