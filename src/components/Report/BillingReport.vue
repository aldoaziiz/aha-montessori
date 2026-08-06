<template>
  <v-container fluid class="billing-report-page">
    <!-- HEADER -->

    <div class="mb-6">
      <div class="text-h4 font-weight-bold">Billing Report</div>

      <div class="text-body-2 text-medium-emphasis mt-1">
        Review registration billing and payment status.
      </div>
    </div>

    <!-- PERIOD FILTER -->

    <v-card rounded="lg" variant="outlined" class="mb-6">
      <v-card-title>Report Period</v-card-title>

      <v-divider />

      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="period.startMonth"
              :items="months"
              item-title="name"
              item-value="value"
              label="Start Month"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="period.endMonth"
              :items="months"
              item-title="name"
              item-value="value"
              label="End Month"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="period.year"
              :items="years"
              label="Year"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <v-col cols="12" sm="6" md="4" class="d-flex flex-wrap ga-2">
            <v-btn
              color="primary"
              prepend-icon="mdi-filter-check"
              :loading="loading"
              :disabled="loading"
              @click="applyPeriod"
            >
              Apply
            </v-btn>

            <v-btn
              variant="outlined"
              prepend-icon="mdi-refresh"
              :disabled="loading"
              @click="resetPeriod"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- SUMMARY -->

    <v-row class="mb-2">
      <v-col v-for="item in summaryCards" :key="item.title" cols="12" sm="6" lg="3">
        <v-card rounded="lg" elevation="1" height="100%" :loading="loading">
          <v-card-text>
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ item.title }}
                </div>

                <div class="text-h5 font-weight-bold mt-2">
                  {{ item.value }}
                </div>
              </div>

              <v-avatar color="primary" variant="tonal">
                <v-icon>
                  {{ item.icon }}
                </v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- TABLE FILTER -->

    <v-card rounded="lg" variant="outlined" class="mb-6">
      <v-card-title>Billing Filters</v-card-title>

      <v-divider />

      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.registrationNumber"
              label="Registration Number"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.invoiceNumber"
              label="Invoice Number"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.childName"
              label="Child Name"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>

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
            />
          </v-col>

          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="filters.paymentStatus"
              :items="paymentStatuses"
              label="Payment Status"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            color="primary"
            prepend-icon="mdi-magnify"
            :loading="loading"
            :disabled="loading"
            @click="applyFilters"
          >
            Apply Filters
          </v-btn>

          <v-btn
            variant="outlined"
            prepend-icon="mdi-filter-off-outline"
            :disabled="loading"
            @click="resetFilters"
          >
            Reset Filters
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- TABLE -->

    <v-card rounded="lg" elevation="1">
      <v-card-title class="d-flex flex-wrap align-center ga-3">
        <span>Billing Records</span>

        <v-spacer />

        <v-btn variant="outlined" prepend-icon="mdi-file-excel-outline" disabled>
          Export Excel
        </v-btn>

        <v-btn variant="outlined" prepend-icon="mdi-file-pdf-box" disabled>Export PDF</v-btn>
      </v-card-title>

      <v-divider />

      <v-data-table-server
        v-model:page="page"
        v-model:items-per-page="perPage"
        :headers="headers"
        :items="billings"
        :items-length="totalItems"
        :items-per-page-options="[10, 25, 50]"
        :loading="loading"
        item-value="id"
        class="billing-table"
      >
        <template #item.total_billing="{ item }">
          {{ formatCurrency(item.total_billing) }}
        </template>

        <template #item.payment_status="{ item }">
          <v-chip
            :color="
              item.payment_status === 'Paid'
                ? 'success'
                : item.payment_status === 'Waiting'
                  ? 'info'
                  : 'warning'
            "
            size="small"
            variant="tonal"
          >
            {{ item.payment_status }}
          </v-chip>
        </template>

        <template #no-data>
          <div class="text-center py-10">
            <v-icon icon="mdi-receipt-text-outline" size="48" class="mb-3" />

            <div class="text-subtitle-1">No billing records found</div>

            <div class="text-body-2 text-medium-emphasis mt-1">
              Billing data will appear here after the report endpoint is connected.
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
import { computed, onMounted, reactive, ref, watch } from 'vue'

