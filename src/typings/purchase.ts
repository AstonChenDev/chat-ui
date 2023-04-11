declare namespace Purchase {
  interface Product {
    id: number
    name: string
    price: number
    tokens: number
    icon: string
    desc: string
    status: number
  }

  interface WechatNaive {
    code_url: string
    order_no: string
  }

}
