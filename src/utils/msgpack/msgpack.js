/*! {id:msgpack.js,ver:1.05,license:"MIT",author:"uupaa.js@gmail.com"} */

// === msgpack ===
// MessagePack -> http://msgpack.sourceforge.net/
export default {
  pack: msgpackpack, // msgpack.pack(data:Mix,
  //              toString:Boolean = false):ByteArray/ByteString/false
  //  [1][mix to String]    msgpack.pack({}, true) -> "..."
  //  [2][mix to ByteArray] msgpack.pack({})       -> [...]
  unpack: msgpackunpack, // msgpack.unpack(data:BinaryString/ByteArray):Mix
  //  [1][String to mix]    msgpack.unpack("...") -> {}
  //  [2][ByteArray to mix] msgpack.unpack([...]) -> {}
  worker: 'msgpack.js', // msgpack.worker - WebWorkers script filename
  upload: msgpackupload, // msgpack.upload(url:String, option:Hash, callback:Function)
  download: msgpackdownload, // msgpack.download(url:String, option:Hash, callback:Function)
}
const globalScope = window
const _ie = /MSIE/.test(navigator.userAgent)
const _bin2num = {} // BinaryStringToNumber   { "\00": 0, ... "\ff": 255 }
const _num2bin = {} // NumberToBinaryString   { 0: "\00", ... 255: "\ff" }
const _num2b64 = ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    + 'abcdefghijklmnopqrstuvwxyz0123456789+/').split('')
let _buf = [] // decode buffer
let _idx = 0 // decode buffer[index]
let _error = 0 // msgpack.pack() error code. 1 = CYCLIC_REFERENCE_ERROR
const _isArray = Array.isArray || function (mix) {
  return Object.prototype.toString.call(mix) === '[object Array]'
}
const _isUint8Array = function (mix) {
  return Object.prototype.toString.call(mix) === '[object Uint8Array]'
}
const _toString = String.fromCharCode // CharCode/ByteArray to String
const _MAX_DEPTH = 512

// for WebWorkers Code Block
self.importScripts && (onmessage = function (event) {
  if (event.data.method === 'pack')
    postMessage(base64encode(msgpackpack(event.data.data)))
  else
    postMessage(msgpackunpack(event.data.data))
})

// msgpack.pack
function msgpackpack(data, // @param Mix:
  toString) { // @param Boolean(= false):
  // @return ByteArray/BinaryString/false:
  //     false is error return
  //  [1][mix to String]    msgpack.pack({}, true) -> "..."
  //  [2][mix to ByteArray] msgpack.pack({})       -> [...]

  _error = 0

  const byteArray = encode([], data, 0)

  return _error
    ? false
    : toString
      ? byteArrayToByteString(byteArray)
      : byteArray
}

// msgpack.unpack
function msgpackunpack(data) { // @param BinaryString/ByteArray:
  // @return Mix/undefined:
  //       undefined is error return
  //  [1][String to mix]    msgpack.unpack("...") -> {}
  //  [2][ByteArray to mix] msgpack.unpack([...]) -> {}

  _buf = typeof data === 'string' ? toByteArray(data) : data
  _idx = -1
  return decode() // mix or undefined
}

