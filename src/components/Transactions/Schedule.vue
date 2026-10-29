<template>
  <div class="schedule-content">
    <template v-if="loading">
      <v-skeleton-loader type="heading" class="mb-4" />

      <v-skeleton-loader type="article" class="mb-4" />

      <v-skeleton-loader type="article" class="mb-4" />

      <v-skeleton-loader type="table" />
    </template>

    <template v-else>
      <!-- HEADER -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold mb-2">Schedule</h1>

          <p class="text-body-2 text-grey">Manage school learning schedules.</p>
        </div>

        <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack">Back</v-btn>
      </div>

      <!-- Registration Information -->
      <v-card elevation="1" class="mb-4 rounded-lg">
        <v-card-title>Registration Information</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Registration No.</div>
              <div class="font-weight-medium">
                {{ registration.registration_number || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Registration Date</div>
              <div class="font-weight-medium">
                {{ formatDate(registration.created_at) || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Child Name</div>
              <div class="font-weight-medium">
                {{ registration.child?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Child ID Number</div>
              <div class="font-weight-medium">
                {{ registration.child?.id_number || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Child Birth Date</div>
              <div class="font-weight-medium">
                {{ formatDate(registration.child?.birth_date) || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Payer</div>
              <div class="font-weight-medium">
                {{ registration.payer?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Program Category</div>
              <div class="font-weight-medium">
                {{ registration.program_category?.name || registration.programs?.[0]?.program_category?.name || '-' }}
              </div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey">Program</div>
              <div v-for="program in registration.programs || []" :key="program.id">
                • {{ program.name }}
              </div>
            </v-col>

            <v-divider></v-divider>

            <v-col cols="12" md="4">
              <div class="text-caption text-grey mb-1">Guardians</div>
              <div v-for="g in registration.child?.guardians || []" :key="g.id" class="mb-2">
                <div class="font-weight-medium">
                  {{ g.name }}
                </div>
                <div class="text-caption text-blue">
                  {{ g.guardian_role.name }}
                </div>
                <div class="text-caption text-grey">
                  {{ g.phone }}
                </div>
                <div class="text-caption text-grey">
                  ID Number: {{ g.id_number || '-' }}
                </div>
                <div class="text-caption text-grey">
                  Email: {{ g.email || '-' }}
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- AVAILABILITY GRID -->
      <!-- WEEKLY AVAILABILITY GRID -->

      <v-divider />
      <v-card elevation="1" class="mb-4 rounded-lg">
        <v-card-title>School Schedule</v-card-title>

        <v-divider />
        <v-card-text>
          <v-row>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="availabilityFilter.start_date"
                type="date"
                label="Start Date"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="3">
              <v-text-field
                v-model="availabilityFilter.end_date"
                type="date"
                label="End Date"
                density="compact"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                v-model="selectedAvailabilityCategory"
                :items="availabilityCategoryOptions"
                item-title="title"
                item-value="value"
                label="Program Category"
                density="compact"
                hide-details
              />
            </v-col>

            <v-col cols="12" md="2">
              <v-btn color="primary" block @click="applyAvailabilityFilter">Apply</v-btn>
            </v-col>
          </v-row>
        </v-card-text>

        <v-progress-linear v-if="availabilityLoading" indeterminate color="primary" />

        <v-card-text v-if="isTrackAvailabilityView" class="pa-4 track-availability-card-text">
          <v-row class="mb-2">
            <v-col cols="12" sm="4">
              <v-select
                v-model="trackAvailabilityFilters.subject"
                :items="trackAvailabilitySubjectOptions"
                label="Filter Subject"
                clearable
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="trackAvailabilityFilters.mode"
                :items="trackAvailabilityModeOptions"
                label="Filter Mode"
                clearable
                density="compact"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="trackAvailabilityFilters.classCode"
                :items="trackAvailabilityClassOptions"
                label="Filter Class"
                clearable
                density="compact"
                hide-details
              />
            </v-col>
          </v-row>

          <div class="track-availability-table-wrapper">
            <v-data-table
              :headers="trackAvailabilityHeaders"
              :items="trackAvailabilityRows"
              :loading="availabilityLoading || trackAvailabilityLoading"
              :items-per-page="25"
              density="comfortable"
              class="track-availability-table"
            >
              <template #item.mode_class="{ item }">
                {{ formatDeliveryMode(item.delivery_mode) }} · Class {{ item.class_code }}
              </template>
              <template #item.time_range="{ item }">
                {{ item.start_time }}–{{ item.end_time }}
              </template>
              <template #item.occupancy="{ item }">
                {{ item.occupied }} / {{ item.capacity }}
              </template>
              <template #item.available="{ item }">
                <v-chip
                  :color="item.available > 0 ? 'success' : 'error'"
                  variant="tonal"
                  size="small"
                >
                  {{ item.available }}
                </v-chip>
              </template>
              <template #item.children="{ item }">
                <span v-if="item.children.length">{{ item.children.join(', ') }}</span>
                <span v-else class="text-medium-emphasis">—</span>
              </template>
              <template #no-data>
                <div class="pa-6 text-center text-medium-emphasis">
                  <span v-if="!appliedAvailabilityFilter.start_date || !appliedAvailabilityFilter.end_date">
                    Select a date range above and click Apply to display session slots.
                  </span>
                  <span v-else>
                    No active session slots found for this program category in this date range.
                  </span>
                </div>
              </template>
            </v-data-table>
          </div>

          <div class="d-flex ga-4 pt-4 flex-wrap text-body-2">
            <div>Occupied / Capacity shows booked seats.</div>
            <div>Available shows remaining seats in that slot.</div>
          </div>
        </v-card-text>

        <v-card-text v-else class="pa-0">
          <div class="schedule-wrapper">
            <!-- HEADER -->
            <table class="schedule-grid schedule-header">
              <thead>
                <tr>
                  <th rowspan="2" class="date-column">Date</th>

                  <th colspan="3">Toddler</th>

                  <th colspan="3">Kinder</th>
                </tr>

                <tr>
                  <th>08:00 - 09:30</th>

                  <th>10:30 - 12:00</th>

                  <th>15:00 - 16:30</th>

                  <th>08:00 - 10:00</th>

                  <th>10:30 - 12:30</th>

                  <th>15:00 - 17:00</th>
                </tr>
              </thead>
            </table>

            <!-- BODY -->
            <div class="availability-grid-wrapper">
              <table class="schedule-grid schedule-body">
                <tbody>
                  <template v-for="schedule in schedules" :key="`${schedule.date}-${schedule.day}`">
                    <!-- WEEKEND -->
                    <tr v-if="schedule.isWeekend">
                      <td class="date-column holiday-cell">
                        <div class="date-text">
                          {{ schedule.date }}
                        </div>

                        <div class="day-text">
                          {{ schedule.day }}
                        </div>
                      </td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>

                      <td class="holiday-cell">-</td>
                    </tr>

                    <!-- WEEKDAY -->
                    <template v-else>
                      <tr v-for="row in 10" :key="`${schedule.date}-${row}`">
                        <td v-if="row === 1" rowspan="10" class="date-column">
                          <div class="date-text">
                            {{ schedule.date }}
                          </div>

                          <div class="day-text">
                            {{ schedule.day }}
                          </div>
                        </td>

                        <!-- TODDLER -->
                        <td
                          :class="{
                            'red-cell': hasChild(schedule.toddler1, row - 1),
                            'available-cell': !hasChild(schedule.toddler1, row - 1),
                          }"
                          :title="getChild(schedule.toddler1, row - 1)"
                        >
                          {{ getChildLabel(schedule.toddler1, row - 1) }}
                        </td>

                        <td
                          :class="{
                            'red-cell': hasChild(schedule.toddler2, row - 1),
                            'available-cell': !hasChild(schedule.toddler2, row - 1),
                          }"
                          :title="getChild(schedule.toddler2, row - 1)"
                        >
                          {{ getChildLabel(schedule.toddler2, row - 1) }}
                        </td>

                        <td
                          :class="{
                            'red-cell': hasChild(schedule.toddler3, row - 1),
                            'available-cell': !hasChild(schedule.toddler3, row - 1),
                          }"
                          :title="getChild(schedule.toddler3, row - 1)"
                        >
                          {{ getChildLabel(schedule.toddler3, row - 1) }}
                        </td>

                        <!-- KINDER -->
                        <td
                          :class="{
                            'red-cell': row > 8 || hasChild(schedule.kinder1, row - 1),
                            'available-cell': row <= 8 && !hasChild(schedule.kinder1, row - 1),
                          }"
                          :title="getChild(schedule.kinder1, row - 1)"
                        >
                          {{ row <= 8 ? getChildLabel(schedule.kinder1, row - 1) : '-' }}
                        </td>

                        <td
                          :class="{
                            'red-cell': row > 8 || hasChild(schedule.kinder2, row - 1),
                            'available-cell': row <= 8 && !hasChild(schedule.kinder2, row - 1),
                          }"
                          :title="getChild(schedule.kinder2, row - 1)"
                        >
                          {{ row <= 8 ? getChildLabel(schedule.kinder2, row - 1) : '-' }}
                        </td>

                        <td
                          :class="{
                            'red-cell': row > 8 || hasChild(schedule.kinder3, row - 1),
                            'available-cell': row <= 8 && !hasChild(schedule.kinder3, row - 1),
                          }"
                          :title="getChild(schedule.kinder3, row - 1)"
                        >
                          {{ row <= 8 ? getChildLabel(schedule.kinder3, row - 1) : '-' }}
                        </td>
                      </tr>
                    </template>
                  </template>
                </tbody>
              </table>
            </div>
          </div>

          <div class="d-flex ga-4 pa-4 flex-wrap">
            <div>🟥 Occupied</div>

            <div>🟩 Available</div>

            <div>🟦 Weekend</div>
          </div>
        </v-card-text>
      </v-card>

      <!-- FORM -->
      <v-card v-if="!isTrackBasedRegistration" elevation="1" class="mb-4 rounded-lg">
        <v-card-title>Generate Sessions</v-card-title>
        <v-divider></v-divider>

        <v-card-text>
          <v-form ref="formRef">
            <v-row>
              <!-- DATE -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.start_date"
                  label="Start Date"
                  type="date"
                  variant="outlined"
                  :rules="requiredRule"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.end_date"
                  label="End Date"
                  type="date"
                  variant="outlined"
                  :min="form.start_date || undefined"
                  :rules="[
                    ...requiredRule,
                    (v) =>
                      !form.start_date ||
                      v >= form.start_date ||
                      'End Date must be on or after Start Date',
                  ]"
                  hint="Generate stops at End Date or when all remaining sessions are scheduled."
                  persistent-hint
                />
              </v-col>
              <v-divider></v-divider>

              <!-- weekly schedule -->
              <v-col cols="12">
                <div class="overflow-x-auto">
                  <div v-if="isTrackBasedRegistration" class="d-flex justify-end mb-3">
                    <v-btn
                      color="primary"
                      variant="tonal"
                      prepend-icon="mdi-plus"
                      :disabled="form.schedule_configs.length >= 42"
                      @click="addWeeklyScheduleRow"
                    >
                      Add Weekly Session
                    </v-btn>
                  </div>
                  <v-table
                    density="comfortable"
                    class="schedule-table"
                    :class="{ 'schedule-table--track-based': isTrackBasedRegistration }"
                  >
                    <thead>
                      <tr>
                        <th class="schedule-day-column">Day</th>
                        <th class="schedule-enable-column">Enable</th>
                        <th class="schedule-time-column">Session Time</th>
                        <th v-if="isTrackBasedRegistration" class="schedule-action-column text-center">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-for="(schedule, index) in form.schedule_configs" :key="schedule.key">
                        <td>
                          <v-select
                            v-if="isTrackBasedRegistration"
                            v-model="schedule.day"
                            :items="weekDays"
                            item-title="label"
                            item-value="day"
                            variant="outlined"
                            density="compact"
                            hide-details
                            :disabled="!schedule.enabled"
                          />
                          <span v-else>
                            {{ weekDays.find((d) => d.day === schedule.day)?.label }}
                          </span>
                        </td>

                        <td class="text-center">
                          <v-checkbox v-model="schedule.enabled" hide-details />
                        </td>

                        <td>
                          <v-select
                            v-model="schedule.session_time_id"
                            :items="availableTimeSlots"
                            item-title="label"
                            item-value="id"
                            variant="outlined"
                            density="comfortable"
                            hide-details
                            :disabled="!schedule.enabled"
                          />
                        </td>
                        <td v-if="isTrackBasedRegistration" class="text-center">
                          <v-btn
                            v-if="index >= 5"
                            icon="mdi-delete"
                            variant="text"
                            color="error"
                            size="small"
                            @click="removeWeeklyScheduleRow(index)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-col>

              <!-- NOTES -->
              <v-col cols="12">
                <v-textarea v-model="form.notes" label="Notes" variant="outlined" rows="3" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn
            @click="saveSchedule"
            color="primary"
            variant="elevated"
            :loading="saving"
            :disabled="saving || schedulingUnavailable"
          >
            Generate Sessions
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- SUMMARY -->
      <div class="text-body-2 mb-3">
        Session validity:
        {{
          registration.session_started_at ? formatLongDate(registration.session_started_at) : '-'
        }}
        to
        {{
          registration.session_expired_at ? formatLongDate(registration.session_expired_at) : '-'
        }}
      </div>
      <v-alert v-if="sessionValidityMessage" type="warning" variant="tonal" class="mb-4">
        {{ sessionValidityMessage }}
      </v-alert>
      <div class="summary-grid mb-4">
        <v-card color="#F5F5F5" class="summary-card h-100 text-grey-darken-4">
          <v-card-text>
            <div class="text-caption">Total Sessions</div>
            <div class="text-h5 font-weight-bold">
              {{ totalSessions ?? '-' }}
            </div>
          </v-card-text>
        </v-card>

        <v-card color="#E8F5E9" class="summary-card h-100 text-grey-darken-4">
          <v-card-text>
            <div class="text-caption">Used Sessions</div>
            <div class="text-h5 font-weight-bold">
              {{ completedSessions ?? '-' }}
            </div>
          </v-card-text>
        </v-card>

        <v-card color="#E0F7FA" class="summary-card h-100 text-grey-darken-4">
          <v-card-text>
            <div class="text-caption">Remaining Sessions</div>
            <div class="text-h5 font-weight-bold">
              {{ remainingSessions ?? '-' }}
            </div>
          </v-card-text>
        </v-card>
      </div>

      <v-card v-if="isTrackBasedRegistration" elevation="1" class="rounded-lg mb-4">
        <v-card-title>School Readiness Package Summary</v-card-title>
        <v-card-subtitle>
          Quota is tracked separately for each selected subject and delivery mode.
        </v-card-subtitle>
        <v-card-text class="pa-0">
          <div class="package-summary-table-wrapper">
            <v-table density="comfortable" class="package-summary-table">
              <thead>
                <tr>
                  <th>Subject / Mode</th>
                  <th>Total Package</th>
                  <th>Scheduled / Reserved</th>
                  <th>Completed / Used</th>
                  <th>Available to Schedule</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in schoolReadinessPackageSummaries" :key="item.registration_program_id">
                  <td>
                    <div class="font-weight-medium">
                      {{ item.subject_name }} · {{ formatDeliveryMode(item.delivery_mode) }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.sessions_per_month }} sessions/month ×
                      {{ item.learning_period_months }} month(s)
                    </div>
                  </td>
                  <td>{{ item.total_sessions }}</td>
                  <td>{{ item.scheduled_reserved_sessions }}</td>
                  <td>{{ item.completed_used_sessions }}</td>
                  <td class="font-weight-bold">{{ item.available_to_schedule }}</td>
                </tr>
                <tr v-if="schoolReadinessPackageSummaries.length === 0">
                  <td colspan="5" class="text-center text-medium-emphasis py-5">
                    No School Readiness subject packages are linked to this registration.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
        <v-card-text class="text-caption text-medium-emphasis pt-2">
          Scheduled sessions reserve quota. Completed / Used counts sessions that consume a package session.
        </v-card-text>
      </v-card>

      <v-alert v-if="sessionSummaryMessage" type="info" variant="tonal" class="mb-4">
        {{ sessionSummaryMessage }}
      </v-alert>

      <!-- SESSION HISTORY -->
      <v-card elevation="1" class="rounded-lg">
        <v-card-title>School Sessions</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row class="mb-4">
            <v-btn
              @click="sessionDialog = true"
              :disabled="schedulingUnavailable"
              color="primary"
              prepend-icon="mdi-plus"
            >
              Add Session
            </v-btn>

            <v-btn
              color="warning"
              prepend-icon="mdi-playlist-plus"
              @click="openMultipleSessionDialog"
              :disabled="schedulingUnavailable"
            >
              Add Multiple Session
            </v-btn>
          </v-row>
          <v-row class="mb-4">
            <v-col cols="12" md="3">
              <v-select
                v-model="sessionFilters.day"
                :items="dayOptions"
                item-title="title"
                item-value="value"
                label="Day"
                clearable
              />
            </v-col>

            <v-col cols="12" md="3">
              <v-select
                v-model="sessionFilters.status"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Status"
                clearable
              />
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-data-table
          :headers="headers"
          :items="filteredSessions"
          :items-per-page="20"
          density="comfortable"
        >
          <!-- DAY -->
          <template #item.day="{ item }">
            {{ formatDay(item.therapy_date) }}
          </template>

          <!-- DATE -->
          <template #item.therapy_date="{ item }">
            {{ formatLongDate(item.therapy_date) }}
          </template>

          <!-- SCHOOL READINESS SESSION DETAILS -->
          <template #item.session_details="{ item }">
            <div class="track-session-details">
              <div class="font-weight-medium">
                {{ item.track_subject_name }} · {{ formatDeliveryMode(item.track_delivery_mode) }} · Class {{ item.track_class_code }}
              </div>
              <div class="text-caption">{{ item.session_name }}</div>
            </div>
          </template>

          <!-- START -->
          <template v-slot:item.start_time="{ item }">
            {{ item.start_time?.slice(0, 5) }}
          </template>

          <!-- END -->
          <template v-slot:item.end_time="{ item }">
            {{ item.end_time?.slice(0, 5) }}
          </template>

          <!-- STATUS -->
          <template #item.status="{ item }">
            <v-chip
              size="small"
              :color="getStatusColor(item.therapy_session_status?.name)"
              variant="tonal"
            >
              {{ item.therapy_session_status?.name }}
            </v-chip>
          </template>

          <template #item.attendance="{ item }">
            <div
              class="d-flex align-center ga-1"
              :class="{ 'opacity-60': isUpdatingAttendance(item.id) }"
            >
              <!-- Scheduled -->
              <v-btn
                size="small"
                icon="mdi-clock-outline"
                :disabled="isUpdatingAttendance(item.id)"
                :color="item.therapy_session_status_id === 1 ? 'primary' : 'grey'"
                :variant="item.therapy_session_status_id === 1 ? 'flat' : 'text'"
                @click="updateAttendance(item, 1)"
              />

              <!-- Completed -->
              <v-btn
                size="small"
                icon="mdi-check"
                :disabled="isUpdatingAttendance(item.id)"
                :color="item.therapy_session_status_id === 2 ? 'success' : 'grey'"
                :variant="item.therapy_session_status_id === 2 ? 'flat' : 'text'"
                @click="updateAttendance(item, 2)"
              />

              <!-- Alpha -->
              <v-btn
                size="small"
                icon="mdi-close"
                :disabled="isUpdatingAttendance(item.id)"
                :color="item.therapy_session_status_id === 3 ? 'error' : 'grey'"
                :variant="item.therapy_session_status_id === 3 ? 'flat' : 'text'"
                @click="updateAttendance(item, 3)"
              />
            </div>
          </template>

          <!-- ACTION -->
          <template v-slot:item.actions="{ item }">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn variant="tonal" size="small" v-bind="props">
                  Action

                  <v-icon end>mdi-chevron-down</v-icon>
                </v-btn>
              </template>

              <v-list>
                <v-list-item @click="openEditSession(item)">
                  <v-list-item-title>Edit</v-list-item-title>
                </v-list-item>
                <!-- <v-list-item
                  v-if="item.therapy_session_status?.id === 1"
                  @click="markCompleted(item)"
                >
                  <v-list-item-title>Mark as Completed</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="item.therapy_session_status?.id === 1" @click="markAlpha(item)">
                  <v-list-item-title>Mark as Alpha</v-list-item-title>
                </v-list-item> -->
                <v-list-item @click="deleteSession(item)">
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snackbar" :color="snackbarColor" location="top right" timeout="3000">
        {{ snackbarText }}
      </v-snackbar>
    </template>
  </div>

  <v-dialog v-model="deleting" persistent width="320">
    <v-card rounded="xl" class="pa-8 d-flex flex-column align-center justify-center text-center">
      <v-progress-circular indeterminate color="primary" size="56" width="5" />

      <div class="text-h6 font-weight-medium mt-6">Deleting Session...</div>

      <div class="text-body-2 text-medium-emphasis mt-2">Please wait a moment</div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="sessionDialog" max-width="600">
    <v-card>
      <v-card-title>
        {{ editingSessionId ? 'Edit Session' : 'Add Session' }}
      </v-card-title>

      <v-card-text class="pt-4">
        <v-text-field
          v-model="sessionForm.therapy_date"
          :disabled="schedulingUnavailable"
          type="date"
          label="Date"
          variant="outlined"
          class="mb-2"
        />

        <v-select
          v-model="sessionForm.session_time_id"
          :disabled="schedulingUnavailable"
          :items="availableTimeSlots"
          item-title="label"
          item-value="id"
          label="Session Time"
          variant="outlined"
          class="mb-2"
        />

        <v-textarea v-model="sessionForm.notes" label="Notes" rows="2" variant="outlined" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn variant="text" @click="closeSessionDialog">Cancel</v-btn>

        <v-btn
          color="primary"
          :disabled="!editingSessionId && schedulingUnavailable"
          @click="saveSession"
        >
          {{ editingSessionId ? 'Update Session' : 'Save Session' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="multipleSessionDialog" max-width="1100">
    <v-card>
      <v-card-title>Add Multiple Session</v-card-title>

      <v-card-text class="pt-4">
        <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
          Add one or more school sessions for this child. Date and session time are required.
        </v-alert>

        <div class="multiple-session-wrapper">
          <v-table density="comfortable" class="multiple-session-table">
            <thead>
              <tr>
                <th style="width: 24%">Date</th>

                <th style="width: 34%">Session Time</th>

                <th>Notes</th>

                <th style="width: 72px" class="text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(row, index) in multipleSessionRows" :key="row.key">
                <td>
                  <v-text-field
                    v-model="row.therapy_date"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>

                <td>
                  <v-select
                    v-model="row.session_time_id"
                    :items="availableTimeSlots"
                    item-title="label"
                    item-value="id"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </td>

                <td>
                  <v-textarea
                    v-model="row.notes"
                    variant="outlined"
                    density="compact"
                    rows="1"
                    auto-grow
                    hide-details
                  />
                </td>

                <td class="text-center">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    :disabled="multipleSessionRows.length === 1"
                    @click="removeMultipleSessionRow(index)"
                  />
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <v-btn
          class="mt-4"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-plus"
          @click="addMultipleSessionRow"
        >
          Add Row
        </v-btn>

        <div v-if="hasMultipleSessionValidationResult" class="mt-4">
          <v-alert
            :type="multipleSessionValidationPassed ? 'success' : 'warning'"
            variant="tonal"
            density="comfortable"
          >
            {{ multipleSessionValidation.message }}
          </v-alert>

          <v-table
            v-if="multipleSessionValidation.conflicts.length"
            density="compact"
            class="mt-3 validation-result-table"
          >
            <thead>
              <tr>
                <th>Row</th>

                <th>Date</th>

                <th>Session</th>

                <th>Issue</th>

                <th>Capacity</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="conflict in multipleSessionValidation.conflicts"
                :key="`${conflict.row}-${conflict.type}`"
              >
                <td>{{ conflict.row }}</td>

                <td>{{ formatLongDate(conflict.therapy_date) }}</td>

                <td>
                  {{ conflict.session_name }}: {{ conflict.start_time }}-{{ conflict.end_time }}
                </td>

                <td>{{ conflict.message }}</td>

                <td>
                  <span v-if="conflict.capacity !== null && conflict.capacity !== undefined">
                    {{ conflict.occupied }} / {{ conflict.capacity }}
                  </span>

                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          variant="text"
          :disabled="savingMultipleSessions"
          @click="closeMultipleSessionDialog"
        >
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          variant="tonal"
          :loading="validatingMultipleSessions"
          :disabled="savingMultipleSessions"
          @click="validateMultipleSessions"
        >
          Validate Sessions
        </v-btn>

        <v-btn
          color="primary"
          :loading="savingMultipleSessions"
          :disabled="
            !multipleSessionValidationPassed || validatingMultipleSessions || schedulingUnavailable
          "
          @click="saveMultipleSessions"
        >
          Save Sessions
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="conflictDialog" max-width="700">
    <v-card rounded="lg">
      <v-card-title class="text-h6">Session Slot Unavailable</v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          The following session slots have reached their maximum capacity. Please choose another day
          or another session time, then generate again.
        </v-alert>

        <v-table density="comfortable">
          <thead>
            <tr>
              <th style="width: 45%">Date</th>

              <th style="width: 25%">Time</th>

              <th style="width: 30%">Capacity</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(item, index) in conflictSchedules" :key="index">
              <td>
                <div>{{ item.day }}</div>

                <div class="text-grey">
                  {{ formatDate(item.therapy_date) }}
                </div>
              </td>

              <td>{{ item.start_time }} - {{ item.end_time }}</td>

              <td>{{ item.occupied }} / {{ item.capacity }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />

        <v-btn color="primary" @click="conflictDialog = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const registration = ref({})
const sessions = ref([])
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const loading = ref(true)
const saving = ref(false)
const formRef = ref(null)
const deleting = ref(false)
const availabilityDate = ref(new Date())
const availabilityLoading = ref(false)
const sessionDialog = ref(false)
const multipleSessionDialog = ref(false)
const editingSessionId = ref(null)
const conflictDialog = ref(false)
const availabilityGrid = ref([])
const trackAvailabilityCategories = ref([])
const trackAvailabilitySessionTimes = ref([])
const trackAvailabilityLoading = ref(false)
const selectedAvailabilityCategory = ref('classic')
const trackAvailabilityFilters = ref({
  subject: null,
  mode: null,
  classCode: null,
})
const conflictSchedules = ref([])
const therapySessionStatuses = ref([])
const programCategorySessionTimes = ref([])
const updatingAttendance = ref([])
const validatingMultipleSessions = ref(false)
const savingMultipleSessions = ref(false)

const sessionFilters = ref({
  day: null,
  status: null,
})

const dayOptions = [
  { title: 'All Days', value: null },
  { title: 'Monday', value: 1 },
  { title: 'Tuesday', value: 2 },
  { title: 'Wednesday', value: 3 },
  { title: 'Thursday', value: 4 },
  { title: 'Friday', value: 5 },
]

const trackAvailabilityHeaders = [
  { title: 'Date', key: 'display_date' },
  { title: 'Subject', key: 'subject_name' },
  { title: 'Mode / Class', key: 'mode_class' },
  { title: 'Session', key: 'session_name' },
  { title: 'Time', key: 'time_range' },
  { title: 'Occupied / Capacity', key: 'occupancy' },
  { title: 'Available', key: 'available' },
  { title: 'Children', key: 'children', sortable: false },
]

const statusOptions = computed(() => [
  {
    title: 'All Status',
    value: null,
  },

  ...therapySessionStatuses.value.map((item) => ({
    title: item.name,
    value: item.id,
  })),
])

const sessionForm = ref({
  therapist_id: null,
  therapy_date: '',
  session_time_id: null,
  notes: '',
})

const createMultipleSessionRow = () => ({
  key: `${Date.now()}-${Math.random()}`,
  therapy_date: '',
  session_time_id: null,
  notes: '',
})

const multipleSessionRows = ref([createMultipleSessionRow()])

const multipleSessionValidation = ref({
  status: 'idle',
  message: '',
  conflicts: [],
})

const hasMultipleSessionValidationResult = computed(() => {
  return multipleSessionValidation.value.status !== 'idle'
})

const multipleSessionValidationPassed = computed(() => {
  return multipleSessionValidation.value.status === 'passed'
})

watch(
  multipleSessionRows,
  () => {
    if (multipleSessionValidation.value.status !== 'idle') {
      resetMultipleSessionValidation()
    }
  },
  { deep: true },
)

function isUpdatingAttendance(sessionId) {
  return updatingAttendance.value.includes(sessionId)
}

const getChildLabel = (list, row) => {
  const child = getChild(list, row)

  return `${row + 1}. ${getFirstName(child)}`
}

const getFirstName = (name) => {
  if (!name) return ''

  return name.split(' ')[0]
}

const hasChild = (list, row) => {
  return !!getChild(list, row)
}

const selectedSessionTime = computed(() => {
  return getSessionTimeById(sessionForm.value.session_time_id)
})

const getSessionTimeById = (sessionTimeId) => {
  return (
    programCategorySessionTimes.value.find((item) => String(item.id) === String(sessionTimeId)) ??
    null
  )
}

const programCategoryId = computed(() => {
  return registration.value?.programs?.[0]?.program_category?.id ?? null
})

const isTrackBasedRegistration = computed(() =>
  registration.value?.programs?.some((program) => program.program_category?.supports_tracks),
)

const registrationProgramForSessionTime = (sessionTime) => {
  const trackId = Number(sessionTime?.track?.id)
  if (!trackId) return null

  return (
    registration.value?.programs?.find(
      (program) => Number(program.program_track_id) === trackId,
    ) ?? null
  )
}

const schoolReadinessPackageSummaries = computed(() => {
  const packages = (registration.value?.programs ?? []).filter(
    (program) => program.track && !program.is_registration_fee,
  )

  return packages.map((program) => {
    const registrationProgramId = Number(program.registration_program_id)
    const packageSessions = sessions.value.filter(
      (session) => Number(session.registration_program_id) === registrationProgramId,
    )
    const countedSessions = packageSessions.filter(
      (session) => Boolean(session.uses_session)
        || Number(session.therapy_session_status_id) === 1,
    ).length
    const completedUsedSessions = packageSessions.filter(
      (session) => Boolean(session.uses_session),
    ).length
    const totalSessions = Number(program.session_count ?? 0)
      * Number(program.learning_period_months ?? 1)

    return {
      registration_program_id: registrationProgramId,
      subject_name: program.track.subject_name,
      delivery_mode: program.track.delivery_mode,
      sessions_per_month: Number(program.session_count ?? 0),
      learning_period_months: Number(program.learning_period_months ?? 1),
      total_sessions: totalSessions,
      scheduled_reserved_sessions: Math.max(countedSessions - completedUsedSessions, 0),
      completed_used_sessions: completedUsedSessions,
      available_to_schedule: Math.max(totalSessions - countedSessions, 0),
    }
  })
})

const filteredSessions = computed(() => {
  let data = [...sessions.value]

  if (sessionFilters.value.day !== null) {
    data = data.filter((item) => new Date(item.therapy_date).getDay() === sessionFilters.value.day)
  }

  if (sessionFilters.value.status !== null) {
    data = data.filter((item) => item.therapy_session_status_id === sessionFilters.value.status)
  }

  return data
})

const availabilityFilter = ref({
  start_date: '',
  end_date: '',
  therapist_id: null,
})

const appliedAvailabilityFilter = ref({
  start_date: '',
  end_date: '',
  therapist_id: null,
})

const formatDeliveryMode = (mode) => {
  if (!mode) return ''
  return String(mode).charAt(0).toUpperCase() + String(mode).slice(1)
}

const availabilityCategoryOptions = computed(() => [
  { title: 'Toddler & Kinder', value: 'classic' },
  ...trackAvailabilityCategories.value.map((category) => ({
    title: category.name,
    value: Number(category.id),
  })),
])

const isTrackAvailabilityView = computed(() => selectedAvailabilityCategory.value !== 'classic')

const selectedTrackAvailabilityCategory = computed(() =>
  trackAvailabilityCategories.value.find(
    (category) => Number(category.id) === Number(selectedAvailabilityCategory.value),
  ) ?? null,
)

const activeTrackAvailabilitySlots = computed(() =>
  trackAvailabilitySessionTimes.value.filter(
    (slot) => slot.is_active && slot.track?.is_active && slot.track?.class_is_active,
  ),
)

const trackAvailabilitySubjectOptions = computed(() =>
  [...new Set(activeTrackAvailabilitySlots.value.map((slot) => slot.track?.subject_name).filter(Boolean))].sort(),
)

const trackAvailabilityModeOptions = computed(() =>
  [...new Set(activeTrackAvailabilitySlots.value.map((slot) => slot.track?.delivery_mode).filter(Boolean))]
    .sort()
    .map((mode) => ({ title: formatDeliveryMode(mode), value: mode })),
)

const trackAvailabilityClassOptions = computed(() =>
  [...new Set(activeTrackAvailabilitySlots.value.map((slot) => slot.track?.class_code).filter(Boolean))].sort(),
)

const trackAvailabilityRows = computed(() => {
  const categoryName = selectedTrackAvailabilityCategory.value?.name
  const startDate = appliedAvailabilityFilter.value.start_date
  const endDate = appliedAvailabilityFilter.value.end_date
  if (!categoryName || !startDate || !endDate) return []

  const occupancyBySlotAndDate = new Map()
  availabilityGrid.value.forEach((session) => {
    const slotId = Number(session.program_category_session_time_id)
    if (!slotId || session.program_category !== categoryName) return

    const key = `${session.therapy_date}|${slotId}`
    const occupancy = occupancyBySlotAndDate.get(key) ?? { count: 0, children: [] }
    occupancy.count += 1
    if (session.child_name) occupancy.children.push(session.child_name)
    occupancyBySlotAndDate.set(key, occupancy)
  })

  const dates = dateKeysBetween(startDate, endDate)
  const rows = []

  dates.forEach((date) => {
    activeTrackAvailabilitySlots.value.forEach((slot) => {
      const track = slot.track
      if (trackAvailabilityFilters.value.subject && track.subject_name !== trackAvailabilityFilters.value.subject) return
      if (trackAvailabilityFilters.value.mode && track.delivery_mode !== trackAvailabilityFilters.value.mode) return
      if (trackAvailabilityFilters.value.classCode && track.class_code !== trackAvailabilityFilters.value.classCode) return

      const occupancy = occupancyBySlotAndDate.get(`${date}|${slot.id}`) ?? { count: 0, children: [] }
      const capacity = Number(slot.capacity ?? 0)
      rows.push({
        id: `${date}-${slot.id}`,
        date,
        display_date: formatAvailabilityDate(date),
        subject_name: track.subject_name,
        delivery_mode: track.delivery_mode,
        class_code: track.class_code,
        session_name: slot.session_name,
        start_time: slot.start_time,
        end_time: slot.end_time,
        time_range: `${slot.start_time}–${slot.end_time}`,
        capacity,
        occupied: occupancy.count,
        available: Math.max(capacity - occupancy.count, 0),
        children: occupancy.children,
      })
    })
  })

  return rows.sort((left, right) =>
    left.date.localeCompare(right.date)
    || left.start_time.localeCompare(right.start_time)
    || left.subject_name.localeCompare(right.subject_name),
  )
})

const closeSessionDialog = () => {
  editingSessionId.value = null

  sessionDialog.value = false

  sessionForm.value = {
    therapist_id: null,
    therapy_date: '',
    session_time_id: null,
    notes: '',
  }
}

const resetMultipleSessionRows = () => {
  multipleSessionRows.value = [createMultipleSessionRow()]
}

const resetMultipleSessionValidation = () => {
  multipleSessionValidation.value = {
    status: 'idle',
    message: '',
    conflicts: [],
  }
}

const buildMultipleSessionPayload = () => ({
  registration_id: route.params.id,
  sessions: multipleSessionRows.value.map((row) => ({
    therapy_date: row.therapy_date,
    session_time_id: row.session_time_id,
    registration_program_id: registrationProgramForSessionTime(
      getSessionTimeById(row.session_time_id),
    )?.registration_program_id,
    notes: row.notes,
  })),
})

const getInvalidMultipleSessionRowIndex = () => {
  return multipleSessionRows.value.findIndex(
    (row) => !row.therapy_date || !row.session_time_id || !getSessionTimeById(row.session_time_id),
  )
}

const openMultipleSessionDialog = () => {
  resetMultipleSessionRows()

  resetMultipleSessionValidation()

  multipleSessionDialog.value = true
}

const closeMultipleSessionDialog = () => {
  multipleSessionDialog.value = false

  resetMultipleSessionRows()

  resetMultipleSessionValidation()
}

const addMultipleSessionRow = () => {
  multipleSessionRows.value.push(createMultipleSessionRow())

  resetMultipleSessionValidation()
}

const removeMultipleSessionRow = (index) => {
  if (multipleSessionRows.value.length === 1) return

  multipleSessionRows.value.splice(index, 1)

  resetMultipleSessionValidation()
}

const availableTimeSlots = computed(() => {
  return programCategorySessionTimes.value
    .filter((sessionTime) => {
      if (!isTrackBasedRegistration.value) return true
      return (
        sessionTime.is_active &&
        sessionTime.track?.is_active &&
        sessionTime.track?.class_is_active &&
        registrationProgramForSessionTime(sessionTime)
      )
    })
    .map((sessionTime) => ({
      ...sessionTime,
      label: sessionTime.track
        ? `${sessionTime.track.subject_name} · ${sessionTime.track.delivery_mode} · Class ${sessionTime.track.class_code} · ${sessionTime.session_name} (${sessionTime.start_time} - ${sessionTime.end_time})`
        : sessionTime.label,
    }))
})

const goBack = () => {
  router.back()
}

const requiredRule = [(v) => !!v || 'This field is required']

const form = ref({
  start_date: '',
  end_date: '',
  notes: '',
  schedule_configs: [
    {
      key: 'weekday-1',
      day: 1,
      enabled: false,
      session_time_id: null,
    },
    {
      key: 'weekday-2',
      day: 2,
      enabled: false,
      session_time_id: null,
    },
    {
      key: 'weekday-3',
      day: 3,
      enabled: false,
      session_time_id: null,
    },
    {
      key: 'weekday-4',
      day: 4,
      enabled: false,
      session_time_id: null,
    },
    {
      key: 'weekday-5',
      day: 5,
      enabled: false,
      session_time_id: null,
    },
  ],
})

const weekDays = [
  {
    day: 1,
    label: 'Monday',
  },
  {
    day: 2,
    label: 'Tuesday',
  },
  {
    day: 3,
    label: 'Wednesday',
  },
  {
    day: 4,
    label: 'Thursday',
  },
  {
    day: 5,
    label: 'Friday',
  },
]

const addWeeklyScheduleRow = () => {
  form.value.schedule_configs.push({
    key: `extra-${Date.now()}-${Math.random()}`,
    day: 1,
    enabled: true,
    session_time_id: null,
  })
}

const removeWeeklyScheduleRow = (index) => {
  if (index < 5) return
  form.value.schedule_configs.splice(index, 1)
}

const headers = computed(() => {
  const columns = [
    { title: 'Day', key: 'day' },
    { title: 'Date', key: 'therapy_date' },
  ]

  if (isTrackBasedRegistration.value) {
    columns.push({
      title: 'Session',
      key: 'session_details',
      sortable: false,
      width: '240px',
    })
  }

  columns.push(
    { title: 'Start', key: 'start_time' },
    { title: 'End', key: 'end_time' },
    { title: 'Session Status', key: 'status' },
    {
      title: 'Attendance',
      key: 'attendance',
      sortable: false,
      align: 'center',
    },
    { title: 'Notes', key: 'notes' },
    {
      title: '',
      key: 'actions',
      sortable: false,
      align: 'center',
    },
  )

  return columns
})

const sessionSummaryLoading = ref(false)
const sessionSummaryError = ref(false)
let registrationRequestId = 0

const sessionSummary = computed(() => {
  if (sessionSummaryLoading.value || sessionSummaryError.value) return null

  // Older registrations need their session entitlement populated before showing totals.
  if (registration.value?.total_session == null) return null

  return registration.value?.session_summary ?? null
})

const totalSessions = computed(() => sessionSummary.value?.total_session ?? null)
const completedSessions = computed(() => sessionSummary.value?.completed_session ?? null)
const remainingSessions = computed(() => {
  if (totalSessions.value == null || completedSessions.value == null) return null
  return totalSessions.value - completedSessions.value
})
const schedulingUnavailable = computed(
  () => !sessionSummary.value,
)

const sessionValidityMessage = computed(() => {
  if (sessionSummaryLoading.value || sessionSummaryError.value) return ''
  if (sessionSummary.value?.is_session_expired) {
    return 'Session validity has passed. This is a warning only; scheduling and transactions remain available.'
  }
  if (
    registration.value?.id &&
    (!registration.value.session_started_at || !registration.value.session_expired_at)
  ) {
    return 'Session validity dates have not been set. This is a warning only; scheduling and transactions remain available.'
  }
  return ''
})

const sessionSummaryMessage = computed(() => {
  if (sessionSummaryLoading.value) return 'Loading session summary...'
  if (sessionSummaryError.value) return 'Unable to load session summary. Please refresh the page.'
  if (registration.value?.id && registration.value.total_session == null) {
    return 'Session totals have not been set for this registration.'
  }
  if (!sessionSummary.value) return 'Session summary is not available.'
  return ''
})


const fetchTherapySessionStatuses = async () => {
  const res = await api.get('/therapy-session-statuses')

  therapySessionStatuses.value = res.data.data
}

const fetchProgramCategorySessionTimes = async () => {
  if (!programCategoryId.value) return

  const res = await api.get(`/program-categories/${programCategoryId.value}/session-times`)

  programCategorySessionTimes.value = res.data.data.map((item) => ({
    ...item,
    label: `${item.session_name} (${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)})`,
  }))
}

// ======================
// FETCH REGISTRATION
// ======================

const fetchRegistration = async ({ loadSessionTimes = true } = {}) => {
  const requestId = ++registrationRequestId
  sessionSummaryLoading.value = true
  sessionSummaryError.value = false

  try {
    const res = await api.get(`/registrations/${route.params.id}`)
    if (requestId !== registrationRequestId) return

    registration.value = res.data.data
  } catch (err) {
    if (requestId === registrationRequestId) sessionSummaryError.value = true
    console.error(err)
  } finally {
    if (requestId === registrationRequestId) sessionSummaryLoading.value = false
  }

  if (loadSessionTimes) await fetchProgramCategorySessionTimes()
}

// ======================
// FETCH SESSIONS
// ======================

const fetchSessions = async () => {
  try {
    const res = await api.get('/therapy-sessions', {
      params: {
        registration_id: route.params.id,
        per_page: 999,
      },
    })

    sessions.value = res.data.data
  } catch (err) {
    console.error(err)
  }
}

const refreshScheduleData = async () => {
  await Promise.all([fetchSessions(), fetchRegistration({ loadSessionTimes: false })])
}

const fetchAvailability = async () => {
  availabilityLoading.value = true

  try {
    const res = await api.get('/therapy-sessions/grid', {
      params: {
        start_date: availabilityFilter.value.start_date,
        end_date: availabilityFilter.value.end_date,
      },
    })

    availabilityGrid.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    availabilityLoading.value = false
  }
}

const fetchTrackAvailabilityCategories = async () => {
  try {
    const response = await api.get('/program-categories')
    trackAvailabilityCategories.value = (response.data.data ?? []).filter(
      (category) => category.supports_tracks,
    )
  } catch (err) {
    console.error('Error loading track-based program categories:', err)
  }
}

const fetchTrackAvailabilitySessionTimes = async (categoryId) => {
  trackAvailabilityLoading.value = true
  trackAvailabilitySessionTimes.value = []

  try {
    const response = await api.get(`/program-categories/${categoryId}/session-times`)
    trackAvailabilitySessionTimes.value = response.data.data ?? []
  } catch (err) {
    console.error('Error loading track-based session slots:', err)
  } finally {
    trackAvailabilityLoading.value = false
  }
}

const dateKeysBetween = (startDate, endDate) => {
  const current = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) return []

  const dates = []
  while (current <= end) {
    dates.push([
      current.getFullYear(),
      String(current.getMonth() + 1).padStart(2, '0'),
      String(current.getDate()).padStart(2, '0'),
    ].join('-'))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

const formatAvailabilityDate = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

watch(selectedAvailabilityCategory, async (categoryId) => {
  trackAvailabilityFilters.value = { subject: null, mode: null, classCode: null }
  trackAvailabilitySessionTimes.value = []

  if (categoryId !== 'classic' && categoryId != null) {
    await fetchTrackAvailabilitySessionTimes(Number(categoryId))
  }

  if (availabilityFilter.value.start_date && availabilityFilter.value.end_date) {
    await applyAvailabilityFilter()
  }
})

const getChildren = (date, category, startTime) => {
  return availabilityGrid.value
    .filter(
      (item) =>
        item.therapy_date === date &&
        item.program_category === category &&
        item.start_time === startTime,
    )
    .map((item) => item.child_name)
}

const getChild = (list, row) => {
  return list[row] ?? null
}

const schedules = computed(() => {
  const dates = [...new Set(availabilityGrid.value.map((item) => item.therapy_date))].sort()

  return dates.map((date) => {
    const jsDate = new Date(date)

    const day = jsDate.toLocaleDateString('en-US', {
      weekday: 'long',
    })

    const formattedDate = jsDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    const isWeekend = availabilityGrid.value.some(
      (item) => item.therapy_date === date && item.program_category === 'HOLIDAY',
    )

    return {
      day,
      date: formattedDate,
      isWeekend,

      toddler1: getChildren(date, 'TODDLER', '08:00'),
      toddler2: getChildren(date, 'TODDLER', '10:30'),
      toddler3: getChildren(date, 'TODDLER', '15:00'),

      kinder1: getChildren(date, 'KINDER', '08:00'),
      kinder2: getChildren(date, 'KINDER', '10:30'),
      kinder3: getChildren(date, 'KINDER', '15:00'),
    }
  })
})

// FORMAT DATE
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-ID', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

const formatLongDate = (date) => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const applyAvailabilityFilter = async () => {
  const start = new Date(availabilityFilter.value.start_date)

  const end = new Date(availabilityFilter.value.end_date)

  const diff = (end - start) / (1000 * 60 * 60 * 24)

  if (diff > 30) {
    snackbarText.value = 'Maximum range is 31 days'

    snackbarColor.value = 'error'

    snackbar.value = true

    return
  }
  appliedAvailabilityFilter.value = {
    ...availabilityFilter.value,
  }
  await fetchAvailability()
}

const formatDay = (date) => {
  return new Date(date).toLocaleDateString('en-EN', {
    weekday: 'long',
  })
}

const getStatusColor = (status) => {
  switch (status) {
    case 'Scheduled':
      return 'primary'

    case 'Completed':
      return 'success'

    case 'Alpha':
      return 'error'

    default:
      return 'grey'
  }
}

// ======================
// SAVE
// ======================

const saveSchedule = async () => {
  const { valid } = await formRef.value.validate()

  if (!valid) return

  const enabledSchedules = form.value.schedule_configs.filter((schedule) => schedule.enabled)

  if (!enabledSchedules.length) {
    snackbarText.value = 'Please select at least one day.'

    snackbarColor.value = 'warning'

    snackbar.value = true

    return
  }

  for (const schedule of enabledSchedules) {
    if (!schedule.session_time_id) {
      snackbarText.value = `Please select session time for ${
        weekDays.find((d) => d.day === schedule.day)?.label
      }.`
      snackbarColor.value = 'warning'
      snackbar.value = true
      return
    }
  }

  try {
    saving.value = true
    const response = await api.post('/therapy-sessions/generate', {
      registration_id: route.params.id,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      notes: form.value.notes,

      schedule_configs: enabledSchedules.map((schedule) => ({
        day: schedule.day,
        session_time_id: schedule.session_time_id,
        registration_program_id: registrationProgramForSessionTime(
          getSessionTimeById(schedule.session_time_id),
        )?.registration_program_id,
      })),
    })

    snackbarText.value = response.data.message || 'Sessions generated successfully'

    snackbarColor.value = 'success'
    snackbar.value = true

    // reset form
    form.value.start_date = ''
    form.value.end_date = ''
    form.value.notes = ''
    form.value.schedule_configs.forEach((schedule) => {
      schedule.enabled = false
      schedule.session_time_id = null
    })

    await refreshScheduleData()
  } catch (err) {
    // ======================
    // CONFLICTS
    // ======================

    if (err.response?.data?.conflicts) {
      conflictSchedules.value = err.response.data.conflicts

      conflictDialog.value = true

      return
    }

    // ======================
    // OTHER ERRORS
    // ======================

    snackbarText.value = err.response?.data?.message || 'Failed to generate sessions'

    snackbarColor.value = 'error'

    snackbar.value = true
  } finally {
    saving.value = false
  }
}

const saveSession = async () => {
  try {
    if (!selectedSessionTime.value) {
      snackbarText.value = 'Please select session time.'

      snackbarColor.value = 'warning'

      snackbar.value = true

      return
    }

    const payload = {
      registration_id: route.params.id,

      therapist_id: null,

      therapy_date: sessionForm.value.therapy_date,

      session_time_id: sessionForm.value.session_time_id,
      registration_program_id: registrationProgramForSessionTime(selectedSessionTime.value)
        ?.registration_program_id,

      start_time: selectedSessionTime.value.start_time,

      end_time: selectedSessionTime.value.end_time,

      notes: sessionForm.value.notes,
    }

    if (editingSessionId.value) {
      await api.put(`/therapy-sessions/${editingSessionId.value}`, payload)
    } else {
      await api.post('/therapy-sessions', payload)
    }

    snackbarText.value = editingSessionId.value
      ? 'Session updated successfully'
      : 'Session created successfully'

    snackbarColor.value = 'success'

    snackbar.value = true

    sessionForm.value = {
      therapist_id: null,
      therapy_date: '',
      session_time_id: null,
      notes: '',
    }

    editingSessionId.value = null
    sessionDialog.value = false

    await refreshScheduleData()
  } catch (err) {
    snackbarText.value = err.response?.data?.message || 'Failed to create session'

    snackbarColor.value = 'error'

    snackbar.value = true
  }
}

const validateMultipleSessions = async () => {
  const invalidRowIndex = getInvalidMultipleSessionRowIndex()

  if (invalidRowIndex !== -1) {
    snackbarText.value = `Please complete date and session time for row ${invalidRowIndex + 1}.`

    snackbarColor.value = 'warning'

    snackbar.value = true

    multipleSessionValidation.value = {
      status: 'failed',
      message: snackbarText.value,
      conflicts: [],
    }

    return
  }

  validatingMultipleSessions.value = true

  try {
    const res = await api.post('/therapy-sessions/bulk-validate', buildMultipleSessionPayload())

    multipleSessionValidation.value = {
      status: 'passed',
      message: res.data.message || 'All sessions are available. You can save now.',
      conflicts: [],
    }

    snackbarText.value = multipleSessionValidation.value.message

    snackbarColor.value = 'success'

    snackbar.value = true
  } catch (err) {
    multipleSessionValidation.value = {
      status: 'failed',
      message: err.response?.data?.message || 'Some sessions need attention.',
      conflicts: err.response?.data?.conflicts || [],
    }

    snackbarText.value = multipleSessionValidation.value.message

    snackbarColor.value = 'warning'

    snackbar.value = true
  } finally {
    validatingMultipleSessions.value = false
  }
}

const saveMultipleSessions = async () => {
  if (!multipleSessionValidationPassed.value) {
    snackbarText.value = 'Please validate sessions first.'

    snackbarColor.value = 'warning'

    snackbar.value = true

    return
  }

  savingMultipleSessions.value = true

  try {
    const res = await api.post('/therapy-sessions/bulk', buildMultipleSessionPayload())

    snackbarText.value = res.data.message || 'Sessions created successfully'

    snackbarColor.value = 'success'

    snackbar.value = true

    multipleSessionDialog.value = false
    resetMultipleSessionRows()
    resetMultipleSessionValidation()
  } catch (err) {
    multipleSessionValidation.value = {
      status: 'failed',
      message: err.response?.data?.message || 'Some sessions are no longer available.',
      conflicts: err.response?.data?.conflicts || [],
    }

    snackbarText.value = multipleSessionValidation.value.message

    snackbarColor.value = 'error'

    snackbar.value = true
  } finally {
    savingMultipleSessions.value = false

    await refreshScheduleData()
  }
}

const openEditSession = (item) => {
  editingSessionId.value = item.id

  const selectedSessionTime = programCategorySessionTimes.value.find(
    (slot) =>
      (item.program_category_session_time_id
        ? Number(slot.id) === Number(item.program_category_session_time_id)
        : slot.start_time.startsWith(item.start_time.substring(0, 5)) &&
          slot.end_time.startsWith(item.end_time.substring(0, 5))),
  )

  sessionForm.value = {
    therapist_id: null,

    therapy_date: item.therapy_date,

    session_time_id: selectedSessionTime?.id ?? null,

    notes: item.notes ?? '',
  }

  sessionDialog.value = true
}

const markAlpha = async (session) => {
  if (!confirm('Mark this session as Alpha?')) {
    return
  }

  try {
    await api.patch(`/therapy-sessions/${session.id}/mark-alpha`)

    await refreshScheduleData()

    snackbarText.value = 'Session marked as Alpha.'
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (error) {
    snackbarText.value = error.response?.data?.message ?? 'Failed to mark session as Alpha.'

    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

async function updateAttendance(item, statusId) {
  if (item.therapy_session_status_id === statusId) {
    return
  }

  updatingAttendance.value.push(item.id)

  try {
    const response = await api.patch(`/therapy-sessions/${item.id}/status`, {
      therapy_session_status_id: statusId,
    })

    item.therapy_session_status_id = statusId
    item.therapy_session_status = response.data.data.therapy_session_status

    await fetchRegistration({ loadSessionTimes: false })

    snackbarText.value = response.data.message
    snackbarColor.value = 'success'
    snackbar.value = true
  } catch (error) {
    snackbarText.value = error.response?.data?.message ?? 'Failed to update attendance.'

    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    updatingAttendance.value = updatingAttendance.value.filter((id) => id !== item.id)
  }
}

// ======================
// DELETE SESSION
// ======================

const deleteSession = async (item) => {
  if (!confirm('Delete this session?')) {
    return
  }

  deleting.value = true

  try {
    await api.delete(`/therapy-sessions/${item.id}`)

    snackbarText.value = 'Session deleted'

    snackbarColor.value = 'success'

    snackbar.value = true

    await refreshScheduleData()
  } catch (err) {
    snackbarText.value = err.response?.data?.message || 'Failed to delete session'

    snackbarColor.value = 'error'

    snackbar.value = true
  } finally {
    deleting.value = false
  }
}

watch(
  () => form.value.schedule_configs,
  (configs) => {
    ;(configs ?? []).forEach((schedule) => {
      if (!schedule.enabled) {
        schedule.therapist_id = null
        schedule.time_slot = null
      }
    })
  },
  {
    deep: true,
  },
)

// ======================
// INIT
// ======================

onMounted(async () => {
  loading.value = true

  await fetchRegistration()

  await Promise.all([
    fetchSessions(),
    fetchTherapySessionStatuses(),
    fetchTrackAvailabilityCategories(),
  ])
  const today = new Date()

  const endDate = new Date()

  endDate.setDate(today.getDate() + 6)

  availabilityFilter.value = {
    start_date: today.toISOString().split('T')[0],

    end_date: endDate.toISOString().split('T')[0],

    therapist_id: null,
  }

  loading.value = false
})
</script>

<style scoped>
.schedule-content {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  min-width: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-wrapper {
  width: 100%;
}

.schedule-grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.schedule-grid th,
.schedule-grid td {
  border: 1px solid #d6d6d6;
  padding: 4px 8px;
  font-size: 14px;
}

.schedule-header {
  margin-bottom: -1px;
}

.schedule-header th {
  background: #ffe8cc;
  text-align: center;
  font-weight: 600;
}

.schedule-body td {
  vertical-align: top;
}

.date-column {
  width: 170px;
}

.date-text {
  font-weight: 600;
}

.day-text {
  margin-top: 2px;
  font-size: 12px;
  color: #757575;
}

.schedule-grid th:not(.date-column),
.schedule-grid td:not(.date-column) {
  width: calc((100% - 170px) / 6);
}

.availability-grid-wrapper {
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
}

.red-cell {
  background: #ffebee;
}

.available-cell {
  background: #e8f5e9;
}

.holiday-cell {
  background: #e3f2fd;
  color: #1565c0;
}

.multiple-session-wrapper {
  overflow-x: auto;
}

.multiple-session-table {
  min-width: 860px;
}

.multiple-session-table th,
.multiple-session-table td {
  padding: 10px 8px;
  vertical-align: top;
}

.track-availability-table-wrapper {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
}

.track-availability-card-text,
.track-availability-table {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.track-availability-table :deep(.v-table__wrapper) {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.track-availability-table :deep(table) {
  min-width: 1050px;
}

.track-availability-table :deep(td:nth-child(8)) {
  min-width: 220px;
  white-space: normal;
}

.track-session-details {
  min-width: 210px;
  white-space: normal;
  line-height: 1.35;
}

.package-summary-table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.package-summary-table :deep(table) {
  min-width: 760px;
}

.schedule-table--track-based {
  min-width: 760px;
}

.schedule-table--track-based :deep(table) {
  min-width: 760px;
  table-layout: fixed;
}

.schedule-table--track-based th:nth-child(1),
.schedule-table--track-based td:nth-child(1) {
  width: 18%;
  min-width: 145px;
}

.schedule-table--track-based th:nth-child(2),
.schedule-table--track-based td:nth-child(2) {
  width: 8%;
  min-width: 72px;
}

.schedule-table--track-based th:nth-child(3),
.schedule-table--track-based td:nth-child(3) {
  width: 62%;
  min-width: 400px;
}

.schedule-table--track-based th:nth-child(4),
.schedule-table--track-based td:nth-child(4) {
  width: 72px;
  min-width: 72px;
}

.schedule-table--track-based th {
  white-space: nowrap;
}

.schedule-table--track-based td:nth-child(1) .v-select {
  min-width: 125px;
}

.schedule-table--track-based td:nth-child(3) .v-select {
  min-width: 380px;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
