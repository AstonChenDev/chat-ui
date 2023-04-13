<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, FormItemRule } from 'naive-ui'
import { NButton, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import UserLayout from '@/views/user/components/Layout/index.vue'
import IconPhone from '@/icons/phone.vue'
import IconPassword from '@/icons/password.vue'

const loginFormRef = ref<FormInst | null>(null)
const loading = ref(false) // 加载图标 默认false
const router = useRouter()
const message = useMessage()
const loginForm = reactive({
  mobile: '',
  password: '',
})

useUserStore().resetUserInfo()
const loginRules = {
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
}

function validateMobile(rule: FormItemRule, value: string): boolean {
  return testMobile(value)
}

function testMobile(mobile: string) {
  const reg = /^1\d{10}$/
  return reg.test(mobile)
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

const handleLogin = (e: any) => {
  e.preventDefault()
  loginFormRef.value?.validate(async (errors: any) => {
    if (!errors) {
      loading.value = true
      try {
        await useUserStore().login({
          mobile: loginForm.mobile,
          password: loginForm.password,
        })
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

function gotoRegister() {
  router.push('register')
}

function gotoReset() {
  router.push('reset')
}
</script>

<template>
  <UserLayout title="登录">
    <NForm
      ref="loginFormRef"
      label-placement="left"
      size="large"
      :model="loginForm"
      :rules="loginRules"
    >
      <NFormItem path="mobile">
        <NInput
          v-model:value="loginForm.mobile"
          :placeholder="loginRules.mobile[0].message"
        >
          <template #prefix>
            <IconPhone />
          </template>
        </NInput>
      </NFormItem>
      <NFormItem path="password">
        <NInput
          v-model:value="loginForm.password"
          type="password"
          show-password-on="click"
          :placeholder="loginRules.password[0].message"
        >
          <template #prefix>
            <IconPassword />
          </template>
        </NInput>
      </NFormItem>
      <NFormItem>
        <NButton
          type="primary"
          size="large"
          round
          :loading="loading"
          block
          @click="handleLogin"
        >
          登录
        </NButton>
      </NFormItem>
    </NForm>
    还没有账号？请 <a class="text-blue-400" href="" @click.prevent="gotoRegister">注册</a>, 忘记密码请 <a
      class="text-blue-400" href="" @click.prevent="gotoReset"
    >重置密码</a>
  </UserLayout>
</template>

<style scoped>
.view-account {
  box-shadow: 0 0 20px 5px #2828284d;
  backdrop-filter: blur(2px);
  background-color: rgba(255, 255, 255, 0); /* 50% 透明白色 */
  background-color: rgba(255, 255, 255, 0.1); /* 50% 透明白色 */
}
</style>
