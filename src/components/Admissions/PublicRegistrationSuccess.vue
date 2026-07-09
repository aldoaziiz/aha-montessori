<template>
  <div class="success-page">
    <v-card class="success-card rounded-xl" elevation="2">
      <div class="text-center">
        <v-icon size="80" color="success" class="mb-4">mdi-check-circle</v-icon>

        <h1 class="text-h4 font-weight-bold mb-3">Registration Submitted</h1>

        <p class="text-body-1 text-grey-darken-1 mb-6">
          Thank you for registering with
          <strong>AHA! Montessori</strong>
          .
        </p>

        <v-alert type="success" variant="tonal" class="mb-6 text-left">
          Your registration has been received successfully. Our team will review your submission and
          contact you soon.
        </v-alert>

        <v-card variant="outlined" class="pa-4 mb-6">
          <div class="text-caption text-grey mb-2">Registration Number</div>

          <div class="text-h5 font-weight-bold">
            {{ registrationNumber }}
          </div>
        </v-card>

        <div class="text-body-2 text-grey-darken-1 mb-8">
          Please save this registration number for future reference.
        </div>

        <div class="d-flex justify-center ga-3 flex-wrap">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="registerAnother">
            New Register
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const registrationNumber = computed(() => {
  return route.query.registration_number || '-'
})

const registerAnother = () => {
  router.push('/public-registrations')
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;
  background: #f5f5f5;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;
}

.success-card {
  width: 100%;
  max-width: 700px;
  padding: 48px 32px;
}
</style>
