<template>
  <div class="guardian-create-page">
    <!-- HEADER -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Create Guardian</h1>

        <p class="text-body-2 text-grey">Add new guardian.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <!-- FORM -->
    <v-card elevation="1" class="rounded-xl">
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
            <v-text-field v-model="form.email" label="Email" type="email" variant="outlined" />
          </v-col>

          <v-col cols="12">
            <v-textarea v-model="form.address" label="Address" variant="outlined" rows="3" />
          </v-col>
        </v-row>

        <!-- ACTION -->
        <div class="d-flex justify-end ga-3 mt-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="loading"
            :disabled="loading"
            @click="createGuardian"
          >
            Save Guardian
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { useRouter } from 'vue-router'

import api from '@/services/api'

// ======================
// ROUTER
// ======================

const router = useRouter()

// ======================
// STATE
// ======================

const loading = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const form = ref({
  id_number: '',
  name: '',
  phone: '',
  occupation: '',
  social_media: '',
  address: '',
  email: '',
})

// ======================
// SNACKBAR
// ======================

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// ======================
// GO BACK
// ======================

const goBack = () => {
  router.push('/guardians')
}

// ======================
// CREATE GUARDIAN
// ======================

const createGuardian = async () => {
  try {
    loading.value = true

    await api.post('/guardians', form.value)

    showSnackbar('Guardian created successfully')

    router.push('/guardians')
  } catch (err) {
    console.error(err)

    showSnackbar(
      err.response?.data?.message || 'Failed to create guardian',

      'error',
    )
  } finally {
    loading.value = false
  }
}

// ======================
// INIT
// ======================

onMounted(() => {
  // Initialize component if needed
})
</script>

<style scoped>
.guardian-create-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  gap: 16px;

  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .v-btn {
    width: 100%;
  }
}
</style>
