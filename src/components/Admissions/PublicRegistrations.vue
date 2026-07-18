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
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.name"
                  label="Full Name"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.child.nickname" label="Nickname" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.id_number"
                  label="ID Number / KIA"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.child.birth_date"
                  type="date"
                  label="Birth Date"
                  :rules="[rules.required]"
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
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.hometown_id"
                  :items="cities"
                  item-title="name"
                  item-value="id"
                  label="Hometown"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.school_id"
                  :items="schools"
                  item-title="name"
                  item-value="id"
                  label="School"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.school_class_id"
                  :items="schoolClasses"
                  item-title="name"
                  item-value="id"
                  label="Class"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.child.school_education_id"
                  :items="schoolEducations"
                  item-title="name"
                  item-value="id"
                  label="Education"
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
                />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="form.child.address" label="Address" rows="2" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- ================= GUARDIAN ================= -->
        <v-card class="mb-8 rounded-xl" elevation="1">
          <v-card-title>Parent / Guardian</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.id_number"
                  label="ID Number / KTP"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.guardian.name" label="Name" :rules="[rules.required]" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.phone"
                  label="Phone"
                  :rules="[rules.required]"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.guardian.occupation" label="Occupation" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field v-model="form.guardian.social_media" label="Social Media Instagram" />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.guardian.email"
                  label="Email"
                  type="email"
                  :rules="[rules.required]"
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
                <v-textarea v-model="form.guardian.address" label="Address" rows="2" />
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
              <v-col cols="12" md="6">
                <v-autocomplete
                  v-model="form.registration.clinic_id"
                  :items="clinics"
                  item-title="name"
                  item-value="id"
                  label="AHA! School"
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

                <div v-if="recommendedProgramCategory" class="text-caption text-grey mt-1">
                  Child age
                  <strong>{{ age }}</strong>
                  is suitable for
                  <strong>{{ recommendedProgramCategory }}</strong>
                  .
                </div>
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
                  multiple
                  chips
                  :disabled="
                    !form.registration.clinic_id ||
                    !form.registration.program_category_id ||
                    !form.registration.payer_id
                  "
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

              <v-select
                v-model="form.registration.program_duration_months"
                label="Learning Period"
                :items="[
                  { title: '6 Months', value: 6 },
                  { title: '12 Months', value: 12 },
                ]"
                item-title="title"
                item-value="value"
                variant="outlined"
              />
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

// OPTIONS
const guardianRoles = ref([])
const programs = ref([])
const payers = ref([])
const cities = ref([])
const schools = ref([])
const schoolClasses = ref([])
const schoolEducations = ref([])
const programCategories = ref([])
const clinics = ref([])

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
    occupation: '',
    social_media: '',
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
    program_duration_months: 6,
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

const recommendedProgramCategory = computed(() => {
  if (!form.value.child.birth_date) return ''

  const birth = new Date(form.value.child.birth_date)
  if (isNaN(birth.getTime())) return ''

  const today = new Date()

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--
    months += 12
  }

  const totalMonths = years * 12 + months

  if (totalMonths >= 18 && totalMonths <= 35) {
    return 'Toddler'
  }

  if (totalMonths >= 36 && totalMonths <= 72) {
    return 'Kinder'
  }

  return ''
})

/* =========================
   RULES
========================= */

const rules = {
  required: (v) => !!v || 'Field is required',
}

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
      child: {
        ...form.value.child,
      },

      guardian: {
        ...form.value.guardian,
      },

      registration: {
        ...form.value.registration,
      },
    }

    const res = await api.post('/public-registrations', payload)

    snackbarText.value = 'Registration saved successfully'
    snackbarColor.value = 'success'
    snackbar.value = true

    router.replace({
      path: '/public-registration-success',

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

// watcher
watch(
  () => form.value.registration.program_category_id,
  () => {
    form.value.registration.payer_id = null
    form.value.registration.program_id = null
    form.value.registration.program_ids = []
  },
)

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
   LIFECYCLE
========================= */

onMounted(fetchMaster)
</script>

<style scoped>
.aha-logo {
  width: 120px;
  height: auto;
  object-fit: contain;
}

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
