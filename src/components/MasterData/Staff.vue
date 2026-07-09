<template>
  <div class="staff-content">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">{{ pageTitle }}</h1>
        <p class="text-body2 text-grey">{{ pageSubtitle }}</p>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" @click="router.push('/staff/create')">
        New Staff
      </v-btn>
    </div>

    <!-- Data Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="1">
          <v-card flat>
            <template v-slot:text>
              <v-text-field
                v-model="search"
                label="Search Name"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                hide-details
                single-line
              ></v-text-field>
            </template>

            <v-data-table-server
              :headers="headers"
              :items="staff"
              :items-length="totalItems"
              :loading="loading"
              :page="page"
              :items-per-page="itemsPerPage"
              @update:options="onOptionsChange"
            >
              <template v-slot:item.staff_role_id="{ item }">
                {{ item.staff_role?.name || '-' }}
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="Number(item.status?.id) === 1 ? 'green' : 'grey'">
                  {{ item.status?.name || '-' }}
                </v-chip>
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
          <div class="text-h6 font-weight-bold">Staff Details</div>
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
            <div class="text-body-2 text-grey">Loading staff details...</div>
          </div>
        </v-card-text>

        <v-card-text v-else-if="selectedStaff" class="py-6">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-label">Name</div>
              <div class="detail-value">{{ selectedStaff.name || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Email</div>
              <div class="detail-value">{{ selectedStaff.email || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Role</div>
              <div class="detail-value">{{ selectedStaff.staff_role?.name || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Phone</div>
              <div class="detail-value">{{ selectedStaff.phone || '-' }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-label">Address</div>
              <div class="detail-value">{{ selectedStaff.address || '-' }}</div>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-text v-else class="py-6">
          <div class="text-body-2 text-grey">No staff details available.</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <v-dialog v-model="statusLoading" persistent width="320">
    <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />

      <div class="text-h6 font-weight-medium mt-6">Processing...</div>

      <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import debounce from 'lodash/debounce'
import api from '@/services/api' // pakai axios instance kamu

const router = useRouter()
const pageTitle = 'Staff'
const pageSubtitle = 'Manage and view information about staff'

const statusLoading = ref(false)
const initialized = ref(false)
const staff = ref([])
const search = ref('')
const loading = ref(false)
const detailsDialog = ref(false)
const selectedStaff = ref(null)
const detailsLoading = ref(false)

const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const sortBy = ref([])

const headers = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Role', key: 'staff_role_id' },
  { title: 'Phone', key: 'phone' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'center' },
]

const fetchData = async () => {
  loading.value = true

  try {
    const res = await api.get('/staff', {
      params: {
        page: page.value,
        per_page: itemsPerPage.value,
        search: search.value,
        sort_by: sortBy.value[0]?.key,
        sort_order: sortBy.value[0]?.order,
      },
    })

    staff.value = res.data.data
    totalItems.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openDetails = async (item) => {
  detailsDialog.value = true

  detailsLoading.value = true

  selectedStaff.value = null

  try {
    const res = await api.get(`/staff/${item.id}`)

    selectedStaff.value = res.data
  } catch (err) {
    console.error('Error fetching staff details:', err)
  } finally {
    detailsLoading.value = false
  }
}

const goToEdit = (id) => {
  router.push(`/staff/${id}/edit`)
}

const toggleStatus = async (item) => {
  const isActive = Number(item.status?.id) === 1

  if (!confirm(`Yakin mau ${isActive ? 'nonaktifkan' : 'aktifkan'} data ini?`)) {
    return
  }

  statusLoading.value = true

  try {
    await api.put(
      `/staff/${item.id}`,

      {
        status_id: isActive ? 2 : 1,
      },
    )

    await fetchData()
  } catch (error) {
    console.error(error)
  } finally {
    statusLoading.value = false
  }
}

const onOptionsChange = (options) => {
  // ======================
  // PREVENT INITIAL DUPLICATE
  // ======================

  if (!initialized.value) {
    initialized.value = true
  } else {
    const samePage = page.value === options.page

    const sameItems = itemsPerPage.value === options.itemsPerPage

    const sameSort = JSON.stringify(sortBy.value) === JSON.stringify(options.sortBy)

    if (samePage && sameItems && sameSort) {
      return
    }
  }

  page.value = options.page

  itemsPerPage.value = options.itemsPerPage

  sortBy.value = options.sortBy

  fetchData()
}

const debouncedFetch = debounce(() => {
  page.value = 1
  fetchData()
}, 500)

watch(search, () => {
  debouncedFetch()
})

onUnmounted(() => {
  debouncedFetch.cancel()
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

.staff-content {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-left: 4px solid var(--v-primary-base);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: #f5f5f5;
}

.activity-item {
  border-bottom: 1px solid #e0e0e0;
}

.activity-item:last-child {
  border-bottom: none;
}

.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stat-card {
    margin-bottom: 12px;
  }
}
</style>
