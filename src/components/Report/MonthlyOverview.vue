<template>
  <div class="monthly-overview-page">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold">Monthly Overview</h1>
      <div class="text-body-2 text-grey">View scheduled sessions by child and category.</div>
    </div>

    <v-card elevation="1" class="rounded-lg">
      <v-card-text>
        <v-row class="mb-2">
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              item-title="title"
              item-value="value"
              label="Category"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="selectedMonth"
              :items="monthOptions"
              label="Month"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="selectedYear"
              :items="yearOptions"
              label="Year"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
          <div class="d-flex align-center justify-space-between ga-3">
            <span>{{ error }}</span>
            <v-btn size="small" variant="text" @click="fetchMonthlyOverview">Retry</v-btn>
          </div>
        </v-alert>

        <v-data-table
          class="monthly-overview-table"
          density="compact"
          v-else
          :headers="tableHeaders"
          :items="filteredRows"
          :loading="loading"
          :items-per-page="10"
          :items-per-page-options="[10, 25, 50]"
          :sort-by="[{ key: 'child_name', order: 'asc' }]"
          loading-text="Loading monthly overview..."
          no-data-text="No sessions were found for this month."
        >
          <template #item.child_name="{ item }">
            <div class="child-name-cell">
              <div class="font-weight-medium">{{ item.child_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.category }}</div>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import api from '@/services/api'

const currentYear = new Date().getFullYear()
const selectedCategory = ref('all')
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedYear = ref(currentYear)
const rows = ref([])
const loading = ref(false)
const error = ref('')

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  title: new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2000, index, 1)),
  value: index + 1,
}))

const yearOptions = Array.from(
  { length: Math.max(currentYear - 2015, 0) + 3 },
  (_, index) => currentYear + 2 - index,
)

const tableHeaders = [
  { title: 'Child Name', key: 'child_name' },
  { title: 'Total Sessions', key: 'total_sessions', align: 'end', width: '108px' },
]

const categoryOptions = computed(() => [
  { title: 'All', value: 'all' },
  ...Array.from(new Set(rows.value.map((row) => row.category)))
    .sort((first, second) => first.localeCompare(second))
    .map((category) => ({ title: category, value: category })),
])

const filteredRows = computed(() =>
  selectedCategory.value === 'all'
    ? rows.value
    : rows.value.filter((row) => row.category === selectedCategory.value),
)

const fetchMonthlyOverview = async () => {
  loading.value = true
  error.value = ''

  try {
    const month = String(selectedMonth.value).padStart(2, '0')
    const startDate = `${selectedYear.value}-${month}-01`
    const finalDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
    const endDate = `${selectedYear.value}-${month}-${String(finalDay).padStart(2, '0')}`

    const response = await api.get('/therapy-sessions/grid', {
      params: { start_date: startDate, end_date: endDate },
    })

    const rowsByChildCategory = new Map()

    ;(Array.isArray(response.data) ? response.data : []).forEach((session) => {
      if (!session.child_id) return

      const category = session.program_category || 'Category unavailable'
      const key = `${session.child_id}|${category}`

      if (!rowsByChildCategory.has(key)) {
        rowsByChildCategory.set(key, {
          row_key: key,
          child_id: session.child_id,
          child_name: session.child_name || 'Unknown child',
          category,
          total_sessions: 0,
        })
      }

      rowsByChildCategory.get(key).total_sessions += 1
    })

    rows.value = Array.from(rowsByChildCategory.values())

    if (
      selectedCategory.value !== 'all' &&
      !rows.value.some((row) => row.category === selectedCategory.value)
    ) {
      selectedCategory.value = 'all'
    }
  } catch (requestError) {
    console.error('Error loading monthly school session overview:', requestError)
    error.value = 'Failed to load the monthly overview.'
  } finally {
    loading.value = false
  }
}

watch([selectedMonth, selectedYear], fetchMonthlyOverview)

fetchMonthlyOverview()
</script>

<style scoped>
.monthly-overview-page {
  width: 100%;
}

.monthly-overview-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}

.monthly-overview-table :deep(th:last-child),
.monthly-overview-table :deep(td:last-child) {
  width: 108px;
  min-width: 108px;
  white-space: nowrap;
}

.monthly-overview-table :deep(th:last-child .v-data-table-header__content) {
  white-space: normal;
  justify-content: flex-end;
}

.child-name-cell {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  padding: 4px 0;
}
</style>
