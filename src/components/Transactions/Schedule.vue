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

          <p class="text-body-2 text-grey">Manage school learning schedules.</p>
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
        <v-card-title>School Schedule</v-card-title>

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

            <v-col cols="12" md="2">
              <v-btn color="primary" block @click="applyAvailabilityFilter">Apply</v-btn>
            </v-col>
          </v-row>
        </v-card-text>

        <v-progress-linear v-if="availabilityLoading" indeterminate color="primary" />

        <v-card-text class="pa-0">
          <div class="schedule-wrapper">
            <!-- HEADER -->
            <table class="schedule-grid schedule-header">
              <thead>
                <tr>
                  <th rowspan="2" class="date-column">Date</th>

                  <th colspan="3">Toddler</th>

                  <th colspan="3">Kinder</th>
                </tr>

                <tr>
                  <th>08:00 - 09:30</th>

                  <th>10:30 - 12:00</th>

                  <th>15:00 - 16:30</th>

                  <th>08:00 - 10:00</th>

                  <th>10:30 - 12:30</th>

                  <th>15:00 - 17:00</th>
                </tr>
              </thead>
            </table>

            <!-- BODY -->
            <div class="availability-grid-wrapper">
              <table class="schedule-grid schedule-body">
                <tbody>
                  <template v-for="schedule in schedules" :key="`${schedule.date}-${schedule.day}`">
                    <!-- WEEKEND -->
                    <tr v-if="schedule.isWeekend">
                      <td class="date-column holiday-cell">
                        <div class="date-text">
                          {{ schedule.date }}
                        </div>

                        <div class="day-text">
                          {{ schedule.day }}
                        </div>
                      </td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>
                    </tr>

                    <!-- WEEKDAY -->
                    <template v-else>
                      <tr v-for="row in 10" :key="`${schedule.date}-${row}`">
                        <td v-if="row === 1" rowspan="10" class="date-column">
                          <div class="date-text">
                            {{ schedule.date }}
                          </div>

                          <div class="day-text">
                            {{ schedule.day }}
                          </div>
                        </td>

                        <!-- TODDLER -->
                        <td
                          :class="{
                            'red-cell': hasChild(schedule.toddler1, row - 1),
                            'available-cell': !hasChild(schedule.toddler1, row - 1),
                          }"
                          :title="getChild(schedule.toddler1, row - 1)"
                        >
                          {{ getChildLabel(schedule.toddler1, row - 1) }}
                        </td>

                        <td
                          :class="{
                            'red-cell': hasChild(schedule.toddler2, row - 1),
                            'available-cell': !hasChild(schedule.toddler2, row - 1),
                          }"
                          :title="getChild(schedule.toddler2, row - 1)"
                        >
                          {{ getChildLabel(schedule.toddler2, row - 1) }}
                        </td>

                        <td
                          :class="{
                            'red-cell': hasChild(schedule.toddler3, row - 1),
                            'available-cell': !hasChild(schedule.toddler3, row - 1),
                          }"
                          :title="getChild(schedule.toddler3, row - 1)"
                        >
                          {{ getChildLabel(schedule.toddler3, row - 1) }}
                        </td>

                        <!-- KINDER -->
                        <td
                          :class="{
                            'red-cell': row > 8 || hasChild(schedule.kinder1, row - 1),
                            'available-cell': row <= 8 && !hasChild(schedule.kinder1, row - 1),
                          }"
                          :title="getChild(schedule.kinder1, row - 1)"
                        >
                          {{ row <= 8 ? getChildLabel(schedule.kinder1, row - 1) : '-' }}
                        </td>

                        <td
                          :class="{
                            'red-cell': row > 8 || hasChild(schedule.kinder2, row - 1),
                            'available-cell': row <= 8 && !hasChild(schedule.kinder2, row - 1),
                          }"
                          :title="getChild(schedule.kinder2, row - 1)"
                        >
                          {{ row <= 8 ? getChildLabel(schedule.kinder2, row - 1) : '-' }}
                        </td>

                        <td
                          :class="{
                            'red-cell': row > 8 || hasChild(schedule.kinder3, row - 1),
                            'available-cell': row <= 8 && !hasChild(schedule.kinder3, row - 1),
                          }"
                          :title="getChild(schedule.kinder3, row - 1)"
                        >
                          {{ row <= 8 ? getChildLabel(schedule.kinder3, row - 1) : '-' }}
                        </td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="d-flex ga-4 pa-4 flex-wrap">
            <div>🟥 Occupied</div>

            <div>🟩 Available</div>

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
                          <v-select
                            v-model="schedule.session_time_id"
                            :items="availableTimeSlots"
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
        <v-card-title>School Sessions</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12" md="3">
              <v-select
                v-model="sessionFilters.day"
                :items="dayOptions"
                item-title="title"
                item-value="value"
                label="Day"
                clearable
              />
            </v-col>

            <v-col cols="12" md="3">
              <v-select
                v-model="sessionFilters.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Status"
                clearable
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-data-table
          :headers="headers"
          :items="filteredSessions"
          :items-per-page="20"
          density="comfortable"
        >
          <!-- DAY -->
          <template #item.day="{ item }">
            {{ formatDay(item.therapy_date) }}
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
      <v-card-title>
        {{ editingSessionId ? 'Edit Session' : 'Add Session' }}
      </v-card-title>

      <v-card-text class="pt-4">
        <v-text-field
          v-model="sessionForm.therapy_date"
          type="date"
          label="Date"
          variant="outlined"
          class="mb-2"
        />

        <v-select
          v-model="sessionForm.session_time_id"
          :items="programCategorySessionTimes"
          item-title="label"
          item-value="id"
          label="Session Time"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea v-model="sessionForm.notes" label="Notes" rows="2" variant="outlined" />
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

  <v-dialog v-model="conflictDialog" max-width="700">
    <v-card rounded="lg">
      <v-card-title class="text-h6">Session Slot Unavailable</v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          The following session slots have reached their maximum capacity. Please choose another day
          or another session time, then generate again.
        </v-alert>

        <v-table density="comfortable">
          <thead>
            <tr>
              <th style="width: 45%">Date</th>

              <th style="width: 25%">Time</th>

              <th style="width: 30%">Capacity</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in conflictSchedules" :key="index">
              <td>
                <div>{{ item.day }}</div>

                <div class="text-grey">
                  {{ formatDate(item.therapy_date) }}
                </div>
              </td>

              <td>{{ item.start_time }} - {{ item.end_time }}</td>

              <td>{{ item.occupied }} / {{ item.capacity }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider />

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
const availabilityGrid = ref([])
const conflictSchedules = ref([])
const therapySessionStatuses = ref([])
const programCategorySessionTimes = ref([])

const sessionFilters = ref({
  day: null,
  status: null,
})

const dayOptions = [
  { title: 'All Days', value: null },
  { title: 'Monday', value: 1 },
  { title: 'Tuesday', value: 2 },
  { title: 'Wednesday', value: 3 },
  { title: 'Thursday', value: 4 },
  { title: 'Friday', value: 5 },
]

const statusOptions = computed(() => [
  {
    title: 'All Status',
    value: null,
  },

  ...therapySessionStatuses.value.map((item) => ({
    title: item.name,
    value: item.id,
  })),
])

const sessionForm = ref({
  therapist_id: null,
  therapy_date: '',
  session_time_id: null,
  notes: '',
})

const getChildLabel = (list, row) => {
  const child = getChild(list, row)

  return `${row + 1}. ${getFirstName(child)}`
}

const getFirstName = (name) => {
  if (!name) return ''

  return name.split(' ')[0]
}

const hasChild = (list, row) => {
  return !!getChild(list, row)
}

const selectedSessionTime = computed(() => {
  return (
    programCategorySessionTimes.value.find(
      (item) => item.id === sessionForm.value.session_time_id,
    ) ?? null
  )
})

const programCategoryId = computed(() => {
  return registration.value?.programs?.[0]?.program_category?.id ?? null
})

const filteredSessions = computed(() => {
  let data = [...sessions.value]

  if (sessionFilters.value.day !== null) {
    data = data.filter((item) => new Date(item.therapy_date).getDay() === sessionFilters.value.day)
  }

  if (sessionFilters.value.status !== null) {
    data = data.filter((item) => item.therapy_session_status_id === sessionFilters.value.status)
  }

  return data
})

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
    session_time_id: null,
    notes: '',
  }
}

