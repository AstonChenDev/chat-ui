import { Packet } from '../msgpack/Packet'
import { MAIN_CMD, SUB_CMD } from './Const'

export interface Body {
  len: number
  cmd: number
  scmd: number
  type: number
  code: number
  msg: string
  data: any
}

export interface Route {
  handleError(body: Body): void

  handleEmpty(body: Body): void

  getCallback(cmd: number, scmd: number, type: number): any
}

export class Client {
  private readonly _host: string
  private _ws: WebSocket
  private readonly _debug: boolean
  private _route?: Route
  private readonly _token: string
  private heart_timer_id?: NodeJS.Timer
  private static _instance: Client | null
  private _onClose?: (evt: Event) => void
  private _onOpen?: (evt: Event) => void
  private readonly _binaryType: BinaryType
  private readonly _url: string
  private _onError?: (evt: Event) => void
  private tryCount: number

  private constructor(host: string, token: string, useBinary = true, debug = true) {
    this._host = host
    this._token = token
    this._debug = debug
    this.tryCount = 0
    this._binaryType = useBinary ? 'arraybuffer' : 'blob'
    const str = `token=${this._token}`
    this._url = `${`${this._host}`}?${str}`
    const ws = new WebSocket(this._url)
    ws.binaryType = this._binaryType
    this._ws = ws
  }

  public setRoute(route: Route): Client {
    this._route = route
    return this
  }

  static getInstance(host: string, token: string, useBinary = true, debug = true): Client {
    if (!Client._instance)
      Client._instance = new Client(host, token, useBinary, debug)
    return Client._instance
  }

  public setOnOpen(callback: (evt: Event) => void): Client {
    this._onOpen = callback
    this._ws.onopen = (evt: Event) => {
      this.tryCount = 0
      this.heart_timer_id = setInterval(() => {
        if (this._ws.readyState === this._ws.OPEN) {
          const data = {
            time: (new Date()).valueOf(),
          }
          this.send(data, MAIN_CMD.CMD_SYS, SUB_CMD.SYS_HEART_ASK_REQ)
        }
        else {
          clearInterval(this.heart_timer_id)
        }
      }, 10000)
      callback(evt)
    }
    return this
  }

  public send(data: any, cmd: number, scmd: number) {
    if (this._ws.readyState !== this._ws.OPEN)
      return
    data.time = (new Date()).valueOf()
    // this.ws.close();
    this.log(`websocket 发送消息 >>>  cmd=${cmd}  scmd=${scmd}  data=`, data)
    const pack_data = Packet.msgpack(data, cmd, scmd)
    // 组装数据
    this._ws.send(pack_data)
  }

  // 打印日志方法
  public log(message?: any, ...optionalParams: any[]) {
    if (this._debug)
      console.log(message, ...optionalParams)
  }

  public setOnMessage(): Client {
    this._ws.onmessage = (evt: MessageEvent) => {
      if (!evt.data)
        return
      const total_data = new DataView(evt.data)
      const total_len = total_data.byteLength
      if (total_data.byteLength < 4) {
        this.log('系统提示: 数据格式有问题')
        this._ws.close()
        return
      }
      // 进行粘包处理
      let off = 0
      let body = ''
      while (total_len > off) {
        const len = total_data.getUint32(off)
        const data = evt.data.slice(off, off + len + 4)
        // 解析body
        body = Packet.msgunpack(data)
        // 转发响应的请求
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        this.recvCmd(body)
        off += len + 4
      }
    }
    return this
  }

  public setOnClose(callback: (evt: Event) => void) {
    this._onClose = callback
    this._ws.onclose = (evt: CloseEvent) => {
      this.reconnect()
      callback(evt)
    }
    return this
  }

  public setOnError(callback: (evt: Event) => void) {
    this._onError = callback
    this._ws.onerror = (evt: Event) => {
      callback(evt)
    }
    return this
  }

  // 处理消息回调命令字
  public recvCmd(body: Body) {
    const len: number = body.len
    const cmd: number = body.cmd
    const scmd: number = body.scmd
    const data = body.data
    const push_type = body.type
    const type_human = body.type === 1 ? '提示' : '广播'
    this.log(`websocket 收到服务端消息 <<<  len=${len}  cmd=${cmd}  scmd=${scmd}  type=${type_human}  data=`, body)
    this.log(JSON.stringify(body))

    if (body.code !== 200) {
      this._route?.handleError(body)
      return
    }
    // 路由到处理地方
    try {
      // const callback = this._route[cmd][scmd][push_type]
      const callback = this._route?.getCallback(cmd, scmd, push_type)
      if (!callback)
        this._route?.handleEmpty(body)
      else
        callback(data)
    }
    catch (e) {
      this._route?.handleEmpty(body)
    }
  }

  static destroy(): void {
    Client._instance = null
  }

  private reconnect() {
    if (this.tryCount === 5)
      return

    try {
      const ws = new WebSocket(this._url)
      ws.binaryType = this._binaryType
      this._ws = ws
      this.setOnOpen(this._onOpen
        ? this._onOpen
        : () => {
          }).setOnMessage().setOnClose(this._onClose
        ? this._onClose
        : () => {
          }).setOnError(this._onError
        ? this._onError
        : () => {
          })
      this.tryCount++
    }
    catch (e) {
      this.log('reconnecting')
    }
  }
}
