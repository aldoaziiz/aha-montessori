<template>
  <div class="milestone-curricula-page">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-5">
      <div>
        <h1 class="text-h4 font-weight-bold">Manage Milestone Curricula</h1>
        <div class="text-body-2 text-medium-emphasis">Manage curricula, areas, optional subareas, milestones, and age ranges.</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openEditor('curriculum')">New Curriculum</v-btn>
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="curricula">Curricula</v-tab>
      <v-tab v-if="showAuditLogTab" value="audit">Audit Log</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="curricula">
        <v-alert v-if="pageError" type="error" variant="tonal" class="mb-4">{{ pageError }}</v-alert>
        <v-skeleton-loader v-if="loading" type="article, article" />
        <v-alert v-else-if="curricula.length === 0" type="info" variant="tonal">No curricula yet. Add one to start building the master data.</v-alert>
        <v-expansion-panels v-else multiple>
          <v-expansion-panel v-for="curriculum in curricula" :key="curriculum.id" rounded="lg" class="mb-3">
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-wrap ga-3 w-100 pr-3">
                <strong>{{ curriculum.name }}</strong>
                <v-chip size="x-small" :color="curriculum.is_active ? 'success' : 'grey'" variant="tonal">{{ curriculum.is_active ? 'Active' : 'Archived' }}</v-chip>
                <span class="text-caption text-medium-emphasis">{{ curriculum.areas?.length ?? 0 }} areas</span>
                <v-spacer />
                <v-btn size="small" variant="text" icon="mdi-pencil" aria-label="Edit curriculum" @click.stop="openEditor('curriculum', curriculum)" />
                <v-btn size="small" variant="text" color="error" icon="mdi-delete" aria-label="Delete or archive curriculum" @click.stop="removeCurriculum(curriculum)" />
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex justify-end mb-3">
                <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openEditor('area', undefined, { curriculum_id: curriculum.id })">Add Area</v-btn>
              </div>
              <v-alert v-if="curriculum.areas?.length === 0" type="info" variant="tonal">No areas in this curriculum.</v-alert>
              <v-expansion-panels v-else multiple>
                <v-expansion-panel v-for="area in curriculum.areas" :key="area.id" variant="outlined" class="mb-2">
                  <v-expansion-panel-title>
                    <div class="d-flex align-center flex-wrap ga-2 w-100 pr-3">
                      <strong>{{ area.name }}</strong>
                      <v-chip v-if="!area.is_active" size="x-small" color="grey" variant="tonal">Archived</v-chip>
                      <span class="text-caption text-medium-emphasis">{{ totalAreaMilestones(area) }} milestones</span>
                      <v-spacer />
                      <v-btn size="small" variant="text" icon="mdi-pencil" aria-label="Edit area" @click.stop="openEditor('area', area, { curriculum_id: curriculum.id })" />
                      <v-btn size="small" variant="text" color="error" icon="mdi-delete" aria-label="Delete or archive area" @click.stop="removeMaster('area', area)" />
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="d-flex flex-wrap justify-end ga-2 mb-3">
                      <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="openEditor('subarea', undefined, { area_id: area.id })">Add Subarea</v-btn>
                      <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openEditor('milestone', undefined, { area_id: area.id })">Add Milestone</v-btn>
                    </div>
                    <div v-if="area.milestones?.length" class="milestone-table-wrap mb-3">
                      <div v-for="milestone in area.milestones" :key="milestone.id" class="master-row">
                        <div class="master-row-name">{{ milestone.name }} <v-chip v-if="!milestone.is_active" size="x-small" color="grey" variant="tonal">Archived</v-chip></div>
                        <div class="d-flex align-center ga-1 flex-wrap age-list"><v-chip v-for="age in milestone.ages" :key="age" size="x-small" variant="tonal">{{ age }}</v-chip></div>
                        <div class="d-flex justify-end">
                          <v-btn size="small" variant="text" icon="mdi-pencil" aria-label="Edit milestone" @click="openEditor('milestone', milestone, { area_id: area.id })" />
                          <v-btn size="small" variant="text" color="error" icon="mdi-delete" aria-label="Delete or archive milestone" @click="removeMaster('milestone', milestone)" />
                        </div>
                      </div>
                    </div>
                    <v-expansion-panels v-if="area.subareas?.length" multiple>
                      <v-expansion-panel v-for="subarea in area.subareas" :key="subarea.id" variant="tonal" class="mb-2">
                        <v-expansion-panel-title>
                          <div class="d-flex align-center flex-wrap ga-2 w-100 pr-3">
                            <span>{{ subarea.name }}</span>
                            <v-chip v-if="!subarea.is_active" size="x-small" color="grey" variant="tonal">Archived</v-chip>
                            <span class="text-caption text-medium-emphasis">{{ subarea.milestones?.length ?? 0 }} milestones</span>
                            <v-spacer />
                            <v-btn size="small" variant="text" icon="mdi-pencil" aria-label="Edit subarea" @click.stop="openEditor('subarea', subarea, { area_id: area.id })" />
                            <v-btn size="small" variant="text" color="error" icon="mdi-delete" aria-label="Delete or archive subarea" @click.stop="removeMaster('subarea', subarea)" />
                          </div>
                        </v-expansion-panel-title>
                        <v-expansion-panel-text>
                          <div class="d-flex justify-end mb-2">
                            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openEditor('milestone', undefined, { area_id: area.id, subarea_id: subarea.id })">Add Milestone</v-btn>
                          </div>
                          <div v-for="milestone in subarea.milestones" :key="milestone.id" class="master-row">
                            <div class="master-row-name">{{ milestone.name }} <v-chip v-if="!milestone.is_active" size="x-small" color="grey" variant="tonal">Archived</v-chip></div>
                            <div class="d-flex align-center ga-1 flex-wrap age-list"><v-chip v-for="age in milestone.ages" :key="age" size="x-small" variant="tonal">{{ age }}</v-chip></div>
                            <div class="d-flex justify-end">
                              <v-btn size="small" variant="text" icon="mdi-pencil" aria-label="Edit milestone" @click="openEditor('milestone', milestone, { area_id: area.id, subarea_id: subarea.id })" />
                              <v-btn size="small" variant="text" color="error" icon="mdi-delete" aria-label="Delete or archive milestone" @click="removeMaster('milestone', milestone)" />
                            </div>
                          </div>
                          <div v-if="!subarea.milestones?.length" class="text-body-2 text-medium-emphasis">No milestones in this subarea yet.</div>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-window-item>

      <v-window-item v-if="showAuditLogTab" value="audit">
        <v-card rounded="lg">
          <v-card-text>
            <div class="d-flex align-center ga-3 mb-3">
              <v-text-field v-model="auditSearch" label="Search audit log" prepend-inner-icon="mdi-magnify" clearable variant="outlined" density="comfortable" hide-details @keyup.enter="fetchAuditLogs" />
              <v-btn color="primary" :loading="auditLoading" @click="fetchAuditLogs">Search</v-btn>
            </div>
            <v-alert v-if="auditError" type="error" variant="tonal">{{ auditError }}</v-alert>
            <v-data-table v-else :headers="auditHeaders" :items="auditLogs" :loading="auditLoading" :items-per-page="25" :items-per-page-options="[25, 50, 100]">
              <template #item.created_at="{ item }">{{ formatTimestamp(item.created_at) }}</template>
              <template #item.actor_name="{ item }"><div class="font-weight-medium">{{ item.actor_name || 'Deleted account' }}</div><div class="text-caption text-medium-emphasis">{{ item.actor_email || '' }}</div></template>
              <template #item.action="{ item }">{{ item.action.replaceAll('.', ' ') }}</template>
              <template #item.event_context="{ item }"><span class="audit-context">{{ formatContext(item.event_context) }}</span></template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>

    <v-dialog v-model="editorDialog" max-width="620">
      <v-card>
        <v-card-title>{{ editorTitle }}</v-card-title>
        <v-card-text>
          <v-alert v-if="editorError" type="error" variant="tonal" class="mb-3">{{ editorError }}</v-alert>
          <v-text-field v-model="editor.name" :label="editorType === 'milestone' ? 'Milestone Name' : editorType === 'subarea' ? 'Subarea Name' : editorType === 'area' ? 'Area Name' : 'Curriculum Name'" variant="outlined" />
          <template v-if="editorType === 'milestone'">
            <v-select v-model="editor.subarea_id" :items="subareaOptions" item-title="name" item-value="id" label="Subarea (optional)" clearable variant="outlined" />
            <v-combobox v-model="editor.ages" :items="ageOptions" label="Age" multiple chips closable-chips variant="outlined" hint="Select or enter age numbers. Leave empty if not specified." persistent-hint />
          </template>
          <v-text-field v-if="['area', 'subarea', 'milestone'].includes(editorType)" v-model.number="editor.sort_order" label="Display Order" type="number" min="0" variant="outlined" />
          <template v-if="editorType === 'curriculum' && editingEntity">
            <v-switch v-model="editor.is_active" label="Active curriculum" color="primary" hide-details />
          </template>
          <template v-if="['area', 'subarea', 'milestone'].includes(editorType) && editingEntity">
            <v-switch v-model="editor.is_active" label="Active" color="primary" hide-details />
          </template>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" :disabled="editorSaving" @click="editorDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="editorSaving" @click="saveEditor">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4500">{{ snackbarText }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'

