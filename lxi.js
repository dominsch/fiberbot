import { dlopen, FFIType } from "bun:ffi";

const path = `liblxi.so`;
//const path = `liblxi.so.1.0.0`;

const lib = dlopen(path, {
  lxi_init: {
    args: [],
    returns: FFIType.i32,
  },
  lxi_discover:{
    args: [],
    returns: FFIType.i32,
  },
  lxi_connect: {
    args: [FFIType.cstring, FFIType.i32, FFIType.cstring, FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
  lxi_send:{
    args: [FFIType.i32, FFIType.cstring, FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
  lxi_receive:{
    args: [FFIType.i32, FFIType.cstring, FFIType.i32, FFIType.i32],
    returns: FFIType.i32,
  },
  lxi_disconnect:{
    args: [FFIType.i32],
    returns: FFIType.i32,
  },
});

// lxi_init()
// let dev = lxi_connect("192.168.10.104", 8301, "device")//lib.symbols.lxi_connect(str2ab("localhost"), 8301, str2ab("fake"), 1000, 1)
// lxi_send(dev, "*IDN?")
// let res = lxi_receive(dev)
// console.log(res)
// lxi_disconnect(dev)

function lxi_init() {
  let err = lib.symbols.lxi_init()
  if (err) throw new Error("init failed")
  console.log("init success")
}

function lxi_connect(host, port, name) {
  let host_string = new Uint8Array(host.length + 1)
  let name_string = new Uint8Array(name.length + 1)
  for (let i in host) { host_string[i] = host.charCodeAt(i) }
  for (let i in name) { name_string[i] = name.charCodeAt(i) }
  let device = lib.symbols.lxi_connect(host_string, port, name_string, 1000, 1)
  if (device == -1) throw new Error("connect failed!")
  console.log("connect success")
  return device
}

function lxi_send(device, command) {
  let buffer = new Uint8Array(command.length + 1)
  for (let i in command) {
    buffer[i] = command.charCodeAt(i)
  }
  let sent_bytes = lib.symbols.lxi_send(device, buffer, command.length, 1000)
  if (sent_bytes <= 0) throw new Error("send failed")
}

function lxi_receive(device) {
  let buffer = new Uint8Array(1024)
  let recd_bytes = lib.symbols.lxi_receive(device, buffer, buffer.length, 1000)
  if (recd_bytes < 0) throw new Error("receive failed")
  return String.fromCharCode.apply(null, buffer.slice(0, recd_bytes))//.substring(0, recd_bytes) //.match(/([^\0]+)/g)[0]
}

function lxi_disconnect(device) {
  let err = lib.symbols.lxi_disconnect(device)
  if (err) throw new Error("disconnect failed")
}

export {lxi_init as init, lxi_connect as connect, lxi_send as send, lxi_receive as receive, lxi_disconnect as disconnect}