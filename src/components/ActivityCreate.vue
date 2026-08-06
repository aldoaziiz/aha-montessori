<template>
  <v-container class="py-6 px-4 px-md-8">
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Create Activity</h1>

        <p class="text-medium-emphasis mt-1">Create a new activity for children.</p>
      </v-col>

      <!-- Desktop -->
      <v-col cols="auto" class="d-none d-sm-flex">
        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="router.push('/activity')">
          Back
        </v-btn>
      </v-col>

      <!-- Mobile -->
      <v-col cols="12" class="d-flex d-sm-none pt-0">
        <v-btn
          variant="tonal"
          prepend-icon="mdi-arrow-left"
          block
          @click="router.push('/activity')"
        >
          Back
        </v-btn>
      </v-col>
    </v-row>

    <v-card rounded="lg" elevation="2">
      <v-card-text>
        <!-- Program Category -->
        <v-text-field
          v-model="form.therapy_date"
          label="Activity Date"
          type="date"
          variant="outlined"
          prepend-inner-icon="mdi-calendar"
          class="mb-4"
        />

        <v-autocomplete
          v-model="form.program_category_id"
          :items="programCategories"
          item-title="name"
          item-value="id"
          label="Program Category"
          variant="outlined"
          density="comfortable"
          class="mb-5"
        />

        <v-autocomplete
          v-model="selectedSession"
          :items="schoolSessions"
          item-title="label"
          item-value="id"
          return-object
          label="School Session"
          variant="outlined"
          density="comfortable"
          class="mb-5"
        />

        <!-- Children -->
        <v-card variant="tonal" rounded="lg" class="mb-5">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-medium mb-3">Children</div>

            <v-checkbox
              v-model="selectAllChildren"
              label="Select All Children"
              @update:model-value="toggleSelectAll"
              hide-details
              class="mb-3"
            />

            <v-autocomplete
              v-model="form.child_ids"
              :items="children"
              item-title="name"
              item-value="id"
              label="Select Children"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
            />
          </v-card-text>
        </v-card>

        <!-- Description -->
        <v-textarea
          v-model="form.description"
          label="Description"
          variant="outlined"
          rows="5"
          auto-grow
          counter="5000"
          class="mb-5"
        />

        <!-- Photos -->
        <div class="mb-2">
          <div class="text-subtitle-1 font-weight-medium">Photos</div>

          <div class="text-caption text-medium-emphasis">
            Maximum 10 photos. Each photo must not exceed 5 MB.
          </div>
        </div>
        <v-card variant="outlined" rounded="lg" class="mb-5">
          <v-card-text>
            <v-file-input
              v-model="photos"
              label="Add Photos"
              multiple
              accept="image/*"
              :error-messages="photoErrors"
              show-size
            />

            <v-row v-if="photoPreviews.length" class="mt-2">
              <v-col v-for="(photo, index) in photoPreviews" :key="index" cols="6" md="3">
                <v-img :src="photo" height="140" cover rounded />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Video -->
        <div class="mb-2">
          <div class="text-subtitle-1 font-weight-medium">Video</div>

          <div class="text-caption text-medium-emphasis">
            Maximum 1 video. File size must not exceed 75 MB.
          </div>
        </div>
        <v-card variant="outlined" rounded="lg" class="mb-5">
          <v-card-text>
            <v-file-input
              v-model="video"
              label="Add Video"
              accept="video/*"
              :error-messages="videoError"
              show-size
            />

            <video
              v-if="videoPreview"
              :src="videoPreview"
              controls
              style="width: 100%; border-radius: 12px"
            />
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <v-btn variant="text" @click="$router.back()">Cancel</v-btn>

        <v-btn color="primary" size="large" prepend-icon="mdi-send" @click="submit">
          Post Activity
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Loading -->
    <v-overlay :model-value="uploading" persistent class="align-center justify-center">
      <v-card width="320" class="pa-6">
        <div class="text-h6 mb-4">Uploading...</div>

        <v-progress-linear :model-value="uploadProgress" height="10" rounded color="primary" />

        <div class="text-center mt-3">{{ uploadProgress }}%</div>
      </v-card>
    </v-overlay>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" location="top end">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

// ======================
// STATE
// ======================

const loading = ref(false) // Loading data (master data, children)
const uploading = ref(false) // Upload activity
const uploadProgress = ref(0)

const programCategories = ref([])

const children = ref([])
const schoolSessions = ref([])

const selectedSession = ref(null)

const photos = ref([])

const video = ref(null)

const photoPreviews = ref([])

const videoPreview = ref(null)

const selectAllChildren = ref(false)
const photoErrors = ref([])
const videoError = ref([])

const snackbar = reactive({
  show: false,
  color: 'success',
  text: '',
})

const getVideoFile = (value) => {
  if (!value) return null

  return Array.isArray(value) ? (value[0] ?? null) : value
}

const form = reactive({
  therapy_date: new Date().toISOString().slice(0, 10),

  program_category_id: null,

  child_ids: [],

  description: '',
})

function toggleSelectAll(checked) {
  if (checked) {
    form.child_ids = children.value.map((child) => child.id)
  } else {
    form.child_ids = []
  }
}

// ======================
// WATCH
// ======================

watch(
  () => form.child_ids,
  (selected) => {
    const allSelected = selected.length === children.value.length && children.value.length > 0

    if (selectAllChildren.value !== allSelected) {
      selectAllChildren.value = allSelected
    }
  },
  {
    deep: true,
  },
)

