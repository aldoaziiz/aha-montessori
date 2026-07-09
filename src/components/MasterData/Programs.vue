<template>
  <div class="programs-content">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">{{ pageTitle }}</h1>
        <p class="text-body2 text-grey">{{ pageSubtitle }}</p>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="router.push('/programs/create')">
        New Program
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="1">
          <v-card flat>
            <template v-slot:text>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="search"
                    label="Search Programs"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    hide-details
                    density="compact"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-autocomplete
                    v-model="selectedClinic"
                    :items="clinics"
                    item-title="name"
                    item-value="id"
                    label="Filter Clinic"
                    variant="outlined"
                    hide-details
                    density="compact"
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-autocomplete
                    v-model="selectedCategory"
                    :items="programCategories"
                    item-title="name"
                    item-value="id"
                    label="Filter Category"
                    variant="outlined"
                    hide-details
                    density="compact"
                    clearable
                  />
                </v-col>
              </v-row>
            </template>

            <v-data-table-server
              :headers="headers"
              :items="programs"
              :items-length="totalPrograms"
              :loading="loading"
              :page="page"
              :items-per-page="itemsPerPage"
              :sort-by="sortBy"
              @update:options="onOptionsChange"
            >
              <template v-slot:item.clinic="{ item }">
                {{ item.clinic?.name || '-' }}
              </template>
              <template v-slot:item.payer="{ item }">
                {{ item.payer?.name || '-' }}
              </template>
              <template v-slot:item.category="{ item }">
                {{ item.category?.name || '-' }}
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="Number(item.status?.id) === 1 ? 'green' : 'grey'">
                  {{ item.status?.name || '-' }}
                </v-chip>
              </template>
              <template #item.session_count="{ item }">{{ item.session_count }}</template>
              <template v-slot:item.price="{ item }">
                {{ formatCurrency(item.price) }}
              </template>
              <template v-slot:item.actions="{ item }">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="small" color="white">
                      Action
                      <v-icon right>mdi-chevron-down</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item @click="openDetails(item)">
                      <v-list-item-title>Details</v-list-item-title>
                    </v-list-item>

                    <v-list-item @click="goToEdit(item.id)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>

                    <v-list-item @click="toggleStatus(item)">
                      <v-list-item-title>
                        {{ Number(item.status?.id) === 1 ? '🔴 Deactivate' : '🟢 Activate' }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table-server>
          </v-card>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="detailsDialog" max-width="700" scrollable>
      <v-card rounded="xl">
        <v-card-title class="d-flex justify-space-between align-center">
          <div class="text-h6 font-weight-bold">Program Details</div>
          <v-btn icon variant="text" @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text
          v-if="detailsLoading"
          class="py-6 d-flex justify-center align-center"
          style="min-height: 250px"
        >
          <div class="text-center">
            <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
            <div class="text-body-2 text-grey">Loading program details...</div>
          </div>
        </v-card-text>

        <v-card-text v-else-if="selectedProgram" class="py-6">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-label">Name</div>
              <div class="detail-value">{{ selectedProgram.name || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Clinic</div>
              <div class="detail-value">{{ selectedProgram.clinic?.name || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Category</div>
              <div class="detail-value">{{ selectedProgram.category?.name || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Session Count</div>
              <div class="detail-value">{{ selectedProgram.session_count || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Payer</div>
              <div class="detail-value">{{ selectedProgram.payer?.name || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Price</div>
              <div class="detail-value">{{ formatCurrency(selectedProgram.price) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">List Number</div>
              <div class="detail-value">{{ selectedProgram.order_number || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Status</div>
              <div class="detail-value">{{ selectedProgram.status?.name || '-' }}</div>
            </v-col>
            <v-col cols="12">
              <div class="detail-label">Description</div>
              <div class="detail-value">{{ selectedProgram.description || '-' }}</div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-text v-else class="py-6">
          <div class="text-body-2 text-grey">No program selected.</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
    {{ snackbarText }}
  </v-snackbar>

  <v-dialog v-model="statusLoading" persistent width="320">
    <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />

      <div class="text-h6 font-weight-medium mt-6">Processing...</div>

      <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()

const pageTitle = 'Programs'
const pageSubtitle = 'Manage and view available program offerings'

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const search = ref('')
const programs = ref<any[]>([])
const totalPrograms = ref(0)
const loading = ref(false)
const detailsDialog = ref(false)
const detailsLoading = ref(false)
const selectedProgram = ref<any>(null)

const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref<any[]>([])
const initialized = ref(false)

const clinics = ref([])
const programCategories = ref([])

const selectedClinic = ref(null)
const selectedCategory = ref(null)

const statusLoading = ref(false)

const goToEdit = (id: number) => {
  router.push(`/programs/${id}/edit`)
}

const headers = [
  { title: 'List Number', key: 'order_number' },
  { title: 'Name', key: 'name' },
  { title: 'Session', key: 'session_count' },
  { title: 'Payer', key: 'payer' },
  { title: 'Price', key: 'price' },
  { title: 'Clinic', key: 'clinic' },
  { title: 'Category', key: 'category' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'center' as const },
]

const fetchMasterData = async () => {
  try {
    const res = await api.get('/master-data')

    clinics.value = res.data.clinics
    programCategories.value = res.data.program_categories
  } catch (err) {
    console.error(err)
  }
}

const fetchPrograms = async () => {
  loading.value = true

  try {
    const params: any = {
      page: page.value,
      limit: itemsPerPage.value,
    }

    if (search.value) {
      params.search = search.value
    }

    if (sortBy.value.length > 0) {
      params.sort_by = sortBy.value[0].key
      params.sort_order = sortBy.value[0].order === 'desc' ? 'desc' : 'asc'
    }

    if (selectedClinic.value) {
      params.clinic_id = selectedClinic.value
    }

    if (selectedCategory.value) {
      params.program_category_id = selectedCategory.value
    }

    const res = await api.get('/programs', { params })

    programs.value = res.data.data || []
    totalPrograms.value = res.data.total ?? programs.value.length
  } catch (error) {
    console.error('Error loading programs:', error)
  } finally {
    loading.value = false
  }
}

const onOptionsChange = (options: any) => {
  if (!initialized.value) {
    initialized.value = true
    page.value = options.page
    itemsPerPage.value = options.itemsPerPage
    sortBy.value = options.sortBy
    fetchPrograms()
    return
  }

  const samePage = page.value === options.page
  const sameItems = itemsPerPage.value === options.itemsPerPage
  const sameSort = JSON.stringify(sortBy.value) === JSON.stringify(options.sortBy)

  if (samePage && sameItems && sameSort) {
    return
  }

  // Reset to page 1 if sort or search changes
  const sortChanged = !sameSort
  if (sortChanged) {
    page.value = 1
  } else {
    page.value = options.page
  }

  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy

  fetchPrograms()
}

const toggleStatus = async (item: any) => {
  const isActive = Number(item.status?.id) === 1

  if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this program?`)) {
    return
  }

  statusLoading.value = true

  try {
    await api.put(`/programs/${item.id}`, {
      status_id: isActive ? 2 : 1,
    })

    await fetchPrograms()
  } catch (error) {
    console.error(error)
  } finally {
    statusLoading.value = false
  }
}

let debouncedTimeout: ReturnType<typeof setTimeout> | null = null

const debouncedFetch = () => {
  if (debouncedTimeout) {
    clearTimeout(debouncedTimeout)
  }

  debouncedTimeout = setTimeout(() => {
    page.value = 1
    fetchPrograms()
  }, 500)
}

watch([search, selectedClinic, selectedCategory], () => {
  debouncedFetch()
})

onUnmounted(() => {
  if (debouncedTimeout) {
    clearTimeout(debouncedTimeout)
  }
})

const openDetails = (program: any) => {
  detailsDialog.value = true
  detailsLoading.value = false
  selectedProgram.value = program
}

const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return '-'
  const amount = Number(value)

  if (Number.isNaN(amount)) return '-'

  return new Intl.NumberFormat('en-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount)
}

onMounted(() => {
  fetchMasterData()
})
</script>

<style scoped>
.detail-label {
  font-size: 12px;
  color: rgb(120, 120, 120);
  margin-bottom: 4px;
}

.detail-value {
  font-size: 15px;
  font-weight: 500;
  word-break: break-word;
}

.programs-content {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
