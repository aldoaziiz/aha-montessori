<template>
  <div class="activity-page">
    <!-- PAGE HEADER -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Activity Feed</h1>

        <p class="text-body-2 text-grey">
          Daily activities, therapy moments, and learning updates.
        </p>
      </div>

      <v-btn
        v-if="canManageActivity"
        color="primary"
        prepend-icon="mdi-plus"
        size="large"
        @click="goToCreate"
      >
        New Post
      </v-btn>
    </div>

    <!-- SEARCH -->
    <v-card elevation="1" class="mb-4 rounded-xl">
      <v-card-text>
        <v-text-field
          v-model="search"
          label="Search Child"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
        />
      </v-card-text>
    </v-card>

    <!-- PAGE LOADING -->
    <div v-if="pageLoading">
      <v-card v-for="n in 3" :key="n" class="mb-4 rounded-xl">
        <v-skeleton-loader
          type="
            article,
            image,
            paragraph
          "
        />
      </v-card>
    </div>

    <!-- FEED -->
    <div v-else class="feed-wrapper">
      <!-- POST CARD -->
      <v-card
        v-for="activity in activities"
        :key="activity.id"
        class="mb-4 rounded-xl"
        elevation="1"
      >
        <v-card-text>
          <!-- HEADER -->
          <div class="d-flex justify-space-between align-start mb-4">
            <!-- LEFT -->
            <div>
              <!-- SESSION DATE -->
              <div class="text-caption text-grey mb-1">
                {{ formatDate(activity.therapy_session?.therapy_date) }}
              </div>

              <!-- CHILD -->
              <div class="text-h6 font-weight-bold">
                {{ activity.therapy_session?.registration?.child?.name }}
              </div>

              <!-- PROGRAM -->
              <div class="text-body-2 text-grey">
                {{ activity.therapy_session?.registration?.program?.name }}
              </div>
            </div>

            <!-- RIGHT -->
            <div v-if="canManageActivity" class="d-flex align-center ga-2">
              <!-- ACTION MENU -->
              <v-menu>
                <template #activator="{ props }">
                  <v-btn icon variant="text" size="small" v-bind="props">
                    <v-icon>mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>

                <v-list density="comfortable">
                  <!-- EDIT -->
                  <v-list-item @click="goToEdit(activity.id)">
                    <v-list-item-title>Edit</v-list-item-title>
                  </v-list-item>

                  <!-- DELETE -->
                  <v-list-item @click="deleteActivity(activity.id)">
                    <v-list-item-title class="text-error">Delete</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>

          <!-- PHOTOS -->
          <v-carousel
            v-if="activity.photos?.length"
            height="500"
            hide-delimiter-background
            delimiter-icon="mdi-circle"
            class="mb-4 rounded-lg"
            show-arrows="hover"
          >
            <v-carousel-item v-for="photo in activity.photos" :key="photo.id">
              <v-img
                :src="storageUrl(photo.photo)"
                height="100%"
                contain
                class="activity-image cursor-pointer"
                @click="openImage(photo.photo)"
              />
            </v-carousel-item>
          </v-carousel>

          <!-- VIDEO -->
          <div v-if="activity.video" class="mb-4">
            <video controls preload="none" class="activity-video">
              <source :src="storageUrl(activity.video)" type="video/mp4" />
            </video>
          </div>

          <!-- THERAPIST -->
          <div class="text-h6 font-weight-bold">
            {{ activity.therapy_session?.therapist?.name }}
          </div>

          <!-- CAPTION -->
          <div v-if="activity.caption" class="text-body-1 mb-4">
            <!-- TEXT -->
            <span>
              {{
                isExpanded(activity.id)
                  ? activity.caption
                  : activity.caption.length > 125
                    ? activity.caption.slice(0, 125) + '...'
                    : activity.caption
              }}
            </span>

            <!-- MORE BUTTON -->
            <span
              v-if="activity.caption.length > 125"
              class="caption-toggle"
              @click="toggleCaption(activity.id)"
            >
              {{ isExpanded(activity.id) ? 'less' : 'more' }}
            </span>
          </div>
        </v-card-text>
      </v-card>

      <!-- LOAD MORE TRIGGER -->
      <div ref="loadMoreTrigger" class="load-more-trigger">
        <v-progress-circular v-if="loadingMore" indeterminate size="28" />
      </div>
    </div>

    <!-- IMAGE PREVIEW -->
    <v-dialog v-model="imageDialog" fullscreen>
      <div class="image-preview-wrapper">
        <v-btn icon="mdi-close" class="close-btn" @click="imageDialog = false" />

        <img :src="selectedImage" alt="Activity Photo" class="preview-image" />
      </div>
    </v-dialog>

    <!-- DELETE LOADING -->
    <v-dialog v-model="deleting" persistent width="320">
      <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
        <v-progress-circular indeterminate color="primary" size="56" width="5" />

        <div class="text-h6 font-weight-medium mt-6">Deleting Activity...</div>

        <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
      </v-card>
    </v-dialog>

    <!-- PAGE ACTION LOADING -->
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
  </div>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { useRouter } from 'vue-router'

