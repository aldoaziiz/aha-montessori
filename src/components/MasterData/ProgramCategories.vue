<template>
  <div class="programs-content">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Program Categories</h1>
        <p class="text-body2 text-grey">Manage program category session schedules</p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="router.push('/program-categories/create')"
      >
        New Category
      </v-btn>
    </div>

    <v-card>
      <v-card-text>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search Session"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Category"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
        </v-row>
        <v-data-table :headers="headers" :items="items" :loading="loading" item-value="id">
          <template #item.time="{ item }">{{ item.start_time }} - {{ item.end_time }}</template>

          <template #item.is_active="{ item }">
            <v-chip :color="item.is_active ? 'success' : 'grey'" size="small" variant="tonal">
              {{ item.is_active ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <v-menu>
              <template #activator="{ props }">
                <v-btn v-bind="props" size="small" color="white">
                  Action
                  <v-icon end>mdi-chevron-down</v-icon>
                </v-btn>
              </template>

              <v-list density="compact">
                <v-list-item title="Edit" @click="openEditDialog(item)" />

                <v-list-item
                  :title="item.is_active ? '🔴 Deactivate' : '🟢 Activate'"
                  @click="toggleStatus(item)"
                />
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </div>
  <v-dialog v-model="editDialog" max-width="600">
    <v-card>
      <v-card-title>Edit Session</v-card-title>

      <v-card-text class="pt-4">
        <v-text-field
          v-model="editForm.category_name"
          label="Category"
          variant="outlined"
          disabled
          class="mb-2"
        />

        <v-text-field
          v-model="editForm.session_order"
          label="Session Order"
          type="number"
          variant="outlined"
          class="mb-2"
        />

        <v-text-field
          v-model="editForm.session_name"
          label="Session Name"
          variant="outlined"
          class="mb-2"
        />

        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="editForm.start_time"
              type="time"
              label="Start Time"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6">
            <v-text-field
              v-model="editForm.end_time"
              type="time"
              label="End Time"
              variant="outlined"
            />
          </v-col>
        </v-row>

        <v-text-field
          v-model="editForm.capacity"
          type="number"
          label="Max Students"
          variant="outlined"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="editDialog = false">Cancel</v-btn>

        <v-btn color="primary" @click="saveEdit">Save Changes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import api from '@/services/api'

const router = useRouter()
const loading = ref(false)
const items = ref([])
const search = ref('')
const categories = ref([])
const selectedCategory = ref(null)
const editDialog = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = [
  { title: 'Category', key: 'category_name' },
  { title: 'Order', key: 'session_order' },
  { title: 'Session', key: 'session_name' },
  { title: 'Time', key: 'time' },
  { title: 'Max Students', key: 'capacity' },
  { title: 'Status', key: 'is_active' },
  { title: '', key: 'actions', sortable: false },
]

const editForm = ref({
  id: null,
  category_name: '',
  session_order: 1,
  session_name: '',
  start_time: '',
  end_time: '',
  capacity: 1,
})

const fetchSessionTimes = async () => {
  loading.value = true

  try {
    const res = await api.get('/program-category-sessions', {
      params: {
        search: search.value || undefined,
        program_category_id: selectedCategory.value || undefined,
      },
    })

    items.value = res.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const debouncedFetch = debounce(() => {
  fetchSessionTimes()
}, 500)

const fetchCategories = async () => {
  try {
    const res = await api.get('/program-categories')

    categories.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

const openEditDialog = (item) => {
  editForm.value = {
    id: item.id,
    category_name: item.category_name,
    session_order: item.session_order,
    session_name: item.session_name,
    start_time: item.start_time,
    end_time: item.end_time,
    capacity: item.capacity,
  }

  editDialog.value = true
}

const toggleStatus = async (item) => {
  const action = item.is_active ? 'deactivate' : 'activate'

  if (!confirm(`Are you sure you want to ${action} this session?`)) {
    return
  }

  try {
    await api.patch(`/program-category-sessions/${item.id}/toggle-status`)

    snackbarText.value = `Session ${action}d successfully.`

    snackbarColor.value = 'success'

    snackbar.value = true

    await fetchSessionTimes()
  } catch (err) {
    snackbarText.value = err.response?.data?.message ?? `Failed to ${action} session.`

    snackbarColor.value = 'error'

    snackbar.value = true
  }
}

const saveEdit = async () => {
  try {
    await api.put(`/program-category-sessions/${editForm.value.id}`, {
      session_order: editForm.value.session_order,
      session_name: editForm.value.session_name,
      start_time: editForm.value.start_time,
      end_time: editForm.value.end_time,
      capacity: editForm.value.capacity,
    })

    snackbarText.value = 'Session updated successfully.'

    snackbarColor.value = 'success'

    snackbar.value = true

    editDialog.value = false

    await fetchSessionTimes()
  } catch (err) {
    snackbarText.value = err.response?.data?.message ?? 'Failed to update session.'

    snackbarColor.value = 'error'

    snackbar.value = true
  }
}

watch(search, () => {
  debouncedFetch()
})

watch(selectedCategory, () => {
  fetchSessionTimes()
})

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchSessionTimes()])
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
