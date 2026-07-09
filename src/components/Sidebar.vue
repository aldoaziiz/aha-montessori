<template>
  <!-- Sidebar -->
  <v-navigation-drawer
    v-model="sidebarOpen"
    :permanent="!isMobile"
    :temporary="isMobile"
    class="sidebar"
  >
    <v-list dense nav>
      <v-list-item
        v-if="
          authStore.isAdmin || authStore.isGuardian || authStore.isTherapist || authStore.isStaff
        "
        @click="setActiveMenu('Dashboard')"
        :active="activeMenu === 'Dashboard'"
        to="/dashboard"
      >
        <template v-slot:prepend>
          <v-icon>mdi-home</v-icon>
        </template>
        <v-list-item-title>Dashboard</v-list-item-title>
      </v-list-item>

      <!-- master data -->
      <v-list-group v-if="authStore.isAdmin">
        <template v-slot:activator="{ props }">
          <v-list-item v-bind="props" title="Master Data" prepend-icon="mdi-folder"></v-list-item>
        </template>
        <v-list-item
          @click="setActiveMenu('Children')"
          :active="activeMenu === 'Children'"
          title="Children"
          to="/children"
        ></v-list-item>
        <v-list-item
          @click="setActiveMenu('Guardians')"
          :active="activeMenu === 'Guardians'"
          title="Guardians"
          to="/guardians"
        ></v-list-item>
        <v-list-item
          @click="setActiveMenu('Staff')"
          :active="activeMenu === 'Staff'"
          title="Staff"
          to="/staff"
        ></v-list-item>
        <v-list-item
          @click="setActiveMenu('Programs')"
          :active="activeMenu === 'Programs'"
          title="Programs"
          to="/programs"
        ></v-list-item>
      </v-list-group>

      <!-- transactions -->
      <v-list-group v-if="authStore.isAdmin">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Transactions"
            prepend-icon="mdi-folder-arrow-down-outline"
          ></v-list-item>
        </template>
        <v-list-item
          @click="setActiveMenu('Registrations')"
          :active="activeMenu === 'Registrations'"
          title="Registrations"
          to="/registrations"
        ></v-list-item>
        <v-list-item
          @click="setActiveMenu('TherapySessions')"
          :active="activeMenu === 'TherapySessions'"
          title="Therapy Sessions"
          to="/therapy-sessions"
        ></v-list-item>
      </v-list-group>

      <!-- admission -->
      <v-list-group v-if="authStore.isAdmin || authStore.isGuardian">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            title="Admission"
            prepend-icon="mdi-book-open-variant-outline"
          ></v-list-item>
        </template>
        <v-list-item
          v-if="authStore.isAdmin"
          @click="setActiveMenu('RegistrationsNew')"
          :active="activeMenu === 'RegistrationsNew'"
          title="Admin Registrations"
          to="/registrations-new"
        ></v-list-item>
        <v-list-item
          v-if="authStore.isAdmin || authStore.isGuardian"
          @click="setActiveMenu('PublicRegistrations')"
          :active="activeMenu === 'PublicRegistrations'"
          title="Public Registrations"
          to="/public-registrations"
        ></v-list-item>
      </v-list-group>

      <!-- activity -->
      <v-list-item
        v-if="authStore.isAdmin || authStore.isGuardian || authStore.isTherapist"
        @click="setActiveMenu('Activity')"
        :active="activeMenu === 'Activity'"
        to="/activity"
      >
        <template v-slot:prepend>
          <v-icon>mdi-pencil-box-multiple-outline</v-icon>
        </template>
        <v-list-item-title>Activity</v-list-item-title>
      </v-list-item>

      <!-- report -->
      <v-list-item
        v-if="authStore.isAdmin"
        @click="setActiveMenu('Report')"
        :active="activeMenu === 'Report'"
        to="/report"
      >
        <template v-slot:prepend>
          <v-icon>mdi-chart-bar</v-icon>
        </template>
        <v-list-item-title>Report</v-list-item-title>
      </v-list-item>
    </v-list>

    <v-divider class="my-4"></v-divider>

    <v-list dense nav>
      <v-list-item
        v-if="authStore.isAdmin || authStore.isGuardian || authStore.isTherapist"
        @click="setActiveMenu('helpSupport')"
        :active="activeMenu === 'helpSupport'"
        to="/help-support"
      >
        <template v-slot:prepend>
          <v-icon>mdi-help-circle</v-icon>
        </template>
        <v-list-item-title>Help & Support</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'

const { mobile } = useDisplay()
const authStore = useAuthStore()

const sidebarOpen = ref(!mobile.value)
const activeMenu = ref('dashboard')
const isMobile = computed(() => mobile.value)

const setActiveMenu = (menu: string) => {
  activeMenu.value = menu
}

// Expose sidebarOpen to parent component
defineExpose({
  sidebarOpen,
})
</script>

<style scoped>
.sidebar {
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
}
</style>