import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'

import debounce from 'lodash/debounce'

import api from '@/services/api'

import { useAuthStore } from '@/stores/auth'

// ======================
// AUTH
// ======================

const authStore = useAuthStore()

// ======================
// ROUTER
// ======================

const router = useRouter()

// ======================
// STATE
// ======================

const activities = ref([])

const page = ref(1)

const lastPage = ref(1)

const loading = ref(false)

const loadingMore = ref(false)

const fetchingMore = ref(false)

const pageLoading = ref(true)

const deleting = ref(false)

const search = ref('')

const expandedCaptions = ref([])

const loadMoreTrigger = ref(null)

const pageActionLoading = ref(false)

const pageActionText = ref('Loading...')

const snackbar = ref(false)

const snackbarText = ref('')

const snackbarColor = ref('success')

const imageDialog = ref(false)

const selectedImage = ref('')

let observer = null

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text

  snackbarColor.value = color

  snackbar.value = true
}

// ======================
// PERMISSION
// ======================

const canManageActivity = computed(() => {
  return authStore.isAdmin || authStore.isTherapist
})

// ======================
// STORAGE URL
// ======================

const storageUrl = (path) => {
  return `${import.meta.env.VITE_STORAGE_URL}/${path}`
}

const openImage = (path) => {
  selectedImage.value = storageUrl(path)

  imageDialog.value = true
}

// ======================
// CAPTION
// ======================

const isExpanded = (id) => {
  return expandedCaptions.value.includes(id)
}

