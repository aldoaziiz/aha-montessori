<template>
  <div class="milestone-report-page">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
      <div>
        <h1 class="text-h4 font-weight-bold">Milestone Progress</h1>
        <div class="text-body-2 text-medium-emphasis">Create and review a child's milestone progress report.</div>
      </div>
      <div class="d-flex ga-2">
        <v-btn v-if="authStore.isAdmin" variant="outlined" prepend-icon="mdi-book-cog" to="/master-data/milestone-curricula">
          Manage Curricula
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">Create Report</v-btn>
      </div>
    </div>

    <v-card rounded="lg">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Search child, report, curriculum" prepend-inner-icon="mdi-magnify" clearable variant="outlined" density="comfortable" hide-details @keyup.enter="fetchReports" />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="startDate" label="Report date from" type="date" variant="outlined" density="comfortable" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="endDate" label="Report date to" type="date" variant="outlined" density="comfortable" hide-details />
          </v-col>
          <v-col cols="12" md="2" class="d-flex ga-2">
            <v-btn color="primary" :loading="loading" @click="fetchReports">Apply</v-btn>
            <v-btn icon="mdi-refresh" variant="text" aria-label="Refresh reports" @click="clearFilters" />
          </v-col>
        </v-row>

        <v-alert v-if="listError" class="mt-4" type="error" variant="tonal">{{ listError }}</v-alert>
        <v-data-table
          v-else
          class="mt-4"
          :headers="reportHeaders"
          :items="reports"
          :loading="loading"
          :items-per-page="10"
          :items-per-page-options="[10, 25, 50]"
          no-data-text="No milestone progress reports found."
        >
          <template #item.report_date="{ item }">{{ formatDate(item.report_date) }}</template>
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" color="primary" @click="openReport(item)">Open</v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="createDialog" max-width="1260" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Create Milestone Progress Report</span>
          <v-btn icon="mdi-close" variant="text" aria-label="Close" @click="createDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="create-report-body">
          <v-alert v-if="formError" type="error" variant="tonal" class="mb-4">{{ formError }}</v-alert>

          <h2 class="text-subtitle-1 font-weight-bold mb-3">Choose Child</h2>
          <v-autocomplete v-model="form.child_id" :items="children" item-title="name" item-value="id" label="Active Child" variant="outlined" density="comfortable" :loading="childrenLoading" class="mb-2" />

          <template v-if="form.child_id">
          <h2 class="text-subtitle-1 font-weight-bold mb-3">Report Setup</h2>
          <v-row>
            <v-col cols="12" md="6">
              <v-select v-model="form.curriculum_id" :items="curricula" item-title="name" item-value="id" label="Curriculum" variant="outlined" density="comfortable" :loading="curriculaLoading" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.report_name" label="Report Name" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.report_date" label="Report Date" type="date" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field v-model="academicYearStart" label="Academic Year From" type="month" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-text-field v-model="academicYearEnd" label="Academic Year To" type="month" variant="outlined" density="comfortable" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.teacher_comments" label="Teacher Comments (optional)" rows="3" auto-grow variant="outlined" />
            </v-col>
          </v-row>

          <template v-if="selectedCurriculum">
            <v-divider class="my-4" />
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
              <div>
                <h2 class="text-h6">{{ selectedCurriculum.name }}</h2>
                <div class="text-body-2 text-medium-emphasis">Check the milestones to include. Every selected milestone needs a progress value.</div>
              </div>
              <div class="selection-count">{{ selectedCount }} selected</div>
            </div>

            <v-row class="mb-2">
              <v-col cols="12" md="4">
                <v-select v-model="filterAreas" :items="areaFilterOptions" item-title="title" item-value="value" label="Filter Area" multiple chips closable-chips clearable variant="outlined" density="comfortable" hide-details />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="filterProgress" :items="progressFilterOptions" item-title="title" item-value="value" label="Filter Progress" multiple chips closable-chips clearable variant="outlined" density="comfortable" hide-details>
                  <template #chip="{ item, props }">
                    <v-chip v-bind="props" size="small">
                      <span class="progress-choice">
                        <span class="progress-code" :class="progressCodeClass(item.value)">{{ item.value }}</span>
                        <span>{{ progressDescription(item.value) }}</span>
                      </span>
                    </v-chip>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend="{ isSelected }">
                        <v-icon
                          :icon="isSelected ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
                          :color="isSelected ? 'primary' : 'medium-emphasis'"
                          size="small"
                          aria-hidden="true"
                        />
                      </template>
                      <template #title>
                        <div class="progress-choice">
                          <span class="progress-code" :class="progressCodeClass(item.value)">{{ item.value }}</span>
                          <span>{{ progressDescription(item.value) }}</span>
                        </div>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="filterAges" :items="ageOptions" label="Filter Age" multiple chips closable-chips clearable variant="outlined" density="comfortable" hide-details />
              </v-col>
            </v-row>
            <div class="text-caption text-medium-emphasis mb-3">Filters only narrow the list on screen. They do not change which milestones are included in the report.</div>

            <v-alert v-if="!selectedCurriculum.areas?.length" type="info" variant="tonal">This curriculum has no active areas yet.</v-alert>
            <v-card v-for="area in selectedCurriculum.areas" v-show="isAreaVisible(area)" :key="area.id" variant="outlined" class="mb-4 area-card">
              <div class="area-header d-flex align-center ga-2">
                <v-checkbox-btn
                  class="area-header-checkbox"
                  density="compact"
                  :model-value="areaSelectionState(area) === 'all'"
                  :indeterminate="areaSelectionState(area) === 'partial'"
                  :disabled="allMilestones(area).length === 0"
                  @update:model-value="toggleArea(area, $event)"
                />
                <button
                  type="button"
                  class="area-header-toggle"
                  :aria-expanded="isAreaExpanded(area.id)"
                  :aria-controls="`milestone-area-${area.id}`"
                  @click="toggleAreaExpanded(area.id)"
                >
                  <span class="font-weight-bold">{{ area.name }}</span>
                  <span class="text-caption text-medium-emphasis area-selection-count">{{ selectedInArea(area) }}/{{ allMilestones(area).length }} selected</span>
                  <v-icon :icon="isAreaExpanded(area.id) ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="small" />
                </button>
              </div>

              <v-expand-transition>
                <div v-show="isAreaExpanded(area.id)" :id="`milestone-area-${area.id}`" class="area-content">
                  <v-divider />
                  <div v-if="visibleMilestones(area).length === 0" class="pa-4 text-body-2 text-medium-emphasis">No milestones match the current filters.</div>
                  <div v-else class="milestone-list">
                    <div v-for="group in visibleMilestoneGroups(area)" :key="group.key">
                      <div v-if="group.title" class="subarea-title">{{ group.title }}</div>
                      <v-row v-for="milestone in group.items" :key="milestone.id" class="milestone-row" align="center" no-gutters>
                        <v-col cols="12" md="8">
                          <v-checkbox
                            :model-value="isMilestoneSelected(milestone.id)"
                            :label="milestone.name"
                            density="compact"
                            hide-details
                            @update:model-value="toggleMilestone(milestone.id, $event)"
                          />
                          <div v-if="milestone.ages?.length" class="age-tags">Age {{ milestone.ages.join(', ') }}</div>
                        </v-col>
                        <v-col cols="12" md="4" class="progress-select-cell">
                          <v-select
                            :model-value="selectedMilestones[milestone.id]?.progress ?? 'N/A'"
                            :items="milestoneProgressOptions"
                            item-title="title"
                            item-value="value"
                            label="Progress"
                            variant="outlined"
                            density="compact"
                            hide-details
                            :disabled="!isMilestoneSelected(milestone.id)"
                            @update:model-value="setMilestoneProgress(milestone.id, $event)"
                        >
                          <template #selection="{ item }">
                            <div class="progress-choice">
                              <span v-if="item?.value" class="progress-code" :class="progressCodeClass(item.value)">{{ item.value }}</span>
                              <span>{{ progressDescription(item?.value) }}</span>
                            </div>
                          </template>
                          <template #item="{ props, item }">
                            <v-list-item v-bind="props">
                              <template #title>
                                <div class="progress-choice">
                                  <span v-if="item?.value" class="progress-code" :class="progressCodeClass(item.value)">{{ item.value }}</span>
                                  <span>{{ progressDescription(item?.value) }}</span>
                                </div>
                              </template>
                            </v-list-item>
                          </template>
                        </v-select>
                        </v-col>
                      </v-row>
                    </div>
                  </div>

                  <v-divider v-if="selectedInArea(area) > 0" />
                  <div v-if="selectedInArea(area) > 0" class="pa-4">
                    <v-textarea v-model="areaNotes[area.id]" label="Area Note (optional)" rows="2" auto-grow variant="outlined" hide-details />
                  </div>
                </div>
              </v-expand-transition>
            </v-card>
          </template>
          <v-alert v-else type="info" variant="tonal">Choose a curriculum to load its areas and milestones.</v-alert>
          </template>
          <v-alert v-else type="info" variant="tonal">Choose an active child to begin setting up the report.</v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-alert v-if="selectionError" type="error" variant="tonal" density="compact" class="mr-auto">{{ selectionError }}</v-alert>
          <v-spacer v-else />
          <v-btn variant="text" :disabled="saving" @click="createDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveReport">Create Report</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="detailDialog" max-width="1000" scrollable>
      <v-card v-if="activeReport">
        <v-card-title class="d-flex align-center justify-space-between">
          <div><div>{{ activeReport.report_name }}</div><div class="text-body-2 text-medium-emphasis">{{ activeReport.child_name_snapshot }}</div></div>
          <v-btn icon="mdi-close" variant="text" aria-label="Close" @click="detailDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-row class="mb-3">
            <v-col cols="12" sm="6"><div class="text-caption text-medium-emphasis">Report Date</div>{{ formatDate(activeReport.report_date) }}</v-col>
            <v-col cols="12" sm="6"><div class="text-caption text-medium-emphasis">Curriculum</div>{{ activeReport.curriculum_name_snapshot }}</v-col>
            <v-col cols="12" sm="6"><div class="text-caption text-medium-emphasis">Date of Birth</div>{{ formatDate(activeReport.child_birth_date_snapshot) }}</v-col>
            <v-col cols="12" sm="6"><div class="text-caption text-medium-emphasis">Age at Report</div>{{ activeReport.age_at_report || '—' }}</v-col>
            <v-col cols="12" sm="6"><div class="text-caption text-medium-emphasis">Academic Year</div>{{ activeReport.academic_year }}</v-col>
          </v-row>
          <v-card v-for="area in activeReport.areas" :key="area.id" variant="outlined" class="mb-3">
            <v-card-title class="text-subtitle-1">{{ area.area_name_snapshot }}</v-card-title>
            <v-table density="compact">
              <thead><tr><th>Milestone</th><th>Progress</th></tr></thead>
              <tbody>
                <tr v-for="item in area.items" :key="item.id">
                  <td><span v-if="item.subarea_name_snapshot" class="text-medium-emphasis">{{ item.subarea_name_snapshot }} · </span>{{ item.milestone_name_snapshot }}</td>
                  <td>
                    <span class="progress-choice">
                      <span class="progress-code" :class="progressCodeClass(item.progress_code)">{{ item.progress_code }}</span>
                      <span>{{ progressDescription(item.progress_code) }}</span>
                    </span>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-card-text v-if="area.area_note"><strong>Area Note</strong><div class="report-note">{{ area.area_note }}</div></v-card-text>
          </v-card>
          <v-card v-if="activeReport.teacher_comments" variant="tonal" class="mt-3">
            <v-card-title class="text-subtitle-1">Teacher Comments</v-card-title>
            <v-card-text class="report-note">{{ activeReport.teacher_comments }}</v-card-text>
          </v-card>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-btn color="error" variant="text" prepend-icon="mdi-delete" :loading="deleting" @click="deleteReport">Delete Permanently</v-btn>
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Close</v-btn>
          <v-btn color="primary" prepend-icon="mdi-file-pdf-box" :loading="downloading" @click="downloadPdf">Download PDF</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" timeout="4500">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

