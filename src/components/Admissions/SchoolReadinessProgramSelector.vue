<template>
  <div class="school-readiness-program-selector">
    <div class="text-body-2 text-medium-emphasis mb-3">
      Choose a package for each subject you want to enroll in. You may choose a different mode
      and learning period for each subject.
    </div>

    <v-card v-if="registrationFeePrograms.length" variant="outlined" class="mb-4">
      <v-card-text>
        <v-select
          :model-value="selectedRegistrationFee?.program_id ?? null"
          :items="registrationFeePrograms"
          item-title="selection_label"
          item-value="id"
          label="Annual Registration Fee (optional)"
          hint="Select this only when the annual registration fee should be included in this registration."
          persistent-hint
          variant="outlined"
          clearable
          :disabled="disabled"
          @update:model-value="setRegistrationFee"
        />
      </v-card-text>
    </v-card>

    <v-row>
      <v-col v-for="group in subjectGroups" :key="group.key" cols="12" md="6">
        <v-card variant="outlined" class="h-100">
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-3">{{ group.subjectName }}</div>

            <v-select
              :model-value="selectionFor(group.key)?.program_id ?? null"
              :items="group.programs"
              :item-title="programTitle"
              item-value="id"
              label="Package and mode"
              variant="outlined"
              clearable
              :disabled="disabled"
              hide-details="auto"
              @update:model-value="setProgram(group.key, $event)"
            >
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #title>
                    {{ programTitle(programFromSelectItem(item)) }}
                  </template>
                  <template #subtitle>
                    {{ programOptionSubtitle(item) }}
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <v-select
              v-if="selectionFor(group.key)"
              :model-value="selectionFor(group.key).learning_period_months"
              :items="learningPeriods"
              label="Learning Period in Month"
              variant="outlined"
              class="mt-4"
              hide-details="auto"
              :disabled="disabled"
              @update:model-value="setLearningPeriod(group.key, $event)"
            />

            <div v-if="selectionFor(group.key)" class="text-caption text-medium-emphasis mt-2">
              {{ selectedProgram(group.key)?.session_count }} sessions per month · Estimated total:
              <strong>
                Rp
                {{
                  (
                    monthlyPrice(selectedProgram(group.key)) *
                    selectionFor(group.key).learning_period_months
                  ).toLocaleString('id-ID')
                }}
              </strong>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const learningPeriods = Array.from({ length: 12 }, (_, index) => ({
  title: String(index + 1),
  value: index + 1,
}))

const subjectGroups = computed(() => {
  const groups = new Map()

  props.programs
    .filter((program) =>
      program.track &&
      program.track.is_active &&
      Number(program.status_id ?? (program.status?.name === 'Active' ? 1 : 0)) === 1 &&
      !program.is_registration_fee,
    )
    .forEach((program) => {
      const subjectName = program.track.subject_name
      const key = subjectName.trim().toLocaleLowerCase()
      if (!groups.has(key)) groups.set(key, { key, subjectName, programs: [] })
      groups.get(key).programs.push(program)
    })

  return [...groups.values()].map((group) => ({
    ...group,
    programs: group.programs.sort((left, right) => {
      const mode = String(left.track.delivery_mode).localeCompare(String(right.track.delivery_mode))
      return mode || Number(left.session_count) - Number(right.session_count)
    }),
  }))
})

const registrationFeePrograms = computed(() =>
  props.programs
    .filter((program) => program.is_registration_fee && isActiveProgram(program))
    .map((program) => ({
      ...program,
      selection_label: `${program.name} · Rp ${Number(program.price || 0).toLocaleString('id-ID')}`,
    })),
)

const selectedRegistrationFee = computed(() =>
  props.modelValue.find((selection) => programForId(selection.program_id)?.is_registration_fee),
)

const isActiveProgram = (program) =>
  Number(program.status_id ?? (program.status?.name === 'Active' ? 1 : 0)) === 1

const programForId = (programId) =>
  props.programs.find((program) => Number(program.id) === Number(programId))

const subjectKeyForProgram = (programId) => {
  const program = props.programs.find((item) => Number(item.id) === Number(programId))
  return program?.track?.subject_name?.trim().toLocaleLowerCase()
}

const selectionFor = (subjectKey) =>
  props.modelValue.find((selection) => subjectKeyForProgram(selection.program_id) === subjectKey)

const selectedProgram = (subjectKey) => {
  const id = selectionFor(subjectKey)?.program_id
  return props.programs.find((program) => Number(program.id) === Number(id))
}

const programFromSelectItem = (item) => item?.raw ?? item ?? {}

const monthlyPrice = (program) =>
  Number(program?.monthly_price ?? program?.price ?? 0)

const programOptionSubtitle = (item) => {
  const program = programFromSelectItem(item)
  const pricePerSession = Number(program?.track?.price_per_session ?? 0)

  return `Rp ${pricePerSession.toLocaleString('id-ID')} per session · Rp ${monthlyPrice(program).toLocaleString('id-ID')} per month`
}

const programTitle = (program) => {
  if (!program) return ''
  const mode = program.track?.delivery_mode
  const sessions = Number(program.session_count)
  return `${mode ? mode[0].toUpperCase() + mode.slice(1) : ''} · ${program.name} · ${sessions} sessions/month`
}

const emitSelections = (next) => {
  emit(
    'update:modelValue',
    next.map(({ program_id, learning_period_months }) => ({
      program_id: Number(program_id),
      learning_period_months: Number(learning_period_months),
    })),
  )
}

const setProgram = (subjectKey, programId) => {
  const next = props.modelValue.filter(
    (selection) => subjectKeyForProgram(selection.program_id) !== subjectKey,
  )
  if (programId != null) {
    next.push({ program_id: programId, learning_period_months: 1 })
  }
  emitSelections(next)
}

const setLearningPeriod = (subjectKey, period) => {
  emitSelections(
    props.modelValue.map((selection) =>
      subjectKeyForProgram(selection.program_id) === subjectKey
        ? { ...selection, learning_period_months: period }
        : selection,
    ),
  )
}

const setRegistrationFee = (programId) => {
  const next = props.modelValue.filter(
    (selection) => !programForId(selection.program_id)?.is_registration_fee,
  )
  if (programId != null) {
    next.push({ program_id: Number(programId), learning_period_months: 1 })
  }
  emitSelections(next)
}
</script>
