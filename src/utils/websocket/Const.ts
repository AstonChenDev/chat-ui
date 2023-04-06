// 主命令字定义
import type { Body, Route } from '@/utils/websocket/Client'

export enum MAIN_CMD {
  CMD_SYS = 1, // 系统类（主命令字）- 客户端使用
}

// 子命令字定义
export enum SUB_CMD {
  // 请求指令
  SYS_HEART_ASK_REQ = 1, // 心跳请求
  SYS_COMMON_RESP = 3, // 通用响应
  SYS_CHAT_REQ = 4, // 聊天请求
  USER_PUSH_MESSAGE = 121, // 服务端消息推送
}

// 类型定义
export enum TYPE {
  TIP = 1,
  BROADCAST,
}

interface OneMap {
  [cmd: number]: {
    [scmd: number]: {
      [type: number]: any
    }
  }
}

export class Routes implements Route {
  private _map: OneMap

  constructor(map: OneMap) {
    this._map = map
  }

  handleEmpty(body: Body): void {
    this._map[MAIN_CMD.CMD_SYS][SUB_CMD.SYS_COMMON_RESP][TYPE.TIP](body)
  }

  handleError(body: Body): void {
    this._map[MAIN_CMD.CMD_SYS][SUB_CMD.SYS_COMMON_RESP][TYPE.TIP](body)
  }

  getCallback(cmd: number, scmd: number, type: number): any {
    try {
      return this._map[cmd][scmd][type]
    }
    catch (e) {
      return function ({ ...args }) {
        console.log(args)
      }
    }
  }
}
