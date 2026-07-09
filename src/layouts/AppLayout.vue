<template>
  <v-app>
    <div class="app-layout-wrapper">
      <Topbar @toggle-sidebar="toggleSidebar" />
      <Sidebar ref="sidebarRef" />

      <!-- Main Content Area -->
      <v-main class="content-main">
        <div class="content-wrapper">
          <slot />
        </div>
      </v-main>
    </div>
  </v-app>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Topbar from '@/components/Topbar.vue'
import Sidebar from '@/components/Sidebar.vue'

const sidebarRef = ref()

const toggleSidebar = () => {
  if (sidebarRef.value) {
    sidebarRef.value.sidebarOpen = !sidebarRef.value.sidebarOpen
  }
}
</script>

<style scoped>
.app-layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #f5f5f5;
}

.content-main {
  display: flex;
  justify-content: center;
}

.content-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 1400px;
  padding: 20px;
}
</style>
