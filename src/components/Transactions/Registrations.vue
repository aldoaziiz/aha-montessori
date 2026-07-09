<template>
  <div class="registrations-content">
    <!-- Header -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">Registrations</h1>

        <p class="text-body2 text-grey">Manage and view registration data</p>
      </div>
    </div>

    <!-- Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="1">
          <v-card flat>
            <!-- Search -->
            <template v-slot:text>
              <v-text-field
                v-model="search"
                label="Search"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                hide-details
                single-line
              />
            </template>

            <!-- Data Table -->
            <v-data-table-server
              :headers="headers"
              :items="registrations"
              :items-length="totalItems"
              :loading="loading"
              :page="page"
              :items-per-page="itemsPerPage"
              @update:options="onOptionsChange"
            >
              <!-- CHILD -->
              <template v-slot:item.child="{ item }">
                <div>
                  <div class="font-weight-medium">
                    {{ item.child?.name }}
                  </div>
                </div>
              </template>

              <!-- BIRTH DATE -->
              <template v-slot:item.child.birth_date="{ item }">
                {{ formatDate(item.child?.birth_date) }}
              </template>

              <!-- AGE -->
              <template v-slot:item.age="{ item }">
                {{ calculateAge(item.child?.birth_date) }}
              </template>

              <!-- REGISTRATION DATE -->
              <template v-slot:item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <!-- PAYMENT STATUS -->
              <template v-slot:item.payment_status.id="{ item }">
                <v-chip
                  :color="getStatusColor(item.billing?.payment_status?.id)"
                  variant="tonal"
                  size="small"
                  class="mb-1"
                >
                  {{ item.billing?.payment_status?.name || '-' }}
                </v-chip>
              </template>

              <!-- ACTION -->
              <template v-slot:item.actions="{ item }">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="small" color="white">
                      Action

                      <v-icon right>mdi-chevron-down</v-icon>
                    </v-btn>
                  </template>

                  <v-list>
                    <!-- DETAILS -->
                    <v-list-item @click="openDetails(item)">
                      <v-list-item-title>Details</v-list-item-title>
                    </v-list-item>

                    <!-- EDIT -->
                    <v-list-item v-if="!item.billing" @click="editRegistration(item)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>

                    <!-- GENERATE BILLING -->
                    <v-list-item v-if="!item.billing" @click="generateBilling(item)">
                      <v-list-item-title>Generate Billing</v-list-item-title>
                    </v-list-item>

                    <!-- VIEW BILLING -->
                    <v-list-item v-if="item.billing" @click="viewBilling(item)">
                      <v-list-item-title>View Billing</v-list-item-title>
                    </v-list-item>

                    <!-- SCHEDULE -->
                    <v-list-item @click="schedule(item)">
                      <v-list-item-title>Schedule</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table-server>
          </v-card>
        </v-card>
      </v-col>
    </v-row>

    <!-- PAGE ACTION LOADING -->
    <v-dialog v-model="pageActionLoading" persistent fullscreen scrim="black">
      <div class="d-flex flex-column align-center justify-center h-100">
        <v-card rounded="xl" class="pa-8 text-center" width="320">
          <v-progress-circular indeterminate color="primary" size="56" width="5" />

          <div class="text-h6 font-weight-medium mt-6">
            {{ pageActionText }}
          </div>

          <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
        </v-card>
      </div>
    </v-dialog>
  </div>

  <v-dialog v-model="detailsDialog" max-width="900" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 font-weight-bold">Registration Details</div>

        <v-btn icon variant="text" @click="detailsDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- LOADING -->
      <v-card-text v-if="detailsLoading" class="py-8 d-flex justify-center">
        <v-progress-circular indeterminate color="primary" size="48" />
      </v-card-text>

      <!-- CONTENT -->
      <v-card-text v-else-if="selectedRegistration" class="py-6">
        <!-- Registration -->
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Registration Information</h3>

        <v-row class="mb-6">
          <v-col cols="12" md="6">
            <div class="detail-label">Registration No.</div>
            <div class="detail-value">
              {{ selectedRegistration.registration_number }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-label">Registration Date</div>
            <div class="detail-value">
              {{ formatDate(selectedRegistration.created_at) }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-label">Clinic</div>
            <div class="detail-value">
              {{ selectedRegistration.clinic?.name || '-' }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-label">Payer</div>
            <div class="detail-value">
              {{ selectedRegistration.payer?.name || '-' }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-label">Problem</div>
            <div class="detail-value">
              {{ selectedRegistration.complaint || '-' }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-label">Payment Status</div>

            <v-chip :color="getStatusColor(selectedRegistration.payment_status?.id)" size="small">
              {{ selectedRegistration.payment_status?.name }}
            </v-chip>
          </v-col>
        </v-row>

        <v-divider class="mb-6" />

        <!-- Child -->
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Child Information</h3>

        <v-row class="mb-6">
          <v-col cols="12" md="6">
            <div class="detail-label">Child Name</div>
            <div class="detail-value">
              {{ selectedRegistration.child?.name || '-' }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="detail-label">Birth Date</div>
            <div class="detail-value">
              {{ formatDate(selectedRegistration.child?.birth_date) }}
            </div>
          </v-col>

          <v-col cols="12">
            <div class="detail-label mb-3">Guardians</div>

            <div
              v-for="guardian in selectedRegistration.child?.guardians || []"
              :key="guardian.id"
              class="mb-4"
            >
              <div class="detail-value">
                {{ guardian.name }}
              </div>

              <div class="text-light-blue text-body-2">
                {{ guardian.guardian_role?.name || '-' }}
              </div>

              <div class="text-medium-emphasis">
                {{ guardian.phone || '-' }}
              </div>
            </div>
          </v-col>
        </v-row>

        <v-divider class="mb-6" />

        <!-- Programs -->
        <h3 class="text-subtitle-1 font-weight-bold mb-4">Programs</h3>

        <v-list density="compact">
          <v-list-item v-for="program in selectedRegistration.programs" :key="program.id">
            <template #append>
              {{ formatCurrency(program.price) }}
            </template>

            <v-list-item-title>
              {{ program.name }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <v-divider class="my-4" />

        <div class="d-flex justify-space-between font-weight-bold text-h6">
          <span>Total</span>

          <span>
            {{ formatCurrency(calculateTotal(selectedRegistration.programs)) }}
          </span>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="billingDialog" max-width="700" scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 font-weight-bold">Billing Details</div>

        <v-btn icon variant="text" @click="billingDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- LOADING -->
      <v-card-text v-if="billingLoading" class="py-8 text-center">
        <v-progress-circular indeterminate color="primary" />

        <div class="mt-4">Loading billing details...</div>
      </v-card-text>

      <!-- CONTENT -->
      <v-card-text v-else-if="selectedBilling" class="py-6">
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <div class="text-caption text-grey">Invoice Number</div>

            <div class="font-weight-medium">
              {{ selectedBilling.invoice_number }}
            </div>
          </v-col>

          <v-col cols="12">
            <div class="text-caption text-grey">Invoice Link</div>

            <div class="d-flex ga-2 mt-1">
              <v-text-field :model-value="invoiceUrl" readonly density="compact" hide-details />

              <v-btn icon variant="text" @click="copyInvoiceLink">
                <v-icon>mdi-content-copy</v-icon>
              </v-btn>

              <v-btn icon variant="text" @click="openInvoice">
                <v-icon>mdi-open-in-new</v-icon>
              </v-btn>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="text-caption text-grey">Registration Number</div>

            <div class="font-weight-medium">
              {{ selectedBilling.registration?.registration_number }}
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="text-caption text-grey">Payment Status</div>

            <v-chip size="small" :color="getStatusColor(selectedBilling.payment_status?.id)">
              {{ selectedBilling.payment_status?.name }}
            </v-chip>
          </v-col>

          <v-col cols="12" v-if="selectedBilling.admin_note">
            <v-alert type="warning" variant="tonal">
              {{ selectedBilling.admin_note }}
            </v-alert>
          </v-col>

          <v-col cols="12" md="6">
            <div class="text-caption text-grey">Child</div>

            <div class="font-weight-medium">
              {{ selectedBilling.registration?.child?.name }}
            </div>
          </v-col>

          <v-col cols="12">
            <div class="text-caption text-grey">Payer</div>

            <div class="font-weight-medium">
              {{ selectedBilling.registration?.payer?.name || '-' }}
            </div>
          </v-col>
        </v-row>

        <v-divider class="mb-4" />

        <div class="text-subtitle-1 font-weight-bold mb-3">Billing Items</div>

        <div
          v-for="item in selectedBilling.items"
          :key="item.id"
          class="d-flex justify-space-between py-2"
        >
          <div>
            {{ item.description }}
          </div>

          <div class="font-weight-medium">
            {{ formatCurrency(item.subtotal) }}
          </div>
        </div>

        <!-- RECEIPT -->
        <div v-if="selectedBilling.payment_receipt">
          <v-divider class="my-4" />

          <div class="text-subtitle-1 font-weight-bold mb-3">Proof of Payment</div>

          <v-img :src="receiptUrl" max-height="250" class="rounded-lg border mb-3" cover />

          <v-btn variant="text" prepend-icon="mdi-open-in-new" @click="openReceipt">
            Open Full Image
          </v-btn>
        </div>

        <v-divider class="my-4" />

        <div class="d-flex justify-space-between font-weight-bold text-h6">
          <span>TOTAL</span>

          <span>
            {{ formatCurrency(selectedBilling.total_amount) }}
          </span>
        </div>
      </v-card-text>
      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <v-btn variant="text" @click="billingDialog = false">Close</v-btn>

        <v-btn color="primary" prepend-icon="mdi-file-pdf-box" @click="downloadPdf">
          Download Invoice
        </v-btn>

        <!-- UNPAID -->
        <v-btn
          v-if="Number(selectedBilling?.payment_status?.id) === 1"
          color="error"
          prepend-icon="mdi-close-circle"
          :loading="cancelBillingLoading"
          @click="cancelBilling"
        >
          Cancel Billing
        </v-btn>

        <!-- WAITING -->
        <template v-if="Number(selectedBilling?.payment_status?.id) === 2">
          <v-btn
            color="error"
            variant="outlined"
            prepend-icon="mdi-close"
            @click="rejectDialog = true"
          >
            Reject
          </v-btn>

          <v-btn
            color="success"
            prepend-icon="mdi-check"
            :loading="approveLoading"
            @click="approvePayment"
          >
            Approve Payment
          </v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="rejectDialog" max-width="500">
    <v-card rounded="xl">
      <v-card-title>Reject Payment</v-card-title>

      <v-card-text>
        <v-textarea v-model="adminNote" label="Reason" variant="outlined" rows="3" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="rejectDialog = false">Cancel</v-btn>

        <v-btn color="error" :loading="rejectLoading" :disabled="!adminNote" @click="rejectPayment">
          Reject Payment
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top right">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'

import api from '@/services/api'

import debounce from 'lodash/debounce'

import { useRouter } from 'vue-router'

const backendBaseUrl = import.meta.env.VITE_API_URL.replace('/api', '')

const router = useRouter()

const registrations = ref([])

const search = ref('')

const loading = ref(false)

const page = ref(1)

const itemsPerPage = ref(10)

const totalItems = ref(0)

const sortBy = ref([])

const initialized = ref(false)

const pageActionLoading = ref(false)

const pageActionText = ref('Loading...')

const detailsDialog = ref(false)
const detailsLoading = ref(false)
const selectedRegistration = ref(null)
const billingDialog = ref(false)
const billingLoading = ref(false)
const selectedBilling = ref(null)
const cancelBillingLoading = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const approveLoading = ref(false)

const rejectLoading = ref(false)

const rejectDialog = ref(false)

const adminNote = ref('')

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const downloadPdf = async () => {
  try {
    const response = await api.get(`/billings/${selectedBilling.value.id}/pdf`, {
      responseType: 'blob',
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))

    const link = document.createElement('a')

    link.href = url

    link.download = `${selectedBilling.value.invoice_number}.pdf`

    document.body.appendChild(link)

    link.click()

    link.remove()

    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)

    showSnackbar('Failed to download PDF.', 'error')
  }
}

const receiptUrl = computed(() => {
  if (!selectedBilling.value?.payment_receipt) {
    return null
  }
  return `${import.meta.env.VITE_STORAGE_URL}/${selectedBilling.value.payment_receipt}`
})

const openReceipt = () => {
  if (!receiptUrl.value) return

  window.open(receiptUrl.value, '_blank')
}

// ======================
// SEARCH
// ======================

const debouncedFetch = debounce(() => {
  page.value = 1

  fetchData()
}, 500)

watch(search, () => {
  debouncedFetch()
})

// ======================
// HEADERS
// ======================

const headers = [
  {
    title: 'Registration No.',
    key: 'registration_number',
  },

  {
    title: 'Registration Date',
    key: 'created_at',
  },

  {
    title: 'Child Name',
    key: 'child',
  },

  {
    title: 'Payment Status',
    key: 'payment_status.id',
  },

  {
    title: '',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

// ======================
// FETCH DATA
// ======================

const fetchData = async () => {
  loading.value = true

  try {
    const res = await api.get('/registrations', {
      params: {
        page: page.value,

        per_page: itemsPerPage.value,

        search: search.value,

        sort_by: sortBy.value[0]?.key,

        sort_order: sortBy.value[0]?.order,
      },
    })

    registrations.value = res.data.data

    totalItems.value = res.data.total
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// generate billing
const generateBilling = async (item) => {
  const confirmed = confirm(
    'Generate billing?\n\nRegistration will be locked and can no longer be edited.',
  )

  if (!confirmed) {
    return
  }

  try {
    pageActionText.value = 'Generating Billing...'

    pageActionLoading.value = true

    await api.post(`/registrations/${item.id}/generate-billing`)

    await fetchData()

    showSnackbar('Billing generated successfully')
  } catch (error) {
    console.error(error)

    showSnackbar(error.response?.data?.message || 'Failed to generate billing', 'error')
  } finally {
    pageActionLoading.value = false
  }
}

// view billing
const viewBilling = async (item) => {
  try {
    billingDialog.value = true

    billingLoading.value = true

    selectedBilling.value = null

    const res = await api.get(`/billings/${item.billing.id}`)

    selectedBilling.value = res.data.data
  } catch (error) {
    console.error(error)

    showSnackbar(error.response?.data?.message || 'Failed to load billing', 'error')

    billingDialog.value = false
  } finally {
    billingLoading.value = false
  }
}

// cancel billing
const cancelBilling = async () => {
  if (!selectedBilling.value) {
    return
  }

  const confirmed = confirm('Cancel this billing?\n\nRegistration will become editable again.')

  if (!confirmed) {
    return
  }

  try {
    cancelBillingLoading.value = true

    await api.post(`/billings/${selectedBilling.value.id}/cancel`)

    billingDialog.value = false

    await fetchData()

    showSnackbar('Billing cancelled successfully')
  } catch (error) {
    console.error(error)

    showSnackbar(error.response?.data?.message || 'Failed to cancel billing', 'error')
  } finally {
    cancelBillingLoading.value = false
  }
}

// link invoice
const invoiceUrl = computed(() => {
  if (!selectedBilling.value) {
    return ''
  }

  return `${window.location.origin}/invoice/${selectedBilling.value.invoice_token}`
})

const copyInvoiceLink = async () => {
  try {
    await navigator.clipboard.writeText(invoiceUrl.value)

    showSnackbar('Invoice link copied.')
  } catch {
    showSnackbar('Failed to copy invoice link.', 'error')
  }
}

const openInvoice = () => {
  window.open(invoiceUrl.value, '_blank')
}

// approve payment
const approvePayment = async () => {
  try {
    approveLoading.value = true

    await api.post(`/billings/${selectedBilling.value.id}/approve`)

    const res = await api.get(`/billings/${selectedBilling.value.id}`)

    selectedBilling.value = res.data.data

    await fetchData()

    showSnackbar('Payment approved successfully.')
  } catch (err) {
    console.error(err)
    showSnackbar(err.response?.data?.message || 'Failed to approve payment.', 'error')
  } finally {
    approveLoading.value = false
  }
}

// reject payment
const rejectPayment = async () => {
  try {
    rejectLoading.value = true

    await api.post(`/billings/${selectedBilling.value.id}/reject`, {
      admin_note: adminNote.value,
    })

    const res = await api.get(`/billings/${selectedBilling.value.id}`)

    selectedBilling.value = res.data.data

    await fetchData()

    rejectDialog.value = false

    adminNote.value = ''

    showSnackbar('Payment rejected successfully.')
  } catch (err) {
    console.error(err)
    showSnackbar(err.response?.data?.message || 'Failed to reject payment.', 'error')
  } finally {
    rejectLoading.value = false
  }
}

// ======================
// FORMAT DATE
// ======================

const formatDate = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-ID', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

// ======================
// AGE
// ======================

const calculateAge = (birthDate) => {
  if (!birthDate) return '-'

  const today = new Date()

  const birth = new Date(birthDate)

  let years = today.getFullYear() - birth.getFullYear()

  let months = today.getMonth() - birth.getMonth()

  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--

    months += 12
  }

  return `${years} yr, ${months} mo`
}

// ======================
// STATUS COLOR
// ======================

const getStatusColor = (id) => {
  if (id === 1) return 'warning'

  if (id === 2) return 'info'

  if (id === 3) return 'success'

  return 'grey'
}

// ======================
// VIEW SCHEDULE
// ======================

const schedule = async (item) => {
  pageActionText.value = 'Opening Schedule...'

  pageActionLoading.value = true

  try {
    await router.push(`/registrations/${item.id}/schedule`)
  } finally {
    setTimeout(() => {
      pageActionLoading.value = false
    }, 300)
  }
}

const openDetails = async (item) => {
  detailsDialog.value = true
  detailsLoading.value = true
  selectedRegistration.value = null

  try {
    const res = await api.get(`/registrations/${item.id}`)

    selectedRegistration.value = res.data.data
  } catch (err) {
    console.error('Error loading registration details:', err)
  } finally {
    detailsLoading.value = false
  }
}

const calculateTotal = (programs = []) => {
  return programs.reduce((total, program) => total + Number(program.price || 0), 0)
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(Number(value || 0))
}

// ======================
// EDIT
// ======================

const editRegistration = async (item) => {
  try {
    pageActionText.value = 'Opening Registration...'

    pageActionLoading.value = true

    await router.push(`/registrations/${item.id}/edit`)
  } finally {
    setTimeout(() => {
      pageActionLoading.value = false
    }, 300)
  }
}

// ======================
// TABLE OPTIONS
// ======================

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

// ======================
// CLEANUP
// ======================

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

.registrations-content {
  width: 100%;
}

.page-header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 24px;
}
</style>
