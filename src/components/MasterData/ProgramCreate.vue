<template>
  <div class="program-create-page">
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">New Program</h1>
        <p class="text-body-2 text-grey">Create a new program.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <v-card elevation="1" class="rounded-xl">
      <v-card-text>
        <v-form ref="formRef">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Program Name"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.clinic_id"
                :items="clinics"
                item-title="name"
                item-value="id"
                label="Clinic"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.program_category_id"
                :items="programCategories"
                item-title="name"
                item-value="id"
                label="Program Category"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="form.payer_id"
                :items="payers"
                item-title="name"
                item-value="id"
                label="Payer"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.session_count"
                label="Session Count"
                type="number"
                min="0"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.price"
                label="Price"
                type="number"
                variant="outlined"
                :rules="[rules.required]"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.order_number"
                label="List Number"
                type="number"
                variant="outlined"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Description"
                variant="outlined"
                rows="3"
              />
            </v-col>
          </v-row>
        </v-form>

        <div class="d-flex justify-end ga-3 mt-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="loading"
            :disabled="loading"
            @click="createProgram"
          >
            Create Program
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>

    <v-dialog v-model="saveLoading" persistent width="320">
      <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
        <v-progress-circular indeterminate color="primary" size="56" width="5" />

        <div class="text-h6 font-weight-medium mt-6">Saving...</div>

        <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const loading = ref(false)
const saveLoading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const clinics = ref([])
const programCategories = ref([])
const payers = ref([])
const formRef = ref()

const rules = {
  required: (v) => !!v || 'Field is required',
}

const form = ref({
  clinic_id: null,
  program_category_id: null,
  payer_id: null,
  order_number: null,
  name: '',
  description: '',
  price: null,
  session_count: null,
})

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const goBack = () => {
  router.back()
}

const fetchMasterData = async () => {
  try {
    const res = await api.get('/master-data')

    clinics.value = res.data.clinics || []
    programCategories.value = res.data.program_categories || []
    payers.value = res.data.payers || []
  } catch (err) {
    console.error('Error loading master data:', err)

    showSnackbar('Error loading master data', 'error')
  }
}

const createProgram = async () => {
  if (loading.value) return

  const { valid } = await formRef.value.validate()

  if (!valid) {
    return
  }

  loading.value = true
  saveLoading.value = true

  try {
    await api.post('/programs', {
      clinic_id: form.value.clinic_id,
      program_category_id: form.value.program_category_id,
      payer_id: form.value.payer_id,
      order_number: form.value.order_number,
      name: form.value.name,
      description: form.value.description,
      price: form.value.price,
      session_count: form.value.session_count,
    })

    showSnackbar('Program created successfully')

    router.push('/programs')
  } catch (error) {
    console.error('Error creating program:', error)

    showSnackbar(error.response?.data?.message || 'Error creating program', 'error')
  } finally {
    loading.value = false
    saveLoading.value = false
  }
}

onMounted(async () => {
  await fetchMasterData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.program-create-page {
  width: 100%;
}
</style>
