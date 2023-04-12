<script setup lang="ts">
import { computed, ref } from 'vue'
import { NButton, NGradientText, NModal, NSpace, useDialog } from 'naive-ui'
import { useUserStore } from '@/store'
import { fetchInvitees } from '@/api'
import { copyText } from '@/utils/format'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const userStore = useUserStore()
const dialog = useDialog()
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

const invite_count = ref(0)
const bonus_tokens = computed(() => {
  return invite_count.value * 100000
})

const link = computed(() => {
  return `${window.location.origin}?inviter=${userInfo.value.uid}#/register`
})

async function getInviteList() {
  const { data } = await fetchInvitees<[]>()
  invite_count.value = data.length
}

function copy() {
  if (copyText({ text: link.value ?? '' })) {
    dialog.success({
      title: '复制成功',
      content: '快去邀请你的小伙伴吧~',
      positiveText: 'OK',
    })
  }
}

getInviteList()
</script>

<template>
  <NModal
    v-model:show="show" preset="card" title="邀请用户"
    style="width: 600px; max-width: 80vw; min-width: 200px;"
  >
    <NSpace justify="center">
      <NSpace vertical>
        <NSpace justify="center">
          <NGradientText size="20" type="primary">
            我的专属邀请链接
          </NGradientText>
        </NSpace>
        <NSpace justify="center" />
        <NSpace justify="center">
          <b>{{ link }}</b>
        </NSpace>
        <NSpace justify="center" />
        <NSpace justify="center">
          <NButton strong secondary round type="primary" @click="copy">
            点击复制
          </NButton>
        </NSpace>
        <NSpace justify="center" />

        <NSpace justify="center" style="text-align: center">
          当您通过分享您的专属链接注册的好友，每邀请一位好友注册成功，
          <NGradientText type="error">
            您将获得 10万免费Token额度，可无限续杯。
          </NGradientText>
          快来邀请您的好友加入我们吧！
        </NSpace>

        <NSpace justify="center" style="text-align: center">
          已注册：{{ invite_count }}人；
        </NSpace>
        <NSpace justify="center" style="text-align: center">
          已获得免费Token数量：{{ bonus_tokens }}
        </NSpace>
      </NSpace>
    </NSpace>
  </NModal>
</template>

<style scoped>

</style>
