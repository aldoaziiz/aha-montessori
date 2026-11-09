<template>
  <div class="monthly-overview-page">
    <div class="mb-6 d-flex align-center justify-space-between flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold">Monthly Overview</h1>
        <div class="text-body-2 text-grey">View completed sessions by child and category.</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-file-excel-outline" @click="openExportDialog">
        Export Attendance Excel
      </v-btn>
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
          v-else
          class="monthly-overview-table"
          density="compact"
          :headers="tableHeaders"
          :items="filteredRows"
          :loading="loading"
          :items-per-page="10"
          :items-per-page-options="[10, 25, 50]"
          :sort-by="[{ key: 'child_name', order: 'asc' }]"
          loading-text="Loading monthly overview..."
          no-data-text="No completed sessions were found for this month."
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

    <v-dialog v-model="exportDialog" max-width="560">
      <v-card>
        <v-card-title>Export Attendance Excel</v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Only children with completed sessions are included. Each month is exported to a separate sheet.
          </p>

          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="exportStartMonth"
                label="From month"
                type="month"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="exportEndMonth"
                label="To month"
                type="month"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>

          <v-alert v-if="exportError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ exportError }}
          </v-alert>
          <div class="text-caption text-medium-emphasis mt-2">
            Category filter: {{ selectedCategory === 'all' ? 'All categories' : selectedCategory }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="exportLoading" @click="exportDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="exportLoading" @click="exportAttendanceExcel">
            Download Excel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
const exportDialog = ref(false)
const exportStartMonth = ref('')
const exportEndMonth = ref('')
const exportLoading = ref(false)
const exportError = ref('')

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
  { title: 'Total Completed Sessions', key: 'total_completed_sessions', align: 'end', width: '180px' },
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

const monthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`

const dateRangeForMonths = (startMonth, endMonth) => {
  const [startYear, startNumber] = startMonth.split('-').map(Number)
  const [endYear, endNumber] = endMonth.split('-').map(Number)
  const finalDay = new Date(endYear, endNumber, 0).getDate()

  return {
    startDate: `${startYear}-${String(startNumber).padStart(2, '0')}-01`,
    endDate: `${endYear}-${String(endNumber).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`,
  }
}

const fetchMonthlyOverview = async () => {
  loading.value = true
  error.value = ''

  try {
    const currentMonth = monthKey(selectedYear.value, selectedMonth.value)
    const { startDate, endDate } = dateRangeForMonths(currentMonth, currentMonth)
    const response = await api.get('/reports/monthly-attendance', {
      params: { start_date: startDate, end_date: endDate },
    })

    rows.value = (Array.isArray(response.data?.data) ? response.data.data : []).map((row) => ({
      row_key: `${row.child_id}|${row.report_month}|${row.program_category}`,
      child_id: row.child_id,
      child_name: row.child_name || 'Unknown child',
      category: row.program_category || 'Category unavailable',
      total_completed_sessions: Number(row.completed_sessions) || 0,
    }))

    if (
      selectedCategory.value !== 'all' &&
      !rows.value.some((row) => row.category === selectedCategory.value)
    ) {
      selectedCategory.value = 'all'
    }
  } catch (requestError) {
    console.error('Error loading monthly attendance overview:', requestError)
    error.value = 'Failed to load the monthly overview.'
  } finally {
    loading.value = false
  }
}

const openExportDialog = () => {
  const selected = monthKey(selectedYear.value, selectedMonth.value)
  exportStartMonth.value = selected
  exportEndMonth.value = selected
  exportError.value = ''
  exportDialog.value = true
}

const formatAgeAtMonthEnd = (birthDate, reportMonth) => {
  if (!birthDate) return '—'

  const [birthYear, birthMonth, birthDay] = String(birthDate).slice(0, 10).split('-').map(Number)
  const [reportYear, reportMonthNumber] = reportMonth.split('-').map(Number)
  const lastDay = new Date(reportYear, reportMonthNumber, 0).getDate()
  let months = (reportYear - birthYear) * 12 + (reportMonthNumber - birthMonth)

  if (lastDay < birthDay) months -= 1
  if (months < 0) return '—'

  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (years === 0) return `${remainingMonths} bulan`
  if (remainingMonths === 0) return `${years} tahun`
  return `${years} tahun ${remainingMonths} bulan`
}

const formatBirthplaceAndDate = (birthplace, birthDate) => {
  if (!birthDate) return '—'

  const [year, month, day] = String(birthDate).slice(0, 10).split('-').map(Number)
  const date = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  return birthplace ? `${birthplace}, ${date}` : date
}

const valueOrDash = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return '—'
  return String(value).trim()
}

const buildAttendanceWorkbook = async (records, months) => {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AHA Montessori'
  workbook.subject = 'Monthly child attendance report'
  workbook.created = new Date()
  const headers = [
    'Nama Lengkap',
    'Tempat, Tanggal Lahir',
    'Usia',
    'Alamat Lengkap',
    'NIK/ID',
    'Nama Orang Tua',
    'Nama Sekolah',
    'Program Toddler/Kinder',
    'Diagnosa Khusus',
  ]

  months.forEach((reportMonth) => {
    const childrenById = new Map()

    records
      .filter((record) => record.report_month === reportMonth)
      .forEach((record) => {
        const key = String(record.child_id)
        if (!childrenById.has(key)) {
          childrenById.set(key, {
            ...record,
            categories: new Set(),
          })
        }

        if (record.program_category) {
          childrenById.get(key).categories.add(record.program_category)
        }
      })

    const dataRows = Array.from(childrenById.values()).map((child) => [
      valueOrDash(child.child_name),
      formatBirthplaceAndDate(child.birthplace, child.birth_date),
      formatAgeAtMonthEnd(child.birth_date, reportMonth),
      valueOrDash(child.address),
      valueOrDash(child.id_number),
      valueOrDash(child.guardian_names),
      valueOrDash(child.school_name),
      child.categories.size ? Array.from(child.categories).join(', ') : '—',
      valueOrDash(child.special_condition),
    ])

    const worksheet = workbook.addWorksheet(sheetNameFor(reportMonth), {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    const widths = [30, 34, 16, 38, 22, 34, 30, 30, 36]
    worksheet.columns = headers.map((header, index) => ({
      header,
      key: `column_${index + 1}`,
      width: widths[index],
    }))
    dataRows.forEach((row) => worksheet.addRow(row))
    worksheet.autoFilter = { from: 'A1', to: `I${dataRows.length + 1}` }

    const headerRow = worksheet.getRow(1)
    headerRow.height = 30
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8661A' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFB84B0E' } } }
    })

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      row.height = 32
      row.eachCell((cell, columnNumber) => {
        cell.alignment = { vertical: 'top', wrapText: true }
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } }
        if (rowNumber % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4EC' } }
        }
        if (columnNumber === 5) cell.numFmt = '@'
      })
    })

    worksheet.getColumn(3).alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
  })

  return workbook
}

const sheetNameFor = (reportMonth) => {
  const [year, month] = reportMonth.split('-').map(Number)
  return new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .concat(` ${year}`)
}

const monthsInRange = (startMonth, endMonth) => {
  const [startYear, startNumber] = startMonth.split('-').map(Number)
  const [endYear, endNumber] = endMonth.split('-').map(Number)
  const months = []
  let year = startYear
  let month = startNumber

  while (year < endYear || (year === endYear && month <= endNumber)) {
    months.push(monthKey(year, month))
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

const exportAttendanceExcel = async () => {
  exportError.value = ''
  if (!exportStartMonth.value || !exportEndMonth.value) {
    exportError.value = 'Choose the first and last month.'
    return
  }

  if (exportStartMonth.value > exportEndMonth.value) {
    exportError.value = 'The first month must be earlier than or equal to the last month.'
    return
  }

  exportLoading.value = true
  try {
    const { startDate, endDate } = dateRangeForMonths(exportStartMonth.value, exportEndMonth.value)
    const params = { start_date: startDate, end_date: endDate }
    if (selectedCategory.value !== 'all') params.category = selectedCategory.value

    const response = await api.get('/reports/monthly-attendance', { params })
    const records = Array.isArray(response.data?.data) ? response.data.data : []
    const months = monthsInRange(exportStartMonth.value, exportEndMonth.value)
    const workbook = await buildAttendanceWorkbook(records, months)
    const filename = `Laporan_Kehadiran_Anak_${exportStartMonth.value}_${exportEndMonth.value}.xlsx`
    const buffer = await workbook.xlsx.writeBuffer({ useStyles: true, useSharedStrings: true })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
    exportDialog.value = false
  } catch (requestError) {
    console.error('Error exporting monthly attendance report:', requestError)
    exportError.value = 'Failed to create the Excel report. Please try again.'
  } finally {
    exportLoading.value = false
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
  width: 180px;
  min-width: 140px;
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
