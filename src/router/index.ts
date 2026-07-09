import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import Login from '@/components/Login.vue'
import Dashboard from '@/components/Dashboard.vue'

// master data
import Children from '@/components/MasterData/Children.vue'
import Guardians from '@/components/MasterData/Guardians.vue'
import Staff from '@/components/MasterData/Staff.vue'
import Programs from '@/components/MasterData/Programs.vue'

// transactions
import Registrations from '@/components/Transactions/Registrations.vue'
import TherapySessions from '@/components/Transactions/TherapySessions.vue'

// admissions
import RegistrationsNew from '@/components/Admissions/Registrations.vue'
import PublicRegistrations from '@/components/Admissions/PublicRegistrations.vue'

// schedule
import Schedule from '@/components/Transactions/Schedule.vue'

// activity create
import Activity from '@/components/Activity.vue'
import ActivityCreate from '@/components/ActivityCreate.vue'
import ActivityEdit from '@/components/ActivityEdit.vue'

// report
import Report from '@/components/Report.vue'

// help and support
import HelpSupport from '@/components/HelpSupport.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    component: Login,
    meta: { layout: 'blank', guestOnly: true },
  },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: {
      layout: 'app',
      requiresAuth: true,
      allowedRoles: ['admin', 'guardian', 'therapist', 'staff'],
    },
  },

  // master data
  {
    path: '/children',
    component: Children,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/children/:id/edit',
    component: () => import('@/components/MasterData/ChildEdit.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/guardians',
    component: Guardians,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/guardians/create',
    component: () => import('@/components/MasterData/GuardianCreate.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/guardians/:id/edit',
    component: () => import('@/components/MasterData/GuardianEdit.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/staff',
    component: Staff,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/staff/create',
    component: () => import('@/components/MasterData/StaffCreate.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/staff/:id/edit',
    component: () => import('@/components/MasterData/StaffEdit.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/programs',
    component: Programs,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/programs/:id/edit',
    component: () => import('@/components/MasterData/ProgramEdit.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/programs/create',
    component: () => import('@/components/MasterData/ProgramCreate.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },

  // transactions
  {
    path: '/registrations',
    component: Registrations,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/registrations/:id/edit',
    component: () => import('@/components/Transactions/RegistrationEdit.vue'),
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin'] },
  },
  {
    path: '/therapy-sessions',
    component: TherapySessions,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist'] },
  },
  {
    path: '/invoice/:token',
    name: 'public-invoice',
    component: () => import('@/components/Transactions/PublicInvoice.vue'),
  },

  // admissions
  {
    path: '/registrations-new',
    component: RegistrationsNew,
    meta: {
      layout: 'app',
      requiresAuth: true,
      allowedRoles: ['admin'],
    },
  },
  {
    path: '/public-registrations',
    component: PublicRegistrations,
    meta: {
      layout: 'blank',
    },
  },
  {
    path: '/registration-success',
    component: () => import('@/components/Admissions/RegistrationSuccess.vue'),
    meta: {
      layout: 'app',
      requiresAuth: true,
      allowedRoles: ['admin', 'guardian'],
    },
  },
  {
    path: '/public-registration-success',
    component: () => import('@/components/Admissions/PublicRegistrationSuccess.vue'),
    meta: {
      layout: 'blank',
    },
  },

  // Schedule
  {
    path: '/registrations/:id/schedule',
    component: Schedule,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist'] },
  },

  // Activity
  {
    path: '/activity',
    component: Activity,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist', 'guardian'] },
  },
  {
    path: '/activity/create',
    component: ActivityCreate,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist'] },
  },
  {
    path: '/activity/:id/edit',
    component: ActivityEdit,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist'] },
  },

  // report
  {
    path: '/report',
    component: Report,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist', 'guardian'] },
  },

  // help support
  {
    path: '/help-support',
    component: HelpSupport,
    meta: { layout: 'app', requiresAuth: true, allowedRoles: ['admin', 'therapist', 'guardian'] },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // ======================
  // FETCH USER
  // ======================

  if (authStore.token && !authStore.user) {
    await authStore.fetchMe()
  }

  // ======================
  // REQUIRES AUTH
  // ======================

  if (to.meta.requiresAuth && !authStore.token) {
    return next('/login')
  }

  // ======================
  // GUEST ONLY
  // ======================

  if (to.meta.guestOnly && authStore.token) {
    return next('/dashboard')
  }

  // ======================
  // ROLE GUARD
  // ======================

  const allowedRoles = to.meta.allowedRoles as string[] | undefined

  if (allowedRoles && !allowedRoles.includes(authStore.user?.role || '')) {
    return next('/dashboard')
  }

  next()
})
