<template>
  <div class="activity-create-page">
    <!-- HEADER -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Create Activity</h1>

        <p class="text-body-2 text-grey">Create therapy session activity documentation.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
    </div>

    <!-- SESSION LOADING -->
    <v-card v-if="pageLoading" elevation="1" class="mb-4 rounded-xl">
      <v-skeleton-loader
        type="
          article,
          paragraph,
          paragraph
        "
      />
    </v-card>

    <!-- CONTENT -->
    <template v-else>
      <!-- SELECT SESSION -->
      <v-card elevation="1" class="mb-4 rounded-xl">
        <v-card-title>Select Therapy Session</v-card-title>

        <v-card-text>
          <!-- SEARCH -->
          <v-text-field
            v-model="search"
            label="Search Child"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            class="mb-4"
          />

          <!-- SCROLL -->
          <div class="session-scroll">
            <!-- SESSION LIST -->
            <div class="session-list">
              <v-card
                v-for="session in filteredSessions"
                :key="session.id"
                elevation="0"
                class="session-card rounded-xl"
                :class="{
                  'session-selected': selectedSession === session.id,

                  'session-disabled': session.activity,
                }"
                @click="selectSession(session)"
              >
                <v-card-text>
                  <div class="d-flex justify-space-between align-start ga-4 flex-wrap">
                    <!-- LEFT -->
                    <div>
                      <!-- CHILD -->
                      <div class="text-h6 font-weight-bold mb-1">
                        {{ session.registration?.child?.name }}
                      </div>

                      <div class="text-h6 mb-1">
                        {{ session.registration?.registration_number }}
                      </div>

                      <!-- CHIPS -->
                      <div class="d-flex flex-wrap ga-2">
                        <!-- DATE -->
                        <v-chip size="small" variant="tonal">
                          {{ formatDate(session.therapy_date) }}
                        </v-chip>

                        <!-- TIME -->
                        <v-chip size="small" variant="tonal">
                          {{ session.start_time?.slice(0, 5) }}

                          -

                          {{ session.end_time?.slice(0, 5) }}
                        </v-chip>
                      </div>
                    </div>

                    <!-- RIGHT -->
                    <div class="text-right">
                      <div class="text-caption text-grey mb-1">Therapist</div>

                      <div class="font-weight-medium mb-2">
                        {{ session.therapist?.name }}
                      </div>

                      <v-chip v-if="session.activity" color="success" variant="tonal" size="small">
                        Already Documented
                      </v-chip>

                      <v-chip v-else color="primary" variant="tonal" size="small">
                        Select Session
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- SELECTED SESSION -->
      <v-card v-if="selectedSessionData" elevation="1" class="mb-4 rounded-xl">
        <v-card-title>Selected Therapy Session</v-card-title>

        <v-card-text>
          <v-row>
            <!-- CHILD -->
            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Child</div>

              <div class="font-weight-medium text-body-1">
                {{ selectedSessionData.registration?.child?.name }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Reg. No.</div>

              <div class="font-weight-medium text-body-1">
                {{ selectedSessionData.registration?.registration_number }}
              </div>
            </v-col>

            <!-- THERAPIST -->
            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Therapist</div>

              <div class="font-weight-medium text-body-1">
                {{ selectedSessionData.therapist?.name }}
              </div>
            </v-col>

            <!-- DATE -->
            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Date</div>

              <div class="font-weight-medium text-body-1">
                {{ formatDate(selectedSessionData.therapy_date) }}
              </div>
            </v-col>

            <!-- TIME -->
            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Time</div>

              <div class="font-weight-medium text-body-1">
                {{ selectedSessionData.start_time?.slice(0, 5) }}

                -

                {{ selectedSessionData.end_time?.slice(0, 5) }}
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- FORM -->
      <v-card elevation="1" class="rounded-xl">
        <v-card-title>Activity Documentation</v-card-title>

        <v-card-text>
          <v-row>
            <!-- CAPTION -->
            <v-col cols="12">
              <v-textarea
                v-model="form.caption"
                label="Activity Caption"
                variant="outlined"
                rows="5"
                auto-grow
                placeholder="
                  Write activity summary
                  and therapy progress...
                "
              />
            </v-col>

            <!-- PHOTOS -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-medium mb-3">Photos</div>

              <v-file-input
                multiple
                chips
                prepend-icon="mdi-camera"
                variant="outlined"
                label="Upload Photos"
                v-model="form.photos"
                accept="image/*"
                show-size
              />
            </v-col>

            <!-- VIDEO -->
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-medium mb-3">Video</div>

              <v-file-input
                v-model="form.video"
                :multiple="false"
                prepend-icon="mdi-video"
                variant="outlined"
                label="Upload Video"
                accept="video/*"
                show-size
              />
            </v-col>
          </v-row>
        </v-card-text>

        <!-- ACTION -->
        <v-progress-linear
          v-if="loading"
          :model-value="uploadProgress"
          color="primary"
          height="8"
          rounded
          class="mb-4"
        />

        <div v-if="loading" class="text-center text-body-2 text-medium-emphasis mb-4">
          Uploading video... {{ uploadProgress }}%
          <br />
          Please do not close this page until the upload is complete.
        </div>
        <v-card-actions class="px-6 pb-6">
          <v-spacer />

          <v-btn variant="tonal" @click="goBack">Cancel</v-btn>

          <v-btn
            color="primary"
            prepend-icon="
              mdi-content-save
            "
            :loading="loading"
            :disabled="loading"
            @click="saveActivity"
          >
            {{ loading ? `Uploading... ${uploadProgress}%` : 'Save' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>

    <!-- FULLSCREEN LOADING -->
    <v-dialog v-model="loading" persistent fullscreen scrim="black">
      <div class="d-flex flex-column align-center justify-center h-100">
        <v-card rounded="xl" class="pa-8 text-center" width="320">
          <v-progress-circular indeterminate color="primary" size="56" width="5" />

          <div class="text-h6 font-weight-medium mt-6">
            {{ uploadLoadingText }}
          </div>

          <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
        </v-card>
      </div>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'

import debounce from 'lodash/debounce'

import api from '@/services/api'

import { useRouter } from 'vue-router'

// ======================
// ROUTER
// ======================

const router = useRouter()

// ======================
// STATE
// ======================

const sessions = ref([])

const selectedSession = ref(null)

const search = ref('')

const debouncedSearch = ref('')

const loading = ref(false)

const pageLoading = ref(true)

const uploadProgress = ref(0)

const uploadLoadingText = ref('Uploading Activity...')

const form = ref({
  caption: '',
  photos: [],
  video: null,
})

// ======================
// BACK
// ======================

const goBack = async () => {
  loading.value = true

  uploadLoadingText.value = 'Returning...'

  try {
    await router.push('/activity')
  } finally {
    setTimeout(() => {
      loading.value = false
    }, 300)
  }
}

// ======================
// FETCH SESSIONS
// ======================

const fetchSessions = async () => {
  try {
    pageLoading.value = true

    const res = await api.get('/therapy-sessions', {
      params: {
        without_activity: 1,
        per_page: 100,
      },
    })

    sessions.value = res.data.data
  } catch (err) {
    console.error(err)
  } finally {
    pageLoading.value = false
  }
}

// ======================
// SEARCH
// ======================

const debounceSearchHandler = debounce((value) => {
  debouncedSearch.value = value
}, 300)

watch(search, (value) => {
  debounceSearchHandler(value)
})

// ======================
// FILTERED SESSIONS
// ======================

const filteredSessions = computed(() => {
  if (!debouncedSearch.value) {
    return sessions.value
  }

  return sessions.value.filter((session) => {
    return session.registration?.child?.name
      ?.toLowerCase()
      .includes(debouncedSearch.value.toLowerCase())
  })
})

// ======================
// SELECT SESSION
// ======================

const selectSession = (session) => {
  if (session.activity) {
    return
  }

  selectedSession.value = session.id
}

// ======================
// SELECTED SESSION
// ======================

const selectedSessionData = computed(() => {
  return sessions.value.find((session) => session.id === selectedSession.value)
})

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
// SAVE
// ======================

const saveActivity = async () => {
  if (loading.value) return

  if (!selectedSession.value) {
    alert('Please select therapy session')

    return
  }

  // ======================
  // VIDEO LIMIT
  // ======================

  const maxVideoSize = 100 * 1024 * 1024

  if (form.value.video && form.value.video.size > maxVideoSize) {
    alert('Video max size is 100 MB')

    return
  }

  try {
    uploadProgress.value = 0
    loading.value = true

    uploadLoadingText.value = 'Uploading Activity...'

    const payload = new FormData()

    // ======================
    // BASIC DATA
    // ======================

    payload.append('therapy_session_id', selectedSession.value)

    payload.append('caption', form.value.caption || '')

    // ======================
    // VIDEO
    // ======================

    if (form.value.video) {
      payload.append('video', form.value.video)
    }

    // ======================
    // PHOTOS
    // ======================

    if (form.value.photos?.length) {
      form.value.photos.forEach((photo) => {
        payload.append('photos[]', photo)
      })
    }

    // ======================
    // API
    // ======================

    await api.post('/activities', payload, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },

      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      },
    })

    uploadProgress.value = 100

    alert('Activity created successfully')

    form.value = {
      caption: '',
      photos: [],
      video: null,
    }

    selectedSession.value = null

    await new Promise((resolve) => setTimeout(resolve, 500))
    await router.push('/activity')
  } catch (err) {
    console.error(err)

    alert(err.response?.data?.message || 'Failed to create activity')
  } finally {
    loading.value = false
    uploadProgress.value = 0
  }
}

