<template>
  <v-container class="py-6 px-4 px-md-8">
    <!-- Header -->
    <v-row align="center" class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Edit Activity</h1>

        <p class="text-medium-emphasis mt-1">Edit activity for selected post</p>
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

    <!-- Page Skeleton -->
    <v-card v-if="pageLoading" rounded="lg" elevation="2">
      <v-card-text class="pa-6">
        <!-- Activity Information -->
        <v-card variant="outlined" class="mb-6">
          <v-card-text>
            <v-skeleton-loader type="heading" width="220" class="mb-5" />

            <v-row>
              <v-col v-for="item in 3" :key="item" cols="12" md="4">
                <v-skeleton-loader type="text, text" />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Children -->
        <v-card variant="tonal" rounded="lg" class="mb-5">
          <v-card-text>
            <v-skeleton-loader
              type="
            heading,
            list-item-two-line,
            list-item-two-line
          "
            />
          </v-card-text>
        </v-card>

        <!-- Description -->
        <v-skeleton-loader type="heading, paragraph" class="mb-6" />

        <!-- Photos -->
        <v-skeleton-loader type="heading" width="180" class="mb-3" />

        <v-row class="mb-6">
          <v-col v-for="item in 4" :key="item" cols="6" sm="4" md="3">
            <v-skeleton-loader type="image" />
          </v-col>
        </v-row>

        <!-- Video -->
        <v-skeleton-loader type="heading, image" class="mb-5" />

        <!-- Actions -->
        <div class="d-flex justify-end ga-3">
          <v-skeleton-loader type="button" />
          <v-skeleton-loader type="button" />
        </div>
      </v-card-text>
    </v-card>

    <v-card v-else rounded="lg" elevation="2">
      <v-card-text>
        <v-card class="mb-6" variant="outlined">
          <v-card-title>Activity Information</v-card-title>

          <v-divider />

          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  :model-value="activityInfo.date"
                  label="Activity Date"
                  readonly
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  :model-value="activityInfo.programCategory"
                  label="Program Category"
                  readonly
                  variant="outlined"
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  :model-value="activityInfo.session"
                  label="School Session"
                  readonly
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

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
        <div v-if="existingPhotos.length" class="mb-6">
          <div class="text-subtitle-1 font-weight-medium mb-2">Current Photos</div>

          <v-row>
            <v-col v-for="photo in existingPhotos" :key="photo.id" cols="12" sm="4" md="3">
              <v-card>
                <v-img :src="getMediaUrl(photo.file_path)" height="180" cover />

                <v-card-actions>
                  <v-spacer />

                  <v-btn
                    icon="mdi-delete"
                    color="error"
                    variant="text"
                    @click="removeExistingPhoto(photo)"
                  />
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </div>
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
        <div v-if="existingVideo" class="mb-6">
          <div class="text-subtitle-1 font-weight-medium mb-2">Current Video</div>

          <v-card variant="outlined" rounded="lg">
            <video
              :src="getMediaUrl(existingVideo.file_path)"
              controls
              preload="metadata"
              class="existing-video"
            />

            <v-card-actions>
              <div class="text-body-2 text-medium-emphasis text-truncate">
                {{ existingVideo.file_name }}
              </div>

              <v-spacer />

              <v-btn icon="mdi-delete" color="error" variant="text" @click="removeExistingVideo" />
            </v-card-actions>
          </v-card>
        </div>
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

        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-content-save"
          :loading="uploading"
          :disabled="uploading"
          @click="submit"
        >
          Save Changes
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
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()

// ======================
// STATE
// ======================

const pageLoading = ref(true)
const uploading = ref(false) // Upload activity
const uploadProgress = ref(0)
const children = ref([])
const photos = ref([])
const video = ref(null)
const photoPreviews = ref([])
const videoPreview = ref(null)
const selectAllChildren = ref(false)
const photoErrors = ref([])
const videoError = ref([])
const existingPhotos = ref([])
const existingVideo = ref(null)
const removedMediaIds = ref([])
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
  child_ids: [],
  description: '',
})

const activityInfo = reactive({
  date: '',

  programCategory: '',

  session: '',
})

function getMediaUrl(path) {
  if (!path) return ''

  const baseUrl = import.meta.env.VITE_STORAGE_URL?.replace(/\/$/, '')

  const cleanPath = String(path).replace(/^\/+/, '')

  return `${baseUrl}/${cleanPath}`
}