// inner - encoder
function encode(rv, // @param ByteArray: result
  mix, // @param Mix: source data
  depth) { // @param Number: depth
  let size, i, iz, c, pos, // for UTF8.encode, Array.encode, Hash.encode
    high, low, sign, exp, frac // for IEEE754

  if (mix == null) { // null or undefined -> 0xc0 ( null )
    rv.push(0xC0)
  }
  else if (mix === false) { // false -> 0xc2 ( false )
    rv.push(0xC2)
  }
  else if (mix === true) { // true  -> 0xc3 ( true  )
    rv.push(0xC3)
  }
  else {
    switch (typeof mix) {
      case 'number':
        if (mix !== mix) { // isNaN
          rv.push(0xCB, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF) // quiet NaN
        }
        else if (mix === Infinity) {
          rv.push(0xCB, 0x7F, 0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00) // positive infinity
        }
        else if (Math.floor(mix) === mix) { // int or uint
          if (mix < 0) {
            // int
            if (mix >= -32) { // negative fixnum
              rv.push(0xE0 + mix + 32)
            }
            else if (mix > -0x80) {
              rv.push(0xD0, mix + 0x100)
            }
            else if (mix > -0x8000) {
              mix += 0x10000
              rv.push(0xD1, mix >> 8, mix & 0xFF)
            }
            else if (mix > -0x80000000) {
              mix += 0x100000000
              rv.push(0xD2, mix >>> 24, (mix >> 16) & 0xFF,
                (mix >> 8) & 0xFF, mix & 0xFF)
            }
            else {
              high = Math.floor(mix / 0x100000000)
              low = mix & 0xFFFFFFFF
              rv.push(0xD3, (high >> 24) & 0xFF, (high >> 16) & 0xFF,
                (high >> 8) & 0xFF, high & 0xFF,
                (low >> 24) & 0xFF, (low >> 16) & 0xFF,
                (low >> 8) & 0xFF, low & 0xFF)
            }
          }
          else {
            // uint
            if (mix < 0x80) {
              rv.push(mix) // positive fixnum
            }
            else if (mix < 0x100) { // uint 8
              rv.push(0xCC, mix)
            }
            else if (mix < 0x10000) { // uint 16
              rv.push(0xCD, mix >> 8, mix & 0xFF)
            }
            else if (mix < 0x100000000) { // uint 32
              rv.push(0xCE, mix >>> 24, (mix >> 16) & 0xFF,
                (mix >> 8) & 0xFF, mix & 0xFF)
            }
            else {
              high = Math.floor(mix / 0x100000000)
              low = mix & 0xFFFFFFFF
              rv.push(0xCF, (high >> 24) & 0xFF, (high >> 16) & 0xFF,
                (high >> 8) & 0xFF, high & 0xFF,
                (low >> 24) & 0xFF, (low >> 16) & 0xFF,
                (low >> 8) & 0xFF, low & 0xFF)
            }
          }
        }
        else { // double
          // THX!! @edvakf
          // http://javascript.g.hatena.ne.jp/edvakf/20101128/1291000731
          sign = mix < 0
          sign && (mix *= -1)

          // add offset 1023 to ensure positive
          // 0.6931471805599453 = Math.LN2;
          exp = ((Math.log(mix) / 0.6931471805599453) + 1023) | 0

          // shift 52 - (exp - 1023) bits to make integer part exactly 53 bits,
          // then throw away trash less than decimal point
          frac = mix * 2 ** (52 + 1023 - exp)

          //  S+-Exp(11)--++-----------------Fraction(52bits)-----------------------+
          //  ||          ||                                                        |
          //  v+----------++--------------------------------------------------------+
          //  00000000|00000000|00000000|00000000|00000000|00000000|00000000|00000000
          //  6      5    55  4        4        3        2        1        8        0
          //  3      6    21  8        0        2        4        6
          //
          //  +----------high(32bits)-----------+ +----------low(32bits)------------+
          //  |                                 | |                                 |
          //  +---------------------------------+ +---------------------------------+
          //  3      2    21  1        8        0
          //  1      4    09  6
          low = frac & 0xFFFFFFFF
          sign && (exp |= 0x800)
          high = ((frac / 0x100000000) & 0xFFFFF) | (exp << 20)

          rv.push(0xCB, (high >> 24) & 0xFF, (high >> 16) & 0xFF,
            (high >> 8) & 0xFF, high & 0xFF,
            (low >> 24) & 0xFF, (low >> 16) & 0xFF,
            (low >> 8) & 0xFF, low & 0xFF)
        }
        break
      case 'string':
        // http://d.hatena.ne.jp/uupaa/20101128
        iz = mix.length
        pos = rv.length // keep rewrite position

        rv.push(0) // placeholder

        // utf8.encode
        for (i = 0; i < iz; ++i) {
          c = mix.charCodeAt(i)
          if (c < 0x80) { // ASCII(0x00 ~ 0x7f)
            rv.push(c & 0x7F)
          }
          else if (c < 0x0800) {
            rv.push(((c >>> 6) & 0x1F) | 0xC0, (c & 0x3F) | 0x80)
          }
          else if (c < 0x10000) {
            rv.push(((c >>> 12) & 0x0F) | 0xE0,
              ((c >>> 6) & 0x3F) | 0x80, (c & 0x3F) | 0x80)
          }
        }
        size = rv.length - pos - 1

        if (size < 32) {
          rv[pos] = 0xA0 + size // rewrite
        }
        else if (size < 0x100) { // 8
          rv.splice(pos, 1, 0xD9, size)
        }
        else if (size < 0x10000) { // 16
          rv.splice(pos, 1, 0xDA, size >> 8, size & 0xFF)
        }
        else if (size < 0x100000000) { // 32
          rv.splice(pos, 1, 0xDB,
            size >>> 24, (size >> 16) & 0xFF,
            (size >> 8) & 0xFF, size & 0xFF)
        }
        break
      default: // array, hash, or Uint8Array
        if (_isUint8Array(mix)) {
          size = mix.length

          if (size < 0x100) { // 8
            rv.push(0xC4, size)
          }
          else if (size < 0x10000) { // 16
            rv.push(0xC5, size >> 8, size & 0xFF)
          }
          else if (size < 0x100000000) { // 32
            rv.push(0xC6, size >>> 24, (size >> 16) & 0xFF,
              (size >> 8) & 0xFF, size & 0xFF)
          }
          Array.prototype.push.apply(rv, mix)
          break
        }
        if (++depth >= _MAX_DEPTH) {
          _error = 1 // CYCLIC_REFERENCE_ERROR
          return rv = [] // clear
        }
        if (_isArray(mix)) {
          size = mix.length
          if (size < 16) {
            rv.push(0x90 + size)
          }
          else if (size < 0x10000) { // 16
            rv.push(0xDC, size >> 8, size & 0xFF)
          }
          else if (size < 0x100000000) { // 32
            rv.push(0xDD, size >>> 24, (size >> 16) & 0xFF,
              (size >> 8) & 0xFF, size & 0xFF)
          }
          for (i = 0; i < size; ++i)
            encode(rv, mix[i], depth)
        }
        else { // hash
          // http://d.hatena.ne.jp/uupaa/20101129
          pos = rv.length // keep rewrite position
          rv.push(0) // placeholder
          size = 0
          for (i in mix) {
            ++size
            encode(rv, i, depth)
            encode(rv, mix[i], depth)
          }
          if (size < 16) {
            rv[pos] = 0x80 + size // rewrite
          }
          else if (size < 0x10000) { // 16
            rv.splice(pos, 1, 0xDE, size >> 8, size & 0xFF)
          }
          else if (size < 0x100000000) { // 32
            rv.splice(pos, 1, 0xDF,
              size >>> 24, (size >> 16) & 0xFF,
              (size >> 8) & 0xFF, size & 0xFF)
          }
        }
    }
  }
  return rv
}

