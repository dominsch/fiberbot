import { dlopen, FFIType } from "bun:ffi";

//const path = `liblxi.${suffix}`;
const path = `liblxi.so.1.0.0`;

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
// let dev = lxi_connect("localhost", 8301, "device")//lib.symbols.lxi_connect(str2ab("localhost"), 8301, str2ab("fake"), 1000, 1)
// lxi_send(dev, "*IDN?")
// let res = lxi_receive(dev)
// console.log(res)
// lxi_disconnect(dev)

function lxi_init() {
  lib.symbols.lxi_init()
}

function lxi_connect(host, port, name) {
  let host_string = new Uint8Array(host.length + 1)
  let name_string = new Uint8Array(name.length + 1)
  for (let i in host) { host_string[i] = host.charCodeAt(i) }
  for (let i in name) { name_string[i] = name.charCodeAt(i) }
  return lib.symbols.lxi_connect(host_string, port, name_string, 1000, 1)
}

function lxi_send(device, command) {
  let buffer = new Uint8Array(command.length + 1)
  for (let i in command) {
    buffer[i] = command.charCodeAt(i)
  }
  lib.symbols.lxi_send(dev, buffer, command.length, 1000)
}

function lxi_receive(device) {
  let buffer = new Uint8Array(1024)
  lib.symbols.lxi_receive(device, buffer, buffer.length, 1000)
  let response = String.fromCharCode.apply(null, buffer).match(/([^\0]+)/g)[0]
  return response
}

function lxi_disconnect(device) {
  lib.symbols.lxi_disconnect(device)
}
