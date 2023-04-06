import msgpack from '@/utils/msgpack/msgpack.js'

export const Packet = {
  // jons数据打包成二进制数据
  encode(obj: {}, cmd: number, scmd: number) {
    const data = JSON.stringify(obj)
    const len = data.length + 6
    const buf = new ArrayBuffer(len) // 每个字符占用1个字节
    const buff_data = new DataView(buf, 0, len)
    const str_len = data.length
    buff_data.setUint32(0, str_len + 2)
    buff_data.setUint8(4, cmd)
    buff_data.setUint8(5, scmd)
    for (let i = 0; i < str_len; i++)
      buff_data.setInt8(i + 6, data.charCodeAt(i))

    return buf
  },

  // 二进制数据解包成二进制数据
  decode(buff: ArrayBufferLike) {
    const len = new DataView(buff, 0, 4).getUint32(0)
    const body_data = new DataView(buff, 4, len)
    // 解析cmd
    const cmd = body_data.getUint8(0)
    const scmd = body_data.getUint8(1)

    let body = ''
    // 解析body
    for (let i = 2; i < body_data.byteLength; i++)
      body += String.fromCharCode(body_data.getUint8(i))
    const obj = JSON.parse(body)
    obj.cmd = cmd
    obj.scmd = scmd
    return obj
  },

  encodeUTF8(str: string) {
    let temp = ''
    let rs = ''
    for (let i = 0, len = str.length; i < len; i++) {
      temp = str.charCodeAt(i).toString(16)
      rs += `\\u${new Array(5 - temp.length).join('0')}${temp}`
    }
    return rs
  },

  decodeUTF8(str: string) {
    return str.replace(/(\\u)(\w{4}|\w{2})/gi, ($0, $1, $2) => {
      return String.fromCharCode(parseInt($2, 16))
    })
  },

  // 使用msgpack解包arraybuf数据
  msgunpack(buff: ArrayBufferLike) {
    let body = ''
    const len = new DataView(buff, 0, 4).getUint32(0)
    const body_data = new DataView(buff, 4, len)
    // 解析cmd
    const cmd = body_data.getUint8(0)
    const scmd = body_data.getUint8(1)

    // 解析body
    for (let i = 2; i < body_data.byteLength; i++)
      body += String.fromCharCode(body_data.getUint8(i))

    // console.log("data msgpack decode   >>>  cmd="+cmd+"  scmd="+scmd+"  len="+len+" data="+body);
    const obj = msgpack.unpack(body)
    obj.cmd = cmd
    obj.scmd = scmd
    obj.len = len
    return obj
  },

  // 使用packmsg打包object数据对象
  msgpack(data: {}, cmd: number, scmd: number): ArrayBuffer {
    // var dt = {};
    // dt.data = data;
    const data_buff = msgpack.pack(data)
    const str_buff = String.fromCharCode.apply(null, Array.from(new Uint8Array(data_buff)))
    const len = str_buff.length + 6
    const buf = new ArrayBuffer(len) // 每个字符占用1个字节
    const buff_data = new DataView(buf, 0, len)
    const str_len = str_buff.length
    buff_data.setUint32(0, str_len + 2)
    buff_data.setUint8(4, cmd)
    buff_data.setUint8(5, scmd)

    for (let i = 0; i < str_len; i++)
      buff_data.setInt8(i + 6, str_buff.charCodeAt(i))
    // console.log("data msgpack encode  >>>  cmd="+cmd+"  scmd="+scmd+"  len="+len+"  data=");
    // console.log(data);
    return buf
  },
}