// inner - decoder
function decode() { // @return Mix:
  let size
  let i
  let iz
  let c
  let num = 0
  let sign
  let exp
  let frac
  let ary
  let hash
  const buf = _buf
  let type = buf[++_idx]

  if (type >= 0xE0) { // Negative FixNum (111x xxxx) (-32 ~ -1)
    return type - 0x100
  }
  if (type < 0xC0) {
    if (type < 0x80) { // Positive FixNum (0xxx xxxx) (0 ~ 127)
      return type
    }
    if (type < 0x90) { // FixMap (1000 xxxx)
      num = type - 0x80
      type = 0x80
    }
    else if (type < 0xA0) { // FixArray (1001 xxxx)
      num = type - 0x90
      type = 0x90
    }
    else { // if (type < 0xc0) {   // FixRaw (101x xxxx)
      num = type - 0xA0
      type = 0xA0
    }
  }
  switch (type) {
    case 0xC0:
      return null
    case 0xC2:
      return false
    case 0xC3:
      return true
    case 0xCA: // float
      num = buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
                + (buf[++_idx] << 8) + buf[++_idx]
      sign = num & 0x80000000 //  1bit
      exp = (num >> 23) & 0xFF //  8bits
      frac = num & 0x7FFFFF // 23bits
      if (!num || num === 0x80000000) { // 0.0 or -0.0
        return 0
      }
      if (exp === 0xFF) { // NaN or Infinity
        return frac ? NaN : Infinity
      }
      return (sign ? -1 : 1)
                * (frac | 0x800000) * 2 ** (exp - 127 - 23) // 127: bias
    case 0xCB: // double
      num = buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
                + (buf[++_idx] << 8) + buf[++_idx]
      sign = num & 0x80000000 //  1bit
      exp = (num >> 20) & 0x7FF // 11bits
      frac = num & 0xFFFFF // 52bits - 32bits (high word)
      if (!num || num === 0x80000000) { // 0.0 or -0.0
        _idx += 4
        return 0
      }
      if (exp === 0x7FF) { // NaN or Infinity
        _idx += 4
        return frac ? NaN : Infinity
      }
      num = buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
                + (buf[++_idx] << 8) + buf[++_idx]
      return (sign ? -1 : 1)
                * ((frac | 0x100000) * 2 ** (exp - 1023 - 20) // 1023: bias
                    + num * 2 ** (exp - 1023 - 52))
      // 0xcf: uint64, 0xce: uint32, 0xcd: uint16
    case 0xCF:
      num = buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
                + (buf[++_idx] << 8) + buf[++_idx]
      return num * 0x100000000
                + buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
                + (buf[++_idx] << 8) + buf[++_idx]
    case 0xCE:
      num += buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
    case 0xCD:
      num += buf[++_idx] << 8
    case 0xCC:
      return num + buf[++_idx]
      // 0xd3: int64, 0xd2: int32, 0xd1: int16, 0xd0: int8
    case 0xD3:
      num = buf[++_idx]
      if (num & 0x80) { // sign -> avoid overflow
        return ((num ^ 0xFF) * 0x100000000000000
                    + (buf[++_idx] ^ 0xFF) * 0x1000000000000
                    + (buf[++_idx] ^ 0xFF) * 0x10000000000
                    + (buf[++_idx] ^ 0xFF) * 0x100000000
                    + (buf[++_idx] ^ 0xFF) * 0x1000000
                    + (buf[++_idx] ^ 0xFF) * 0x10000
                    + (buf[++_idx] ^ 0xFF) * 0x100
                    + (buf[++_idx] ^ 0xFF) + 1) * -1
      }
      return num * 0x100000000000000
                + buf[++_idx] * 0x1000000000000
                + buf[++_idx] * 0x10000000000
                + buf[++_idx] * 0x100000000
                + buf[++_idx] * 0x1000000
                + buf[++_idx] * 0x10000
                + buf[++_idx] * 0x100
                + buf[++_idx]
    case 0xD2:
      num = buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
                + (buf[++_idx] << 8) + buf[++_idx]
      return num < 0x80000000 ? num : num - 0x100000000 // 0x80000000 * 2
    case 0xD1:
      num = (buf[++_idx] << 8) + buf[++_idx]
      return num < 0x8000 ? num : num - 0x10000 // 0x8000 * 2
    case 0xD0:
      num = buf[++_idx]
      return num < 0x80 ? num : num - 0x100 // 0x80 * 2
      // 0xdb: str32, 0xda: str16, 0xd9: str8, 0xa0: fixstr
    case 0xDB:
      num += buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
    case 0xDA:
      num += buf[++_idx] << 8
    case 0xD9:
      num += buf[++_idx]
    case 0xA0: // utf8.decode
      for (ary = [], i = _idx, iz = i + num; i < iz;) {
        c = buf[++i] // lead byte
        ary.push(c < 0x80 ? c // ASCII(0x00 ~ 0x7f)
          : c < 0xE0
            ? ((c & 0x1F) << 6 | (buf[++i] & 0x3F))
            : ((c & 0x0F) << 12 | (buf[++i] & 0x3F) << 6
                            | (buf[++i] & 0x3F)))
      }
      _idx = i
      return ary.length < 10240
        ? _toString.apply(null, ary)
        : byteArrayToByteString(ary)
        // 0xc6: bin32, 0xc5: bin16, 0xc4: bin8
    case 0xC6:
      num += buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
    case 0xC5:
      num += buf[++_idx] << 8
    case 0xC4:
      num += buf[++_idx]
      var end = ++_idx + num
      var ret = buf.slice(_idx, end)
      _idx += num
      return ret
      // 0xdf: map32, 0xde: map16, 0x80: map
    case 0xDF:
      num += buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
    case 0xDE:
      num += (buf[++_idx] << 8) + buf[++_idx]
    case 0x80:
      hash = {}
      while (num--) {
        // make key/value pair
        size = buf[++_idx] - 0xA0

        for (ary = [], i = _idx, iz = i + size; i < iz;) {
          c = buf[++i] // lead byte
          ary.push(c < 0x80 ? c // ASCII(0x00 ~ 0x7f)
            : c < 0xE0
              ? ((c & 0x1F) << 6 | (buf[++i] & 0x3F))
              : ((c & 0x0F) << 12 | (buf[++i] & 0x3F) << 6
                                | (buf[++i] & 0x3F)))
        }
        _idx = i
        hash[_toString.apply(null, ary)] = decode()
      }
      return hash
      // 0xdd: array32, 0xdc: array16, 0x90: array
    case 0xDD:
      num += buf[++_idx] * 0x1000000 + (buf[++_idx] << 16)
    case 0xDC:
      num += (buf[++_idx] << 8) + buf[++_idx]
    case 0x90:
      ary = []
      while (num--)
        ary.push(decode())

      return ary
  }
}

