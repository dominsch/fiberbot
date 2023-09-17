import { dlopen, FFIType, suffix } from "bun:ffi";

const path = `liblxi.${suffix}`;

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

let err = lib.symbols.lxi_init()
console.log(err);
let host = "localhost"
let mybuf = str2ab(host)
const myString = new CString(mybuf);
let dev = lib.symbols.lxi_connect(str2ab("localhost"), 8301, str2ab("fake\0"), 1000, 1)
lib.symbols.lxi_disconnect(dev)



function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}