<template>
  <div v-if="!isRouterReady" class="app-loading-shell">
    <v-progress-circular indeterminate color="primary" size="48" />

    <div class="mt-4 text-body-1 text-medium-emphasis">Memuat halaman...</div>
  </div>

  <component v-else :is="layout">
    <router-view />
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import router from '@/router'
import AppLayout from '@/layouts/AppLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'

const route = useRoute()
const isRouterReady = ref(false)

onMounted(async () => {
  await router.isReady()
  isRouterReady.value = true
})

const layout = computed(() => {
  return route.meta.layout === 'app' ? AppLayout : BlankLayout
})
</script>

<style scoped>
.app-loading-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}
</style>
