<template>
  <div class="program-category-create-page">
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-2">New Program Category</h1>

        <p class="text-body2 text-grey">Create a new program category and its session schedules.</p>
      </div>

      <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="leaveDialog = true">Back</v-btn>
    </div>

    <v-card>
      <v-card-text>
        <h3 class="text-h6 mb-4">Category Information</h3>

        <v-text-field
          v-model="form.name"
          label="Category Name"
          variant="outlined"
          class="mb-8"
          :error="!!errors.name"
          :error-messages="errors.name"
        />

        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-h6">Session Schedules</h3>

          <v-btn color="primary" prepend-icon="mdi-plus" @click="addSession">Add Session</v-btn>
        </div>

        <v-table density="comfortable">
          <thead>
            <tr>
              <th width="100">Order No.</th>
              <th>Session Name</th>
              <th width="140">Start Time</th>
              <th width="140">End Time</th>
              <th width="140">Max Students</th>
              <th width="80"></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(session, index) in sessions" :key="index">
              <td>
                <v-text-field
                  v-model="session.session_order"
                  type="number"
                  density="compact"
                  variant="outlined"
                  :hide-details="!errors[`sessions.${index}.session_order`]"
                  :error="!!errors[`sessions.${index}.session_order`]"
                  :error-messages="errors[`sessions.${index}.session_order`]"
                />
              </td>

              <td>
                <v-text-field
                  v-model="session.session_name"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :error="!!errors[`sessions.${index}.session_name`]"
                  :error-messages="errors[`sessions.${index}.session_name`]"
                  :hide-details="!errors[`sessions.${index}.session_name`]"
                />
              </td>

              <td>
                <v-text-field
                  v-model="session.start_time"
                  type="time"
                  density="compact"
                  variant="outlined"
                  :hide-details="!errors[`sessions.${index}.start_time`]"
                  :error="!!errors[`sessions.${index}.start_time`]"
                  :error-messages="errors[`sessions.${index}.start_time`]"
                />
              </td>

              <v-text-field
                v-model="session.end_time"
                type="time"
                density="compact"
                variant="outlined"
                :hide-details="!errors[`sessions.${index}.end_time`]"
                :error="!!errors[`sessions.${index}.end_time`]"
                :error-messages="errors[`sessions.${index}.end_time`]"
              />

              <td>
                <v-text-field
                  v-model="session.capacity"
                  type="number"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :error="!!errors[`sessions.${index}.capacity`]"
                  :error-messages="errors[`sessions.${index}.capacity`]"
                  :hide-details="!errors[`sessions.${index}.capacity`]"
                />
              </td>

              <td class="text-center">
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  variant="text"
                  :disabled="sessions.length === 1"
                  @click="removeSession(index)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />

        <v-btn color="primary" :loading="saving" :disabled="saving" @click="saveCategory">
          Save Category
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </div>

  <v-dialog v-model="leaveDialog" max-width="420">
    <v-card>
      <v-card-title>Leave Page?</v-card-title>

      <v-card-text>
        Any unsaved changes will be lost. Are you sure you want to leave this page?
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="leaveDialog = false">No</v-btn>

        <v-btn color="error" @click="goBack">Yes</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const saving = ref(false)
const errors = ref({})
const leaveDialog = ref(false)

const form = ref({
  name: '',
})

const sessions = ref([
  {
    session_order: 1,
    session_name: '',
    start_time: '',
    end_time: '',
    capacity: 10,
  },
])

const goBack = () => {
  router.push('/program-categories')
}

const addSession = () => {
  sessions.value.push({
    session_order: sessions.value.length + 1,
    session_name: '',
    start_time: '',
    end_time: '',
    capacity: 10,
  })
}

const removeSession = (index) => {
  sessions.value.splice(index, 1)

  sessions.value.forEach((session, i) => {
    session.session_order = i + 1
  })
}

const validateForm = () => {
  errors.value = {}

  if (!form.value.name?.trim()) {
    errors.value.name = ['Category name is required.']
  }

  sessions.value.forEach((session, index) => {
    if (!session.session_order) {
      errors.value[`sessions.${index}.session_order`] = ['Required']
    }

    if (!session.session_name?.trim()) {
      errors.value[`sessions.${index}.session_name`] = ['Required']
    }

    if (!session.start_time) {
      errors.value[`sessions.${index}.start_time`] = ['Required']
    }

    if (!session.end_time) {
      errors.value[`sessions.${index}.end_time`] = ['Required']
    }

    if (!session.capacity || session.capacity < 1) {
      errors.value[`sessions.${index}.capacity`] = ['Required']
    }
  })

  return Object.keys(errors.value).length === 0
}

const saveCategory = async () => {
  if (!validateForm()) {
    return
  }
  errors.value = {}
  saving.value = true

  try {
    const payload = {
      name: form.value.name,
      sessions: sessions.value,
    }

    await api.post('/program-categories', payload)

    router.push('/program-categories')
  } catch (err) {
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors ?? {}

      return
    }

    alert(err.response?.data?.message ?? 'Failed to create program category.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.program-category-create-page {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
