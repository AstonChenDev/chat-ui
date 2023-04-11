<script setup lang="ts">
import { computed, reactive } from 'vue'
import QRCodeVue3 from 'qrcode-vue3'
import {
  NModal, NSpace,
} from 'naive-ui'
import image from '@/assets/favicon.svg'

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

interface Props {
  visible: boolean
  codeUrl: string
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const url = computed(() => {
  return props.codeUrl
})

const qr_data = reactive({
  /**
   * 基础配置
   */
  width: 360, // 二维码宽度
  height: 360, // 二维码高度
  value: url, // 二维码内容
  margin: 6, // 二维码图像的外边距
  /**
   * 背景配置
   */
  backgroundOptions: {
    // 二维码背景色
    color: 'white',
  },
  /**
   * 二维码配置
   */
  qrOptions: {
    typeNumber: '0', // 类型编号 0 - 40
    mode: 'Byte', // 模式 Numeric | Alphanumeric | Byte | Kanji
    errorCorrectionLevel: 'Q', // 错误级别 L | M | Q | H
  },
  /**
   * 图像配置（中心图片）
   */
  image, // 二维码中心的图片
  imageOptions: {
    hideBackgroundDots: true, // 隐藏图片背后有点
    imageSize: 0.5,
    margin: 5,
    crossOrigin: 'anonymous', // anonymous | use-credentials
  },
  /**
   * 二维码点配置
   */
  dotsOptions: {
    type: 'rounded', // 二维码样式 square | dots | rounded | extra-rounded | classy | classy-rounded
    color: '#6a1a4c',
    // 渐变色
    gradient: {
      type: 'linear', // linear线性渐变 | radial径向渐变
      rotation: 0,
      colorStops: [
        {
          offset: 0,
          color: '#fa5aec',
        },
        {
          offset: 1,
          color: '#377ded',
        },
      ],
    },
  },
  /**
   * 角落广场配置
   */
  cornersSquareOptions: {
    type: 'extra-rounded', // none | square | dot | extra-rounded
    color: '#8fdfbd',
    gradient: {
      type: 'linear',
      rotation: 0,
      colorStops: [
        {
          offset: 0,
          color: '#548bd3',
        },
        {
          offset: 1,
          color: '#00ffbf',
        },
      ],
    },
  },
  /**
   * 角落点配置
   */
  cornersDotOptions: {
    type: 'dot', // none | square | dot
    color: '#000000',
    gradient: {
      type: 'radial',
      rotation: 0,
      colorStops: [
        {
          offset: 0,
          color: '#ff00ea',
        },
        {
          offset: 1,
          color: '#00aaff',
        },
      ],
    },
  },
})

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
  <NModal
    v-model:show="show" preset="card" title="请使用微信扫码支付" header-style="text-align:center"
    :style="`width:${qr_data.width}px;height:${qr_data.height + 30}px`"
  >
    <NSpace vertical>
      <NSpace justify="center">
        <QRCodeVue3
          :margin="qr_data.margin"
          :width="qr_data.width"
          :height="qr_data.height"
          :value="qr_data.value"
          :qr-options="qr_data.qrOptions"
          :image="qr_data.image"
          :image-options="qr_data.imageOptions"
          :dots-options="qr_data.dotsOptions"
          :background-options="qr_data.backgroundOptions"
          :corners-square-options="qr_data.cornersSquareOptions"
          :corners-dot-options="qr_data.cornersDotOptions"
        />
      </NSpace>
    </NSpace>
  </NModal>
</template>

<style scoped>

</style>
