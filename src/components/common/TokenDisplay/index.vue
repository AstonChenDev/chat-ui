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

interface Emit {
  (e: 'onFinish', current: number): void
}

watch(userInfo, (newVal: UserInfo, oldValue: UserInfo) => {
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
      :duration="5000"
      :on-finish="onFinish"
    />
  </NGradientText>
</template>
