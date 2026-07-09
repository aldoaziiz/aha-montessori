<template>
  <div class="schedule-content">
    <template v-if="loading">
      <v-skeleton-loader type="heading" class="mb-4" />

      <v-skeleton-loader type="article" class="mb-4" />

      <v-skeleton-loader type="article" class="mb-4" />

      <v-skeleton-loader type="table" />
    </template>

    <template v-else>
      <!-- HEADER -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">Schedule</h1>

          <p class="text-body-2 text-grey">Manage therapy schedules.</p>
        </div>

        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
      </div>

      <!-- Registration Information -->
      <v-card elevation="1" class="mb-4 rounded-lg">
        <v-card-title>Registration Information</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Registration No.</div>
              <div class="font-weight-medium">
                {{ registration.registration_number || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Registration Date</div>
              <div class="font-weight-medium">
                {{ formatDate(registration.created_at) || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Child Name</div>
              <div class="font-weight-medium">
                {{ registration.child?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Child Birth Date</div>
              <div class="font-weight-medium">
                {{ formatDate(registration.child?.birth_date) || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Problem</div>
              <div class="font-weight-medium">
                {{ registration.complaint || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Payer</div>
              <div class="font-weight-medium">
                {{ registration.payer?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Program</div>
              <div v-for="program in registration.programs || []" :key="program.id">
                • {{ program.name }}
              </div>
            </v-col>

            <v-divider></v-divider>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Guardians</div>
              <div v-for="g in registration.child?.guardians || []" :key="g.id" class="mb-2">
                <div class="font-weight-medium">
                  {{ g.name }}
                </div>
                <div class="text-caption text-blue">
                  {{ g.guardian_role.name }}
                </div>
                <div class="text-caption text-grey">
                  {{ g.phone }}
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- AVAILABILITY GRID -->
      <!-- WEEKLY AVAILABILITY GRID -->

      <v-divider />
      <v-card elevation="1" class="mb-4 rounded-lg">
        <v-card-title>Therapist Availability</v-card-title>

        <v-divider />

        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="availabilityFilter.start_date"
                type="date"
                label="Start Date"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="3">
              <v-text-field
                v-model="availabilityFilter.end_date"
                type="date"
                label="End Date"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="availabilityFilter.therapist_id"
                :items="therapists"
                item-title="name"
                item-value="id"
                label="Therapist"
                density="compact"
                clearable
              />
            </v-col>

            <v-col cols="12" md="2">
              <v-btn color="primary" block @click="applyAvailabilityFilter">Apply</v-btn>
            </v-col>
          </v-row>
        </v-card-text>

        <v-progress-linear v-if="availabilityLoading" indeterminate color="primary" />

        <v-card-text class="pa-0">
          <div class="availability-grid-wrapper">
            <table class="availability-grid">
              <thead>
                <tr>
                  <th>Therapist</th>
                  <th v-for="day in weekDates" :key="day.key">
                    {{ day.label }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <template v-for="therapist in therapistsGrid" :key="therapist.name">
                  <tr v-for="hour in availabilityHours" :key="therapist.name + hour">
                    <td
                      v-if="hour === '08'"
                      :rowspan="availabilityHours.length"
                      class="therapist-name"
                    >
                      {{ therapist.name }}
                    </td>

                    <td
                      v-for="day in weekDates"
                      :key="day.date + hour"
                      :style="{
                        background: getCellColor(therapist, day, hour),
                      }"
                    >
                      <template v-if="getSessionInfo(therapist.id, day, hour)">
                        <v-tooltip location="top">
                          <template #activator="{ props }">
                            <span v-bind="props" class="slot-content">
                              <span class="slot-hour">
                                {{ hour }}
                              </span>

                              <span class="slot-child">
                                {{
                                  getSessionInfo(
                                    therapist.id,
                                    day,
                                    hour,
                                  ).registration.child.name.split(' ')[0]
                                }}
                              </span>
                            </span>
                          </template>

                          {{ getSessionInfo(therapist.id, day, hour).registration.child.name }}
                        </v-tooltip>
                      </template>

                      <template v-else>
                        <span class="slot-hour">
                          {{ hour }}
                        </span>
                      </template>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>

          <div class="d-flex ga-4 pa-4 flex-wrap">
            <div>🟥 Occupied</div>

            <div>🟩 Available</div>

            <div>🟨 Break</div>

            <div>🟦 Weekend</div>
          </div>
        </v-card-text>
      </v-card>

      <!-- FORM -->
      <v-card elevation="1" class="mb-4 rounded-lg">
        <v-card-title>Generate Sessions</v-card-title>
        <v-divider></v-divider>

        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <!-- DATE -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.start_date"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  :rules="requiredRule"
                />
              </v-col>
              <v-divider></v-divider>

              <!-- weekly schedule -->
              <v-col cols="12">
                <div class="overflow-x-auto">
                  <v-table density="comfortable" class="schedule-table">
                    <thead>
                      <tr>
                        <th style="width: 10%">Day</th>
                        <th style="width: 10%">Enable</th>
                        <th style="width: 40%">Therapist</th>
                        <th style="width: 30%">Session Time</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="schedule in form.schedule_configs" :key="schedule.day">
                        <td>
                          {{ weekDays.find((d) => d.day === schedule.day)?.label }}
                        </td>

                        <td class="text-center">
                          <v-checkbox v-model="schedule.enabled" hide-details />
                        </td>

                        <td>
                          <v-autocomplete
                            v-model="schedule.therapist_id"
                            :items="therapists"
                            item-title="name"
                            item-value="id"
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            :disabled="!schedule.enabled"
                          />
                        </td>

                        <td>
                          <v-select
                            v-model="schedule.time_slot"
                            :items="timeSlots"
                            item-title="label"
                            item-value="id"
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            :disabled="!schedule.enabled"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-col>

              <!-- NOTES -->
              <v-col cols="12">
                <v-textarea v-model="form.notes" label="Notes" variant="outlined" rows="3" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            @click="saveSchedule"
            color="primary"
            variant="elevated"
            :loading="saving"
            :disabled="saving"
          >
            Generate Sessions
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- SUMMARY -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-card :color="targetCardColor">
            <v-card-text>
              <div class="text-caption">Target Sessions</div>

              <div class="text-h5 font-weight-bold">
                {{ targetSessions }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card :color="generatedCardColor">
            <v-card-text>
              <div class="text-caption">Generated</div>

              <div class="text-h5 font-weight-bold">
                {{ generatedSessions }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card :color="remainingCardColor">
            <v-card-text>
              <div class="text-caption">Remaining</div>

              <div class="text-h5 font-weight-bold">
                {{ remainingSessions }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- SESSION HISTORY -->

      <v-row class="mb-4">
        <v-btn @click="sessionDialog = true" color="primary" prepend-icon="mdi-plus">
          Add Session
        </v-btn>
      </v-row>

      <v-card elevation="1" class="rounded-lg">
        <v-card-title>Therapy Sessions</v-card-title>
        <v-divider></v-divider>

        <v-data-table
          :headers="headers"
          :items="sessions"
          :items-per-page="20"
          density="comfortable"
        >
          <!-- THERAPIST -->
          <template v-slot:item.therapist="{ item }">
            {{ item.therapist?.name || '-' }}
          </template>

          <!-- START -->
          <template v-slot:item.start_time="{ item }">
            {{ item.start_time?.slice(0, 5) }}
          </template>

          <!-- END -->
          <template v-slot:item.end_time="{ item }">
            {{ item.end_time?.slice(0, 5) }}
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
                <v-btn variant="tonal" size="small" v-bind="props">
                  Action

                  <v-icon end>mdi-chevron-down</v-icon>
                </v-btn>
              </template>

              <v-list>
                <v-list-item :disabled="!!item.activity" @click="openEditSession(item)">
                  <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="item.therapy_session_status?.id === 1" @click="markAlpha(item)">
                  <v-list-item-title>Mark as Alpha</v-list-item-title>
                </v-list-item>
                <v-list-item :disabled="!!item.activity" @click="deleteSession(item)">
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" timeout="3000">
        {{ snackbarText }}
      </v-snackbar>
    </template>
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

  <v-dialog v-model="conflictDialog" max-width="800">
    <v-card>
      <v-card-title class="text-h6">Schedule Conflicts</v-card-title>

      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          Ada konflik jadwal sesi terapi. Mohon cek kembali jadwal yang anda buat. Pastikan jadwal
          yang anda pilih tidak konflik dengan jadwal di bawah ini.
        </v-alert>

        <v-table density="comfortable">
          <thead>
            <tr>
              <th>Date</th>

              <th>Time</th>

              <th>Therapist</th>

              <th>Child</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in conflictSchedules" :key="index">
              <td>
                <div>{{ formatDay(item.therapy_date) }}</div>
                <div class="text-grey">
                  {{ formatDate(item.therapy_date) }}
                </div>
              </td>

              <td>
                {{ item.time_slot }}
              </td>

              <td>
                {{ item.therapist_name }}
              </td>

              <td>
                {{ item.child_name }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn color="primary" @click="conflictDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const registration = ref({})
const therapists = ref([])
const sessions = ref([])
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const loading = ref(true)
const saving = ref(false)
const formRef = ref(null)
const deleting = ref(false)
const availabilityDate = ref(new Date())
const availabilityLoading = ref(false)
const sessionDialog = ref(false)
const editingSessionId = ref(null)
const conflictDialog = ref(false)

const conflictSchedules = ref([])

const sessionForm = ref({
  therapist_id: null,
  therapy_date: '',
  session_time: null,
  notes: '',
})

const weekDates = computed(() => {
  const result = []

  if (!appliedAvailabilityFilter.value.start_date || !appliedAvailabilityFilter.value.end_date) {
    return result
  }

  const current = new Date(appliedAvailabilityFilter.value.start_date)

  const end = new Date(appliedAvailabilityFilter.value.end_date)

  while (current <= end) {
    result.push({
      key: current.toISOString(),

      date: current.toISOString().split('T')[0],

      label: current.toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
      }),
    })

    current.setDate(current.getDate() + 1)
  }

  return result
})

const availabilityHours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17']

const availabilityFilter = ref({
  start_date: '',
  end_date: '',
  therapist_id: null,
})

const appliedAvailabilityFilter = ref({
  start_date: '',
  end_date: '',
  therapist_id: null,
})

const closeSessionDialog = () => {
  editingSessionId.value = null

  sessionDialog.value = false

  sessionForm.value = {
    therapist_id: null,
    therapy_date: '',
    session_time: null,
    notes: '',
  }
}

const therapistsGrid = ref([])

const availabilitySessions = ref([])

const daysOfWeek = [
  {
    label: 'Monday',
    value: 1,
  },
  {
    label: 'Tuesday',
    value: 2,
  },
  {
    label: 'Wednesday',
    value: 3,
  },
  {
    label: 'Thursday',
    value: 4,
  },
  {
    label: 'Friday',
    value: 5,
  },
  {
    label: 'Saturday',
    value: 6,
  },
  {
    label: 'Sunday',
    value: 0,
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

const getCellKey = (day, hour) => {
  return `${day.substring(0, 3)}-${hour}`
}

const getCellColor = (therapist, day, hour) => {
  if (hour === '12') {
    return '#fff3cd'
  }

  const weekday = new Date(day.date).getDay()

  if (weekday === 0 || weekday === 6) {
    return '#9fc5e8'
  }

  const session = getSessionInfo(therapist.id, day, hour)

  if (session) {
    return '#f4cccc'
  }

  return '#d9ead3'
}

const goBack = () => {
  router.back()
}

const requiredRule = [(v) => !!v || 'This field is required']

const form = ref({
  start_date: '',

  schedule_configs: [
    {
      day: 1,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
    {
      day: 2,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
    {
      day: 3,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
    {
      day: 4,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
    {
      day: 5,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
    {
      day: 6,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
    {
      day: 0,
      enabled: false,
      therapist_id: null,
      time_slot: null,
    },
  ],

  therapy_date: '',
  start_time: '',
  end_time: '',
  notes: '',
})

const weekDays = [
  {
    day: 1,
    label: 'Monday',
  },
  {
    day: 2,
    label: 'Tuesday',
  },
  {
    day: 3,
    label: 'Wednesday',
  },
  {
    day: 4,
    label: 'Thursday',
  },
  {
    day: 5,
    label: 'Friday',
  },
  {
    day: 6,
    label: 'Saturday',
  },
  {
    day: 0,
    label: 'Sunday',
  },
]

const headers = [
  { title: 'Date', key: 'therapy_date' },
  { title: 'Start', key: 'start_time' },
  { title: 'End', key: 'end_time' },
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

const getSessionInfo = (therapistId, day, hour) => {
  return availabilitySessions.value.find((session) => {
    const therapistMatch = session.therapist_id === therapistId

    const dateMatch = session.therapy_date === day.date

    const hourMatch = session.start_time.startsWith(hour)

    return therapistMatch && dateMatch && hourMatch
  })
}

const targetSessions = computed(() => {
  return (
    registration.value?.programs?.reduce(
      (total, program) => total + Number(program.session_count || 0),
      0,
    ) || 0
  )
})

const generatedSessions = computed(() => {
  return sessions.value.length
})

const remainingSessions = computed(() => {
  return targetSessions.value - generatedSessions.value
})

const targetCardColor = computed(() => {
  return '#64AF64'
})

const generatedCardColor = computed(() => {
  if (generatedSessions.value > targetSessions.value) {
    return '#E6611D'
  }

  if (generatedSessions.value < targetSessions.value) {
    return '#FFD039'
  }

  if (generatedSessions.value === targetSessions.value) {
    return '#64AF64'
  }

  return ''
})

const remainingCardColor = computed(() => {
  if (remainingSessions.value > 0) {
    return '#FFD039'
  }

  if (remainingSessions.value < 0) {
    return '#E6611D'
  }

  return '#64AF64'
})

// ======================
// FETCH REGISTRATION
// ======================

const fetchRegistration = async () => {
  try {
    const res = await api.get(`/registrations/${route.params.id}`)

    registration.value = res.data.data
  } catch (err) {
    console.error(err)
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
// FETCH SESSIONS
// ======================

const fetchSessions = async () => {
  try {
    const res = await api.get('/therapy-sessions', {
      params: {
        registration_id: route.params.id,
        per_page: 999,
      },
    })

    sessions.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

const fetchAvailability = async () => {
  availabilityLoading.value = true

  try {
    const res = await api.get('/therapy-sessions/availability', {
      params: {
        start_date: availabilityFilter.value.start_date,
        end_date: availabilityFilter.value.end_date,
        therapist_id: availabilityFilter.value.therapist_id,
      },
    })

    therapistsGrid.value = res.data.therapists

    availabilitySessions.value = res.data.sessions
  } catch (err) {
    console.error(err)
  } finally {
    availabilityLoading.value = false
  }
}

// FORMAT DATE
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-ID', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const applyAvailabilityFilter = async () => {
  const start = new Date(availabilityFilter.value.start_date)

  const end = new Date(availabilityFilter.value.end_date)

  const diff = (end - start) / (1000 * 60 * 60 * 24)

  if (diff > 6) {
    snackbarText.value = 'Maximum range is 7 days'

    snackbarColor.value = 'error'

    snackbar.value = true

    return
  }
  appliedAvailabilityFilter.value = {
    ...availabilityFilter.value,
  }
  await fetchAvailability()
}

const previousAvailabilityDay = () => {
  const d = new Date(availabilityDate.value)

  d.setDate(d.getDate() - 1)

  availabilityDate.value = d
}

const nextAvailabilityDay = () => {
  const d = new Date(availabilityDate.value)

  d.setDate(d.getDate() + 1)

  availabilityDate.value = d
}

const formatAvailabilityDate = () => {
  return availabilityDate.value.toLocaleDateString('en-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getAvailabilityColor = (status) => {
  if (status === 'available') return 'success'

  if (status === 'occupied') return 'error'

  return 'grey'
}

const getAvailabilityLabel = (status) => {
  if (status === 'available') return 'A'

  if (status === 'occupied') return 'O'

  return 'B'
}

const formatDay = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
  })
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
// SAVE
// ======================

const saveSchedule = async () => {
  const { valid } = await formRef.value.validate()

  if (!valid) return

  const enabledSchedules = form.value.schedule_configs.filter((schedule) => schedule.enabled)

  if (!enabledSchedules.length) {
    snackbarText.value = 'Please select at least one day.'

    snackbarColor.value = 'warning'

    snackbar.value = true

    return
  }

  for (const schedule of enabledSchedules) {
    if (!schedule.therapist_id) {
      snackbarText.value = `Please select therapist for ${weekDays.find((d) => d.day === schedule.day)?.label}.`

      snackbarColor.value = 'warning'

      snackbar.value = true

      return
    }

    if (!schedule.time_slot) {
      snackbarText.value = `Please select session time for ${weekDays.find((d) => d.day === schedule.day)?.label}.`

      snackbarColor.value = 'warning'

      snackbar.value = true

      return
    }
  }

  try {
    saving.value = true
    await api.post('/therapy-sessions/generate', {
      registration_id: route.params.id,
      start_date: form.value.start_date,
      notes: form.value.notes,

      schedule_configs: form.value.schedule_configs
        .filter((schedule) => schedule.enabled)
        .map((schedule) => ({
          day: schedule.day,
          therapist_id: schedule.therapist_id,
          time_slot: schedule.time_slot,
        })),
    })

    snackbarText.value = 'Sessions generated successfully'

    snackbarColor.value = 'success'
    snackbar.value = true

    form.value = {
      therapist_id: null,

      days: [],

      start_date: '',

      time_slot: null,

      therapy_date: '',

      start_time: '',
      end_time: '',

      notes: '',
    }

    await fetchSessions()
  } catch (err) {
    // ======================
    // CONFLICTS
    // ======================

    if (err.response?.data?.conflicts) {
      conflictSchedules.value = err.response.data.conflicts

      conflictDialog.value = true

      return
    }

    // ======================
    // OTHER ERRORS
    // ======================

    snackbarText.value = err.response?.data?.message || 'Failed to generate sessions'

    snackbarColor.value = 'error'

    snackbar.value = true
  } finally {
    saving.value = false
  }
}

const saveSession = async () => {
  try {
    const selectedSlot = timeSlots.find((slot) => slot.label === sessionForm.value.session_time)

    const payload = {
      registration_id: route.params.id,

      therapist_id: sessionForm.value.therapist_id,

      therapy_date: sessionForm.value.therapy_date,

      start_time: selectedSlot.start,

      end_time: selectedSlot.end,

      notes: sessionForm.value.notes,
    }

    if (editingSessionId.value) {
      await api.put(`/therapy-sessions/${editingSessionId.value}`, payload)
    } else {
      await api.post('/therapy-sessions', payload)
    }

    snackbarText.value = editingSessionId.value
      ? 'Session updated successfully'
      : 'Session created successfully'

    snackbarColor.value = 'success'

    snackbar.value = true

    sessionForm.value = {
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

const openEditSession = (item) => {
  editingSessionId.value = item.id

  const selectedSlot = timeSlots.find(
    (slot) => slot.start === item.start_time.slice(0, 5) && slot.end === item.end_time.slice(0, 5),
  )

  sessionForm.value = {
    therapist_id: item.therapist_id,

    therapy_date: item.therapy_date,

    session_time: selectedSlot?.label ?? null,

    notes: item.notes ?? '',
  }

  sessionDialog.value = true
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
    snackbarText.value = err.response?.data?.message || 'Failed to delete session'

    snackbarColor.value = 'error'

    snackbar.value = true
  } finally {
    deleting.value = false
  }
}

watch(
  () => form.value.schedule_configs,
  (configs) => {
    ;(configs ?? []).forEach((schedule) => {
      if (!schedule.enabled) {
        schedule.therapist_id = null
        schedule.time_slot = null
      }
    })
  },
  {
    deep: true,
  },
)

// ======================
// INIT
// ======================

onMounted(async () => {
  loading.value = true

  await Promise.all([fetchRegistration(), fetchTherapists(), fetchSessions()])
  const today = new Date()

  const endDate = new Date()

  endDate.setDate(today.getDate() + 6)

  availabilityFilter.value = {
    start_date: today.toISOString().split('T')[0],

    end_date: endDate.toISOString().split('T')[0],

    therapist_id: null,
  }

  loading.value = false
})
</script>

<style scoped>
.schedule-content {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.availability-grid {
  border-collapse: collapse;
  table-layout: auto;
}

.availability-grid thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f5f5f5;
  border: 1px solid #ddd;
  padding: 4px;
  font-size: 12px;
}

.availability-grid td {
  border: 1px solid #ddd;
  padding: 4px;
  font-size: 12px;
}

.therapist-name {
  vertical-align: top;
  text-align: left;

  white-space: nowrap;

  width: 1%;

  padding-top: 8px;

  font-weight: 600;
}

.slot-content {
  display: flex;
  align-items: center;
  gap: 8px;

  justify-content: flex-start;
}

.slot-hour {
  width: 24px;
  flex-shrink: 0;
  font-weight: 600;
}

.slot-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.availability-grid-wrapper {
  overflow: auto;
  max-height: 600px;
}

.overflow-x-auto {
  overflow-x: auto;
}

.schedule-table {
  min-width: 900px;
}

.schedule-table td,
.schedule-table th {
  vertical-align: middle;
}

.schedule-table td {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
</style>
