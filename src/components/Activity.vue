<template>
  <v-container fluid class="py-6">
    <!-- HEADER -->
    <v-row>
      <div class="mb-5">
        <h1 class="text-h4 font-weight-bold">Activity Feed</h1>

        <div class="text-body-2 text-grey mt-2">
          Daily activities, learning moments, and updates.
        </div>
      </div>
    </v-row>

    <v-row justify="end">
      <v-btn color="primary" prepend-icon="mdi-plus" to="/activity/create">New Post</v-btn>
    </v-row>

    <!-- SEARCH -->
    <v-row>
      <v-text-field
        v-model="search"
        placeholder="Search Child"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        rounded="lg"
        clearable
        class="mb-4"
        @keyup.enter="searchActivity"
        @click:clear="clearSearch"
      />
    </v-row>

    <!-- LOADING -->

    <v-row v-if="initialLoading">
      <v-col v-for="i in 3" :key="i" cols="12" sm="10" md="8" lg="7" xl="6" class="mx-auto">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <!-- FEED -->

    <div v-else>
      <!-- ACTIVITY LIST -->

      <div v-for="activity in activities" :key="activity.id" class="activity-wrapper">
        <v-card rounded="xl" elevation="1" class="activity-card">
          <!-- TOP -->

          <v-card-text>
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-caption text-grey">
                  {{ formatDate(activity.created_at) }}
                </div>

                <!-- CATEGORY -->

                <div class="text-h6 font-weight-bold mt-2">
                  {{ activity.program_category?.name }}
                </div>

                <div class="text-caption text-medium-emphasis mt-1">
                  {{ getSessionText(activity) }}
                </div>

                <!-- CHILDREN -->

                <div v-if="activity.children?.length" class="mb-4 mt-3">
                  <div class="d-flex flex-wrap align-center ga-2">
                    <v-chip
                      v-for="child in visibleChildren(activity)"
                      :key="child.id"
                      size="small"
                      variant="tonal"
                      prepend-icon="mdi-account"
                    >
                      {{ child.name }}
                    </v-chip>

                    <v-btn
                      v-if="activity.children.length > CHILDREN_PREVIEW_LIMIT"
                      variant="text"
                      size="small"
                      class="children-toggle"
                      @click="toggleChildren(activity.id)"
                    >
                      {{
                        areChildrenExpanded(activity.id)
                          ? 'Show less'
                          : `+${remainingChildrenCount(activity)} more`
                      }}
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- ACTION -->

              <div v-if="canManageActivity">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn icon variant="text" size="small" v-bind="props">
                      <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                  </template>

                  <v-list density="comfortable">
                    <v-list-item @click="goToEdit(activity.id)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>

                    <v-list-item @click="confirmDelete(activity)">
                      <v-list-item-title class="text-error">Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </v-card-text>

          <!-- PHOTO -->

          <v-carousel
            v-if="getPhotos(activity).length"
            height="520"
            hide-delimiters
            show-arrows="hover"
            class="activity-carousel"
          >
            <v-carousel-item v-for="photo in getPhotos(activity)" :key="photo.id">
              <v-img :src="storageUrl(photo.file_path)" height="520" cover />
            </v-carousel-item>
          </v-carousel>

          <v-card-text>
            <!-- VIDEO -->

            <div v-if="getVideo(activity)" class="mb-4">
              <video controls class="activity-video">
                <source
                  :src="storageUrl(getVideo(activity).file_path)"
                  :type="getVideo(activity).mime_type"
                />
              </video>
            </div>

            <!-- DESCRIPTION -->

            <div v-if="activity.description" class="activity-description">
              <div style="white-space: pre-line">
                {{ isExpanded(activity.id) ? activity.description : getShortDescription(activity) }}
              </div>

              <span
                v-if="activity.description.length > 125"
                class="text-primary cursor-pointer"
                @click="toggleDescription(activity.id)"
              >
                {{ isExpanded(activity.id) ? ' View less' : ' View more' }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- INFINITE SCROLL SENTINEL -->

      <div v-if="activities.length && hasMore" v-intersect="onIntersect" class="load-more-sentinel">
        <v-progress-circular v-if="loadingMore" indeterminate color="primary" size="32" width="3" />
      </div>

      <!-- END OF FEED -->

      <div v-else-if="activities.length" class="text-center text-caption text-medium-emphasis py-6">
        All activities have been loaded.
      </div>

      <!-- EMPTY STATE -->

      <v-empty-state
        v-if="!activities.length"
        icon="mdi-post-outline"
        title="No activities found"
        text="
      Try another child name or create
      a new activity.
    "
      />
    </div>
  </v-container>

  <v-dialog v-model="deleteDialog" max-width="420">
    <v-card rounded="xl">
      <v-card-title>Delete Activity</v-card-title>

      <v-card-text>
        Are you sure you want to permanently delete this activity?

        <br />
        <br />

        This action cannot be undone.
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>

        <v-btn color="error" :loading="deleting" @click="deleteActivity">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" timeout="3000">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()

const authStore = useAuthStore()

// ======================
// STATE
// ======================

const activities = ref([])

const initialLoading = ref(false)
const loadingMore = ref(false)

const search = ref('')

const page = ref(1)
const lastPage = ref(1)

const PER_PAGE = 5

const hasMore = computed(() => {
  return page.value < lastPage.value
})

let fetchRequestId = 0

const deleteDialog = ref(false)
const deleting = ref(false)
const activityToDelete = ref(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const expandedDescriptions = ref([])
const expandedChildren = ref([])

const CHILDREN_PREVIEW_LIMIT = 3

// ======================
// PERMISSION
// ======================

const canManageActivity = computed(() => {
  return authStore.isAdmin || authStore.isTherapist
})

// ======================
// FETCH ACTIVITY
// ======================

function mergeUniqueActivities(currentActivities, incomingActivities) {
  const activityMap = new Map(currentActivities.map((activity) => [activity.id, activity]))

  incomingActivities.forEach((activity) => {
    activityMap.set(activity.id, activity)
  })

  return Array.from(activityMap.values())
}

async function fetchActivities({ reset = false } = {}) {
  /*
   * Load-more tidak boleh berjalan jika:
   * - initial request masih berjalan;
   * - load-more sebelumnya belum selesai;
   * - sudah berada di halaman terakhir.
   */
  if (!reset && (initialLoading.value || loadingMore.value || !hasMore.value)) {
    return
  }

  /*
   * Reset menghasilkan request generation baru.
   * Response request lama akan diabaikan.
   */
  const requestId = reset ? ++fetchRequestId : fetchRequestId

  const targetPage = reset ? 1 : page.value + 1

  if (reset) {
    initialLoading.value = true
    loadingMore.value = false

    expandedDescriptions.value = []
    expandedChildren.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response = await api.get('/activities', {
      params: {
        page: targetPage,
        per_page: PER_PAGE,
        search: search.value.trim() || undefined,
      },
    })

    /*
     * Abaikan response lama jika user sudah
     * memulai search/reset baru.
     */
    if (requestId !== fetchRequestId) {
      return
    }

    const incomingActivities = response.data.data ?? []

    if (reset) {
      activities.value = incomingActivities
    } else {
      activities.value = mergeUniqueActivities(activities.value, incomingActivities)
    }

    page.value = response.data.current_page ?? targetPage

    lastPage.value = response.data.last_page ?? 1
  } catch (error) {
    if (requestId !== fetchRequestId) {
      return
    }

    console.error(error)

    if (reset) {
      activities.value = []
      page.value = 1
      lastPage.value = 1
    }

    snackbar.value = true
    snackbarColor.value = 'error'
    snackbarText.value = 'Failed to load activities.'
  } finally {
    if (requestId !== fetchRequestId) {
      return
    }

    initialLoading.value = false
    loadingMore.value = false
  }
}

async function backfillAfterDelete() {
  /*
   * Ambil ulang halaman terakhir yang sudah dimuat.
   * Setelah satu data dihapus, satu postingan dari
   * halaman berikutnya akan bergeser ke halaman ini.
   */
  const targetPage = Math.max(page.value, 1)

  loadingMore.value = true

  try {
    const response = await api.get('/activities', {
      params: {
        page: targetPage,
        per_page: PER_PAGE,
        search: search.value.trim() || undefined,
      },
    })

    const incomingActivities = response.data.data ?? []

    activities.value = mergeUniqueActivities(activities.value, incomingActivities)

    lastPage.value = response.data.last_page ?? 1

    /*
     * Halaman terakhir bisa berkurang setelah delete.
     */
    page.value = Math.min(targetPage, lastPage.value)

    page.value = Math.max(page.value, 1)
  } catch (error) {
    /*
     * Delete tetap dianggap berhasil.
     * Kegagalan backfill tidak mengembalikan
     * Activity yang sudah dihapus.
     */
    console.error('Failed to backfill activities after delete.', error)
  } finally {
    loadingMore.value = false
  }
}

// ======================
// SEARCH
// ======================

function searchActivity() {
  fetchActivities({
    reset: true,
  })
}

function clearSearch() {
  search.value = ''

  fetchActivities({
    reset: true,
  })
}

// ======================
// INFINITE SCROLL
// ======================

function onIntersect(isIntersecting) {
  if (!isIntersecting) {
    return
  }

  fetchActivities()
}

// ======================
// FORMAT
// ======================

function formatDate(date) {
  if (!date) return '-'

  const formattedDate = new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const formattedTime = new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return `${formattedDate} at ${formattedTime}`
}

// ======================
// MEDIA
// ======================

function getPhotos(activity) {
  return activity.media?.filter((media) => media.media_type === 'photo') ?? []
}

function getVideo(activity) {
  return activity.media?.find((media) => media.media_type === 'video')
}

function isExpanded(activityId) {
  return expandedDescriptions.value.includes(activityId)
}

function toggleDescription(activityId) {
  if (isExpanded(activityId)) {
    expandedDescriptions.value = expandedDescriptions.value.filter((id) => id !== activityId)
  } else {
    expandedDescriptions.value.push(activityId)
  }
}

function getShortDescription(activity) {
  const text = activity.description ?? ''

  if (text.length <= 125) {
    return text
  }

  return text.substring(0, 125) + '...'
}

function getSessionText(activity) {
  const session = activity.program_category_session_time

  if (!session) {
    return '-'
  }

  const startTime = session.start_time?.slice(0, 5)

  const endTime = session.end_time?.slice(0, 5)

  const timeRange = startTime && endTime ? `${startTime} - ${endTime}` : null

  return [session.session_name, timeRange].filter(Boolean).join(' • ')
}

const areChildrenExpanded = (activityId) => {
  return expandedChildren.value.includes(activityId)
}

const toggleChildren = (activityId) => {
  if (areChildrenExpanded(activityId)) {
    expandedChildren.value = expandedChildren.value.filter((id) => id !== activityId)

    return
  }

  expandedChildren.value.push(activityId)
}

const visibleChildren = (activity) => {
  const children = activity.children ?? []

  if (areChildrenExpanded(activity.id)) {
    return children
  }

  return children.slice(0, CHILDREN_PREVIEW_LIMIT)
}

const remainingChildrenCount = (activity) => {
  return Math.max((activity.children?.length ?? 0) - CHILDREN_PREVIEW_LIMIT, 0)
}

// ======================
// STORAGE
// ======================

function storageUrl(path) {
  if (!path) {
    return ''
  }

  return `${import.meta.env.VITE_STORAGE_URL}/${path}`
}

// ======================
// ACTION
// ======================

function goToEdit(id) {
  router.push(`/activity/${id}/edit`)
}

function confirmDelete(activity) {
  activityToDelete.value = activity
  deleteDialog.value = true
}

async function deleteActivity() {
  if (!activityToDelete.value) {
    return
  }

  const deletedActivityId = activityToDelete.value.id

  deleting.value = true

  try {
    await api.delete(`/activities/${deletedActivityId}`)

    /*
     * Hapus langsung dari tampilan.
     */
    activities.value = activities.value.filter((activity) => activity.id !== deletedActivityId)

    /*
     * Bersihkan state View More/Show Less
     * milik Activity yang dihapus.
     */
    expandedDescriptions.value = expandedDescriptions.value.filter((id) => id !== deletedActivityId)

    expandedChildren.value = expandedChildren.value.filter((id) => id !== deletedActivityId)

    deleteDialog.value = false
    activityToDelete.value = null

    snackbar.value = true
    snackbarColor.value = 'success'
    snackbarText.value = 'Activity deleted successfully.'

    /*
     * Isi kembali posisi kosong jika masih ada
     * Activity pada halaman berikutnya.
     */
    await backfillAfterDelete()
  } catch (error) {
    console.error(error)

    snackbar.value = true
    snackbarColor.value = 'error'
    snackbarText.value = error.response?.data?.message ?? 'Failed to delete activity.'
  } finally {
    deleting.value = false
  }
}

// ======================
// INIT
// ======================

onMounted(() => {
  fetchActivities({
    reset: true,
  })
})
</script>

<style scoped>
.activity-card {
  border: 1px solid #e0e0e0;
}

.activity-video {
  width: 100%;
  max-height: 400px;
  border-radius: 12px;
}

.activity-wrapper {
  max-width: 760px;
  margin: 0 auto 20px;
}

.activity-carousel {
  background: #f5f5f5;
}

.activity-carousel :deep(.v-img__img) {
  object-fit: contain;
}

.children-toggle {
  font-weight: 600;
  text-transform: none;
}

.load-more-sentinel {
  min-height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
