<script setup lang="ts">
import { computed, ref } from 'vue'
import { NGradientText, NModal, NNumberAnimation, NSpace, useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import { fetchInvitees } from '@/api'
import InputCopyable from '@/components/common/InputCopyable/index.vue'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const userStore = useUserStore()
const message = useMessage()
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
const invite_bonus = ref(0)
const bonus_tokens = computed(() => {
  return invite_count.value * 100000
})

const link = computed(() => {
  return `${window.location.origin}?inviter=${userInfo.value.uid}#/register`
})

async function getInviteList() {
  const { data } = await fetchInvitees<{
    list: []
    bonus: number
  }>()
  invite_count.value = data.list.length
  invite_bonus.value = data.bonus
}

function copySuccess() {
  message.success('复制成功，快去邀请你的小伙伴吧~')
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
          <InputCopyable :input="link" @on-finish="copySuccess" />
        </NSpace>
        <NSpace justify="center" />
        <NSpace justify="center" />

        <NSpace justify="center" style="text-align: center">
          每当有用户通过您分享的专属链接注册成功，
          <NGradientText type="error">
            您将获得
            <NNumberAnimation ref="numberAnimationInstRef" :from="invite_bonus" :to="invite_bonus" show-separator />
            免费Token额度
          </NGradientText>
          <NGradientText type="error">
            可无限续杯。
          </NGradientText>
          快来邀请您的好友加入我们吧！
        </NSpace>

        <NSpace justify="center" style="text-align: center">
          已注册：{{ invite_count }}人
        </NSpace>
        <NSpace justify="center" style="text-align: center">
          已获得免费Token数量：
          <NNumberAnimation ref="numberAnimationInstRef" :from="bonus_tokens" :to="bonus_tokens" show-separator />
        </NSpace>
      </NSpace>
    </NSpace>
  </NModal>
</template>

<style scoped>

</style>
