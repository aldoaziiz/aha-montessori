<template>
  <div class="school-schedule-page">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2">School Schedule</h1>
      <p class="text-body-2 text-medium-emphasis">
        Select your child and the scheduling period.
      </p>
    </div>

    <v-card elevation="1" class="rounded-xl">
      <v-card-title class="px-5 pt-5">Schedule Information</v-card-title>

      <v-card-text class="pa-5">
        <div v-if="loading" class="d-flex flex-column align-center py-10 ga-3">
          <v-progress-circular indeterminate color="primary" size="44" />
          <div class="text-body-2 text-medium-emphasis">Loading registrations...</div>
        </div>

        <v-alert v-else-if="loadError" type="error" variant="tonal">
          {{ loadError }}
        </v-alert>

        <v-alert v-else-if="registrations.length === 0" type="info" variant="tonal">
          No registration is connected to this guardian account.
        </v-alert>

        <template v-else>
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="selectedRegistrationId"
                :items="registrations"
                :item-title="registrationTitle"
                item-value="id"
                label="Child"
                variant="outlined"
                hide-details
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #title>
                      <span class="font-weight-medium">
                        {{ registrationItem(item)?.child?.name || '-' }}
                      </span>
                    </template>
                    <template #subtitle>
                      {{ registrationItem(item)?.registration_number || '-' }}
                    </template>
                    <template #append>
                      <v-chip
                        :color="registrationStatusColor(registrationItem(item)?.registration_status)"
                        variant="tonal"
                        size="x-small"
                      >
                        {{ registrationItem(item)?.registration_status_label || '-' }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>

                <template #selection="{ item }">
                  <div class="registration-selection">
                    <div class="registration-selection__text">
                      <div class="font-weight-medium text-truncate">
                        {{ registrationItem(item)?.child?.name || '-' }}
                      </div>
                      <div class="text-caption text-medium-emphasis text-truncate">
                        {{ registrationItem(item)?.registration_number || '-' }}
                      </div>
                    </div>
                    <v-chip
                      :color="registrationStatusColor(registrationItem(item)?.registration_status)"
                      variant="tonal"
                      size="x-small"
                    >
                      {{ registrationItem(item)?.registration_status_label || '-' }}
                    </v-chip>
                  </div>
                </template>
              </v-select>
            </v-col>

            <v-col cols="6">
              <v-select
                v-model="selectedYear"
                :items="availableYears"
                label="Year"
                variant="outlined"
                hide-details
                :disabled="availableYears.length === 0"
              />
            </v-col>

            <v-col cols="6">
              <v-select
                v-model="selectedMonth"
                :items="availableMonths"
                item-title="title"
                item-value="value"
                label="Month"
                variant="outlined"
                hide-details
                :disabled="availableMonths.length === 0"
              />
            </v-col>
          </v-row>

          <div v-if="selectedRegistration" class="registration-meta mt-5">
            <div>
              <span class="text-medium-emphasis">Program category:</span>
              {{ selectedRegistration.program_category?.name || '-' }}
            </div>
            <div>
              <span class="text-medium-emphasis">Session validity:</span>
              {{ formatLongDate(selectedRegistration.session_started_at) }}
              to
              {{ formatLongDate(selectedRegistration.session_expired_at) }}
            </div>
          </div>

          <v-alert
            v-if="registrationMessage"
            :type="registrationMessageType"
            variant="tonal"
            class="mt-4"
          >
            {{ registrationMessage }}
          </v-alert>

          <v-row v-if="selectedSummary" class="mt-2">
            <v-col cols="4">
              <v-card color="#F5F5F5" class="summary-card text-grey-darken-4" flat>
                <v-card-text>
                  <div class="summary-card__label">Total Session</div>
                  <div class="text-h5 font-weight-bold">
                    {{ selectedSummary.total_session }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="4">
              <v-card color="#E8F5E9" class="summary-card text-grey-darken-4" flat>
                <v-card-text>
                  <div class="summary-card__label">Used Session</div>
                  <div class="text-h5 font-weight-bold">
                    {{ selectedSummary.used_session }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="4">
              <v-card
                :color="remainingSessionState.color"
                class="summary-card text-grey-darken-4"
                flat
              >
                <v-card-text>
                  <div class="summary-card__label">Remaining Session</div>
                  <div class="text-h5 font-weight-bold">
                    {{ selectedSummary.remaining_session }}
                  </div>
                  <div v-if="remainingSessionState.label" class="summary-card__state">
                    {{ remainingSessionState.label }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-card-text>
    </v-card>

    <v-card v-if="selectedRegistration" elevation="1" class="rounded-xl mt-5">
      <v-card-title class="px-5 pt-5">Choose Schedule</v-card-title>
      <v-card-subtitle class="px-5">
        Select one or more available dates, then choose a session for each date.
      </v-card-subtitle>

      <v-card-text class="pa-5">
        <div v-if="calendarLoading" class="d-flex flex-column align-center py-10 ga-3">
          <v-progress-circular indeterminate color="primary" size="44" />
          <div class="text-body-2 text-medium-emphasis">Loading session availability...</div>
        </div>

        <v-alert v-else-if="calendarError" type="error" variant="tonal">
          {{ calendarError }}
        </v-alert>

        <v-alert
          v-else-if="calendarData?.is_submitted"
          type="success"
          variant="tonal"
          title="Schedule Submitted"
        >
          <div>
            The schedule for {{ selectedMonthName }} {{ selectedYear }} has been saved and locked.
            Contact the admin if any changes are needed.
          </div>
          <div v-if="calendarData.submission" class="text-caption mt-2">
            {{ calendarData.submission.session_count }} sessions submitted on
            {{ formatDateTime(calendarData.submission.submitted_at) }}.
          </div>
        </v-alert>

        <v-alert
          v-else-if="calendarData && !calendarData.can_schedule"
          type="warning"
          variant="tonal"
        >
          {{ calendarData.unavailable_reason }}
        </v-alert>

        <template v-else-if="calendarData?.can_schedule">
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            You can schedule up to {{ calendarData.available_to_schedule }} more sessions.
          </v-alert>

          <div class="calendar-legend mb-3">
            <div class="calendar-legend__item">
              <span class="calendar-legend__swatch calendar-legend__swatch--available" />
              Available
            </div>
            <div class="calendar-legend__item">
              <span class="calendar-legend__swatch calendar-legend__swatch--selected" />
              Selected
            </div>
            <div class="calendar-legend__item">
              <span class="calendar-legend__swatch calendar-legend__swatch--disabled" />
              Unavailable
            </div>
          </div>

          <div class="calendar-wrapper">
            <v-date-picker
              :model-value="selectedDates"
              :month="selectedMonth - 1"
              :year="selectedYear"
              :min="calendarMonthStart"
              :max="calendarMonthEnd"
              :allowed-dates="isDateAllowed"
              :disabled="!calendarData.can_schedule"
              color="#43A047"
              multiple
              hide-header
              hide-title
              no-auto-navigation
              width="100%"
              @update:model-value="handleDateSelection"
            />
          </div>

          <div v-if="selectedDateDetails.length" class="mt-5">
            <div class="d-flex align-center justify-space-between mb-3 ga-3">
              <div class="text-subtitle-1 font-weight-bold">Selected Dates</div>
              <v-chip color="success" variant="tonal" size="small">
                {{ selectedDateDetails.length }} selected
              </v-chip>
            </div>

            <div class="selected-date-list">
              <v-card
                v-for="day in selectedDateDetails"
                :key="day.date"
                variant="outlined"
                class="selected-date-card rounded-lg"
              >
                <v-card-text>
                  <div class="font-weight-bold mb-3">{{ formatScheduleDate(day.date) }}</div>
                  <div class="session-options">
                    <v-btn
                      v-for="session in day.sessions"
                      :key="session.id"
                      :disabled="session.is_full"
                      :class="[
                        'session-option',
                        { 'session-option--selected': selectedSessionIds[day.date] === session.id },
                      ]"
                      variant="outlined"
                      height="auto"
                      @click="selectSession(day.date, session.id)"
                    >
                      <span class="session-option__content">
                        <span class="font-weight-bold">{{ session.session_name }}</span>
                        <span>{{ session.start_time }} - {{ session.end_time }}</span>
                        <span>{{ session.occupied }}/{{ session.capacity }} slot</span>
                      </span>
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>

            <v-alert
              v-if="missingSessionCount > 0"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              Choose a session for every selected date before saving.
            </v-alert>

            <div class="schedule-submit mt-5">
              <v-btn
                color="success"
                size="large"
                block
                :loading="submitLoading"
                :disabled="!canSubmit"
                @click="submitSchedule"
              >
                Save Schedule
              </v-btn>
              <div class="text-caption text-medium-emphasis text-center mt-2">
                After saving, this month's schedule is locked. Contact the admin if changes are
                needed.
              </div>
            </div>
          </div>

          <v-alert v-else type="info" variant="tonal" class="mt-4">
            Tap an available date to start choosing sessions.
          </v-alert>
        </template>
      </v-card-text>
    </v-card>

    <v-card
      v-if="selectedRegistration && selectedYear && selectedMonth"
      elevation="1"
      class="rounded-xl mt-5"
    >
      <v-card-title class="px-5 pt-5">Monthly Schedule</v-card-title>
      <v-card-subtitle class="px-5">
        {{ selectedRegistration.child?.name || 'Child' }}'s schedule for
        {{ selectedMonthName }} {{ selectedYear }}.
      </v-card-subtitle>

      <v-card-text class="pa-5">
        <div v-if="calendarLoading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary" size="36" />
        </div>

        <v-alert v-else-if="calendarError" type="error" variant="tonal">
          The monthly schedule could not be loaded.
        </v-alert>

        <div v-else-if="monthlySchedules.length" class="monthly-schedule-list">
          <v-card
            v-for="session in monthlySchedules"
            :key="session.id"
            variant="outlined"
            class="monthly-schedule-card rounded-lg"
          >
            <v-card-text class="monthly-schedule-card__content">
              <div class="font-weight-bold">{{ formatScheduleDate(session.therapy_date) }}</div>
              <div>
                {{ session.session_name }} · {{ session.start_time }} - {{ session.end_time }}
              </div>
              <div class="monthly-schedule-card__status">
                <span>Status:</span>
                <v-chip
                  :color="therapySessionStatusColor(session.status?.id)"
                  variant="tonal"
                  size="x-small"
                >
                  {{ session.status?.name || 'Unknown' }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <v-alert v-else-if="calendarData" type="info" variant="tonal">
          No school sessions are scheduled for this month.
        </v-alert>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      location="top end"
      timeout="4000"
    >
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import api from '@/services/api'

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const loading = ref(true)
const loadError = ref('')
const registrations = ref([])
const currentDate = ref('')
const selectedRegistrationId = ref(null)
const selectedYear = ref(null)
const selectedMonth = ref(null)
const calendarLoading = ref(false)
const calendarError = ref('')
const calendarData = ref(null)
const selectedDates = ref([])
const selectedSessionIds = ref({})
const submitLoading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
let calendarRequestId = 0

const selectedRegistration = computed(() =>
  registrations.value.find((registration) => registration.id === selectedRegistrationId.value),
)

const selectedSummary = computed(() => {
  if (selectedRegistration.value?.total_session == null) return null

  return selectedRegistration.value.session_summary ?? null
})

const parseDate = (value) => {
  if (!value) return null

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const monthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1)

const selectionBounds = computed(() => {
  const today = parseDate(currentDate.value)
  const startsAt = parseDate(selectedRegistration.value?.session_started_at)
  const expiresAt = parseDate(selectedRegistration.value?.session_expired_at)

  if (!today || !startsAt || !expiresAt) return null

  const start = monthStart(startsAt > today ? startsAt : today)
  const end = monthStart(expiresAt)

  if (start > end) return null

  return { start, end }
})

const availableYears = computed(() => {
  if (!selectionBounds.value) return []

  const years = []
  for (
    let year = selectionBounds.value.start.getFullYear();
    year <= selectionBounds.value.end.getFullYear();
    year += 1
  ) {
    years.push(year)
  }

  return years
})

const availableMonths = computed(() => {
  if (!selectionBounds.value || !selectedYear.value) return []

  return monthNames
    .map((title, index) => ({ title, value: index + 1 }))
    .filter(({ value }) => {
      const date = new Date(selectedYear.value, value - 1, 1)
      return date >= selectionBounds.value.start && date <= selectionBounds.value.end
    })
})

const remainingSessionState = computed(() => {
  if (!selectedSummary.value) return { color: '#F5F5F5', label: '' }
  if (selectedSummary.value.is_session_expired) {
    return { color: '#FFEBEE', label: 'Expired' }
  }
  if (selectedSummary.value.remaining_session <= 0) {
    return { color: '#FFEBEE', label: 'No sessions remaining' }
  }
  if (
    selectedSummary.value.total_session > 0 &&
    selectedSummary.value.remaining_session / selectedSummary.value.total_session <= 0.2
  ) {
    return { color: '#FFF8E1', label: 'Running low' }
  }

  return { color: '#E3F2FD', label: 'Available' }
})

const calendarDatesByDate = computed(() => {
  const entries = calendarData.value?.dates?.map((day) => [day.date, day]) ?? []
  return new Map(entries)
})

const selectableDateSet = computed(() => new Set(calendarData.value?.selectable_dates ?? []))

const selectedDateKeys = computed(() =>
  selectedDates.value
    .map(toIsoDate)
    .filter(Boolean)
    .sort(),
)

const selectedDateDetails = computed(() =>
  selectedDateKeys.value
    .map((date) => calendarDatesByDate.value.get(date))
    .filter(Boolean),
)

const monthlySchedules = computed(() => calendarData.value?.scheduled_sessions ?? [])

const selectedMonthName = computed(() => monthNames[(selectedMonth.value ?? 1) - 1])

const missingSessionCount = computed(() =>
  selectedDateDetails.value.filter((day) => !selectedSessionIds.value[day.date]).length,
)

const canSubmit = computed(
  () =>
    calendarData.value?.can_schedule &&
    selectedDateDetails.value.length > 0 &&
    selectedDateDetails.value.length <= calendarData.value.available_to_schedule &&
    missingSessionCount.value === 0 &&
    !submitLoading.value,
)

const calendarMonthStart = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return undefined
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
})

const calendarMonthEnd = computed(() => {
  if (!selectedYear.value || !selectedMonth.value) return undefined
  const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  return `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
})

const registrationMessage = computed(() => {
  if (!selectedRegistration.value) return ''

  if (selectedRegistration.value.registration_status === 'inactive') {
    return 'This registration is inactive. New scheduling is unavailable.'
  }
  if (selectedRegistration.value.registration_status === 'closed') {
    return 'This registration is closed. New scheduling is unavailable.'
  }
  if (!selectedRegistration.value.session_started_at || !selectedRegistration.value.session_expired_at) {
    return 'Session validity dates have not been set for this registration.'
  }
  if (selectedRegistration.value.total_session == null) {
    return 'Session totals have not been set for this registration.'
  }
  if (selectedSummary.value?.is_session_expired) {
    return 'Sessions for this registration have expired.'
  }
  if (selectedSummary.value?.remaining_session <= 0) {
    return 'No sessions remain for this registration.'
  }
  if (availableYears.value.length === 0) {
    return 'No scheduling period is available for this registration.'
  }

  return ''
})

const registrationMessageType = computed(() =>
  selectedRegistration.value?.registration_status === 'closed' ? 'error' : 'warning',
)

const registrationTitle = (registration) => registration.child?.name || '-'

const registrationItem = (item) => item?.raw ?? item

const registrationStatusColor = (status) => {
  if (status === 'active') return 'success'
  if (status === 'inactive') return 'warning'
  if (status === 'closed') return 'error'
  return 'grey'
}

const therapySessionStatusColor = (statusId) => {
  if (statusId === 1) return 'primary'
  if (statusId === 2) return 'success'
  if (statusId === 3) return 'error'
  return 'grey'
}

const formatLongDate = (value) => {
  const date = parseDate(value)
  if (!date) return '-'

  return date.toLocaleDateString('en-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function toIsoDate(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

const isDateAllowed = (value) => selectableDateSet.value.has(toIsoDate(value))

const formatScheduleDate = (value) => {
  const date = parseDate(value)
  if (!date) return '-'

  return date.toLocaleDateString('en-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const showSnackbar = (message, color = 'error') => {
  snackbarText.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const handleDateSelection = (value) => {
  const nextDates = Array.isArray(value) ? value : value ? [value] : []
  const limit = Number(calendarData.value?.available_to_schedule ?? 0)

  if (nextDates.length > limit) {
    showSnackbar(`You can only schedule ${limit} more sessions.`, 'warning')
    return
  }

  selectedDates.value = nextDates
}

const selectSession = (date, sessionId) => {
  selectedSessionIds.value = {
    ...selectedSessionIds.value,
    [date]: sessionId,
  }
}

const resetCalendarSelection = () => {
  selectedDates.value = []
  selectedSessionIds.value = {}
}

const applyCalendarData = (data) => {
  calendarData.value = data

  const allowedDates = new Set(data?.selectable_dates ?? [])
  selectedDates.value = selectedDates.value.filter((date) => allowedDates.has(toIsoDate(date)))

  const validSelections = {}
  for (const [date, sessionId] of Object.entries(selectedSessionIds.value)) {
    const day = data?.dates?.find((item) => item.date === date)
    const session = day?.sessions?.find((item) => item.id === sessionId)
    if (allowedDates.has(date) && session && !session.is_full) {
      validSelections[date] = sessionId
    }
  }
  selectedSessionIds.value = validSelections
}

const firstApiError = (error, fallback) => {
  const errors = error.response?.data?.errors
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat().find(Boolean)
    if (first) return first
  }

  return error.response?.data?.message || fallback
}

const resetSelectedPeriod = () => {
  selectedYear.value = availableYears.value[0] ?? null
  selectedMonth.value = availableMonths.value[0]?.value ?? null
}

watch(selectedRegistrationId, resetSelectedPeriod)

watch(selectedYear, () => {
  if (!availableMonths.value.some((month) => month.value === selectedMonth.value)) {
    selectedMonth.value = availableMonths.value[0]?.value ?? null
  }
})

watch(selectedDateKeys, (dates) => {
  const selected = new Set(dates)
  selectedSessionIds.value = Object.fromEntries(
    Object.entries(selectedSessionIds.value).filter(([date]) => selected.has(date)),
  )
})

watch(
  [selectedRegistrationId, selectedYear, selectedMonth],
  () => {
    resetCalendarSelection()

    if (selectedRegistrationId.value && selectedYear.value && selectedMonth.value) {
      fetchCalendar()
    } else {
      calendarData.value = null
      calendarError.value = ''
    }
  },
  { flush: 'post' },
)

const fetchCalendar = async () => {
  const requestId = ++calendarRequestId
  calendarLoading.value = true
  calendarError.value = ''

  try {
    const response = await api.get('/school-schedule/calendar', {
      params: {
        registration_id: selectedRegistrationId.value,
        year: selectedYear.value,
        month: selectedMonth.value,
      },
    })

    if (requestId === calendarRequestId) {
      applyCalendarData(response.data.data)
    }
  } catch (error) {
    if (requestId === calendarRequestId) {
      console.error('Error loading school schedule calendar:', error)
      calendarData.value = null
      calendarError.value =
        error.response?.data?.message || 'Failed to load the school schedule calendar.'
    }
  } finally {
    if (requestId === calendarRequestId) {
      calendarLoading.value = false
    }
  }
}

const submitSchedule = async () => {
  if (selectedDateDetails.value.length === 0) {
    showSnackbar('Select at least one date before saving.', 'warning')
    return
  }
  if (selectedDateDetails.value.length > Number(calendarData.value?.available_to_schedule ?? 0)) {
    showSnackbar(
      `You can only schedule ${calendarData.value?.available_to_schedule ?? 0} more sessions.`,
      'warning',
    )
    return
  }
  if (missingSessionCount.value > 0) {
    showSnackbar('Choose a session for every selected date before saving.', 'warning')
    return
  }

  submitLoading.value = true

  try {
    await api.post('/school-schedule/submissions', {
      registration_id: selectedRegistrationId.value,
      year: selectedYear.value,
      month: selectedMonth.value,
      sessions: selectedDateDetails.value.map((day) => ({
        therapy_date: day.date,
        session_time_id: selectedSessionIds.value[day.date],
      })),
    })

    resetCalendarSelection()
    await fetchCalendar()
    showSnackbar('School schedule saved successfully.', 'success')
  } catch (error) {
    console.error('Error submitting school schedule:', error)
    showSnackbar(firstApiError(error, 'Failed to save the school schedule.'))
    await fetchCalendar()
  } finally {
    submitLoading.value = false
  }
}

const fetchContext = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const response = await api.get('/school-schedule/context')
    registrations.value = response.data.data ?? []
    currentDate.value = response.data.meta?.current_date ?? new Date().toISOString().slice(0, 10)
    selectedRegistrationId.value = registrations.value[0]?.id ?? null
    resetSelectedPeriod()
  } catch (error) {
    console.error('Error loading school schedule context:', error)
    loadError.value = error.response?.data?.message || 'Failed to load school schedule information.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchContext)
</script>

<style scoped>
.school-schedule-page {
  width: 100%;
}

.registration-selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.registration-selection__text {
  min-width: 0;
}

.registration-meta {
  display: grid;
  gap: 4px;
  font-size: 0.875rem;
}

.summary-card {
  height: 100%;
  min-height: 112px;
}

.summary-card :deep(.v-card-text) {
  padding: 16px;
}

.summary-card__label {
  min-height: 40px;
  font-size: 0.75rem;
  line-height: 1.25;
}

.summary-card__state {
  margin-top: 4px;
  font-size: 0.7rem;
  line-height: 1.2;
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.calendar-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.calendar-legend__swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.calendar-legend__swatch--available {
  background: rgb(var(--v-theme-surface));
}

.calendar-legend__swatch--selected {
  background: #43a047;
  border-color: #43a047;
}

.calendar-legend__swatch--disabled {
  background: #eeeeee;
}

.calendar-wrapper {
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
}

.calendar-wrapper :deep(.v-picker) {
  max-width: none;
}

.selected-date-list {
  display: grid;
  gap: 12px;
}

.monthly-schedule-list {
  display: grid;
  gap: 10px;
}

.monthly-schedule-card__content {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 14px 16px;
  line-height: 1.35;
}

.monthly-schedule-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
}

.session-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.session-option {
  min-height: 82px;
  padding: 10px 12px;
  text-transform: none;
  letter-spacing: normal;
  border-color: #bdbdbd;
  color: #424242;
}

.session-option--selected {
  background: #e8f5e9 !important;
  border-color: #43a047 !important;
  color: #1b5e20 !important;
}

.session-option__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  width: 100%;
  white-space: normal;
  line-height: 1.25;
}

@media (max-width: 600px) {
  .summary-card :deep(.v-card-text) {
    padding: 12px 10px;
  }

  .summary-card__label {
    min-height: 44px;
  }

  .school-schedule-page :deep(.v-card-title) {
    white-space: normal;
  }

  .calendar-wrapper {
    margin-inline: -8px;
  }

  .session-options {
    grid-template-columns: 1fr;
  }
}
</style>
