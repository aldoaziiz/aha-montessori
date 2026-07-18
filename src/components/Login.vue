<template>
  <div class="login-page">
    <div class="login-card-wrapper">
      <v-card class="login-card" rounded="xl" elevation="8">
        <v-card-text class="pa-8">
          <!-- LOGO -->
          <div class="text-center mb-8">
            <img src="@/assets/ahamon-logo.png" alt="AHA Montessori Logo" class="logo mb-4" />

            <h1 class="text-h4 font-weight-bold mb-2">Welcome Back</h1>

            <p class="text-body-1 text-grey-darken-1">Please sign in to continue</p>
          </div>

          <!-- SUCCESS -->
          <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4" closable>
            {{ successMessage }}
          </v-alert>

          <!-- ERROR -->
          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @update:model-value="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <!-- FORM -->
          <v-form ref="form" @submit.prevent="handleLogin">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              variant="outlined"
              prepend-inner-icon="mdi-email-outline"
              :rules="emailRules"
              :error="!!errorMessage"
              class="mb-4"
              required
            />

            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              variant="outlined"
              prepend-inner-icon="mdi-lock-outline"
              :rules="passwordRules"
              :error="!!errorMessage"
              class="mb-6"
              required
            />

            <v-btn
              type="submit"
              block
              size="large"
              color="#64AF64"
              :loading="isLoading"
              class="login-btn text-none font-weight-bold"
            >
              Login
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { VForm } from 'vuetify/components'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const authStore = useAuthStore()

const email = ref('')

const password = ref('')

const isLoading = ref(false)

const errorMessage = ref('')

const successMessage = ref('')

const form = ref<InstanceType<typeof VForm>>()

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const emailRules = [
  (v: string) => !!v || 'Email is required',

  (v: string) => /.+@.+\..+/.test(v) || 'Email must be valid',
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',

  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
]

const handleLogin = async () => {
  const isValid = await form.value?.validate()

  if (!isValid?.valid) {
    return
  }

  isLoading.value = true

  errorMessage.value = ''

  successMessage.value = ''

  try {
    await authStore.login(email.value, password.value)

    successMessage.value = 'Login successful! Redirecting...'

    setTimeout(() => {
      router.push('/dashboard')
    }, 800)
  } catch (error) {
    console.error(error)

    const err = error as any

    errorMessage.value = err.response?.data?.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const message = sessionStorage.getItem('login_message')

  if (message) {
    showSnackbar(message, 'warning')

    sessionStorage.removeItem('login_message')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;

  display: flex;

  align-items: center;

  justify-content: center;

  padding: 24px;

  background: linear-gradient(135deg, #f4f7f5 0%, #edf5ef 100%);
}

.login-card-wrapper {
  width: 100%;

  max-width: 420px;
}

.login-card {
  backdrop-filter: blur(8px);
}

.logo {
  width: 120px;

  max-width: 100%;

  object-fit: contain;
}

.login-btn {
  height: 52px;

  font-size: 16px;

  border-radius: 12px;
}

@media (max-width: 600px) {
  .login-page {
    padding: 16px;
  }

  .login-card-wrapper {
    max-width: 100%;
  }

  .logo {
    width: 100px;
  }
}
</style>
