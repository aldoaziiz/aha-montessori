<template>
  <!-- SNACKBAR -->
  <v-snackbar
    v-model="snackbar"
    :color="snackbarColor"
    timeout="3000"
    location="top right"
    elevation="2"
  >
    {{ snackbarText }}
  </v-snackbar>

  <div class="registration-page">
    <div class="registration-content">
      <!-- HEADER -->
      <div class="page-header mb-8">
        <div class="d-flex align-center">
          <img :src="logo" alt="AHA CDC" class="aha-logo mr-4" />

          <div>
            <h1 class="text-h5 font-weight-bold mb-2">
              New Registration for Assessment Behavior & Learning Therapy
            </h1>

            <p class="text-body2 text-grey">Fill in the information below</p>
          </div>
        </div>
      </div>

      <!-- FORM -->
      <v-form ref="formRef" @submit.prevent="submitForm">
        <!-- ================= CHILD ================= -->
        <v-card class="mb-8 rounded-xl" elevation="1">
          <v-card-title>Child Information</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-radio-group v-model="childMode" inline>
              <v-radio label="New Child" value="new" />

              <v-radio label="Select Existing" value="existing" />
            </v-radio-group>

            <v-autocomplete
              v-model="selectedChild"
              :items="childrenOptions"
              item-title="name"
              item-value="id"
              label="Select Child"
              :disabled="childMode === 'new'"
              :clearable="childMode !== 'existing'"
              class="mb-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.name"
                  :subtitle="`ID: ${item.id_number}`"
                ></v-list-item>
              </template>
            </v-autocomplete>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.name"
                  label="Full Name"
                  :rules="[rules.required]"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.nickname"
                  label="Nickname"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.id_number"
                  label="ID Number / KIA"
                  :rules="[rules.required]"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.birth_date"
                  type="date"
                  label="Birth Date"
                  :rules="[rules.required]"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.birthplace_id"
                  :items="cities"
                  item-title="name"
                  item-value="id"
                  label="Birthplace"
                  :rules="[rules.required]"
                  :clearable="childMode !== 'existing'"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.hometown_id"
                  :items="cities"
                  item-title="name"
                  item-value="id"
                  label="Hometown"
                  :clearable="childMode !== 'existing'"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.school_id"
                  :items="schools"
                  item-title="name"
                  item-value="id"
                  label="School"
                  :clearable="childMode !== 'existing'"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.school_class_id"
                  :items="schoolClasses"
                  item-title="name"
                  item-value="id"
                  label="Class"
                  :clearable="childMode !== 'existing'"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.school_education_id"
                  :items="schoolEducations"
                  item-title="name"
                  item-value="id"
                  label="Education"
                  :clearable="childMode !== 'existing'"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field :model-value="age" label="Age" readonly />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="form.child.gender"
                  :items="['Male', 'Female']"
                  label="Gender"
                  :rules="[rules.required]"
                  :readonly="childMode === 'existing'"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.child.address"
                  label="Address"
                  rows="2"
                  :readonly="childMode === 'existing'"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ================= GUARDIAN ================= -->
        <v-card class="mb-8 rounded-xl" elevation="1">
          <v-card-title>Parent / Guardian</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-radio-group v-model="guardianMode" inline>
              <v-radio label="New Guardian" value="new" />

              <v-radio label="Select Existing" value="existing" />
            </v-radio-group>

            <v-autocomplete
              v-model="selectedGuardian"
              :items="guardiansOptions"
              item-title="name"
              item-value="id"
              label="Select Guardian"
              :disabled="guardianMode === 'new'"
              :clearable="guardianMode !== 'existing'"
              class="mb-4"
            >
              <template v-slot:item="{ props, item }">
                <v-list-item
                  v-bind="props"
                  :title="item.name"
                  :subtitle="`ID: ${item.id_number}`"
                ></v-list-item>
              </template>
            </v-autocomplete>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.id_number"
                  label="ID Number / KTP"
                  :rules="[rules.required]"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.name"
                  label="Name"
                  :rules="[rules.required]"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.phone"
                  label="Phone"
                  :rules="[rules.required]"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.occupation"
                  label="Occupation"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.social_media"
                  label="Social Media Instagram"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.email"
                  label="Email"
                  type="email"
                  :rules="[rules.required]"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.guardian.guardian_role_id"
                  :items="guardianRoles"
                  item-title="name"
                  item-value="id"
                  label="Relation"
                  :rules="[rules.required]"
                  clearable
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="form.guardian.address"
                  label="Address"
                  rows="2"
                  :readonly="guardianMode === 'existing'"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ================= PROGRAM ================= -->
        <v-card class="mb-8 rounded-xl" elevation="1">
          <v-card-title>Program</v-card-title>
          <v-divider></v-divider>

          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  v-model="form.registration.complaint"
                  label="Problem"
                  rows="2"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.registration.clinic_id"
                  :items="clinics"
                  item-title="name"
                  item-value="id"
                  label="Clinic"
                  :rules="[rules.required]"
                  clearable
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.registration.program_category_id"
                  :items="programCategories"
                  item-title="name"
                  item-value="id"
                  label="Program Category"
                  :rules="[rules.required]"
                  clearable
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.registration.payer_id"
                  :items="payers"
                  item-title="name"
                  item-value="id"
                  label="Payment"
                  :rules="[rules.required]"
                  :disabled="!form.registration.clinic_id || !form.registration.program_category_id"
                  clearable
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.registration.program_ids"
                  :items="filteredPrograms"
                  item-title="name"
                  item-value="id"
                  label="Programs"
                  :rules="[rules.required]"
                  :disabled="
                    !form.registration.clinic_id ||
                    !form.registration.program_category_id ||
                    !form.registration.payer_id
                  "
                  multiple
                  chips
                  clearable
                >
                  <template #item="{ props, item }">
                    <v-list-item
                      v-bind="props"
                      :subtitle="`Rp ${Number(item.price).toLocaleString('id-ID')}`"
                    />
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ACTION -->
        <div class="text-right">
          <v-btn color="primary" type="submit" :loading="loading" :disabled="loading">
            Save Registration
          </v-btn>
        </div>
      </v-form>
    </div>
  </div>
