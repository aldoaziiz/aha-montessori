<template>
  <!-- Top App Bar -->
  <v-app-bar color="primary" dark class="dashboard-header" elevation="2">
    <v-app-bar-nav-icon @click="toggleSidebar"></v-app-bar-nav-icon>

    <v-toolbar-title class="ml-3 font-weight-bold">{{ userName }}</v-toolbar-title>

    <v-spacer></v-spacer>

    <!-- Notifications -->
    <v-badge color="error" dot>
      <v-btn icon="mdi-bell" variant="text"></v-btn>
    </v-badge>

    <!-- User Menu -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn icon="mdi-account-circle" variant="text" size="large" v-bind="props"></v-btn>
      </template>

      <v-list>
        <v-list-item>
          <v-list-item-title>
            {{ userName }}
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ userEmail }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="goToChangePassword">
          <template v-slot:prepend>
            <v-icon>mdi-account</v-icon>
          </template>
          <v-list-item-title>Change Password</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="handleLogout">
          <template v-slot:prepend>
            <v-icon>mdi-logout</v-icon>
          </template>
          <v-list-item-title>Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="changePasswordDialog" max-width="500">
    <v-card rounded="xl">
      <v-card-title class="text-h6 font-weight-bold">Change Password</v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-text-field :model-value="userName" label="Name" variant="outlined" readonly />

        <v-text-field :model-value="userEmail" label="Email" variant="outlined" readonly />

        <v-text-field
          :model-value="authStore.user?.role"
          label="User Role"
          variant="outlined"
          readonly
        />

        <v-divider class="my-4" />

        <div class="text-subtitle-1 font-weight-medium mb-3">Change Password</div>

        <v-text-field
          v-model="form.current_password"
          label="Current Password"
          type="password"
          variant="outlined"
        />

        <v-text-field
          v-model="form.password"
          label="New Password"
          type="password"
          variant="outlined"
        />

        <v-text-field
          v-model="form.password_confirmation"
          label="Confirm New Password"
          type="password"
          variant="outlined"
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />

        <v-btn color="primary" :loading="loading" @click="changePassword">Save Password</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- LOGOUT LOADING -->
  <v-dialog v-model="logoutLoading" persistent fullscreen scrim="black">
    <div class="d-flex flex-column align-center justify-center h-100">
      <v-card rounded="xl" class="pa-8 text-center" width="320">
        <v-progress-circular indeterminate color="primary" size="56" width="5" />

        <div class="text-h6 font-weight-medium mt-6">Logging out...</div>

        <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
      </v-card>
    </div>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()
const changePasswordDialog = ref(false)
const loading = ref(false)
const logoutLoading = ref(false)

const form = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const userName = computed(() => {
  return authStore.user?.name || 'User'
})

const userEmail = computed(() => {
  return authStore.user?.email || '-'
})

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const toggleSidebar = () => {
  emit('toggle-sidebar')
}

const goToChangePassword = () => {
  changePasswordDialog.value = true
}

const handleLogout = async () => {
  logoutLoading.value = true

  try {
    await authStore.logout()

    router.replace('/login')
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(() => {
      logoutLoading.value = false
    }, 300)
  }
}

const changePassword = async () => {
  loading.value = true

  try {
    await api.put('/change-password', {
      current_password: form.value.current_password,

      password: form.value.password,

      password_confirmation: form.value.password_confirmation,
    })

    alert('Password changed successfully')

    changePasswordDialog.value = false

    form.value = {
      current_password: '',
      password: '',
      password_confirmation: '',
    }
  } catch (error) {
    console.error(error)
    const err = error as any
    alert(err.response?.data?.message || 'Failed to change password')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dashboard-header {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