type Milestone = { id: number; name: string; ages: number[]; subarea_id?: number | null }
type Subarea = { id: number; name: string; milestones: Milestone[] }
type Area = { id: number; name: string; milestones: Milestone[]; subareas: Subarea[] }
type Curriculum = { id: number; name: string; areas: Area[] }

const authStore = useAuthStore()
const reports = ref<any[]>([])
const children = ref<any[]>([])
const curricula = ref<Curriculum[]>([])
const loading = ref(false)
const childrenLoading = ref(false)
const curriculaLoading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const downloading = ref(false)
const listError = ref('')
const formError = ref('')
const selectionError = ref('')
const search = ref('')
const startDate = ref('')
const endDate = ref('')
const createDialog = ref(false)
const detailDialog = ref(false)
const activeReport = ref<any | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const filterAreas = ref<number[]>([])
const filterProgress = ref<string[]>([])
const filterAges = ref<number[]>([])
const expandedAreaIds = ref<number[]>([])
const selectedMilestones = reactive<Record<number, { progress: string }>>({})
const areaNotes = reactive<Record<number, string>>({})
const defaultReportName = 'AUTHENTIC MONTESSORI LEARNING JOURNEY & DEVELOPMENT REPORT'
const applicationTimeZone = 'Asia/Makassar'
const todayInApplicationTimeZone = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: applicationTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')}`
}
const today = todayInApplicationTimeZone()
const currentMonth = today.slice(0, 7)

