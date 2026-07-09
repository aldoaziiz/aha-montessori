<template>
  <div class="therapy-sessions-page">
    <!-- PAGE HEADER -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Therapy Sessions</h1>

        <div class="text-body-2 text-grey">Therapy operational schedules</div>
      </div>
    </div>

    <!-- FILTER CARD -->
    <v-card elevation="1" class="mb-4 rounded-lg">
      <v-card-text>
        <v-row>
          <!-- SEARCH -->
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Search Child"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>

          <!-- DATE -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.date"
              label="Date"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <!-- THERAPIST -->
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.therapist_id"
              :items="therapists"
              item-title="name"
              item-value="id"
              label="Therapist"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>

          <!-- RESET -->
          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn
              block
              variant="tonal"
              :loading="resettingFilters"
              :disabled="resettingFilters || loading"
              @click="resetFilters"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- TABLE -->
    <v-card elevation="1" class="rounded-lg">
      <v-data-table-server
        :headers="headers"
        :items="sessions"
        :items-length="totalItems"
        :loading="loading"
        :page="page"
        :items-per-page="itemsPerPage"
        loading-text="Loading therapy sessions..."
        @update:options="onOptionsChange"
      >
        <template v-slot:item.registration_number="{ item }">
          <div>
            <div>
              {{ item.registration?.registration_number || '-' }}
            </div>
          </div>
        </template>

        <template v-slot:item.child="{ item }">
          <div>
            <div>
              {{ item.registration?.child?.name || '-' }}
            </div>
          </div>
        </template>

        <template v-slot:item.therapy_date="{ item }">
          {{ formatDate(item.therapy_date) }}
        </template>

        <template v-slot:item.time="{ item }">
          {{ item.start_time?.slice(0, 5) }}
          -
          {{ item.end_time?.slice(0, 5) }}
        </template>

        <template v-slot:item.therapist="{ item }">
          <div>
            {{ item.therapist?.name || '-' }}
          </div>
        </template>

        <!-- STATUS -->
        <template #item.status="{ item }">
          <v-chip
            size="small"
            :color="getStatusColor(item.therapy_session_status?.name)"
            variant="tonal"
          >
            {{ item.therapy_session_status?.name }}
          </v-chip>
        </template>

        <!-- ACTION -->
        <template v-slot:item.actions="{ item }">
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" size="small" color="white">
                Action
                <v-icon right>mdi-chevron-down</v-icon>
              </v-btn>
            </template>

            <v-list density="compact">
              <v-list-item @click="viewRegistration(item)">
                <v-list-item-title>View Schedule</v-list-item-title>
              </v-list-item>

              <v-list-item :disabled="!!item.activity" @click="openEditSession(item)">
                <v-list-item-title>Edit</v-list-item-title>
              </v-list-item>

              <v-list-item v-if="item.therapy_session_status?.id === 1" @click="markAlpha(item)">
                <v-list-item-title>Mark as Alpha</v-list-item-title>
              </v-list-item>

              <v-list-item
                v-if="!item.activity && item.therapy_date < new Date().toISOString().split('T')[0]"
                @click="allowLateActivity(item)"
              >
                <v-list-item-title>Allow Late Activity</v-list-item-title>
              </v-list-item>

              <v-list-item @click="deleteSession(item)">
                <v-list-item-title class="text-error">Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- SNACKBAR -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>

  <v-dialog v-model="deleting" persistent width="320">
    <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />

      <div class="text-h6 font-weight-medium mt-6">Deleting Session...</div>

      <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="sessionDialog" max-width="600">
    <v-card>
      <v-card-title>Add Session</v-card-title>
      <v-card-text class="pt-4">
        <v-select
          class="mb-2"
          v-model="sessionForm.therapist_id"
          :items="therapists"
          item-title="name"
          item-value="id"
          label="Therapist"
          variant="outlined"
        />

        <v-text-field
          class="mb-2"
          v-model="sessionForm.therapy_date"
          type="date"
          label="Date"
          variant="outlined"
        />

        <v-select
          v-model="sessionForm.session_time"
          :items="timeSlots.filter((slot) => !slot.disabled)"
          item-title="label"
          item-value="label"
          label="Session Time"
          variant="outlined"
        />

        <v-textarea
          class="mb-2"
          v-model="sessionForm.notes"
          label="Notes"
          rows="2"
          variant="outlined"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="closeSessionDialog">Cancel</v-btn>
        <v-btn color="primary" @click="saveSession">
          {{ editingSessionId ? 'Update Session' : 'Save Session' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="pageActionLoading" persistent fullscreen scrim="black">
    <div class="d-flex flex-column align-center justify-center h-100">
      <v-card rounded="xl" class="pa-8 text-center" width="320">
        <v-progress-circular indeterminate color="primary" size="56" width="5" />

        <div class="text-h6 font-weight-medium mt-6">
          {{ pageActionText }}
        </div>

        <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
      </v-card>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import api from '@/services/api'

// ======================
// ROUTER
// ======================

const router = useRouter()

// ======================
// STATE
// ======================

const initialized = ref(false)
const sessions = ref([])
const therapists = ref([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const sortBy = ref([])
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const deleting = ref(false)
const pageActionLoading = ref(false)
const resettingFilters = ref(false)
const sessionDialog = ref(false)
const editingSessionId = ref(null)

const sessionForm = ref({
  registration_id: null,
  therapist_id: null,
  therapy_date: '',
  session_time: null,
  notes: '',
})

const pageActionText = ref('Loading...')

const filters = ref({
  date: '',
  therapist_id: null,
})

// ======================
// TABLE
// ======================

const headers = [
  { title: 'Reg No.', key: 'registration_number' },
  { title: 'Child', key: 'child' },
  { title: 'Date', key: 'therapy_date' },
  { title: 'Time', key: 'time' },
  { title: 'Therapist', key: 'therapist' },
  { title: 'Session Status', key: 'status' },
  { title: 'Notes', key: 'notes' },
  {
    title: '',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

const timeSlots = [
  {
    label: '08:00 - 09:00',
    start: '08:00',
    end: '09:00',
    disabled: false,
  },
  {
    label: '09:00 - 10:00',
    start: '09:00',
    end: '10:00',
    disabled: false,
  },
  {
    label: '10:00 - 11:00',
    start: '10:00',
    end: '11:00',
    disabled: false,
  },
  {
    label: '11:00 - 12:00',
    start: '11:00',
    end: '12:00',
    disabled: false,
  },
  {
    label: '12:00 - 13:00 (Break)',
    start: '12:00',
    end: '13:00',
    disabled: true,
  },
  {
    label: '13:00 - 14:00',
    start: '13:00',
    end: '14:00',
    disabled: false,
  },
  {
    label: '14:00 - 15:00',
    start: '14:00',
    end: '15:00',
    disabled: false,
  },
  {
    label: '15:00 - 16:00',
    start: '15:00',
    end: '16:00',
    disabled: false,
  },
  {
    label: '16:00 - 17:00',
    start: '16:00',
    end: '17:00',
    disabled: false,
  },
  {
    label: '17:00 - 18:00',
    start: '17:00',
    end: '18:00',
    disabled: false,
  },
]

const closeSessionDialog = () => {
  sessionDialog.value = false

  editingSessionId.value = null

  sessionForm.value = {
    registration_id: null,
    therapist_id: null,
    therapy_date: '',
    session_time: null,
    notes: '',
  }
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'primary'

    case 'Completed':
      return 'success'

    case 'Alpha':
      return 'error'

    default:
      return 'grey'
  }
}

// ======================
// FETCH SESSIONS
// ======================

const fetchSessions = async () => {
  loading.value = true

  try {
    const res = await api.get('/therapy-sessions', {
      params: {
        page: page.value,
        per_page: itemsPerPage.value,

        search: search.value,

        therapy_date: filters.value.date,
        therapist_id: filters.value.therapist_id,
        sort_by: sortBy.value[0]?.key,
        sort_order: sortBy.value[0]?.order,
      },
    })

    sessions.value = res.data.data
    totalItems.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// ======================
// FETCH THERAPISTS
// ======================

const fetchTherapists = async () => {
  try {
    const res = await api.get('/staff', {
      params: {
        staff_role_id: 2,
        per_page: 100,
      },
    })

    therapists.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

// ======================
// PAGINATION
// ======================

const onOptionsChange = (options) => {
  // ======================
  // PREVENT INITIAL DUPLICATE
  // ======================

  if (!initialized.value) {
    initialized.value = true
  } else {
    const samePage = page.value === options.page

    const sameItems = itemsPerPage.value === options.itemsPerPage

    const sameSort = JSON.stringify(sortBy.value) === JSON.stringify(options.sortBy)

    if (samePage && sameItems && sameSort) {
      return
    }
  }

  page.value = options.page

  itemsPerPage.value = options.itemsPerPage

  sortBy.value = options.sortBy

  fetchSessions()
}

// ======================
// DEBOUNCE SEARCH
// ======================

const debouncedFetch = debounce(() => {
  page.value = 1
  fetchSessions()
}, 500)

watch(search, () => {
  if (resettingFilters.value) {
    return
  }

  debouncedFetch()
})

// ======================
// FILTER WATCH
// ======================

watch(
  filters,

  () => {
    if (resettingFilters.value) {
      return
    }

    page.value = 1

    fetchSessions()
  },

  {
    deep: true,
  },
)

onUnmounted(() => {
  debouncedFetch.cancel()
})

// ======================
// RESET FILTER
// ======================

const resetFilters = async () => {
  // ======================
  // PREVENT SPAM
  // ======================

  if (resettingFilters.value || loading.value) {
    return
  }

  resettingFilters.value = true

  try {
    search.value = ''

    filters.value = {
      date: '',

      therapist_id: null,
    }

    page.value = 1

    await fetchSessions()
  } finally {
    resettingFilters.value = false
  }
}

// ======================
// FORMAT DATE
// ======================

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ======================
// VIEW REGISTRATION
// ======================

const viewRegistration = async (item) => {
  pageActionText.value = 'Opening Schedule...'

  pageActionLoading.value = true

  try {
    await router.push(`/registrations/${item.registration_id}/schedule`)
  } finally {
    setTimeout(() => {
      pageActionLoading.value = false
    }, 300)
  }
}

// ======================
// ALLOW LATE ACTIVITY
// ======================

const allowLateActivity = async (item) => {
  if (!confirm('Allow therapist to post this activity?')) {
    return
  }

  try {
    await api.put(`/therapy-sessions/${item.id}/allow-late-activity`)

    snackbarText.value = 'Late activity allowed'

    snackbarColor.value = 'success'

    snackbar.value = true

    await fetchSessions()
  } catch (err) {
    snackbarText.value = 'Failed to allow late activity'

    snackbarColor.value = 'error'

    snackbar.value = true
  }
}

const openEditSession = (item) => {
  editingSessionId.value = item.id

  const selectedSlot = timeSlots.find(
    (slot) => slot.start === item.start_time.slice(0, 5) && slot.end === item.end_time.slice(0, 5),
  )

  sessionForm.value = {
    registration_id: item.registration_id,
    therapist_id: item.therapist_id,

    therapy_date: item.therapy_date,

    session_time: selectedSlot?.label ?? null,

    notes: item.notes ?? '',
  }

  sessionDialog.value = true
}

const saveSession = async () => {
  try {
    const selectedSlot = timeSlots.find((slot) => slot.label === sessionForm.value.session_time)

    const payload = {
      registration_id: sessionForm.value.registration_id,

      therapist_id: sessionForm.value.therapist_id,

      therapy_date: sessionForm.value.therapy_date,

      start_time: selectedSlot.start,

      end_time: selectedSlot.end,

      notes: sessionForm.value.notes,
    }

    await api.put(`/therapy-sessions/${editingSessionId.value}`, payload)

    snackbarText.value = 'Session updated successfully'

    snackbarColor.value = 'success'

    snackbar.value = true

    sessionForm.value = {
      registration_id: null,
      therapist_id: null,
      therapy_date: '',
      session_time: null,
      notes: '',
    }

    editingSessionId.value = null
    sessionDialog.value = false

    await fetchSessions()
  } catch (err) {
    snackbarText.value = err.response?.data?.message || 'Failed to create session'

    snackbarColor.value = 'error'

    snackbar.value = true
  }
}

const markAlpha = async (session) => {
  if (!confirm('Mark this session as Alpha?')) {
    return
  }

  try {
    await api.patch(`/therapy-sessions/${session.id}/mark-alpha`)

    await fetchSessions()

    snackbarText.value = 'Session marked as Alpha.'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (error) {
    snackbarText.value = error.response?.data?.message ?? 'Failed to mark session as Alpha.'

    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

// ======================
// DELETE SESSION
// ======================

const deleteSession = async (item) => {
  if (!confirm('Delete this session?')) {
    return
  }

  deleting.value = true

  try {
    await api.delete(`/therapy-sessions/${item.id}`)

    snackbarText.value = 'Session deleted'

    snackbarColor.value = 'success'

    snackbar.value = true

    await fetchSessions()
  } catch (err) {
    snackbarText.value = 'Failed to delete session'

    snackbarColor.value = 'error'

    snackbar.value = true
  } finally {
    deleting.value = false
  }
}

// ======================
// INIT
// ======================

onMounted(async () => {
  await fetchTherapists()
})
</script>

<style scoped>
.therapy-sessions-page {
  width: 100%;
}
</style>
