<template>
  <v-container fluid class="school-sessions-report">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">School Sessions</h1>
      <div class="text-body-2 text-medium-emphasis mt-1">
        View session balances across each child’s registrations.
      </div>
    </div>

    <v-card rounded="lg" variant="outlined" class="mb-6">
      <v-card-title>Filters</v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="filters.programCategoryId"
              :items="programCategories"
              item-title="name"
              item-value="id"
              label="Program Category"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.childName"
              label="Child Name"
              variant="outlined"
              density="comfortable"
              clearable
              hide-details
              @keyup.enter="applyFilters"
            />
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn color="primary" prepend-icon="mdi-magnify" :loading="loading" @click="applyFilters">
            Apply Filters
          </v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-filter-off-outline" :disabled="loading" @click="resetFilters">
            Reset Filters
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <v-card rounded="lg" elevation="1">
      <v-card-title>Session Summary</v-card-title>
      <v-divider />
      <v-data-table-server
        v-model:page="page"
        v-model:items-per-page="perPage"
        v-model:sort-by="sortBy"
        :headers="headers"
        :items="rows"
        :items-length="totalItems"
        :items-per-page-options="[10, 25, 50]"
        :loading="loading"
        item-value="id"
        class="school-sessions-table"
        loading-text="Loading school sessions..."
        no-data-text="No school session records found."
      >
        <template #item.id_number="{ item }">
          {{ item.id_number || '—' }}
        </template>
        <template #item.program_category="{ item }">
          {{ item.program_category || '—' }}
        </template>
        <template #item.session_started_at="{ item }">
          {{ formatDate(item.session_started_at) }}
        </template>
        <template #item.session_expired_at="{ item }">
          {{ formatDate(item.session_expired_at) }}
        </template>
        <template #no-data>
          <div class="text-center py-10">
            <v-icon icon="mdi-school-outline" size="48" class="mb-3" />
            <div class="text-subtitle-1">No school session records found</div>
            <div class="text-body-2 text-medium-emphasis mt-1">
              Try changing the filters.
            </div>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-snackbar v-model="snackbar" color="error" location="top end">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'

interface ProgramCategory {
  id: number
  name: string
}

interface SchoolSessionRow {
  id: number
  id_number: string | null
  child_name: string
  program_category: string
  session_started_at: string | null
  session_expired_at: string | null
  total_sessions: number
  used_sessions: number
  remaining_sessions: number
}

const headers = [
  { title: 'ID Number', key: 'id_number' },
  { title: 'Child Name', key: 'child_name' },
  { title: 'Program Category', key: 'program_category' },
  { title: 'Enrollment date', key: 'session_started_at' },
  { title: 'Sessions expired date', key: 'session_expired_at' },
  { title: 'Total Sessions', key: 'total_sessions', align: 'end' as const },
  { title: 'Used Sessions', key: 'used_sessions', align: 'end' as const },
  { title: 'Remaining Sessions', key: 'remaining_sessions', align: 'end' as const },
]

function formatDate(value: string | null): string {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

const filters = reactive({
  programCategoryId: null as number | null,
  childName: '',
})
const appliedFilters = reactive({
  programCategoryId: null as number | null,
  childName: '',
})
const programCategories = ref<ProgramCategory[]>([])
const rows = ref<SchoolSessionRow[]>([])
const page = ref(1)
const perPage = ref(10)
const totalItems = ref(0)
const sortBy = ref([{ key: 'child_name', order: 'asc' as const }])
const loading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
let fetchRequestId = 0

async function fetchMasterData() {
  try {
    const response = await api.get('/master-data')
    programCategories.value = response.data.program_categories ?? []
  } catch (error) {
    console.error('Failed to load program categories.', error)
  }
}

async function fetchRows() {
  const requestId = ++fetchRequestId
  loading.value = true

  try {
    const sort = sortBy.value[0]
    const response = await api.get('/reports/school-sessions', {
      params: {
        program_category_id: appliedFilters.programCategoryId ?? undefined,
        child_name: appliedFilters.childName || undefined,
        page: page.value,
        per_page: perPage.value,
        sort_by: sort?.key ?? 'child_name',
        sort_order: sort?.order ?? 'asc',
      },
    })

    if (requestId !== fetchRequestId) return
    rows.value = response.data.data ?? []
    totalItems.value = Number(response.data.total ?? 0)
  } catch (error: any) {
    if (requestId !== fetchRequestId) return
    console.error('Failed to load school sessions report.', error)
    rows.value = []
    totalItems.value = 0
    snackbarText.value = error.response?.data?.message ?? 'Failed to load school sessions report.'
    snackbar.value = true
  } finally {
    if (requestId === fetchRequestId) loading.value = false
  }
}

function reloadFromFirstPage() {
  if (page.value !== 1) {
    page.value = 1
    return
  }
  fetchRows()
}

function applyFilters() {
  appliedFilters.programCategoryId = filters.programCategoryId
  appliedFilters.childName = filters.childName.trim()
  reloadFromFirstPage()
}

function resetFilters() {
  filters.programCategoryId = null
  filters.childName = ''
  appliedFilters.programCategoryId = null
  appliedFilters.childName = ''
  reloadFromFirstPage()
}

watch([page, perPage, sortBy], fetchRows, { deep: true })

onMounted(async () => {
  await Promise.all([fetchMasterData(), fetchRows()])
})
</script>

<style scoped>
.school-sessions-report {
  max-width: 1600px;
}

.school-sessions-table {
  overflow-x: auto;
}
</style>