const form = reactive({
  child_id: null as number | null,
  curriculum_id: null as number | null,
  report_name: defaultReportName,
  report_date: today,
  teacher_comments: '',
})
const academicYearStart = ref(currentMonth)
const academicYearEnd = ref(`${Number(currentMonth.slice(0, 4)) + 1}-${currentMonth.slice(5, 7)}`)

const reportHeaders = [
  { title: 'Report Name', key: 'report_name' },
  { title: 'Child', key: 'child_name_snapshot' },
  { title: 'Curriculum', key: 'curriculum_name_snapshot' },
  { title: 'Report Date', key: 'report_date' },
  { title: 'Created By', key: 'created_by_name' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]
const progressOptions = [
  { title: 'N/A — choose progress', value: 'N/A' },
  { title: 'B — Belum', value: 'B' },
  { title: 'DB — Dengan Bantuan', value: 'DB' },
  { title: 'M — Mandiri', value: 'M' },
  { title: 'K — Konsisten', value: 'K' },
]
const milestoneProgressOptions = progressOptions.slice(1)
const progressFilterOptions = progressOptions
const selectedCurriculum = computed(() => curricula.value.find((item) => item.id === form.curriculum_id) ?? null)
const selectedCount = computed(() => Object.keys(selectedMilestones).length)
const areaFilterOptions = computed(() => (selectedCurriculum.value?.areas ?? []).map((area) => ({ title: area.name, value: area.id })))
const ageOptions = computed(() => [...new Set((selectedCurriculum.value?.areas ?? []).flatMap((area) => allMilestones(area).flatMap((milestone) => milestone.ages ?? [])))].sort((first, second) => first - second))
const isAreaExpanded = (areaId: number) => expandedAreaIds.value.includes(areaId)
const toggleAreaExpanded = (areaId: number) => {
  expandedAreaIds.value = isAreaExpanded(areaId)
    ? expandedAreaIds.value.filter((id) => id !== areaId)
    : [...expandedAreaIds.value, areaId]
}

const allMilestones = (area: Area): Milestone[] => [
  ...(area.milestones ?? []),
  ...(area.subareas ?? []).flatMap((subarea) => subarea.milestones ?? []),
]
const isMilestoneSelected = (id: number) => Object.prototype.hasOwnProperty.call(selectedMilestones, id)
const isAreaVisible = (area: Area) => filterAreas.value.length === 0 || filterAreas.value.includes(area.id)
const visibleMilestones = (area: Area) => allMilestones(area).filter((milestone) => {
  const progress = selectedMilestones[milestone.id]?.progress ?? 'N/A'
  const matchesProgress = filterProgress.value.length === 0 || filterProgress.value.includes(progress)
  const matchesAge = filterAges.value.length === 0 || (milestone.ages ?? []).some((age) => filterAges.value.includes(age))
  return matchesProgress && matchesAge
})
const visibleMilestoneGroups = (area: Area) => {
  const visibleIds = new Set(visibleMilestones(area).map((item) => item.id))
  const groups: { key: string; title: string; items: Milestone[] }[] = []
  const direct = (area.milestones ?? []).filter((item) => visibleIds.has(item.id))
  if (direct.length) groups.push({ key: `area-${area.id}`, title: '', items: direct })
  for (const subarea of area.subareas ?? []) {
    const items = (subarea.milestones ?? []).filter((item) => visibleIds.has(item.id))
    if (items.length) groups.push({ key: `subarea-${subarea.id}`, title: subarea.name, items })
  }
  return groups
}
const selectedInArea = (area: Area) => allMilestones(area).filter((item) => isMilestoneSelected(item.id)).length
const areaSelectionState = (area: Area) => {
  const total = allMilestones(area).length
  const selected = selectedInArea(area)
  if (!selected || !total) return 'none'
  return selected === total ? 'all' : 'partial'
}
const toggleMilestone = (id: number, checked: boolean | null) => {
  if (checked) selectedMilestones[id] = { progress: 'N/A' }
  else delete selectedMilestones[id]
  selectionError.value = ''
}
const toggleArea = (area: Area, checked: boolean | null) => {
  for (const milestone of allMilestones(area)) {
    if (checked) {
      if (!isMilestoneSelected(milestone.id)) selectedMilestones[milestone.id] = { progress: 'N/A' }
    } else {
      delete selectedMilestones[milestone.id]
    }
  }
  selectionError.value = ''
}
const setMilestoneProgress = (id: number, progress: string) => {
  if (selectedMilestones[id]) selectedMilestones[id].progress = progress
  selectionError.value = ''
}
const progressDescription = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return progressOptions.find((item) => item.value === value)?.title.split(' — ').slice(1).join(' — ') ?? value
}
const progressCodeClass = (value: unknown) => typeof value === 'string' && value
  ? `progress-code--${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  : ''
const formatDate = (value: string) => {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)))
}
const showSnackbar = (message: string, color = 'success') => {
  snackbarText.value = message
  snackbarColor.value = color
  snackbar.value = true
}
const errorMessage = (error: any, fallback: string) => {
  const message = error?.response?.data?.message
  if (message) return message
  const errors = error?.response?.data?.errors
  return errors ? Object.values(errors).flat().join(' ') : fallback
}

const fetchReports = async () => {
  loading.value = true
  listError.value = ''
  try {
    const { data } = await api.get('/milestone-reports', {
      params: { search: search.value || undefined, start_date: startDate.value || undefined, end_date: endDate.value || undefined, per_page: 100 },
    })
    reports.value = data.data ?? []
  } catch (error) {
    listError.value = errorMessage(error, 'Failed to load milestone reports.')
  } finally {
    loading.value = false
  }
}
const clearFilters = () => {
  search.value = ''
  startDate.value = ''
  endDate.value = ''
  fetchReports()
}
const loadFormMasters = async () => {
  childrenLoading.value = true
  curriculaLoading.value = true
  try {
    const [childResponse, curriculumResponse] = await Promise.all([
      api.get('/milestone-reports/children'),
      api.get('/milestone-curricula'),
    ])
    children.value = childResponse.data.data ?? []
    curricula.value = curriculumResponse.data.data ?? []
  } catch (error) {
    formError.value = errorMessage(error, 'Failed to load children and curricula.')
  } finally {
    childrenLoading.value = false
    curriculaLoading.value = false
  }
}
const resetSelection = () => {
  for (const key of Object.keys(selectedMilestones)) delete selectedMilestones[Number(key)]
  for (const key of Object.keys(areaNotes)) delete areaNotes[Number(key)]
  filterAreas.value = []
  filterProgress.value = []
  filterAges.value = []
  expandedAreaIds.value = []
  selectionError.value = ''
}
const openCreateDialog = async () => {
  const currentDate = todayInApplicationTimeZone()
  const currentAcademicMonth = currentDate.slice(0, 7)
  formError.value = ''
  resetSelection()
  form.child_id = null
  form.curriculum_id = null
  form.report_name = defaultReportName
  form.report_date = currentDate
  form.teacher_comments = ''
  academicYearStart.value = currentAcademicMonth
  academicYearEnd.value = `${Number(currentAcademicMonth.slice(0, 4)) + 1}-${currentAcademicMonth.slice(5, 7)}`
  await loadFormMasters()
  createDialog.value = true
}
const saveReport = async () => {
  formError.value = ''
  selectionError.value = ''
  const selected = selectedCount.value
  if (selected === 0) {
    selectionError.value = 'Select at least one milestone before creating the report.'
    return
  }
  const missingProgress = Object.values(selectedMilestones).some((item) => !['B', 'DB', 'M', 'K'].includes(item.progress))
  if (missingProgress) {
    selectionError.value = 'Some selected milestones still have N/A progress. Choose B, DB, M, or K for each one.'
    showSnackbar('Some selected milestones still need a progress value.', 'error')
    return
  }
  const [startYear, startMonth] = academicYearStart.value.split('-').map(Number)
  const [endYear, endMonth] = academicYearEnd.value.split('-').map(Number)
  if (!startYear || !startMonth || !endYear || !endMonth) {
    formError.value = 'Enter the start and end month for the academic year.'
    return
  }
  const areas = (selectedCurriculum.value?.areas ?? []).map((area) => {
    const milestones = allMilestones(area).filter((item) => isMilestoneSelected(item.id)).map((item) => ({
      milestone_id: item.id,
      progress: selectedMilestones[item.id].progress,
    }))
    return milestones.length ? { area_id: area.id, note: areaNotes[area.id] || null, milestones } : null
  }).filter(Boolean)

  saving.value = true
  try {
    await api.post('/milestone-reports', {
      ...form,
      academic_year_start_month: startMonth,
      academic_year_start_year: startYear,
      academic_year_end_month: endMonth,
      academic_year_end_year: endYear,
      areas,
    })
    createDialog.value = false
    await fetchReports()
    showSnackbar('Milestone report created.')
  } catch (error) {
    formError.value = errorMessage(error, 'Failed to create the report.')
  } finally {
    saving.value = false
  }
}
const openReport = async (item: any) => {
  activeReport.value = null
  detailDialog.value = true
  try {
    const { data } = await api.get(`/milestone-reports/${item.id}`)
    activeReport.value = data.data
  } catch (error) {
    detailDialog.value = false
    showSnackbar(errorMessage(error, 'Failed to open the report.'), 'error')
  }
}
const downloadPdf = async () => {
  if (!activeReport.value) return
  downloading.value = true
  try {
    const response = await api.get(`/milestone-reports/${activeReport.value.id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeReport.value.report_name}.pdf`.replace(/[\\/:*?"<>|]/g, '-')
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    showSnackbar(errorMessage(error, 'Failed to download the PDF.'), 'error')
  } finally {
    downloading.value = false
  }
}
const deleteReport = async () => {
  if (!activeReport.value || !window.confirm(`Permanently delete "${activeReport.value.report_name}"? This cannot be undone.`)) return
  deleting.value = true
  try {
    const { data } = await api.delete(`/milestone-reports/${activeReport.value.id}`)
    detailDialog.value = false
    activeReport.value = null
    await fetchReports()
    showSnackbar(data.message ?? 'Report deleted.')
  } catch (error) {
    showSnackbar(errorMessage(error, 'Failed to delete the report.'), 'error')
  } finally {
    deleting.value = false
  }
}

watch(() => form.curriculum_id, () => resetSelection())
watch(() => form.child_id, (childId, previousChildId) => {
  if (childId === previousChildId) return
  const hadDraft = selectedCount.value > 0 || Object.values(areaNotes).some((note) => Boolean(note.trim()))
  resetSelection()
  if (previousChildId !== null && hadDraft) {
    showSnackbar('Milestone selections and notes were cleared because the child changed.', 'info')
  }
})
onMounted(fetchReports)
</script>

<style scoped>
.milestone-report-page { width: 100%; }
.create-report-body { max-height: 78vh; }
.selection-count { color: #2e7d32; background: #e8f5e9; border-radius: 18px; padding: 6px 12px; font-size: 13px; }
.area-header { padding: 5px 14px; min-height: 52px; }
.area-header .area-header-checkbox { flex: 0 0 28px; width: 28px; min-width: 28px; max-width: 28px; }
.area-header-toggle { display: flex; flex: 1; align-items: center; justify-content: flex-start; gap: 12px; min-width: 0; min-height: 42px; padding: 4px 4px 4px 0; border: 0; border-radius: 4px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.area-header-toggle:focus-visible { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: 2px; }
.area-header-toggle > span:first-child { overflow-wrap: anywhere; }
.area-selection-count { margin-left: auto; white-space: nowrap; }
.progress-choice { display: inline-flex; align-items: center; gap: 10px; }
.progress-code { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 24px; padding: 0 8px; border-radius: 14px; color: #fff; font-size: 12px; font-weight: 700; line-height: 1; }
.progress-code--b { background: #e94332; }
.progress-code--db { background: #ff8428; }
.progress-code--m { background: #ffbf43; }
.progress-code--k { background: #84bc00; }
.progress-code--n-a { background: #9e9e9e; }
.milestone-list { padding: 4px 16px 10px; }
.milestone-row { border-bottom: 1px solid #f0f1f3; padding: 5px 0; }
.subarea-title { font-weight: 600; color: #5e35b1; padding: 10px 0 3px; }
.age-tags { padding-left: 42px; margin-top: -3px; color: #7b7f87; font-size: 11px; }
.progress-select-cell { padding: 4px 8px; }
.report-note { white-space: pre-wrap; margin-top: 6px; }
</style>
