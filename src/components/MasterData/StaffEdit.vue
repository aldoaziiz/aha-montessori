<template>
  <div class="staff-edit-page">
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Edit Staff</h1>
        <p class="text-body-2 text-grey">Update staff information.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <v-card v-if="pageLoading" elevation="1" class="rounded-xl pa-8">
      <div class="d-flex justify-center align-center flex-column ga-4">
        <v-progress-circular indeterminate color="primary" size="48" />
        <div class="text-body-1 text-grey">Loading staff data...</div>
      </div>
    </v-card>

    <v-card v-else elevation="1" class="rounded-xl">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.name" label="Name" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.email" label="Email" variant="outlined" type="email" />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.phone" label="Phone" variant="outlined" />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.staff_role_id"
              :items="roles"
              item-title="name"
              item-value="id"
              label="Role"
              variant="outlined"
              hide-details
              single-line
            />
          </v-col>

          <v-col cols="12">
            <v-textarea v-model="form.address" label="Address" variant="outlined" rows="3" />
          </v-col>
        </v-row>

        <div class="d-flex justify-end ga-3 mt-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="loading"
            :disabled="loading"
            @click="updateStaff"
          >
            Update Staff
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const pageLoading = ref(true)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const roles = ref([])
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  staff_role_id: null,
})

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const goBack = () => {
  router.back()
}

const fetchRoles = async () => {
  try {
    const res = await api.get('/staff-roles')
    roles.value = res.data.data || []
  } catch (err) {
    console.error('Error loading staff roles:', err)
  }
}

const fetchStaff = async () => {
  try {
    const res = await api.get(`/staff/${route.params.id}`)
    form.value = {
      name: res.data.name || '',
      email: res.data.email || '',
      phone: res.data.phone || '',
      address: res.data.address || '',
      staff_role_id: res.data.staff_role?.id ?? null,
    }
  } catch (err) {
    console.error('Error loading staff:', err)
    showSnackbar('Error loading staff data', 'error')
  }
}

const updateStaff = async () => {
  if (loading.value) return

  loading.value = true

  try {
    await api.put(`/staff/${route.params.id}`, {
      name: form.value.name,
      phone: form.value.phone,
      email: form.value.email,
      address: form.value.address,
      staff_role_id: form.value.staff_role_id,
    })

    showSnackbar('Staff updated successfully')
    goBack()
  } catch (error) {
    console.error('Error updating staff:', error)
    showSnackbar(error.response?.data?.message || 'Error updating staff', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  pageLoading.value = true
  await Promise.all([fetchRoles(), fetchStaff()])
  pageLoading.value = false
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.staff-edit-page {
  width: 100%;
}
</style>