type EntityType = 'curriculum' | 'area' | 'subarea' | 'milestone'
// Keep the audit UI dormant until the admin team is ready to use it.
const showAuditLogTab = false
const tab = ref('curricula')
const curricula = ref<any[]>([])
const auditLogs = ref<any[]>([])
const loading = ref(false)
const auditLoading = ref(false)
const editorSaving = ref(false)
const pageError = ref('')
const auditError = ref('')
const editorError = ref('')
const auditSearch = ref('')
const editorDialog = ref(false)
const editorType = ref<EntityType>('curriculum')
const editingEntity = ref<any | null>(null)
const editorContext = ref<Record<string, number>>({})
const ageOptions = [2, 3, 4, 5, 6]
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const editor = reactive({ name: '', ages: [] as (number | string)[], subarea_id: null as number | null, is_active: true, sort_order: 0 })
const auditHeaders = [
  { title: 'When', key: 'created_at' }, { title: 'Account', key: 'actor_name' },
  { title: 'Action', key: 'action' }, { title: 'Target', key: 'target_label' },
  { title: 'Context', key: 'event_context' }, { title: 'IP Address', key: 'ip_address' },
]
const editorTitle = computed(() => `${editingEntity.value ? 'Edit' : 'Add'} ${editorType.value === 'subarea' ? 'Subarea' : editorType.value}`)
const subareaOptions = computed(() => {
  const areaId = editorContext.value.area_id
  return curricula.value.flatMap((curriculum) => curriculum.areas ?? [])
    .filter((area) => area.id === areaId).flatMap((area) => area.subareas ?? [])
})
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
const fetchCurricula = async () => {
  loading.value = true
  pageError.value = ''
  try {
    const { data } = await api.get('/milestone-curricula', { params: { include_archived: 1 } })
    curricula.value = data.data ?? []
  } catch (error) {
    pageError.value = errorMessage(error, 'Failed to load curriculum master data.')
  } finally {
    loading.value = false
  }
}
const fetchAuditLogs = async () => {
  auditLoading.value = true
  auditError.value = ''
  try {
    const { data } = await api.get('/milestone-audit-logs', { params: { search: auditSearch.value || undefined, per_page: 100 } })
    auditLogs.value = data.data ?? []
  } catch (error) {
    auditError.value = errorMessage(error, 'Failed to load audit logs.')
  } finally {
    auditLoading.value = false
  }
}
const openEditor = (type: EntityType, entity?: any, context: Record<string, number> = {}) => {
  editorType.value = type
  editingEntity.value = entity ?? null
  editorContext.value = context
  editor.name = entity?.name ?? ''
  editor.ages = entity?.ages?.map(Number) ?? []
  editor.subarea_id = entity?.subarea_id ?? context.subarea_id ?? null
  editor.is_active = Boolean(entity?.is_active ?? true)
  editor.sort_order = Number(entity?.sort_order ?? nextDisplayOrder(type, context))
  editorError.value = ''
  editorDialog.value = true
}
const nextDisplayOrder = (type: EntityType, context: Record<string, number>) => {
  if (type === 'area') return (curricula.value.find((item) => item.id === context.curriculum_id)?.areas?.length ?? 0) + 1
  const area = curricula.value.flatMap((item) => item.areas ?? []).find((item) => item.id === context.area_id)
  if (type === 'subarea') return (area?.subareas?.length ?? 0) + 1
  if (type === 'milestone') {
    if (context.subarea_id) return (area?.subareas?.find((item: any) => item.id === context.subarea_id)?.milestones?.length ?? 0) + 1
    return (area?.milestones?.length ?? 0) + 1
  }
  return 0
}
const saveEditor = async () => {
  if (!editor.name.trim()) {
    editorError.value = 'Name is required.'
    return
  }
  editorSaving.value = true
  editorError.value = ''
  const id = editingEntity.value?.id
  const type = editorType.value
  const endpoints: Record<EntityType, string> = {
    curriculum: '/milestone-curricula', area: '/milestone-areas', subarea: '/milestone-subareas', milestone: '/curriculum-milestones',
  }
  const payload: Record<string, any> = { name: editor.name.trim(), is_active: editor.is_active }
  if (type === 'area') Object.assign(payload, { curriculum_id: editorContext.value.curriculum_id, sort_order: editor.sort_order })
  if (type === 'subarea') Object.assign(payload, { area_id: editorContext.value.area_id, sort_order: editor.sort_order })
  if (type === 'milestone') {
    const ages = editor.ages.map(Number)
    if (ages.some((age) => !Number.isInteger(age) || age < 1 || age > 99)) {
      editorError.value = 'Age values must be whole numbers from 1 to 99.'
      editorSaving.value = false
      return
    }
    Object.assign(payload, { area_id: editorContext.value.area_id, subarea_id: editor.subarea_id, sort_order: editor.sort_order, ages })
  }
  try {
    if (id) await api.put(`${endpoints[type]}/${id}`, payload)
    else await api.post(endpoints[type], payload)
    editorDialog.value = false
    await fetchCurricula()
    if (showAuditLogTab) await fetchAuditLogs()
    showSnackbar(`${type[0].toUpperCase()}${type.slice(1)} saved.`)
  } catch (error) {
    editorError.value = errorMessage(error, `Failed to save ${type}.`)
  } finally {
    editorSaving.value = false
  }
}
const removeCurriculum = async (curriculum: any) => {
  if (!window.confirm(`Delete or archive "${curriculum.name}"? Curricula used by a report are archived so reports remain intact.`)) return
  try {
    const { data } = await api.delete(`/milestone-curricula/${curriculum.id}`)
    await fetchCurricula()
    if (showAuditLogTab) await fetchAuditLogs()
    showSnackbar(data.message)
  } catch (error) {
    showSnackbar(errorMessage(error, 'Failed to delete curriculum.'), 'error')
  }
}
const removeMaster = async (type: 'area' | 'subarea' | 'milestone', entity: any) => {
  if (!window.confirm(`Delete or archive "${entity.name}"? Items used in existing reports are archived to preserve those reports.`)) return
  const endpoint = type === 'area' ? '/milestone-areas' : type === 'subarea' ? '/milestone-subareas' : '/curriculum-milestones'
  try {
    const { data } = await api.delete(`${endpoint}/${entity.id}`)
    await fetchCurricula()
    if (showAuditLogTab) await fetchAuditLogs()
    showSnackbar(data.message)
  } catch (error) {
    showSnackbar(errorMessage(error, `Failed to delete ${type}.`), 'error')
  }
}
const totalAreaMilestones = (area: any) => (area.milestones?.length ?? 0) + (area.subareas ?? []).reduce((sum: number, subarea: any) => sum + (subarea.milestones?.length ?? 0), 0)
const formatTimestamp = (value: string) => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
const formatContext = (value: string | object | null) => {
  if (!value) return '—'
  try { return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value) }
  catch { return String(value) }
}
onMounted(() => { fetchCurricula(); if (showAuditLogTab) fetchAuditLogs() })
</script>

<style scoped>
.milestone-curricula-page { width: 100%; }
.master-row { display: grid; grid-template-columns: minmax(180px, 1fr) minmax(100px, 180px) 96px; gap: 8px; align-items: center; padding: 8px 12px; border-bottom: 1px solid #eceef2; }
.master-row:last-child { border-bottom: 0; }
.master-row-name { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.age-list { min-width: 0; }
.audit-context { display: block; max-width: 300px; white-space: normal; overflow-wrap: anywhere; font-size: 12px; }
@media (max-width: 700px) {
  .master-row { grid-template-columns: minmax(0, 1fr) auto; }
  .age-list { grid-column: 1; grid-row: 2; }
  .master-row > div:last-child { grid-column: 2; grid-row: 1 / span 2; }
}
</style>
