<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NAvatar,
  NCard,
  NGradientText,
  NModal,
  NSpace,
  useMessage,
} from 'naive-ui'
import defaultAvatar from '@/assets/avatar.jpg'
import { fetchOrderStatus, fetchProducts, fetchWechatNaive } from '@/api'
import type { Response } from '@/utils/request'
import TokenDisplay from '@/components/common/TokenDisplay/index.vue'
import QRCode from '@/components/common/QRCode/index.vue'
import { useUserStore } from '@/store'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()
const message = useMessage()
const userStore = useUserStore()
const products = ref<Purchase.Product[]>([])
const wechat_naive = ref<Purchase.WechatNaive>({
  code_url: '',
  order_no: '',
})
const select_product_id = ref<number>(0)
let timer: NodeJS.Timer

async function getProducts() {
  try {
    const { data }: Response = await fetchProducts<Response>()
    products.value = data
  }
  catch (e: any) {
    message.error(e.message)
  }
}

getProducts()

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
    if (visible)
      return
    select_product_id.value = 0
    if (timer)
      clearInterval(timer)
  },
})

const show_qr = computed<boolean>({
  get() {
    return wechat_naive.value.code_url !== ''
  },
  set(show_qr: boolean) {
    if (show_qr)
      return

    wechat_naive.value = {
      code_url: '',
      order_no: '',
    }
    select_product_id.value = 0
  },
})

async function requestBuy(product: Purchase.Product) {
  if (select_product_id.value > 0)
    return
  if (timer)
    clearInterval(timer)

  select_product_id.value = product.id
  message.loading(
    '正在请求支付，请使用微信扫码支付',
    { duration: 5000 },
  )
  try {
    const { data } = await fetchWechatNaive<Purchase.WechatNaive>(select_product_id.value)
    wechat_naive.value = data
    startLoop(data.order_no)
  }
  catch (e: any) {
    message.error(e.message)
  }
}

function startLoop(order_no: string) {
  timer = setInterval(async () => {
    const { data } = await fetchOrderStatus<number>({
      out_trade_no: order_no,
    })
    if (data) {
      await userStore.refreshUser()
      message.success('充值成功')
      show_qr.value = false
      clearInterval(timer)
    }
  }, 2000)
}

function afterChange() {
  show.value = false
}
</script>

<template>
  <QRCode v-model:visible="show_qr" :code-url="wechat_naive.code_url" />
  <NModal v-model:show="show" preset="card" title="购买套餐" style="width: 600px; max-width: 80vw; min-width: 200px;">
    <NSpace vertical>
      <NSpace justify="center">
        <NAvatar
          :size="80"
          round
          :src="defaultAvatar"
        />
      </NSpace>
      <NSpace justify="center">
        <NGradientText type="error">
          <TokenDisplay @onFinish="afterChange" />
        </NGradientText>
      </NSpace>
      <NSpace justify="center">
        <NCard
          v-for="product in products" :key="product.id" hoverable
          style="border-radius: 10px;"
          :style="product.id === select_product_id ? 'background-color: rgb(205, 255, 205)' : ''"
          :class=" select_product_id > 0 ? 'selecting' : 'unselecting'"
          @click="requestBuy(product)"
        >
          <NSpace vertical>
            <NSpace justify="center">
              <NGradientText type="success" size="30">
                {{ product.name }}
              </NGradientText>
            </NSpace>
          </NSpace>
          <NSpace vertical>
            <NSpace justify="center">
              <NGradientText type="info" size="10">
                {{ product.desc }}
              </NGradientText>
            </NSpace>
          </NSpace>
          <NSpace vertical>
            <NSpace justify="center">
              <NGradientText type="warning" size="20">
                <b>￥{{ product.price }}</b>
              </NGradientText>
            </NSpace>
          </NSpace>
        </NCard>
      </NSpace>
      <!--      <NSpace justify="center"> -->
      <!--        <NButton strong secondary type="primary" round> -->
      <!--          免费获取Token -->
      <!--        </NButton> -->
      <!--      </NSpace> -->
    </NSpace>
  </NModal>
</template>

<style scoped>
.selecting {
  cursor: not-allowed;
}

.unselecting {
  cursor: pointer;
}
</style>