// inner - byteArray To ByteString
function byteArrayToByteString(byteArray) { // @param ByteArray
  // @return String
  // http://d.hatena.ne.jp/uupaa/20101128
  try {
    return _toString.apply(this, byteArray) // toString
  }
  catch (err) {
    // avoid "Maximum call stack size exceeded"
  }
  const rv = []
  let i = 0
  const iz = byteArray.length
  const num2bin = _num2bin

  for (; i < iz; ++i)
    rv[i] = num2bin[byteArray[i]]

  return rv.join('')
}

// msgpack.download - load from server
function msgpackdownload(url, // @param String:
  option, // @param Hash: { worker, timeout, before, after }
  //    option.worker - Boolean(= false): true is use WebWorkers
  //    option.timeout - Number(= 10): timeout sec
  //    option.before  - Function: before(xhr, option)
  //    option.after   - Function: after(xhr, option, { status, ok })
  callback) { // @param Function: callback(data, option, { status, ok })
  //    data   - Mix/null:
  //    option - Hash:
  //    status - Number: HTTP status code
  //    ok     - Boolean:
  option.method = 'GET'
  option.binary = true
  ajax(url, option, callback)
}

// msgpack.upload - save to server
function msgpackupload(url, // @param String:
  option, // @param Hash: { data, worker, timeout, before, after }
  //    option.data - Mix:
  //    option.worker - Boolean(= false): true is use WebWorkers
  //    option.timeout - Number(= 10): timeout sec
  //    option.before  - Function: before(xhr, option)
  //    option.after   - Function: after(xhr, option, { status, ok })
  callback) { // @param Function: callback(data, option, { status, ok })
  //    data   - String: responseText
  //    option - Hash:
  //    status - Number: HTTP status code
  //    ok     - Boolean:
  option.method = 'PUT'
  option.binary = true

  if (option.worker && globalScope.Worker) {
    const worker = new Worker(msgpack.worker)

    worker.onmessage = function (event) {
      option.data = event.data
      ajax(url, option, callback)
    }
    worker.postMessage({ method: 'pack', data: option.data })
  }
  else {
    // pack and base64 encode
    option.data = base64encode(msgpackpack(option.data))
    ajax(url, option, callback)
  }
}

