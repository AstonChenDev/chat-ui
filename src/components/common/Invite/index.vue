<script setup lang="ts">
import { computed } from 'vue'
import { NAvatar, NButton, NGradientText, NModal, NSpace } from 'naive-ui'
import defaultAvatar from '@/assets/avatar.jpg'
import { useUserStore } from '@/store'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const userStore = useUserStore()
// const message = useMessage()
// const router = useRouter()
const userInfo = computed(() => userStore.userInfo)

interface Props {
  visible: boolean
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const show = computed({
  get() {
    return props.visible
  },
  set(visible: boolean) {
    emit('update:visible', visible)
  },
})
</script>

<template>
  <NModal v-model:show="show" preset="card" title="邀请用户" style="width: 600px; max-width: 80vw; min-width: 200px;">
    <NSpace justify="center">
      <NSpace vertical>
        <NSpace justify="center">
          <NAvatar
            :size="80"
            round
            :src="defaultAvatar"
          />
        </NSpace>
        <NSpace justify="center">
          ID: {{ userInfo.uid }}
        </NSpace>
        <NSpace justify="center">
          {{ userInfo.nickname }}
        </NSpace>
        <NSpace justify="center">
          <NButton strong secondary type="primary">
            免费获取Token
          </NButton>
        </NSpace>
        <NSpace justify="center">
          <NGradientText type="error">
            Token余额： {{ userInfo.balance }}
            <NButton strong secondary type="info">
              充值
            </NButton>
          </NGradientText>
        </NSpace>
      </NSpace>
    </NSpace>
  </NModal>
</template>

<style scoped>

</style>
