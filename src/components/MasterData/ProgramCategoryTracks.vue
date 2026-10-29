<template>
  <div>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">{{ category?.name || 'Program Tracks' }}</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage each subject, delivery mode, class, and session slot.
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="router.push('/program-categories')">
          Categories
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openTrackDialog">
          New Subject Track
        </v-btn>
      </div>
    </div>

    <v-alert v-if="loadError" type="error" variant="tonal" class="mb-4">{{ loadError }}</v-alert>
    <div v-if="loading" class="d-flex justify-center py-10">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <v-alert v-else-if="tracks.length === 0" type="info" variant="tonal">
      No subject tracks yet. Add a subject and its Regular or Private schedule.
    </v-alert>

    <v-row v-else>
      <v-col v-for="track in tracks" :key="track.id" cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center justify-space-between ga-3">
            <span>{{ track.subject_name }} · {{ titleCase(track.delivery_mode) }}</span>
            <v-chip :color="track.is_active ? 'success' : 'grey'" size="small" variant="tonal">
              {{ track.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </v-card-title>
          <v-card-subtitle>
            Rp {{ Number(track.price_per_session).toLocaleString('id-ID') }} per session
          </v-card-subtitle>
          <v-card-text>
            <div class="d-flex justify-end mb-3">
              <v-btn
                size="small"
                variant="tonal"
                :color="track.is_active ? 'error' : 'success'"
                @click="toggleTrack(track)"
              >
                {{ track.is_active ? 'Deactivate Track' : 'Activate Track' }}
              </v-btn>
            </div>
            <div v-for="classItem in track.classes" :key="classItem.id" class="mb-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold">Class {{ classItem.class_code }}</div>
                <v-chip :color="classItem.is_active ? 'success' : 'grey'" size="x-small" variant="tonal">
                  {{ classItem.is_active ? 'Active' : 'Inactive' }}
                </v-chip>
              </div>
              <v-table density="compact">
                <thead>
                  <tr><th>Session</th><th>Time</th><th>Capacity</th></tr>
                </thead>
                <tbody>
                  <tr v-for="slot in classItem.session_times" :key="slot.id">
                    <td>{{ slot.session_name }}</td>
                    <td>{{ slot.start_time?.slice(0, 5) }}–{{ slot.end_time?.slice(0, 5) }}</td>
                    <td>{{ slot.capacity }}</td>
                  </tr>
                </tbody>
              </v-table>
              <v-btn
                class="mt-2"
                size="x-small"
                variant="text"
                :color="classItem.is_active ? 'error' : 'success'"
                @click="toggleClass(classItem)"
              >
                {{ classItem.is_active ? 'Deactivate class' : 'Activate class' }}
              </v-btn>
            </div>

            <v-divider class="my-3" />
            <div class="text-subtitle-2 mb-2">Packages</div>
            <div v-if="track.programs?.length" class="text-body-2">
              <div v-for="program in track.programs" :key="program.id" class="d-flex justify-space-between">
                <span>{{ program.name }} · {{ program.session_count }} sessions/month</span>
                <span>Rp {{ Number(program.price).toLocaleString('id-ID') }}</span>
              </div>
            </div>
            <div v-else class="text-caption text-medium-emphasis">
              No package yet. Create packages from Master Data → Programs.
            </div>
            <v-btn class="mt-2" size="small" variant="text" @click="openClassDialog(track)">
              Add Class
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="trackDialog" max-width="900" persistent>
      <v-card>
        <v-card-title>New Subject Track</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field v-model="trackForm.subject_name" label="Subject" variant="outlined" />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="trackForm.delivery_mode"
                :items="[{ title: 'Regular', value: 'regular' }, { title: 'Private', value: 'private' }]"
                label="Mode"
                variant="outlined"
                @update:model-value="applyModeDefaults"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model.number="trackForm.price_per_session" label="Price per session (Rp)" type="number" min="0" variant="outlined" />
            </v-col>
          </v-row>

          <div v-for="(classItem, classIndex) in trackForm.classes" :key="classIndex" class="border rounded-lg pa-4 mb-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <v-text-field v-model="classItem.class_code" label="Class label" prefix="Class" density="compact" variant="outlined" hide-details class="class-code-field" />
              <v-btn v-if="trackForm.classes.length > 1" icon="mdi-delete" color="error" variant="text" @click="trackForm.classes.splice(classIndex, 1)" />
            </div>
            <v-row>
              <v-col v-for="(slot, slotIndex) in classItem.sessions" :key="slotIndex" cols="12" md="6">
                <div class="text-subtitle-2 mb-2">Session {{ slotIndex + 1 }}</div>
                <v-row>
                  <v-col cols="6">
                    <v-text-field v-model="slot.start_time" type="time" label="Start" variant="outlined" density="compact" />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field v-model="slot.end_time" type="time" label="End" variant="outlined" density="compact" />
                  </v-col>
                </v-row>
                <v-text-field v-model.number="slot.capacity" type="number" min="1" label="Max students" variant="outlined" density="compact" />
              </v-col>
            </v-row>
          </div>
          <v-btn variant="tonal" prepend-icon="mdi-plus" @click="addDraftClass">Add Class B/C…</v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="trackDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveTrack">Save Track</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="classDialog" max-width="700" persistent>
      <v-card>
        <v-card-title>Add Class to {{ selectedTrack?.subject_name }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="classForm.class_code" label="Class label" prefix="Class" variant="outlined" />
          <v-row>
            <v-col v-for="(slot, index) in classForm.sessions" :key="index" cols="12" md="6">
              <div class="text-subtitle-2 mb-2">Session {{ index + 1 }}</div>
              <v-text-field v-model="slot.start_time" type="time" label="Start" variant="outlined" />
              <v-text-field v-model="slot.end_time" type="time" label="End" variant="outlined" />
              <v-text-field v-model.number="slot.capacity" type="number" min="1" label="Max students" variant="outlined" />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="classDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveClass">Save Class</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" timeout="3500">
      {{ snackbarText }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const category = ref(null)
const tracks = ref([])
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const trackDialog = ref(false)
const classDialog = ref(false)
const selectedTrack = ref(null)

const makeSessions = (mode, subject = '', classCode = 'A') => {
  const privateMode = mode === 'private'
  const starts = privateMode ? ['10:00', '11:00'] : ['15:00', '16:00']
  const ends = privateMode ? ['11:00', '12:00'] : ['16:00', '17:00']
  const capacity = privateMode ? 1 : 5
  return starts.map((start, index) => ({
    session_name: `Sesi ${index + 1} ${subject}${subject ? ' ' : ''}Kelas ${classCode}`,
    start_time: start,
    end_time: ends[index],
    capacity,
  }))
}

const trackForm = ref({
  subject_name: '',
  delivery_mode: 'regular',
  price_per_session: null,
  classes: [{ class_code: 'A', sessions: makeSessions('regular') }],
})

const classForm = ref({ class_code: '', sessions: [] })
const nextClassCode = computed(() => {
  const codes = (selectedTrack.value?.classes || []).map((item) => String(item.class_code).toUpperCase())
  for (let code = 65; code <= 90; code += 1) {
    const letter = String.fromCharCode(code)
    if (!codes.includes(letter)) return letter
  }
  return `Class ${codes.length + 1}`
})

const titleCase = (value) => value ? value[0].toUpperCase() + value.slice(1) : ''

const notify = (message, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  snackbar.value = true
}

const fetchData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [categoriesResponse, tracksResponse] = await Promise.all([
      api.get('/program-categories'),
      api.get(`/program-categories/${route.params.id}/tracks`),
    ])
    category.value = categoriesResponse.data.data.find((item) => Number(item.id) === Number(route.params.id))
    tracks.value = tracksResponse.data.data || []
  } catch (error) {
    loadError.value = error.response?.data?.message || 'Could not load category tracks.'
  } finally {
    loading.value = false
  }
}

const openTrackDialog = () => {
  trackForm.value = {
    subject_name: '',
    delivery_mode: 'regular',
    price_per_session: null,
    classes: [{ class_code: 'A', sessions: makeSessions('regular') }],
  }
  trackDialog.value = true
}

const applyModeDefaults = (mode) => {
  trackForm.value.classes.forEach((classItem) => {
    classItem.sessions = makeSessions(mode, trackForm.value.subject_name, classItem.class_code)
  })
}

const addDraftClass = () => {
  const letters = trackForm.value.classes.map((item) => String(item.class_code).toUpperCase())
  const next = String.fromCharCode(65 + trackForm.value.classes.length)
  trackForm.value.classes.push({
    class_code: letters.includes(next) ? `Class ${trackForm.value.classes.length + 1}` : next,
    sessions: makeSessions(trackForm.value.delivery_mode, trackForm.value.subject_name, next),
  })
}

const saveTrack = async () => {
  if (!trackForm.value.subject_name.trim() || trackForm.value.price_per_session == null) {
    notify('Enter a subject and price per session.', 'error')
    return
  }
  saving.value = true
  try {
    const classes = trackForm.value.classes.map((classItem) => ({
      class_code: classItem.class_code,
      sessions: classItem.sessions.map((slot, index) => ({
        ...slot,
        session_name: `Sesi ${index + 1} ${trackForm.value.subject_name} Kelas ${classItem.class_code}`,
      })),
    }))
    await api.post(`/program-categories/${route.params.id}/tracks`, {
      subject_name: trackForm.value.subject_name,
      delivery_mode: trackForm.value.delivery_mode,
      price_per_session: trackForm.value.price_per_session,
      classes,
    })
    trackDialog.value = false
    notify('Subject track created.')
    await fetchData()
  } catch (error) {
    notify(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Could not create subject track.', 'error')
  } finally {
    saving.value = false
  }
}

const openClassDialog = (track) => {
  selectedTrack.value = track
  classForm.value = {
    class_code: nextClassCode.value,
    sessions: makeSessions(track.delivery_mode, track.subject_name, nextClassCode.value),
  }
  classDialog.value = true
}

const saveClass = async () => {
  saving.value = true
  try {
    const sessions = classForm.value.sessions.map((slot, index) => ({
      ...slot,
      session_name: `Sesi ${index + 1} ${selectedTrack.value.subject_name} Kelas ${classForm.value.class_code}`,
    }))
    await api.post(`/program-tracks/${selectedTrack.value.id}/classes`, {
      class_code: classForm.value.class_code,
      sessions,
    })
    classDialog.value = false
    notify('Class added.')
    await fetchData()
  } catch (error) {
    notify(Object.values(error.response?.data?.errors || {})[0]?.[0] || error.response?.data?.message || 'Could not add class.', 'error')
  } finally {
    saving.value = false
  }
}

const toggleTrack = async (track) => {
  try {
    await api.put(`/program-tracks/${track.id}`, { is_active: !track.is_active })
    await fetchData()
  } catch (error) {
    notify(error.response?.data?.message || 'Could not update track status.', 'error')
  }
}

const toggleClass = async (classItem) => {
  try {
    await api.patch(`/program-track-classes/${classItem.id}`, { is_active: !classItem.is_active })
    await fetchData()
  } catch (error) {
    notify(error.response?.data?.message || 'Could not update class status.', 'error')
  }
}

onMounted(fetchData)
</script>

<style scoped>
.class-code-field {
  max-width: 250px;
}
</style>
