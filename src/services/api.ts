import axios from 'axios'

// ======================
// API
// ======================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  headers: {
    Accept: 'application/json',
  },

  timeout: 300000,
})

// ======================
// REQUEST INTERCEPTOR
// ======================

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ======================
// RESPONSE INTERCEPTOR
// ======================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname

      // ======================
      // PUBLIC PAGES
      // ======================

      const publicPages = ['/login', '/registrations-new', '/registration-success']

      // ======================
      // SKIP REDIRECT
      // ======================

      if (!publicPages.includes(currentPath)) {
        sessionStorage.setItem(
          'login_message',
          error.response?.data?.message ?? 'Your session has expired. Please login again.',
        )

        localStorage.removeItem('token')
        localStorage.removeItem('user')

        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
