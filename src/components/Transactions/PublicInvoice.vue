<template>
  <div class="public-invoice-page">
    <v-container class="py-8" max-width="800">
      <!-- LOADING -->
      <v-card v-if="loading" class="rounded-xl pa-8 text-center">
        <v-progress-circular indeterminate color="primary" size="48" />

        <div class="mt-4">Loading invoice...</div>
      </v-card>

      <!-- ERROR -->
      <v-alert v-else-if="error" type="error" variant="tonal">
        {{ error }}
      </v-alert>

      <!-- CONTENT -->
      <v-card v-else elevation="2" class="rounded-xl">
        <v-card-text class="pa-6">
          <!-- HEADER -->
          <div class="text-center mb-8">
            <h1 class="text-h5 font-weight-bold">AHA! Montessori</h1>

            <div class="text-body-2 text-grey mt-1">Invoice</div>
          </div>

          <!-- INFORMATION -->
          <v-row class="mb-6">
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">Invoice Number</div>

              <div class="font-weight-medium">
                {{ invoice.invoice_number }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-caption text-grey">Registration Number</div>

              <div class="font-weight-medium">
                {{ invoice.registration.registration_number }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-caption text-grey">Child</div>

              <div class="font-weight-medium">
                {{ invoice.registration.child.name }}
              </div>
            </v-col>

            <v-col cols="12" md="6">
              <div class="text-caption text-grey">Payer</div>

              <div class="font-weight-medium">
                {{ invoice.registration.payer?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12">
              <div class="text-caption text-grey mb-1">Payment Status</div>

              <v-chip :color="getStatusColor(invoice.payment_status.id)" variant="tonal">
                {{ invoice.payment_status.name }}
              </v-chip>
            </v-col>
          </v-row>

          <v-divider class="mb-6" />

          <!-- ITEMS -->
          <div class="text-subtitle-1 font-weight-bold mb-4">Billing Items</div>

          <div
            v-for="item in invoice.items"
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

          <v-divider class="my-6" />

          <!-- TOTAL -->
          <div class="d-flex justify-space-between text-h6 font-weight-bold">
            <span>TOTAL</span>

            <span>
              {{ formatCurrency(invoice.total_amount) }}
            </span>
          </div>
          <v-divider class="my-6" />

          <!-- UNPAID -->
          <div v-if="invoice.payment_status.id === 1">
            <div class="text-subtitle-1 font-weight-bold mb-4">Upload Proof of Payment</div>

            <v-file-input
              v-model="selectedReceipt"
              label="Receipt Image"
              accept="image/*"
              prepend-icon="mdi-paperclip"
              variant="outlined"
              show-size
            />

            <v-btn
              color="primary"
              prepend-icon="mdi-upload"
              :loading="uploadLoading"
              :disabled="uploadLoading || !selectedReceipt"
              @click="uploadReceipt"
            >
              Upload Receipt
            </v-btn>
          </div>

          <!-- WAITING -->
          <v-alert v-else-if="invoice.payment_status.id === 2" type="info" variant="tonal">
            Proof of payment has been submitted. Please wait for admin verification.
          </v-alert>

          <v-alert v-if="invoice.admin_note" class="mt-4" type="warning" variant="tonal">
            {{ invoice.admin_note }}
          </v-alert>

          <!-- PAID -->
          <v-alert v-else-if="invoice.payment_status.id === 3" type="success" variant="tonal">
            Payment has been verified. Thank you.
          </v-alert>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" location="top">
    {{ snackbarText }}
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()

const loading = ref(true)

const invoice = ref(null)

const error = ref('')

const selectedReceipt = ref(null)

const uploadLoading = ref(false)

const snackbar = ref(false)

const snackbarText = ref('')

const snackbarColor = ref('success')

const showSnackbar = (text, color = 'success') => {
  snackbarText.value = text

  snackbarColor.value = color

  snackbar.value = true
}

const fetchInvoice = async () => {
  try {
    loading.value = true

    const res = await api.get(`/public/billings/${route.params.token}`)

    invoice.value = res.data.data
  } catch (err) {
    console.error(err)

    error.value = err.response?.data?.message || 'Invoice not found'
  } finally {
    loading.value = false
  }
}

const uploadReceipt = async () => {
  if (!selectedReceipt.value) {
    showSnackbar('Please select a receipt image.', 'error')

    return
  }

  try {
    uploadLoading.value = true

    const formData = new FormData()

    formData.append('receipt', selectedReceipt.value)

    await api.post(`/public/billings/${route.params.token}/upload-receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    showSnackbar('Receipt uploaded successfully.')

    selectedReceipt.value = null

    await fetchInvoice()
  } catch (err) {
    console.error(err)

    showSnackbar(err.response?.data?.message || 'Failed to upload receipt.', 'error')
  } finally {
    uploadLoading.value = false
  }
}

const formatCurrency = (value) => {
  return `Rp ${Number(value || 0).toLocaleString('id-ID')}`
}

const getStatusColor = (id) => {
  if (id === 1) return 'warning'

  if (id === 2) return 'info'

  if (id === 3) return 'success'

  return 'grey'
}

onMounted(() => {
  fetchInvoice()
})
</script>

<style scoped>
.public-invoice-page {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