function removeExistingPhoto(photo) {
  if (!photo?.id) return

  if (!removedMediaIds.value.includes(photo.id)) {
    removedMediaIds.value.push(photo.id)
  }

  existingPhotos.value = existingPhotos.value.filter((item) => item.id !== photo.id)
}

// toggle select all
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

  const maxSize = 5 * 1024 * 1024

  for (const file of files) {
    if (file.size > maxSize) {
      photoErrors.value = ['Max 5 MB per photo.']

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

// ======================
// FETCH
// ======================

async function fetchActivity() {
  pageLoading.value = true

  try {
    const response = await api.get(`/activities/${route.params.id}`)

    const activity = response.data.data

    const session = activity.program_category_session_time

    activityInfo.date = activity.therapy_date ?? '-'

    activityInfo.programCategory = activity.program_category?.name ?? '-'

    activityInfo.session = session
      ? `${session.session_name} • ` +
        `${session.start_time.slice(0, 5)} - ` +
        `${session.end_time.slice(0, 5)}`
      : '-'

    form.description = activity.description ?? ''

    const media = activity.media ?? []

    existingPhotos.value = media.filter((item) => item.media_type === 'photo')

    existingVideo.value = media.find((item) => item.media_type === 'video') ?? null

    const currentChildren = activity.children ?? []

    await fetchChildren(activity.program_category_id, currentChildren)

    form.child_ids = currentChildren.map((child) => child.id)
  } catch (error) {
    console.error(error)

    showError(error.response?.data?.message ?? 'Failed to load activity.')

    setTimeout(() => {
      router.push('/activity')
    }, 800)
  } finally {
    pageLoading.value = false
  }
}

async function fetchChildren(programCategoryId, currentChildren = []) {
  try {
    const response = await api.get('/therapy-sessions/activity-children', {
      params: {
        program_category_id: programCategoryId,
      },
    })

    const activeChildren = response.data.data ?? []

    // Gabungkan anak aktif dengan anak yang sudah ada di Activity.
    // Mencegah anak lama hilang kalau statusnya berubah menjadi inactive.
    const mergedChildren = [...activeChildren, ...currentChildren]

    children.value = Array.from(
      new Map(mergedChildren.map((child) => [child.id, child])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name))
  } catch (error) {
    console.error(error)

    children.value = currentChildren

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

function removeExistingVideo() {
  if (!existingVideo.value?.id) return

  const mediaId = existingVideo.value.id

  if (!removedMediaIds.value.includes(mediaId)) {
    removedMediaIds.value.push(mediaId)
  }

  existingVideo.value = null
}

// ======================
// SUBMIT
// ======================

async function submit() {
  uploadProgress.value = 0

  // ======================
  // VALIDATION
  // ======================

  if (!form.child_ids.length) {
    return showError('Please select at least one child.')
  }

  if (photoErrors.value.length) {
    return
  }

  if (videoError.value.length) {
    return
  }

  const totalPhotos = existingPhotos.value.length + photos.value.length

  if (totalPhotos > 10) {
    return showError('Maximum 10 photos are allowed.')
  }

  const hasDescription = form.description?.trim().length > 0

  const hasExistingPhotos = existingPhotos.value.length > 0

  const hasExistingVideo = !!existingVideo.value

  const hasNewPhotos = photos.value.length > 0

  const hasNewVideo = !!getVideoFile(video.value)

  if (!hasDescription && !hasExistingPhotos && !hasExistingVideo && !hasNewPhotos && !hasNewVideo) {
    return showError('Description, photo, or video is required.')
  }

  try {
    uploading.value = true

    const payload = new FormData()

    /*
     * Multipart PUT kadang tidak terbaca dengan baik oleh PHP.
     * Karena itu kirim POST dengan method spoofing.
     */
    payload.append('_method', 'PUT')

    payload.append('description', form.description ?? '')

    form.child_ids.forEach((id) => {
      payload.append('child_ids[]', id)
    })

    removedMediaIds.value.forEach((id) => {
      payload.append('removed_media_ids[]', id)
    })

    photos.value.forEach((photo) => {
      payload.append('photos[]', photo)
    })

    const videoFile = getVideoFile(video.value)

    if (videoFile) {
      payload.append('video', videoFile)
    }

    await api.post(`/activities/${route.params.id}`, payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },

      onUploadProgress(progressEvent) {
        if (!progressEvent.total) return

        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
      },
    })

    showSuccess('Activity updated successfully.')

    setTimeout(() => {
      router.push('/activity')
    }, 800)
  } catch (error) {
    console.error(error)

    showError(error.response?.data?.message ?? 'Failed to update activity.')
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
  fetchActivity()
})
</script>