// inner -
function ajax(url, // @param String:
  option, // @param Hash: { data, ifmod, method, timeout,
  //                header, binary, before, after, worker }
  //    option.data    - Mix: upload data
  //    option.ifmod   - Boolean: true is "If-Modified-Since" header
  //    option.method  - String: "GET", "POST", "PUT"
  //    option.timeout - Number(= 10): timeout sec
  //    option.header  - Hash(= {}): { key: "value", ... }
  //    option.binary  - Boolean(= false): true is binary data
  //    option.before  - Function: before(xhr, option)
  //    option.after   - Function: after(xhr, option, { status, ok })
  //    option.worker  - Boolean(= false): true is use WebWorkers
  callback) { // @param Function: callback(data, option, { status, ok })
  //    data   - String/Mix/null:
  //    option - Hash:
  //    status - Number: HTTP status code
  //    ok     - Boolean:
  function readyStateChange() {
    if (xhr.readyState === 4) {
      let data
      const status = xhr.status
      let worker
      let byteArray
      const rv = { status, ok: status >= 200 && status < 300 }

      if (!run++) {
        if (method === 'PUT') {
          data = rv.ok ? xhr.responseText : ''
        }
        else {
          if (rv.ok) {
            if (option.worker && globalScope.Worker) {
              worker = new Worker(msgpack.worker)
              worker.onmessage = function (event) {
                callback(event.data, option, rv)
              }
              worker.postMessage({
                method: 'unpack',
                data: xhr.responseText,
              })
              gc()
              return
            }
            else {
              byteArray = _ie
                ? toByteArrayIE(xhr)
                : toByteArray(xhr.responseText)
              data = msgpackunpack(byteArray)
            }
          }
        }
        after && after(xhr, option, rv)
        callback(data, option, rv)
        gc()
      }
    }
  }

  function ng(abort, status) {
    if (!run++) {
      const rv = { status: status || 400, ok: false }

      after && after(xhr, option, rv)
      callback(null, option, rv)
      gc(abort)
    }
  }

  function gc(abort) {
    abort && xhr && xhr.abort && xhr.abort()
    watchdog && (clearTimeout(watchdog), watchdog = 0)
    xhr = null
    globalScope.addEventListener
        && globalScope.removeEventListener('beforeunload', ng, false)
  }

  var watchdog = 0
  var method = option.method || 'GET'
  const header = option.header || {}
  const before = option.before
  var after = option.after
  const data = option.data || null
  var xhr = globalScope.XMLHttpRequest
    ? new XMLHttpRequest()
    : globalScope.ActiveXObject
      ? new ActiveXObject('Microsoft.XMLHTTP')
      : null
  var run = 0
  let i
  const overrideMimeType = 'overrideMimeType'
  const setRequestHeader = 'setRequestHeader'
  const getbinary = method === 'GET' && option.binary

  try {
    xhr.onreadystatechange = readyStateChange
    xhr.open(method, url, true) // ASync

    before && before(xhr, option)

    getbinary && xhr[overrideMimeType]
        && xhr[overrideMimeType]('text/plain; charset=x-user-defined')
    data
        && xhr[setRequestHeader]('Content-Type',
          'application/x-www-form-urlencoded')

    for (i in header)
      xhr[setRequestHeader](i, header[i])

    globalScope.addEventListener
        && globalScope.addEventListener('beforeunload', ng, false) // 400: Bad Request

    xhr.send(data)
    watchdog = setTimeout(() => {
      ng(1, 408) // 408: Request Time-out
    }, (option.timeout || 10) * 1000)
  }
  catch (err) {
    ng(0, 400) // 400: Bad Request
  }
}

