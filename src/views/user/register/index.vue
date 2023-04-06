<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, FormItemRule } from 'naive-ui'
import { NButton, NForm, NFormItem, NIcon, NInput, useMessage } from 'naive-ui'
import { fetchCaptcha, fetchRegister } from '@/api'
import { useAuthStoreWithout } from '@/store'

interface CaptchaResponse {
  ttl: number
}

const formRef = ref<FormInst | null>(null)
const countDown = ref(0)
const loading = ref(false) // 加载图标 默认false
const router = useRouter()
// const options = reactive([
//   {
//     label: '+86',
//     value: 86,
//     disabled: true,
//   },
// ])
const form = reactive({
  country_code: 86,
  captcha: '',
  mobile: '',
  password: '',
  confirm_password: '',
})

const message = useMessage()

const loginRules = {
  country_code: { required: true, message: '请选择国家', trigger: 'blur' },
  captcha: { required: true, message: '请输入验证码', trigger: 'blur' },
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      validator: validateMobile,
      message: '无效手机号码',
      trigger: ['input', 'blur'],
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      validator: validatePassword,
      message: '密码长度不小于8位,需要包含数字与字母',
      trigger: 'input',
    },
  ],
  confirm_password: [
    {
      required: true,
      message: '请再次输入密码',
      trigger: ['input', 'blur'],
    },
    {
      validator: validatePasswordStartWith,
      message: '两次密码输入不一致',
      trigger: 'input',
    },
    {
      validator: validatePasswordSame,
      message: '两次密码输入不一致',
      trigger: ['blur', 'password-input'],
    },
  ],
}

const handleLogin = (e: any) => {
  e.preventDefault()
  formRef.value?.validate(async (errors: any) => {
    if (!errors) {
      loading.value = true
      try {
        const response = await fetchRegister<UserResponse>({
          country_code: form.country_code,
          captcha: form.captcha,
          mobile: form.mobile,
          password: form.password,
          confirm_password: form.confirm_password,
        })
        useAuthStoreWithout().setToken(response.data.token)
        await router.push('/chat')
      }
      catch (e: any) {
        message.error(e.message)
      }
      finally {
        loading.value = false
      }
    }
  })
}

async function sendCaptcha() {
  if (!testMobile(form.mobile)) {
    message.error('无效的手机号码')
    return
  }

  try {
    const response = await fetchCaptcha<CaptchaResponse>({
      country_code: form.country_code,
      mobile: form.mobile,
    })
    message.success(response.message ? response.message : '发送成功')
    countDown.value = response.data.ttl
    const id = setInterval(() => {
      // eslint-disable-next-line curly
      if (countDown.value > 0) {
        countDown.value--
      }
      else
        clearInterval(id)
    }, 1000)
  }
  catch (e) {
    message.success('发送失败')
  }
}

function gotoLogin() {
  router.push('login')
}

function validatePasswordStartWith(
  rule: FormItemRule,
  value: string,
): boolean {
  return (
    !!form.password
      && form.password.startsWith(value)
      && form.password.length >= value.length
  )
}

function validatePasswordSame(rule: FormItemRule, value: string): boolean {
  return value === form.password
}

function validatePassword(rule: FormItemRule, password: string): boolean {
  if (password.length < 8 || password.length > 30)
    return false // 密码长度不符合要求

  if (!/\d/.test(password))
    return false // 密码未包含数字

  if (!/[a-zA-Z]/.test(password))
    return false // 密码未包含字母

  if (/\s/.test(password))
    return false // 密码包含空格

  return true
}

function validateMobile(rule: FormItemRule, value: string): boolean {
  return testMobile(value)
}

function testMobile(mobile: string) {
  const reg = /^1\d{10}$/
  return reg.test(mobile)
}
</script>

<template>
  <div class="flex flex-col h-screen  items-center justify-center view-account">
    <h1 class="text-2xl md:text-4xl font-bold text-indigo-900">
      AI宇宙
    </h1>
    <div class="md:flex dark:bg-gray-500 bg-gray-100 rounded-xl shadow-2xl p-8 md:p-0 mt-10">
      <div class="pt-6 md:p-8 space-y-4">
        <div class="text-3xl text-center font-black text-indigo-900">
          注册
        </div>
        <div class="font-medium">
          <NForm
            ref="formRef"
            label-placement="left"
            size="large"
            :model="form"
            :rules="loginRules"
          >
            <NFormItem path="mobile">
              <!--              <NSelect v-model:value="form.country_code" :options="options" /> -->
              <NInput
                v-model:value="form.mobile"
                :placeholder="loginRules.mobile[0].message"
              >
                <template #prefix>
                  <NIcon size="18" color="#808695" />
                </template>
              </NInput>
            </NFormItem>
            <NFormItem path="captcha">
              <NInput
                v-model:value="form.captcha"
                :placeholder="loginRules.captcha.message"
              >
                <template #prefix>
                  <NIcon size="18" color="#808695" />
                </template>
              </NInput>
              <NButton type="info" :disabled="countDown > 0" @click="sendCaptcha">
                {{ countDown > 0 ? `${countDown}秒后重试` : '获取验证码' }}
              </NButton>
            </NFormItem>
            <NFormItem path="password">
              <NInput
                v-model:value="form.password"
                type="password"
                show-password-on="click"
                :placeholder="loginRules.password[0].message"
              >
                <template #prefix>
                  <NIcon size="18" color="#808695" />
                </template>
              </NInput>
            </NFormItem>
            <NFormItem path="confirm_password">
              <NInput
                v-model:value="form.confirm_password"
                type="password"
                :disabled="!form.password"
                show-password-on="click"
                :placeholder="loginRules.confirm_password[0].message"
              >
                <template #prefix>
                  <NIcon size="18" color="#808695" />
                </template>
              </NInput>
            </NFormItem>
            <NFormItem>
              <NButton
                type="primary"
                size="large"
                :loading="loading"
                block
                @click="handleLogin"
              >
                提交
              </NButton>
            </NFormItem>
          </NForm>
          已经注册过账号？请 <a class="text-blue-400" href="" @click.prevent="gotoLogin">登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 768px) {
  .view-account {
    background-repeat: no-repeat;
    background-position: 50%;
    background-size: 100%;
  }
}
</style>