</template>

<style scoped>
.registration-page {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 32px 16px;
}

.registration-content {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}
</style>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import logo from '@/assets/ahamon-logo.png'
import api from '@/services/api'
const router = useRouter()

/* =========================
   STATE
========================= */

const loading = ref(false)
const formRef = ref(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const programCategories = ref([])

// MODE
const childMode = ref('new')
const guardianMode = ref('new')

// SELECTED EXISTING
const selectedChild = ref(null)
const selectedGuardian = ref(null)

// PREVIEW (🔥 FIX ERROR)
const childPreview = ref(null)
const guardianPreview = ref(null)

// OPTIONS
const guardianRoles = ref([])
const programs = ref([])
const payers = ref([])
const cities = ref([])
const schools = ref([])
const schoolClasses = ref([])
const schoolEducations = ref([])
const clinics = ref([])

const childrenOptions = ref([])
const guardiansOptions = ref([])

/* =========================
   FORM
========================= */

const form = ref({
  child: {
    id_number: '',
    name: '',
    nickname: '',
    birth_date: '',
    birthplace_id: null,
    hometown_id: null,
    gender: '',
    address: '',
    school_id: null,
    school_class_id: null,
    school_education_id: null,
  },
  guardian: {
    id_number: '',
    name: '',
    phone: '',
    address: '',
    guardian_role_id: null,
    email: '',
  },
  registration: {
    complaint: '',
    clinic_id: null,
    program_category_id: null,
    program_ids: [],
    payer_id: null,
  },
})

/* =========================
   COMPUTED
========================= */

const age = computed(() => {
  if (!form.value.child.birth_date) return ''

  const birth = new Date(form.value.child.birth_date)
  if (isNaN(birth)) return ''

  const today = new Date()

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--
    months += 12
  }

  return `${years} yr, ${months} mo`
})

const filteredPrograms = computed(() => {
  const clinicId = form.value.registration.clinic_id

  const categoryId = form.value.registration.program_category_id
  const payerId = form.value.registration.payer_id

  if (!clinicId || !categoryId || !payerId) {
    return []
  }

  return programs.value.filter(
    (program) =>
      Number(program.clinic_id) === Number(clinicId) &&
      Number(program.program_category_id) === Number(categoryId) &&
      Number(program.payer_id) === Number(payerId),
  )
})

/* =========================
   RULES
========================= */

const rules = {
  required: (v) => !!v || 'Field is required',
}

/* =========================
   WATCHERS
========================= */

// CHILD
watch(selectedChild, (val) => {
  if (!val) {
    childPreview.value = null
    return
  }

  const c = childrenOptions.value.find((i) => i.id === val)
  if (!c) return

  childPreview.value = c

  form.value.child = {
    id_number: c.id_number,
    name: c.name,
    nickname: c.nickname,
    birth_date: c.birth_date,
    gender: c.gender,
    address: c.address,
    birthplace_id: c.birthplace_id ?? null,
    hometown_id: c.hometown_id ?? null,
    school_id: c.school_id ?? null,
    school_class_id: c.school_class_id ?? null,
    school_education_id: c.school_education_id ?? null,
  }
})