const toggleCaption = (id) => {
  if (isExpanded(id)) {
    expandedCaptions.value = expandedCaptions.value.filter((item) => item !== id)
  } else {
    expandedCaptions.value.push(id)
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
// FETCH ACTIVITIES
// ======================

const fetchActivities = async (reset = false) => {
  try {
    if (reset) {
      page.value = 1

      activities.value = []
    }

    loading.value = true

    if (reset || page.value === 1) {
      pageLoading.value = true
    } else {
      loadingMore.value = true
    }

    const res = await api.get('/activities', {
      params: {
        page: page.value,

        per_page: 10,

        search: search.value,
      },
    })

    const newData = res.data.data

    activities.value = [...activities.value, ...newData]

    lastPage.value = res.data.last_page
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false

    loadingMore.value = false

    pageLoading.value = false
  }
}

// ======================
// SEARCH
// ======================

const debouncedFetch = debounce(() => {
  fetchActivities(true)
}, 500)

watch(search, () => {
  debouncedFetch()
})

// ======================
// LOAD MORE
// ======================

const loadMore = async () => {
  if (fetchingMore.value || loadingMore.value) {
    return
  }

  if (page.value >= lastPage.value) {
    return
  }

  try {
    fetchingMore.value = true

    page.value++

    await fetchActivities()
  } finally {
    fetchingMore.value = false
  }
}

// ======================
// CREATE
// ======================

const goToCreate = async () => {
  pageActionText.value = 'Opening Activity Form...'

  pageActionLoading.value = true

  try {
    await router.push('/activity/create')
  } finally {
    setTimeout(() => {
      pageActionLoading.value = false
    }, 300)
  }
}

// ======================
// EDIT
// ======================

const goToEdit = async (id) => {
  pageActionText.value = 'Opening Activity...'

  pageActionLoading.value = true

  try {
    await router.push(`/activity/${id}/edit`)
  } finally {
    setTimeout(() => {
      pageActionLoading.value = false
    }, 300)
  }
}

// ======================
// DELETE
// ======================

const deleteActivity = async (id) => {
  const confirmed = confirm('Delete this activity?')

  if (!confirmed) return

  try {
    deleting.value = true

    await api.delete(`/activities/${id}`)

    activities.value = activities.value.filter((activity) => activity.id !== id)

    showSnackbar('Activity deleted successfully')
  } catch (err) {
    console.error(err)

    showSnackbar('Failed to delete activity', 'error')
  } finally {
    deleting.value = false
  }
}

// ======================
// INIT
// ======================

onMounted(async () => {
  await fetchActivities()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    },

    {
      threshold: 0.5,
    },
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
})

// ======================
// CLEANUP
// ======================

onBeforeUnmount(() => {
  debouncedFetch.cancel()

  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.activity-page {
  width: 100%;
}

.page-header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 16px;

  flex-wrap: wrap;
}

.feed-wrapper {
  width: 100%;
}

.activity-card {
  transition: all 0.2s ease;
}

.activity-card:hover {
  transform: translateY(-2px);
}

.activity-content {
  line-height: 1.8;
}

.activity-image {
  background: #f5f5f5;
}

.activity-video {
  width: 100%;

  max-height: 500px;

  border-radius: 16px;

  background: black;
}

.caption-toggle {
  margin-left: 6px;

  font-weight: 600;

  color: rgb(25, 118, 210);

  cursor: pointer;
}

.cursor-pointer {
  cursor: pointer;
}

.load-more-trigger {
  display: flex;

  justify-content: center;

  align-items: center;

  height: 80px;
}

.image-preview-wrapper {
  width: 100vw;
  height: 100vh;

  background: black;

  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 95vw;
  max-height: 95vh;

  object-fit: contain;
}

.close-btn {
  position: fixed !important;

  top: 16px;
  right: 16px;

  z-index: 9999;
}

.photo-grid {
  display: grid;

  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));

  gap: 12px;
}

.v-carousel {
  border-radius: 16px;

  overflow: hidden;
}

/* carousel controls */

:deep(.v-window__left),
:deep(.v-window__right) {
  opacity: 0.35;

  transition: opacity 0.2s ease;
}

:deep(.v-window__left .v-btn),
:deep(.v-window__right .v-btn) {
  width: 32px !important;
  height: 32px !important;
}

:deep(.v-carousel__controls__item) {
  transform: scale(0.7);

  opacity: 0.5;
}

:deep(.v-carousel__controls__item--active) {
  opacity: 1;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;

    align-items: stretch;
  }

  .feed-wrapper {
    max-width: 100%;

    padding: 0 4px;
  }

  .activity-card {
    border-radius: 16px;
  }

  .activity-content {
    font-size: 14px;

    line-height: 1.7;
  }

  .activity-video {
    max-height: 260px;
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

  .v-card-text {
    padding: 16px !important;
  }

  .d-flex.ga-2 {
    flex-wrap: wrap;
  }

  .d-flex.ga-6 {
    gap: 16px !important;

    flex-wrap: wrap;
  }

  video.activity-video {
    border-radius: 12px;
  }
}
</style>
