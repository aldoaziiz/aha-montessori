import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

// ======================
// STORE
// ======================

export const useAuthStore = defineStore('auth', () => {
  // ======================
  // STATE
  // ======================

  const token = ref(localStorage.getItem('token'))

  const user = ref<any>(null)

  const isAdmin = computed(() => user.value?.role === 'admin')

  const isTherapist = computed(() => user.value?.role === 'therapist')

  const isGuardian = computed(() => user.value?.role === 'guardian')

  const isStaff = computed(() => user.value?.role === 'staff')

  // ======================
  // LOGIN
  // ======================

  const login = async (email: string, password: string) => {
    const res = await api.post('/login', {
      email,
      password,
    })

    token.value = res.data.token

    user.value = res.data.user

    localStorage.setItem('token', res.data.token)

    return res.data
  }

  // ======================
  // FETCH ME
  // ======================

  const fetchMe = async () => {
    if (!token.value) return

    try {
      const res = await api.get('/me')

      user.value = res.data
    } catch (err) {
      logout()
    }
  }

  // ======================
  // LOGOUT
  // ======================

  const logout = async () => {
    try {
      if (token.value) {
        await api.post('/logout')
      }
    } catch (err) {
      console.error(err)
    }

    token.value = null

    user.value = null

    localStorage.removeItem('token')
  }

  // ======================
  // RETURN
  // ======================

  return {
    token,

    user,

    login,

    logout,

    fetchMe,

    isAdmin,

    isTherapist,

    isGuardian,

    isStaff,
  }
})
