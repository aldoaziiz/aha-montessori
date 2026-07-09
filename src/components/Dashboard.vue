<template>
  <v-container fluid class="pa-6">
    <v-row justify="center">
      <v-col cols="12" md="9" lg="8">
        <v-fade-transition appear>
          <v-card rounded="xl" elevation="2" class="pa-8 text-center">
            <!-- Greeting -->
            <div class="text-h4 font-weight-bold mb-2">{{ greeting }}, {{ userName }}</div>

            <div class="text-subtitle-1 text-medium-emphasis mb-6">
              Welcome back to AHA! Montessori
            </div>

            <v-chip color="orange" variant="tonal" prepend-icon="mdi-calendar" class="mb-8">
              {{ currentDate }}
            </v-chip>

            <!-- Logo -->
            <div>
              <v-avatar size="130" rounded="0" class="mb-6">
                <v-img src="@/assets/ahamon-logo.png" contain />
              </v-avatar>
            </div>

            <!-- Quote -->
            <div class="text-h6 font-weight-medium mb-2" style="color: #e6611d">
              Every child learns differently.
            </div>

            <div class="text-h6 mb-8">Every small step is meaningful.</div>

            <v-divider class="mb-6" />

            <div class="text-body-1 text-medium-emphasis">
              Thank you for being part of the AHA family. Together, we create meaningful moments for
              every child's growth.
            </div>

            <div class="mt-10 text-caption text-disabled">Version 1.0.0</div>
          </v-card>
        </v-fade-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const user = JSON.parse(localStorage.getItem('user') || '{}')

const userName = computed(() => {
  return authStore.user?.name || 'User'
})

const greeting = computed(() => {
  const hour = new Date().getHours()

  if (hour < 11) return 'Good Morning'
  if (hour < 15) return 'Good Afternoon'
  if (hour < 18) return 'Good Evening'

  return 'Hello'
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})
</script>
