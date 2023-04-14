<script setup lang='ts'>
import type { InputInst } from 'naive-ui'
import { NButton, NInput, NInputGroup } from 'naive-ui'
import { computed, ref } from 'vue'

const props = defineProps<Prop>()
const emit = defineEmits<Emit>()

interface Prop {
  input: string
}

const inputInstRef = ref<InputInst | null>(null)

interface Emit {
  (e: 'onFinish', copy_str: string): void
}

const string = computed(() => {
  return props.input
})

function copy() {
  inputInstRef.value?.select()
  if (document.execCommand('copy'))
    document.execCommand('copy')
  inputInstRef.value?.blur()
  emit('onFinish', props.input)
}
</script>

<template>
  <NInputGroup style="width:100%">
    <NInput ref="inputInstRef" v-model:value="string" readonly round />
    <NButton strong secondary round type="primary" @click="copy">
      点击复制
    </NButton>
  </NInputGroup>
</template>