// inner - BinaryString To ByteArray
function toByteArray(data) { // @param BinaryString: "\00\01"
  // @return ByteArray: [0x00, 0x01]
  const rv = []
  const bin2num = _bin2num
  let remain
  const ary = data.split('')
  let i = -1
  let iz

  iz = ary.length
  remain = iz % 8

  while (remain--) {
    ++i
    rv[i] = bin2num[ary[i]]
  }
  remain = iz >> 3
  while (remain--) {
    rv.push(bin2num[ary[++i]], bin2num[ary[++i]],
      bin2num[ary[++i]], bin2num[ary[++i]],
      bin2num[ary[++i]], bin2num[ary[++i]],
      bin2num[ary[++i]], bin2num[ary[++i]])
  }
  return rv
}

// inner - BinaryString to ByteArray
function toByteArrayIE(xhr) {
  const rv = []
  let data
  let remain
  const charCodeAt = 'charCodeAt'
  let loop
  let v0
  let v1
  let v2
  let v3
  let v4
  let v5
  let v6
  let v7
  let i = -1
  let iz

  iz = vblen(xhr)
  data = vbstr(xhr)
  loop = Math.ceil(iz / 2)
  remain = loop % 8

  while (remain--) {
    v0 = data[charCodeAt](++i) // 0x00,0x01 -> 0x0100
    rv.push(v0 & 0xFF, v0 >> 8)
  }
  remain = loop >> 3
  while (remain--) {
    v0 = data[charCodeAt](++i)
    v1 = data[charCodeAt](++i)
    v2 = data[charCodeAt](++i)
    v3 = data[charCodeAt](++i)
    v4 = data[charCodeAt](++i)
    v5 = data[charCodeAt](++i)
    v6 = data[charCodeAt](++i)
    v7 = data[charCodeAt](++i)
    rv.push(v0 & 0xFF, v0 >> 8, v1 & 0xFF, v1 >> 8,
      v2 & 0xFF, v2 >> 8, v3 & 0xFF, v3 >> 8,
      v4 & 0xFF, v4 >> 8, v5 & 0xFF, v5 >> 8,
      v6 & 0xFF, v6 >> 8, v7 & 0xFF, v7 >> 8)
  }
  iz % 2 && rv.pop()

  return rv
}

