<template>
  <div class="staff-create-page">
    <!-- HEADER -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Create Staff</h1>

        <p class="text-body-2 text-grey">Add new staff member.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <!-- FORM -->
    <v-card elevation="1" class="rounded-xl">
      <v-card-text>
        <v-row>
          <!-- NAME -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.name" label="Name" variant="outlined" />
          </v-col>

          <!-- EMAIL -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.email" label="Email" variant="outlined" type="email" />
          </v-col>

          <!-- PHONE -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.phone" label="Phone" variant="outlined" />
          </v-col>

          <!-- STAFF ROLE -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="form.staff_role_id"
              :items="staffRoles"
              item-title="name"
              item-value="id"
              label="Staff Role"
              variant="outlined"
              clearable
            />
          </v-col>

          <!-- ADDRESS -->
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
            @click="createStaff"
          >
            Save Staff
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

const staffRoles = ref([])

const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  staff_role_id: null,
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
  router.push('/staff')
}

// ======================
// FETCH MASTER DATA
// ======================

const fetchMaster = async () => {
  try {
    const roleRes = await api.get('/staff-roles')

    staffRoles.value = roleRes.data.data
  } catch (err) {
    console.error(err)

    showSnackbar('Failed to load form data', 'error')
  }
}

// ======================
// CREATE STAFF
// ======================

const createStaff = async () => {
  try {
    loading.value = true

    await api.post('/staff', form.value)

    showSnackbar('Staff created successfully')

    router.push('/staff')
  } catch (err) {
    console.error(err)

    showSnackbar(
      err.response?.data?.message || 'Failed to create staff',

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
  fetchMaster()
})
</script>

<style scoped>
.staff-create-page {
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