// CHILD MODE
watch(childMode, async (mode) => {
  // ======================
  // RESET NEW MODE
  // ======================

  if (mode === 'new') {
    selectedChild.value = null

    childPreview.value = null

    form.value.child = {
      id_number: '',
      name: '',
      nickname: '',
      birth_date: '',
      birthplace_id: null,
      hometown_id: null,
      gender: '',
      address: '',
      school_id: null,
      school_class_id: null,
      school_education_id: null,
    }

    return
  }

  // ======================
  // LAZY LOAD EXISTING
  // ======================

  if (mode === 'existing' && !childrenOptions.value.length) {
    try {
      const res = await api.get('/children')

      childrenOptions.value = res.data.data
    } catch (err) {
      console.error(err)
    }
  }
})

// GUARDIAN
watch(selectedGuardian, (val) => {
  if (!val) {
    guardianPreview.value = null
    return
  }

  const g = guardiansOptions.value.find((i) => i.id === val)
  if (!g) return

  guardianPreview.value = g

  form.value.guardian = {
    id_number: g.id_number,
    name: g.name,
    phone: g.phone,
    occupation: g.occupation,
    social_media: g.social_media,
    address: g.address,
    email: g.email,
    guardian_role_id: form.value.guardian.guardian_role_id,
  }
})

// GUARDIAN MODE
watch(guardianMode, async (mode) => {
  // ======================
  // RESET NEW MODE
  // ======================

  if (mode === 'new') {
    selectedGuardian.value = null

    guardianPreview.value = null

    form.value.guardian = {
      id_number: '',
      name: '',
      phone: '',
      occupation: '',
      social_media: '',
      address: '',
      email: '',
      guardian_role_id: null,
    }

    return
  }

  // ======================
  // LAZY LOAD EXISTING
  // ======================

  if (mode === 'existing' && !guardiansOptions.value.length) {
    try {
      const res = await api.get('/guardians')

      guardiansOptions.value = res.data.data
    } catch (err) {
      console.error(err)
    }
  }
})

// saat program category berubah
watch(
  () => form.value.registration.program_category_id,
  () => {
    form.value.registration.payer_id = null
    form.value.registration.program_id = null
    form.value.registration.program_ids = []
  },
)

// saat clinic berubah
watch(
  () => form.value.registration.clinic_id,
  () => {
    form.value.registration.program_category_id = null
    form.value.registration.payer_id = null
    form.value.registration.program_id = null
    form.value.registration.program_ids = []
  },
)

watch(
  () => form.value.registration.payer_id,
  () => {
    form.value.registration.program_id = null
    form.value.registration.program_ids = []
  },
)

/* =========================
   API
========================= */

const fetchMaster = async () => {
  try {
    const res = await api.get('/master-data')

    guardianRoles.value = res.data.guardian_roles

    clinics.value = res.data.clinics

    programCategories.value = res.data.program_categories

    programs.value = res.data.programs

    payers.value = res.data.payers

    cities.value = res.data.cities

    schools.value = res.data.schools

    schoolClasses.value = res.data.school_classes

    schoolEducations.value = res.data.school_educations
  } catch (err) {
    console.error(err)
  }
}

/* =========================
   SUBMIT
========================= */

const submitForm = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true

  try {
    const payload = {
      child: childMode.value === 'existing' ? { id: selectedChild.value } : { ...form.value.child },

      guardian:
        guardianMode.value === 'existing'
          ? {
              id: selectedGuardian.value,
              guardian_role_id: form.value.guardian.guardian_role_id,
            }
          : { ...form.value.guardian },

      registration: { ...form.value.registration },
    }

    const res = await api.post('/registrations', payload)

    snackbarText.value = 'Registration saved successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    router.replace({
      path: '/registration-success',

      query: {
        registration_number: res.data.data.registration_number,
      },
    })
  } catch (err) {
    console.error(err)

    const message =
      err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {})[0]?.[0] ||
      'Failed to save registration'

    snackbarText.value = message
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

/* =========================
   LIFECYCLE
========================= */

onMounted(fetchMaster)
</script>

<style scoped>
.registration-page {
  padding-top: 32px;
}

.aha-logo {
  width: 120px;
  height: auto;
  object-fit: contain;
}
</style>
