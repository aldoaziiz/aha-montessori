<template>
  <div class="children-content">
    <!-- PAGE HEADER -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">
          {{ pageTitle }}
        </h1>

        <p class="text-body2 text-grey">
          {{ pageSubtitle }}
        </p>
      </div>
    </div>

    <!-- DATA TABLE -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="1">
          <v-card flat>
            <!-- SEARCH -->
            <template v-slot:text>
              <v-text-field
                v-model="search"
                label="Search Name"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                hide-details
                single-line
              />
            </template>

            <!-- TABLE -->
            <v-data-table-server
              :headers="headers"
              :items="children"
              :items-length="totalItems"
              :loading="loading"
              :page="page"
              :items-per-page="itemsPerPage"
              @update:options="onOptionsChange"
            >
              <!-- BIRTH DATE -->
              <template v-slot:item.birth_date="{ item }">
                <div>
                  <div>
                    {{ formatDate(item.birth_date) }}
                  </div>

                  <div class="text-caption text-grey">
                    {{ calculateAgeDetail(item.birth_date) }}
                  </div>
                </div>
              </template>

              <!-- CREATED -->
              <template v-slot:item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <!-- STATUS -->
              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="Number(item.status_id) === 1 ? 'green' : 'grey'">
                  {{ item.status?.name || '-' }}
                </v-chip>
              </template>

              <!-- ACTIONS -->
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

                    <v-list-item
                      :disabled="statusLoadingId === item.id"
                      @click="toggleStatus(item)"
                    >
                      <v-list-item-title>
                        <template v-if="statusLoadingId === item.id">Processing...</template>

                        <template v-else>
                          {{ Number(item.status?.id) === 1 ? '🔴 Deactivate' : '🟢 Activate' }}
                        </template>
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
  </div>

  <!-- DETAILS DIALOG -->
  <v-dialog v-model="detailsDialog" max-width="900" scrollable>
    <v-card rounded="xl">
      <!-- HEADER -->
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 font-weight-bold">Child Details</div>

        <v-btn icon variant="text" @click="detailsDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- LOADING -->
      <v-card-text
        v-if="detailsLoading"
        class="py-6 d-flex justify-center align-center"
        style="min-height: 400px"
      >
        <div class="text-center">
          <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />

          <div class="text-body-2 text-grey">Loading child details...</div>
        </div>
      </v-card-text>

      <!-- CONTENT -->
      <v-card-text v-if="selectedChild && !detailsLoading" class="py-6">
        <!-- BASIC INFO -->
        <div class="mb-6">
          <div class="text-subtitle-1 font-weight-bold mb-4">-- Basic Information --</div>

          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-label">ID Number</div>

              <div class="detail-value">
                {{ selectedChild.id_number || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="detail-label">Full Name</div>

              <div class="detail-value">
                {{ selectedChild.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="detail-label">Nickname</div>

              <div class="detail-value">
                {{ selectedChild.nickname || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="detail-label">Gender</div>

              <div class="detail-value">
                {{ selectedChild.gender || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="detail-label">Birth Date</div>

              <div class="detail-value">
                {{ formatDate(selectedChild.birth_date) || '-' }}
                -
                {{ calculateAgeDetail(selectedChild.birth_date) || '-' }}
              </div>
            </v-col>

            <!-- GUARDIANS -->
            <v-col cols="12">
              <div class="detail-label">Guardians</div>

              <div v-if="selectedChild.guardians?.length">
                <div
                  v-for="guardian in selectedChild.guardians"
                  :key="guardian.id"
                  class="guardian-item"
                >
                  <div class="detail-value">
                    {{ guardian.name }}
                  </div>

                  <div class="text-body-2 text-primary">
                    {{ getGuardianRoleName(guardian.pivot?.guardian_role_id) }}
                  </div>

                  <div class="text-body-2 text-grey">
                    {{ guardian.phone || '-' }}
                  </div>
                </div>
              </div>

              <div v-else class="detail-value">-</div>
            </v-col>
          </v-row>
        </div>

        <!-- LOCATION -->
        <div class="mb-6">
          <div class="text-subtitle-1 font-weight-bold mb-4">-- Location --</div>

          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-label">Birthplace</div>

              <div class="detail-value">
                {{ selectedChild.birthplace?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="detail-label">Hometown</div>

              <div class="detail-value">
                {{ selectedChild.hometown?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12">
              <div class="detail-label">Address</div>

              <div class="detail-value">
                {{ selectedChild.address || '-' }}
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- EDUCATION -->
        <div>
          <div class="text-subtitle-1 font-weight-bold mb-4">-- Education --</div>

          <v-row>
            <v-col cols="12" md="4">
              <div class="detail-label">School</div>

              <div class="detail-value">
                {{ selectedChild.school?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="detail-label">School Class</div>

              <div class="detail-value">
                {{ selectedChild.school_class?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="detail-label">Education Level</div>

              <div class="detail-value">
                {{ selectedChild.school_education?.name || '-' }}
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- STATUS LOADING DIALOG -->
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
import debounce from 'lodash/debounce'
import api from '@/services/api' // pakai axios instance kamu
import { useRouter } from 'vue-router'

const router = useRouter()
const pageTitle = 'Children'
const pageSubtitle = 'Manage and view information about children'
const children = ref([])
const search = ref('')
const loading = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)
const totalItems = ref(0)
const detailsDialog = ref(false)
const selectedChild = ref(null)
const detailsLoading = ref(false)
const sortBy = ref([])
const guardianRoles = ref([])
const statusLoadingId = ref(null)
const statusLoading = ref(false)
const initialized = ref(false)

const openDetails = async (child) => {
  detailsDialog.value = true

  detailsLoading.value = true

  selectedChild.value = null

  try {
    // ======================
    // LAZY LOAD GUARDIAN ROLES
    // ======================

    if (!guardianRoles.value.length) {
      const guardianRoleRes = await api.get('/guardian-roles')

      guardianRoles.value = guardianRoleRes.data.data
    }

    // ======================
    // FETCH CHILD DETAILS
    // ======================

    const res = await api.get(`/children/${child.id}`)

    selectedChild.value = res.data
  } catch (err) {
    console.error('Error fetching child details:', err)
  } finally {
    detailsLoading.value = false
  }
}

const headers = [
  { title: 'ID No.', key: 'id_number' },
  { title: 'Name', key: 'name' },
  { title: 'Birth Date', key: 'birth_date' },
  { title: 'Gender', key: 'gender' },
  { title: 'Enrollment Date', key: 'created_at' },
  { title: 'Address', key: 'address' },
  { title: 'Status', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'center' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const res = await api.get('/children', {
      params: {
        page: page.value,
        per_page: itemsPerPage.value,
        search: search.value,
        sort_by: sortBy.value[0]?.key,
        sort_order: sortBy.value[0]?.order,
      },
    })

    children.value = res.data.data
    totalItems.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const getGuardianRoleName = (roleId) => {
  const role = guardianRoles.value.find((item) => item.id === roleId)

  return role?.name || '-'
}

const formatDate = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const goToEdit = (id) => {
  router.push(`/children/${id}/edit`)
}

const calculateAgeDetail = (birthDate) => {
  if (!birthDate) return '-'

  const today = new Date()

  const birth = new Date(birthDate + 'T00:00:00')

  let years = today.getFullYear() - birth.getFullYear()

  let months = today.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--
    months += 12
  }

  return `${years} yr, ${months} mo`
}

const toggleStatus = async (item) => {
  const isActive = Number(item.status?.id) === 1

  if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this child?`)) {
    return
  }

  statusLoading.value = true

  try {
    await api.put(`/children/${item.id}`, {
      status_id: isActive ? 2 : 1,
    })

    await fetchData()
  } catch (error) {
    console.error(error)
  } finally {
    statusLoading.value = false
  }
}

const debouncedFetch = debounce(() => {
  page.value = 1
  fetchData()
}, 500)

const onOptionsChange = (options) => {
  // ======================
  // PREVENT INITIAL DOUBLE FETCH
  // ======================

  if (!initialized.value) {
    initialized.value = true

    page.value = options.page
    itemsPerPage.value = options.itemsPerPage
    sortBy.value = options.sortBy

    fetchData()

    return
  }

  // ======================
  // SKIP DUPLICATE SAME OPTIONS
  // ======================

  const samePage = page.value === options.page

  const sameItemsPerPage = itemsPerPage.value === options.itemsPerPage

  const sameSort = JSON.stringify(sortBy.value) === JSON.stringify(options.sortBy)

  if (samePage && sameItemsPerPage && sameSort) {
    return
  }

  page.value = options.page
  itemsPerPage.value = options.itemsPerPage
  sortBy.value = options.sortBy

  fetchData()
}

watch(search, () => {
  debouncedFetch()
})

onUnmounted(() => {
  debouncedFetch.cancel()
})
</script>

<style scoped>
.children-content {
  width: 100%;
}

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

.guardian-item {
  margin-bottom: 12px;
}

.guardian-item:last-child {
  margin-bottom: 0;
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
