<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NAvatar, NButton, NGradientText, NModal, NSpace } from 'naive-ui'
import defaultAvatar from '@/assets/avatar.jpg'
import { useUserStore } from '@/store'
import Buy from '@/components/common/Buy/index.vue'
import Invite from '@/components/common/Invite/index.vue'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const userStore = useUserStore()
const router = useRouter()
const userInfo = computed(() => userStore.userInfo)
const showRecharge = ref(false)
const showInvite = ref(false)

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

function toBuy() {
  showRecharge.value = true
  show.value = false
}

// function toInvite() {
//   showInvite.value = true
//   show.value = false
// }

function quitLogin() {
  router.push('/login')
  userStore.resetUserInfo()
}
</script>

<template>
  <Buy v-model:visible="showRecharge" />
  <Invite v-model:visible="showInvite" />
  <NModal v-model:show="show" preset="card" title="个人信息" style="width: 600px; max-width: 80vw; min-width: 200px;">
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
        <!--        <NSpace justify="center"> -->
        <!--          <NButton strong secondary type="primary" @click="toInvite"> -->
        <!--            免费获取Token -->
        <!--          </NButton> -->
        <!--        </NSpace> -->
        <NSpace justify="center">
          <NGradientText type="error">
            Token余额： {{ userInfo.balance }}
            <NButton strong secondary type="info" @click="toBuy">
              点击充值
            </NButton>
          </NGradientText>
        </NSpace>
      </NSpace>
    </NSpace>
    <template #footer>
      <NSpace justify="center">
        <NSpace vertical>
          <NSpace justify="center">
            <NButton strong secondary type="error" @click="quitLogin">
              退出登录
            </NButton>
          </NSpace>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>

</style>