import api from '@/services/api'

interface BillingRow {
  id: number
  registration_number: string
  invoice_number: string
  child_name: string
  program_category: string
  total_billing: number
  payment_status: 'Unpaid' | 'Waiting' | 'Paid'
}

interface ProgramCategory {
  id: number
  name: string
}

interface BillingSummary {
  totalBilling: number
  totalPaid: number
  totalUnpaid: number
  totalRegistrations: number
}

interface BillingFilters {
  registrationNumber: string
  invoiceNumber: string
  childName: string
  programCategoryId: number | null
  paymentStatus: string | null
}

const currentYear = new Date().getFullYear()

// ======================
// OPTIONS
// ======================

const months = [
  { name: 'January', value: 1 },
  { name: 'February', value: 2 },
  { name: 'March', value: 3 },
  { name: 'April', value: 4 },
  { name: 'May', value: 5 },
  { name: 'June', value: 6 },
  { name: 'July', value: 7 },
  { name: 'August', value: 8 },
  { name: 'September', value: 9 },
  { name: 'October', value: 10 },
  { name: 'November', value: 11 },
  { name: 'December', value: 12 },
]

const years = computed(() => {
  return Array.from({ length: 7 }, (_, index) => currentYear + 1 - index)
})

const paymentStatuses = ['Unpaid', 'Waiting', 'Paid']

// ======================
// PERIOD
// ======================

const period = reactive({
  startMonth: 1,
  endMonth: 12,
  year: currentYear,
})

/*
 * Periode yang sudah benar-benar
 * diterapkan ke request API.
 */
const appliedPeriod = reactive({
  startMonth: 1,
  endMonth: 12,
  year: currentYear,
})

// ======================
// FILTERS
// ======================

const filters = reactive<BillingFilters>({
  registrationNumber: '',
  invoiceNumber: '',
  childName: '',
  programCategoryId: null,
  paymentStatus: null,
})

/*
 * Filter input dipisahkan dari filter aktif.
 * Mengubah field tidak langsung memanggil API
 * sampai tombol Apply Filters ditekan.
 */
const appliedFilters = reactive<BillingFilters>({
  registrationNumber: '',
  invoiceNumber: '',
  childName: '',
  programCategoryId: null,
  paymentStatus: null,
})

const programCategories = ref<ProgramCategory[]>([])

// ======================
// TABLE
// ======================

const billings = ref<BillingRow[]>([])

const page = ref(1)
const perPage = ref(10)
const totalItems = ref(0)

const loading = ref(false)

let fetchRequestId = 0

// ======================
// FEEDBACK
// ======================

const snackbar = ref(false)
const snackbarText = ref('')

// ======================
// SUMMARY
// ======================

const summary = reactive<BillingSummary>({
  totalBilling: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  totalRegistrations: 0,
})

const summaryCards = computed(() => [
  {
    title: 'Total Billing',
    value: formatCurrency(summary.totalBilling),
    icon: 'mdi-receipt-text-outline',
  },
  {
    title: 'Total Paid',
    value: formatCurrency(summary.totalPaid),
    icon: 'mdi-cash-check',
  },
  {
    title: 'Total Unpaid',
    value: formatCurrency(summary.totalUnpaid),
    icon: 'mdi-cash-remove',
  },
  {
    title: 'Total Registrations',
    value: summary.totalRegistrations,
    icon: 'mdi-account-group-outline',
  },
])

// ======================
// HEADERS
// ======================

const headers = [
  {
    title: 'Registration Number',
    key: 'registration_number',
    sortable: false,
  },
  {
    title: 'Invoice Number',
    key: 'invoice_number',
    sortable: false,
  },
  {
    title: 'Child Name',
    key: 'child_name',
    sortable: false,
  },
  {
    title: 'Program Category',
    key: 'program_category',
    sortable: false,
  },
  {
    title: 'Total Billing',
    key: 'total_billing',
    sortable: false,
  },
  {
    title: 'Payment Status',
    key: 'payment_status',
    sortable: false,
  },
]

// ======================
// MASTER DATA
// ======================

async function fetchMasterData() {
  try {
    const response = await api.get('/master-data')

    programCategories.value = response.data.program_categories ?? []
  } catch (error) {
    console.error('Failed to load program categories.', error)
  }
}

