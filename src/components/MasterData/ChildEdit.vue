<template>
  <div class="child-edit-page">
    <!-- HEADER -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Edit Child</h1>

        <p class="text-body-2 text-grey">Update child information.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <!-- LOADING -->
    <v-card v-if="pageLoading" elevation="1" class="rounded-xl pa-8">
      <div class="d-flex justify-center align-center flex-column ga-4">
        <v-progress-circular indeterminate color="primary" size="48" />

        <div class="text-body-1 text-grey">Loading child data...</div>
      </div>
    </v-card>

    <!-- FORM -->
    <v-card v-else elevation="1" class="rounded-xl">
      <v-card-text>
        <v-row>
          <!-- ID NUMBER -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.id_number" label="ID Number" variant="outlined" />
          </v-col>

          <!-- FULL NAME -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.name" label="Full Name" variant="outlined" />
          </v-col>

          <!-- NICKNAME -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.nickname" label="Nickname" variant="outlined" />
          </v-col>

          <!-- GENDER -->
          <v-col cols="12" md="6">
            <v-select
              v-model="form.gender"
              label="Gender"
              variant="outlined"
              :items="['Male', 'Female']"
            />
          </v-col>

          <!-- BIRTH DATE -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.birth_date"
              label="Birth Date"
              type="date"
              variant="outlined"
            />
          </v-col>

          <!-- BIRTHPLACE -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="form.birthplace_id"
              :items="cities"
              item-title="name"
              item-value="id"
              label="Birthplace"
              variant="outlined"
              clearable
            />
          </v-col>

          <!-- HOMETOWN -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="form.hometown_id"
              :items="cities"
              item-title="name"
              item-value="id"
              label="Hometown"
              variant="outlined"
              clearable
            />
          </v-col>

          <!-- SCHOOL -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="form.school_id"
              :items="schools"
              item-title="name"
              item-value="id"
              label="School"
              variant="outlined"
              clearable
            />
          </v-col>

          <!-- SCHOOL CLASS -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="form.school_class_id"
              :items="schoolClasses"
              item-title="name"
              item-value="id"
              label="School Class"
              variant="outlined"
              clearable
            />
          </v-col>

          <!-- SCHOOL EDUCATION -->
          <v-col cols="12">
            <v-autocomplete
              v-model="form.school_education_id"
              :items="schoolEducations"
              item-title="name"
              item-value="id"
              label="School Education"
              variant="outlined"
              clearable
            />
          </v-col>

          <!-- ADDRESS -->
          <v-col cols="12">
            <v-textarea v-model="form.address" label="Address" variant="outlined" rows="3" />
          </v-col>
        </v-row>

        <!-- GUARDIANS -->
        <div class="mt-6">
          <div class="text-subtitle-1 font-weight-bold mb-4">Guardians</div>

          <!-- EXISTING -->
          <div v-if="form.guardians?.length" class="mb-4">
            <div
              v-for="guardian in form.guardians"
              :key="guardian.id"
              class="d-flex align-start guardian-item"
            >
              <!-- DELETE -->
              <v-btn
                icon
                size="small"
                color="error"
                variant="text"
                class="me-2 mt-1"
                @click="detachGuardian(guardian.id)"
              >
                <v-icon size="18">mdi-trash-can-outline</v-icon>
              </v-btn>

              <!-- CONTENT -->
              <div>
                <div class="detail-value">
                  {{ guardian.name }}
                </div>

                <div class="text-body-2 text-primary">
                  {{ getGuardianRoleName(guardian.pivot?.guardian_role_id) }}
                </div>

                <div class="text-body-2 text-grey">
                  {{ guardian.phone }}
                </div>
              </div>
            </div>
          </div>

          <!-- ADD -->
          <div class="d-flex ga-3 flex-wrap">
            <v-autocomplete
              v-model="selectedGuardianId"
              :items="guardians"
              :item-props="guardianItemProps"
              item-title="name"
              item-value="id"
              label="Add Guardian"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />

            <v-select
              v-model="selectedGuardianRoleId"
              :items="guardianRoles"
              item-title="name"
              item-value="id"
              label="Role"
              variant="outlined"
              density="comfortable"
              hide-details
              style="max-width: 220px"
            />

            <v-btn color="primary" @click="attachGuardian">Add</v-btn>
          </div>
        </div>

        <!-- ACTION -->
        <div class="d-flex justify-end ga-3 mt-4">
          <v-btn
            color="primary"
            prepend-icon="mdi-content-save"
            :loading="loading"
            :disabled="loading"
            @click="updateChild"
          >
            Update Child
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
      {{ snackbarText }}
    </v-snackbar>
  </div>

  <!-- PROCESSING DIALOG -->
  <v-dialog v-model="processingDialog" persistent width="320">
    <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />

      <div class="text-h6 font-weight-medium mt-6">
        {{ processingText }}
      </div>

      <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

import api from '@/services/api'

import { useRoute, useRouter } from 'vue-router'

// ======================
// ROUTER
// ======================