// inner - base64.encode
function base64encode(data) { // @param ByteArray:
  // @return Base64String:
  const rv = []
  let c = 0
  let i = -1
  let iz = data.length
  const pad = [0, 2, 1][data.length % 3]
  const num2bin = _num2bin
  const num2b64 = _num2b64

  if (globalScope.btoa) {
    while (i < iz)
      rv.push(num2bin[data[++i]])

    return btoa(rv.join(''))
  }
  --iz
  while (i < iz) {
    c = (data[++i] << 16) | (data[++i] << 8) | (data[++i]) // 24bit
    rv.push(num2b64[(c >> 18) & 0x3F],
      num2b64[(c >> 12) & 0x3F],
      num2b64[(c >> 6) & 0x3F],
      num2b64[c & 0x3F])
  }
  pad > 1 && (rv[rv.length - 2] = '=')
  pad > 0 && (rv[rv.length - 1] = '=')
  return rv.join('')
}

// --- init ---
(function () {
  let i = 0
  let v

  for (; i < 0x100; ++i) {
    v = _toString(i)
    _bin2num[v] = i // "\00" -> 0x00
    _num2bin[i] = v //     0 -> "\00"
  }
  // http://twitter.com/edvakf/statuses/15576483807
  for (i = 0x80; i < 0x100; ++i) { // [Webkit][Gecko]
    _bin2num[_toString(0xF700 + i)] = i // "\f780" -> 0x80
  }

  _ie && document.write('<script type="text/vbscript">\
Function vblen(b)vblen=LenB(b.responseBody)End Function\n\
Function vbstr(b)vbstr=CStr(b.responseBody)+chr(0)End Function</' + 'script>')
})(this)