// ======================
// REPORT API
// ======================

async function fetchBillingReport() {
  const requestId = ++fetchRequestId

  loading.value = true

  try {
    const response = await api.get('/reports/billing', {
      params: {
        start_month: appliedPeriod.startMonth,

        end_month: appliedPeriod.endMonth,

        year: appliedPeriod.year,

        registration_number: appliedFilters.registrationNumber || undefined,

        invoice_number: appliedFilters.invoiceNumber || undefined,

        child_name: appliedFilters.childName || undefined,

        program_category_id: appliedFilters.programCategoryId ?? undefined,

        payment_status: appliedFilters.paymentStatus || undefined,

        page: page.value,

        per_page: perPage.value,
      },
    })

    /*
     * Abaikan response lama jika user
     * sudah menjalankan request baru.
     */
    if (requestId !== fetchRequestId) {
      return
    }

    const responseSummary = response.data.summary ?? {}

    summary.totalBilling = Number(responseSummary.total_billing ?? 0)

    summary.totalPaid = Number(responseSummary.total_paid ?? 0)

    summary.totalUnpaid = Number(responseSummary.total_unpaid ?? 0)

    summary.totalRegistrations = Number(responseSummary.total_registrations ?? 0)

    billings.value = response.data.data ?? []

    totalItems.value = Number(response.data.total ?? 0)
  } catch (error: any) {
    if (requestId !== fetchRequestId) {
      return
    }

    console.error(error)

    billings.value = []
    totalItems.value = 0

    summary.totalBilling = 0
    summary.totalPaid = 0
    summary.totalUnpaid = 0
    summary.totalRegistrations = 0

    snackbarText.value = error.response?.data?.message ?? 'Failed to load billing report.'

    snackbar.value = true
  } finally {
    if (requestId === fetchRequestId) {
      loading.value = false
    }
  }
}

// ======================
// RELOAD
// ======================

function reloadFromFirstPage() {
  /*
   * Jika sedang bukan di page 1,
   * watcher akan menjalankan fetch.
   */
  if (page.value !== 1) {
    page.value = 1

    return
  }

  fetchBillingReport()
}

// ======================
// PERIOD ACTIONS
// ======================

function applyPeriod() {
  if (period.startMonth > period.endMonth) {
    snackbarText.value = 'Start month cannot be later than end month.'

    snackbar.value = true

    return
  }

  appliedPeriod.startMonth = period.startMonth

  appliedPeriod.endMonth = period.endMonth

  appliedPeriod.year = period.year

  reloadFromFirstPage()
}

function resetPeriod() {
  period.startMonth = 1
  period.endMonth = 12
  period.year = currentYear

  appliedPeriod.startMonth = 1
  appliedPeriod.endMonth = 12
  appliedPeriod.year = currentYear

  reloadFromFirstPage()
}

// ======================
// FILTER ACTIONS
// ======================

function applyFilters() {
  appliedFilters.registrationNumber = filters.registrationNumber.trim()

  appliedFilters.invoiceNumber = filters.invoiceNumber.trim()

  appliedFilters.childName = filters.childName.trim()

  appliedFilters.programCategoryId = filters.programCategoryId

  appliedFilters.paymentStatus = filters.paymentStatus

  reloadFromFirstPage()
}

function resetFilters() {
  filters.registrationNumber = ''
  filters.invoiceNumber = ''
  filters.childName = ''
  filters.programCategoryId = null
  filters.paymentStatus = null

  appliedFilters.registrationNumber = ''
  appliedFilters.invoiceNumber = ''
  appliedFilters.childName = ''
  appliedFilters.programCategoryId = null
  appliedFilters.paymentStatus = null

  reloadFromFirstPage()
}

// ======================
// FORMAT
// ======================

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

// ======================
// PAGINATION WATCH
// ======================

watch([page, perPage], () => {
  fetchBillingReport()
})

// ======================
// LIFECYCLE
// ======================

onMounted(async () => {
  await Promise.all([fetchMasterData(), fetchBillingReport()])
})
</script>

<style scoped>
.billing-report-page {
  max-width: 1600px;
}

.billing-table {
  overflow-x: auto;
}
</style>