watch(photos, (files) => {
  photoErrors.value = []

  photoPreviews.value.forEach((url) => {
    URL.revokeObjectURL(url)
  })

  photoPreviews.value = []

  if (!files) return

  if (files.length > 10) {
    photoErrors.value = ['Maximum 10 photos.']

    photos.value = []

    return
  }

  const maxSize = 10 * 1024 * 1024

  for (const file of files) {
    if (file.size > maxSize) {
      photoErrors.value = ['Max 10 MB per photo.']

      photos.value = []

      return
    }
  }

  files.forEach((file) => {
    photoPreviews.value.push(URL.createObjectURL(file))
  })
})

watch(video, (value) => {
  videoError.value = []

  const file = getVideoFile(value)

  if (videoPreview.value) {
    URL.revokeObjectURL(videoPreview.value)
    videoPreview.value = null
  }

  if (!file) {
    videoPreview.value = null

    return
  }

  const maxSize = 75 * 1024 * 1024

  if (file.size > maxSize) {
    videoError.value = ['Max 75 MB video.']

    video.value = null

    return
  }

  videoPreview.value = URL.createObjectURL(file)
})

watch(
  () => form.program_category_id,
  async (id) => {
    form.child_ids = []

    children.value = []

    schoolSessions.value = []

    selectedSession.value = null

    selectAllChildren.value = false

    if (!id) return

    await Promise.all([fetchChildren(id), fetchSchoolSessions(id)])
  },
)

// ======================
// FETCH
// ======================

async function fetchProgramCategories() {
  try {
    loading.value = true

    const response = await api.get('/master-data')

    programCategories.value = response.data.program_categories ?? []
  } catch (error) {
    console.error(error)

    showError('Failed to load program categories.')
  } finally {
    loading.value = false
  }
}

async function fetchSchoolSessions(programCategoryId) {
  try {
    const response = await api.get(`/program-categories/${programCategoryId}/session-times`)

    schoolSessions.value = (response.data.data ?? []).map((session) => ({
      ...session,

      label: `${session.session_name} • ${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}`,
    }))
  } catch (error) {
    console.error(error)

    schoolSessions.value = []

    showError('Failed to load session times.')
  }
}

async function fetchChildren(programCategoryId) {
  try {
    const response = await api.get('/therapy-sessions/activity-children', {
      params: {
        program_category_id: programCategoryId,
      },
    })

    children.value = response.data.data ?? []
  } catch (error) {
    console.error(error)

    children.value = []

    showError('Failed to load children.')
  }
}

// ======================
// PHOTO
// ======================

function removePhoto(index) {
  URL.revokeObjectURL(photoPreviews.value[index])

  photos.value.splice(index, 1)

  photoPreviews.value.splice(index, 1)
}

// ======================
// VIDEO
// ======================

function removeVideo() {
  if (videoPreview.value) {
    URL.revokeObjectURL(videoPreview.value)
  }

  video.value = null

  videoPreview.value = null
}

// ======================
// SUBMIT
// ======================

async function submit() {
  uploadProgress.value = 0

  if (!form.program_category_id) {
    return showError('Please select a program category.')
  }

  if (!selectedSession.value) {
    return showError('Please select a school session.')
  }

  if (!form.child_ids.length) {
    return showError('Please select at least one child.')
  }

  if (photoErrors.value.length) {
    return
  }

  if (videoError.value.length) {
    return
  }

  const hasDescription = form.description?.trim().length > 0

  const hasPhotos = photos.value.length > 0

  const hasVideo = !!video.value

  if (!hasDescription && !hasPhotos && !hasVideo) {
    return showError('Description, photos, or video is required.')
  }

  try {
    uploading.value = true

    const payload = new FormData()

    payload.append('program_category_id', form.program_category_id)

    payload.append('therapy_date', form.therapy_date)

    payload.append('program_category_session_time_id', selectedSession.value.id)

    payload.append('description', form.description)

    form.child_ids.forEach((id) => {
      payload.append('child_ids[]', id)
    })

    photos.value.forEach((photo) => {
      payload.append('photos[]', photo)
    })

    if (video.value) {
      const videoFile = getVideoFile(video.value)

      if (videoFile) {
        payload.append('video', videoFile)
      }
    }

    await api.post('/activities', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },

      onUploadProgress(progressEvent) {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    form.program_category_id = null

    selectedSession.value = null

    schoolSessions.value = []

    form.child_ids = []

    selectAllChildren.value = false

    form.description = ''

    photos.value = []

    video.value = null

    photoPreviews.value.forEach((url) => {
      URL.revokeObjectURL(url)
    })

    if (videoPreview.value) {
      URL.revokeObjectURL(videoPreview.value)
    }

    photoPreviews.value = []

    videoPreview.value = null

    selectAllChildren.value = false

    children.value = []

    showSuccess('Activity created successfully.')

    setTimeout(() => {
      router.push('/activity')
    }, 800)
  } catch (e) {
    showError(e.response?.data?.message ?? 'Failed to create activity.')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// ======================
// SNACKBAR
// ======================

function showSuccess(text) {
  snackbar.color = 'success'

  snackbar.text = text

  snackbar.show = true
}

function showError(text) {
  snackbar.color = 'error'

  snackbar.text = text

  snackbar.show = true
}

// ======================
// INIT
// ======================

onMounted(() => {
  fetchProgramCategories()
})
</script>