// ======================
// INIT
// ======================

onMounted(() => {
  fetchSessions()
})

// ======================
// CLEANUP
// ======================

onBeforeUnmount(() => {
  debounceSearchHandler.cancel()
})
</script>

<style scoped>
.activity-create-page {
  width: 100%;
}

.page-header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 16px;

  flex-wrap: wrap;
}

.session-scroll {
  max-height: 500px;

  overflow-y: auto;

  padding-right: 4px;
}

.session-scroll::-webkit-scrollbar {
  width: 8px;
}

.session-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);

  border-radius: 999px;
}

.session-list {
  display: flex;

  flex-direction: column;

  gap: 12px;
}

.session-card {
  border: 1px solid rgba(0, 0, 0, 0.08);

  cursor: pointer;

  transition: all 0.2s ease;
}

.session-card:hover {
  transform: translateY(-2px);

  border-color: rgba(25, 118, 210, 0.4);
}

.session-selected {
  border: 2px solid rgb(25, 118, 210);

  background: rgba(25, 118, 210, 0.04);
}

.session-disabled {
  opacity: 0.7;

  cursor: not-allowed;
}

.preview-grid {
  display: grid;

  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));

  gap: 16px;
}

.preview-item {
  position: relative;
}

.preview-delete {
  position: absolute;

  top: 8px;

  right: 8px;
}

.video-preview {
  width: 100%;

  max-width: 700px;

  border-radius: 16px;

  background: black;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;

    align-items: stretch;
  }

  .page-header .v-btn {
    width: 100%;
  }

  .session-card .d-flex {
    flex-direction: column;

    align-items: stretch !important;
  }

  .session-card .text-right {
    text-align: left !important;

    margin-top: 12px;
  }
}

@media (max-width: 600px) {
  .page-header h1 {
    font-size: 28px !important;

    line-height: 1.2;
  }

  .page-header p {
    font-size: 13px;
  }

  .session-card .v-card-text {
    padding: 16px !important;
  }

  .session-card .text-h6 {
    font-size: 18px !important;
  }

  .preview-grid {
    grid-template-columns: 1fr;
  }

  .video-preview {
    border-radius: 12px;
  }
}
</style>
