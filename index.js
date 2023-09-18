// import * as lxi from "./lxi.js"

// console.log(lxi)
// lxi.init()
// let map = lxi.connect("192.168.10.104", 8301, "map")
// lxi.send(map, "*IDN?")
// console.log(lxi.receive(map))

var IL = 0;
var RL = 0;
var WL = 1310;
var lowest = 1000
var alive = true
var responseType

async function scpi(socket){
  while(alive){
  IL = Math.trunc(Math.random()*50)/100;
  RL = Math.trunc(Math.random()*20 + 50);
  responseType = "IL"
  socket.write(":FETCH:LOSS?\r\n")
  await Bun.sleep(10);
  responseType = "RL"
  socket.write(":FETCH:ORL?\r\n")
  await Bun.sleep(1000);
  //await new Promise(resolve => setTimeout(resolve, 100));
  }
}

const socket = Bun.connect({
  hostname: "localhost",
  port: 8301,

  socket: {
    data(socket, data) {
      let res = data.toString().trim()
      console.log(responseType, ": ", res)
      if (responseType == "IL") IL = res
      if (responseType == "RL") RL = res
    },
    open(socket) {console.log("open")
      alive = true
      socket.write("*REM\r\n")
      scpi(socket)
    },
    close(socket) {
      alive = false
      console.log("close")
      while (!alive) {
        console.log(socket.readyState)
        socket.reload()
        Bun.sleep(1000);
      }
    },
    drain(socket) {console.log("drain")},
    error(socket, error) {console.log("error")},

    // client-specific handlers
    connectError(socket, error) {console.log("con error")}, // connection failed
    end(socket) {console.log("end")}, // connection closed by server
    timeout(socket) {console.log("timeout")}, // connection timed out
  },
});



const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response(Bun.file("index.html"));
    if (url.pathname === "/keydown") {
      lowest = Math.min(lowest, IL)
      return new Response(`<div id="target">${lowest}</div>`);
    }
    if (url.pathname === "/keyup"){
      lowest = 1000
      return new Response(`<div id="target">---</div>`);
    } 
  },
});
