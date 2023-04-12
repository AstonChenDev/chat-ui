<script setup lang='ts'>
import { computed, ref, watch } from 'vue'
import { NGradientText, NNumberAnimation } from 'naive-ui'
import { useUserStore } from '@/store'
import type { UserInfo } from '@/store/modules/user/helper'

const emit = defineEmits<Emit>()
const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const from = ref(userInfo.value.balance)
const to = ref(userInfo.value.balance)
const duration = ref(2000)

interface Emit {
  (e: 'onFinish', current: number): void
}

watch(userInfo, (newVal: UserInfo, oldValue: UserInfo) => {
  duration.value = Math.abs(oldValue.balance - newVal.balance) > 10000 ? 5000 : 2000
  from.value = oldValue.balance
  to.value = newVal.balance
})

function onFinish() {
  emit('onFinish', userInfo.value.balance)
}
</script>

<template>
  <NGradientText type="error">
    Token余额：
    <NNumberAnimation
      show-separator
      :from="from"
      :to="to"
      :active="true"
      :duration="duration"
      :on-finish="onFinish"
    />
  </NGradientText>
</template>
