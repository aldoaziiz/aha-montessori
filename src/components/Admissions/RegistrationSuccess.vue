<template>
  <div class="success-page">
    <v-card class="success-card" rounded="xl" elevation="3">
      <div class="text-center">
        <v-icon size="72" color="success" class="mb-4">mdi-check-circle</v-icon>

        <h1 class="text-h4 font-weight-bold mb-3">Registration Submitted</h1>

        <p class="text-body-1 text-grey-darken-1 mb-6">
          Thank you. Your registration has been submitted successfully.
        </p>

        <v-alert type="success" variant="tonal" class="mb-6">
          Registration Number:
          <strong>
            {{ registrationNumber }}
          </strong>
        </v-alert>

        <p class="text-body-2 text-grey mb-6">Our admin team will contact you soon.</p>

        <v-btn color="primary" size="large" @click="createNew">Create New Registration</v-btn>
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

const createNew = () => {
  router.replace('/registrations-new')
}
</script>

<style scoped>
.success-page {
  min-height: 100vh;

  display: flex;

  justify-content: center;

  align-items: center;

  padding: 24px;

  background: #f5f5f5;
}

.success-card {
  width: 100%;

  max-width: 520px;

  padding: 48px 32px;
}
</style>