const route = useRoute()
const router = useRouter()

// ======================
// STATE
// ======================

const loading = ref(false)
const pageLoading = ref(true)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const processingDialog = ref(false)
const processingText = ref('Processing...')

// MASTER DATA
const cities = ref([])
const schools = ref([])
const schoolClasses = ref([])
const schoolEducations = ref([])
const guardians = ref([])
const selectedGuardianId = ref(null)
const guardianRoles = ref([])
const selectedGuardianRoleId = ref(null)

const form = ref({
  id_number: '',
  name: '',
  nickname: '',
  birth_date: '',
  gender: '',
  address: '',
  birthplace_id: null,
  hometown_id: null,
  school_id: null,
  school_class_id: null,
  school_education_id: null,
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
  router.back()
}

// ======================
// FETCH MASTER DATA
// ======================

const fetchMaster = async () => {
  try {
    const response = await api.get('/master-data')

    cities.value = response.data.cities

    schools.value = response.data.schools

    schoolClasses.value = response.data.school_classes

    schoolEducations.value = response.data.school_educations
  } catch (err) {
    console.error('Error fetching master data:', err)

    showSnackbar('Error loading form data', 'error')
  }
}

// ======================
// FETCH DETAIL
// ======================

const fetchChild = async () => {
  try {
    const res = await api.get(`/children/${route.params.id}`)

    const childData = {
      id_number: res.data.id_number || '',

      name: res.data.name || '',

      nickname: res.data.nickname || '',

      birth_date: res.data.birth_date || '',

      gender: res.data.gender || '',

      address: res.data.address || '',

      birthplace_id: res.data.birthplace_id ? Number(res.data.birthplace_id) : null,

      hometown_id: res.data.hometown_id ? Number(res.data.hometown_id) : null,

      school_id: res.data.school_id ? Number(res.data.school_id) : null,

      school_class_id: res.data.school_class_id ? Number(res.data.school_class_id) : null,

      school_education_id: res.data.school_education_id
        ? Number(res.data.school_education_id)
        : null,

      guardians: res.data.guardians || [],
    }

    form.value = childData
  } catch (err) {
    console.error(err)

    showSnackbar('Error loading child data', 'error')
  } finally {
    pageLoading.value = false
  }
}

const fetchGuardians = async () => {
  try {
    const res = await api.get('/guardians', {
      params: {
        per_page: 9999,
      },
    })

    guardians.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

const fetchGuardianRoles = async () => {
  try {
    const res = await api.get('/guardian-roles')

    guardianRoles.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

const getGuardianRoleName = (roleId) => {
  const role = guardianRoles.value.find((item) => item.id === roleId)

  return role?.name || '-'
}

const guardianItemProps = (item) => {
  return {
    title: item.name || '-',

    subtitle: `ID: ${item.id_number || '-'}`,
  }
}

// ======================
// UPDATE
// ======================

const updateChild = async () => {
  try {
    loading.value = true

    await api.put(`/children/${route.params.id}`, form.value)

    showSnackbar('Child updated successfully')

    router.push('/children')
  } catch (err) {
    console.error(err)

    showSnackbar(err.response?.data?.message || 'Failed to update child', 'error')
  } finally {
    loading.value = false
  }
}

const attachGuardian = async () => {
  if (!selectedGuardianId.value || !selectedGuardianRoleId.value) {
    showSnackbar('Please select guardian and role', 'error')

    return
  }

  try {
    processingText.value = 'Adding guardian...'

    processingDialog.value = true

    await api.post(
      `/children/${route.params.id}/guardians`,

      {
        guardian_id: selectedGuardianId.value,

        guardian_role_id: selectedGuardianRoleId.value,
      },
    )

    await fetchChild()

    selectedGuardianId.value = null

    selectedGuardianRoleId.value = null

    showSnackbar('Guardian added successfully')
  } catch (err) {
    console.error(err)

    showSnackbar(
      err.response?.data?.message || 'Failed to add guardian',

      'error',
    )
  } finally {
    processingDialog.value = false
  }
}

const detachGuardian = async (guardianId) => {
  const confirmed = confirm('Remove this guardian?')

  if (!confirmed) return

  try {
    processingText.value = 'Removing guardian...'

    processingDialog.value = true

    await api.delete(`/children/${route.params.id}/guardians/${guardianId}`)

    await fetchChild()

    showSnackbar('Guardian removed successfully')
  } catch (err) {
    console.error(err)

    showSnackbar(
      err.response?.data?.message || 'Failed to remove guardian',

      'error',
    )
  } finally {
    processingDialog.value = false
  }
}

// ======================
// INIT
// ======================

onMounted(async () => {
  await fetchMaster()

  await nextTick()

  await nextTick()

  await fetchGuardians()

  await fetchGuardianRoles()

  await fetchChild()
})
</script>

<style scoped>
.child-edit-page {
  width: 100%;
}

.guardian-item {
  padding: 14px 0;
}

.guardian-item:not(:last-child) {
  margin-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
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
