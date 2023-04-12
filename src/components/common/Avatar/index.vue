<script setup lang='ts'>
import { computed } from 'vue'
import { NAvatar } from 'naive-ui'
import { useUserStore } from '@/store'
import { isString } from '@/utils/is'

const props = defineProps<Props>()

interface Props {
  size: number | 'small' | 'medium' | 'large'
  fontSize?: number
}

const pic_size = computed(() => {
  return props.size
})

const font_size = computed(() => {
  return props.fontSize || 14
})

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
</script>

<template>
  <template v-if="isString(userInfo.avatar) && userInfo.avatar.length > 0">
    <NAvatar
      :size="pic_size"
      round
      :src="userInfo.avatar"
    />
  </template>
  <template v-else>
    <NAvatar :size="pic_size" :style="`font-size:${font_size}px;backgroundColor:purple`" round>
      {{ userInfo.nickname.substring(userInfo.nickname.length - 4) }}
    </NAvatar>
  </template>
</template>