const availableTimeSlots = computed(() => {
  return programCategorySessionTimes.value
})

const goBack = () => {
  router.back()
}

const requiredRule = [(v) => !!v || 'This field is required']

const form = ref({
  start_date: '',
  notes: '',
  schedule_configs: [
    {
      day: 1,
      enabled: false,
      session_time_id: null,
    },
    {
      day: 2,
      enabled: false,
      session_time_id: null,
    },
    {
      day: 3,
      enabled: false,
      session_time_id: null,
    },
    {
      day: 4,
      enabled: false,
      session_time_id: null,
    },
    {
      day: 5,
      enabled: false,
      session_time_id: null,
    },
  ],
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
]

const headers = [
  { title: 'Day', key: 'day' },
  { title: 'Date', key: 'therapy_date' },
  { title: 'Start', key: 'start_time' },
  { title: 'End', key: 'end_time' },
  { title: 'Session Status', key: 'status' },
  { title: 'Notes', key: 'notes' },
  {
    title: '',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

const targetSessions = computed(() => {
  return (
    registration.value?.programs?.reduce((total, program) => {
      return (
        total + Number(program.session_count || 0) * Number(program.learning_period_months || 0)
      )
    }, 0) || 0
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

const fetchTherapySessionStatuses = async () => {
  const res = await api.get('/therapy-session-statuses')

  therapySessionStatuses.value = res.data.data
}

const fetchProgramCategorySessionTimes = async () => {
  if (!programCategoryId.value) return

  const res = await api.get(`/program-categories/${programCategoryId.value}/session-times`)

  programCategorySessionTimes.value = res.data.data.map((item) => ({
    ...item,
    label: `${item.session_name} (${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)})`,
  }))
}

// ======================
// FETCH REGISTRATION
// ======================

const fetchRegistration = async () => {
  try {
    const res = await api.get(`/registrations/${route.params.id}`)

    registration.value = res.data.data

    await fetchProgramCategorySessionTimes()
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
    const res = await api.get('/therapy-sessions/grid', {
      params: {
        start_date: availabilityFilter.value.start_date,
        end_date: availabilityFilter.value.end_date,
      },
    })

    availabilityGrid.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    availabilityLoading.value = false
  }
}

const getChildren = (date, category, startTime) => {
  return availabilityGrid.value
    .filter(
      (item) =>
        item.therapy_date === date &&
        item.program_category === category &&
        item.start_time === startTime,
    )
    .map((item) => item.child_name)
}

const getChild = (list, row) => {
  return list[row] ?? null
}

const schedules = computed(() => {
  const dates = [...new Set(availabilityGrid.value.map((item) => item.therapy_date))].sort()

  return dates.map((date) => {
    const jsDate = new Date(date)

    const day = jsDate.toLocaleDateString('en-US', {
      weekday: 'long',
    })

    const formattedDate = jsDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const isWeekend = availabilityGrid.value.some(
      (item) => item.therapy_date === date && item.program_category === 'HOLIDAY',
    )

    return {
      day,
      date: formattedDate,
      isWeekend,

      toddler1: getChildren(date, 'TODDLER', '08:00'),
      toddler2: getChildren(date, 'TODDLER', '10:30'),
      toddler3: getChildren(date, 'TODDLER', '15:00'),

      kinder1: getChildren(date, 'KINDER', '08:00'),
      kinder2: getChildren(date, 'KINDER', '10:30'),
      kinder3: getChildren(date, 'KINDER', '15:00'),
    }
  })
})

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

const formatDay = (date) => {
  return new Date(date).toLocaleDateString('en-EN', {
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
    if (!schedule.session_time_id) {
      snackbarText.value = `Please select session time for ${
        weekDays.find((d) => d.day === schedule.day)?.label
      }.`
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

      schedule_configs: enabledSchedules.map((schedule) => ({
        day: schedule.day,
        session_time_id: schedule.session_time_id,
      })),
    })

    snackbarText.value = 'Sessions generated successfully'

    snackbarColor.value = 'success'
    snackbar.value = true

    // reset form
    form.value.start_date = ''
    form.value.notes = ''
    form.value.schedule_configs.forEach((schedule) => {
      schedule.enabled = false
      schedule.session_time_id = null
    })

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
    if (!selectedSessionTime.value) {
      snackbarText.value = 'Please select session time.'

      snackbarColor.value = 'warning'

      snackbar.value = true

      return
    }

    const payload = {
      registration_id: route.params.id,

      therapist_id: null,

      therapy_date: sessionForm.value.therapy_date,

      start_time: selectedSessionTime.value.start_time,

      end_time: selectedSessionTime.value.end_time,

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
      session_time_id: null,
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

  const selectedSessionTime = programCategorySessionTimes.value.find(
    (slot) =>
      slot.start_time.startsWith(item.start_time.substring(0, 5)) &&
      slot.end_time.startsWith(item.end_time.substring(0, 5)),
  )

  sessionForm.value = {
    therapist_id: null,

    therapy_date: item.therapy_date,

    session_time_id: selectedSessionTime?.id ?? null,

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

  await fetchRegistration()

  await fetchProgramCategorySessionTimes()

  await Promise.all([fetchSessions(), fetchTherapySessionStatuses()])
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-wrapper {
  width: 100%;
}

.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.schedule-grid th,
.schedule-grid td {
  border: 1px solid #d6d6d6;
  padding: 4px 8px;
  font-size: 14px;
}

.schedule-header {
  margin-bottom: -1px;
}

.schedule-header th {
  background: #ffe8cc;
  text-align: center;
  font-weight: 600;
}

.schedule-body td {
  vertical-align: top;
}

.date-column {
  width: 170px;
}

.date-text {
  font-weight: 600;
}

.day-text {
  margin-top: 2px;
  font-size: 12px;
  color: #757575;
}

.schedule-grid th:not(.date-column),
.schedule-grid td:not(.date-column) {
  width: calc((100% - 170px) / 6);
}

.availability-grid-wrapper {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

.red-cell {
  background: #ffebee;
}

.available-cell {
  background: #e8f5e9;
}

.holiday-cell {
  background: #e3f2fd;
  color: #1565c0;
}
</style>
