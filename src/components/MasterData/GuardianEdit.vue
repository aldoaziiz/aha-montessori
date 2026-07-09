<template>
  <div class="guardian-edit-page">
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Edit Guardian</h1>
        <p class="text-body-2 text-grey">Update guardian information.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <v-card v-if="pageLoading" elevation="1" class="rounded-xl pa-8">
      <div class="d-flex justify-center align-center flex-column ga-4">
        <v-progress-circular indeterminate color="primary" size="48" />
        <div class="text-body-1 text-grey">Loading guardian data...</div>
      </div>
    </v-card>

    <v-card v-else elevation="1" class="rounded-xl">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="form.id_number" label="ID Number" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.name" label="Name" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.phone" label="Phone" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.occupation" label="Occupation" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.social_media"
              label="Social Media Instagram"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.email" label="Email" variant="outlined" type="email" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.address" label="Address" variant="outlined" />
          </v-col>
        </v-row>

        <div class="d-flex justify-end ga-3 mt-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="loading"
            :disabled="loading"
            @click="updateGuardian"
          >
            Update Guardian
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

const form = ref({
  id_number: '',
  name: '',
  phone: '',
  address: '',
  email: '',
})

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const goBack = () => {
  router.back()
}

const fetchGuardian = async () => {
  try {
    const res = await api.get(`/guardians/${route.params.id}`)
    form.value = {
      id_number: res.data.id_number || '',
      name: res.data.name || '',
      phone: res.data.phone || '',
      occupation: res.data.occupation || '',
      social_media: res.data.social_media || '',
      address: res.data.address || '',
      email: res.data.email || '',
    }
  } catch (err) {
    console.error('Error loading guardian:', err)
    showSnackbar('Error loading guardian data', 'error')
  } finally {
    pageLoading.value = false
  }
}

const updateGuardian = async () => {
  loading.value = true
  try {
    await api.put(`/guardians/${route.params.id}`, {
      id_number: form.value.id_number,
      name: form.value.name,
      phone: form.value.phone,
      occupation: form.value.occupation,
      social_media: form.value.social_media,
      email: form.value.email,
      address: form.value.address,
    })

    showSnackbar('Guardian updated successfully')
    goBack()
  } catch (error) {
    console.error('Error updating guardian:', error)
    showSnackbar(error.response?.data?.message || 'Error updating guardian', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(fetchGuardian)
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.guardian-edit-page {
  width: 100%;
}
</style>
