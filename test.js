import commands from "./commands.json"
//import device_configs from "./devices.json"
//import device_configs from "./test.json"
let device_configs = [ ["BUN1", "localhost", 8301, "Viavi", 1] ]
var devices = []

class Device {
    constructor(name, address, netport, flavour) {
        this.name = name
        this.address = address
        this.netport = netport
        this.commands = commands[flavour]
        this.IL = [-1]
        this.RL = [-1]
        this.SW = 1
        this.PORT
        this.connected = false
        this.mode = "idle"
        this.busy = 0
        this.isLocked = false
        this.socket;
        this.respType;
        this.lockqueue = [];
        this.error = "none"
    }
    connect() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("try to connect ", this.name)
                this.socket = await Bun.connect({hostname: this.address, port: this.netport, socket: handlers})
                this.socket.data = {
                    device: this
                }
                this.connected = true
                this.error = "none"
                if (this.unlock) this.unlock()
                resolve(true)
            }
            catch (e) {
                this.error = e
                reject(false)
            }
        })
    }
    getLock() {
        this.isLocked = this.busy > 0
        const lock = new Promise(resolve => {
            if (!this.isLocked) {
                resolve()
                return
            }
            this.lockqueue.push(resolve)
        })
        this.busy++
        const releaser = () => {
            const resolve = this.lockqueue.shift()
            this.busy--
            if (resolve) {
                resolve()
            }
        }
        return [lock, releaser]
    }
    async query(q, t) {
        if (this.busy > 5) this.error = "ERROR unresponsive"
        const [lock, unlock] = this.getLock()
        await lock
        this.respType = t
        this.socket.write(q)
        this.unlock = unlock
    }
    // async query(q) {
    //     if (this.busy > 5) this.error = "ERROR unresponsive"
    //     const [lock, unlock] = this.getLock()
    //     await lock
    //     this.respType = q
    //     this.socket.write(this.commands[q])
    //     this.unlock = unlock
    // }
    setMode(mode) {
        this.mode = mode
    }
    disconnect() {
        this.socket.end()
        this.connected = false
    }

}

class DUT {
    constructor(instrument, sn, ends, fibers, wavs, hasrl) {
      this.instrument = instrument
      this.sn = sn
      this.fibers = fibers
      this.ends = ends
      this.wavs = wavs
      this.hasrl = hasrl
      this.focus = 1
      this.IL = []
      this.RL = []
      this.clear()
    }
    clear() {
      for(let e = 1; e<=this.ends; e++) {
        this.IL[e] = []
        this.RL[e] = []
        for(let f = 1; f<=this.fibers; f++) {
          this.IL[e][f] = {}
          this.RL[e][f] = {}
          this.wavs.forEach(wl => {
            this.IL[e][f][wl] = -100
            this.RL[e][f][wl] = -100
          })
        }
      }
    }
    next() {
      (d.focus >= d.fibers) ? d.focus = 1 : d.focus++
    }
    prev() {
      (d.focus <= 1) ? d.focus = d.fibers : d.focus--
    }
  }

const handlers = {
    open(socket) {
        console.log("open")
    },
    data(socket, buffer) {
        let res = String.fromCharCode.apply(null, buffer).trim()
        switch (socket.data.device.respType) {
            case "IL":
                socket.data.device.IL[0] = res
                break
            case "RL":
                socket.data.device.RL[0] = res
                break 
        }
        // console.log(socket.data.device[socket.data.device.respType], socket.data.device.respType)
        // socket.data.device[socket.data.device.respType] = res
        socket.data.device.unlock()
    },
    close(socket) {
        console.log("close")
        socket.data.device.connected = false
    },
    drain(socket) {console.log("drain")},
    error(socket, error) {console.log("error")},
  };

async function scpi(socket){
    device_configs.forEach((element, index) => {
        if (index == 0) devices.push(new Device(...element))
        //devices.element[0] = new Device(...element)
    });
    while(true) {
        devices.forEach(async (d) => {
            //console.log(d)
            if(d.connected == false) {
                try {
                    console.log("try to connect", d.name)
                    let succ = await d.connect()
                    if (succ) console.log("connection successful")
                    await d.setMode("live")
                } catch (e) {
                    console.error(e)
                }
            } else {
                d.query(d.commands.il, "IL")
                d.query(d.commands.rl, "RL")
                // gil = parseFloat(d.IL)
                // grl = parseInt(d.RL)
                //console.log(d.name, " il: ", d.IL, " rl: ", d.RL, " busy ", d.busy, d.error)
            }

        })
        await Bun.sleep(400);
    }
}

scpi()

let d
let gil = -1
let grl = -1

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    //console.log(req)
    const url = new URL(req.url);
    console.log(url.pathname)
    if (url.pathname === "/") {
      d = new DUT(devices[0], Math.trunc(Math.random()*100000000),1,12,[1550],true)
      return new Response(Bun.file("table.html"));
    }
    if (url.pathname === "/setup") {
      d = new DUT(devices[0], Math.trunc(Math.random()*100000000),1,12,[1550],true)
      return new Response(Bun.file("table.html"));
    }
    if (url.pathname === "/instrument") {
      devices.forEach((d) => {
        if(d.name == "BUN1") console.log("found")
      })
      return new Response("Instrument: " + d.instrument.name);
    }
    if (url.pathname === "/clear") {
      d.clear()
      d.focus = 1
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/cap") {
      if (d.instrument.IL[0] < Math.abs(d.IL[1][d.focus][d.wavs[0]])) d.IL[1][d.focus][d.wavs[0]] = d.instrument.IL[0]
      if (d.instrument.RL[0] > d.RL[1][d.focus][d.wavs[0]]) d.RL[1][d.focus][d.wavs[0]] = d.instrument.RL[0]
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/capend") {
      d.next()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/next") {
      d.next()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/prev") {
      d.prev()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/live"){
      let res = makeLive(d)
      return new Response(res);
    } 
    if (url.pathname === "/tab"){
      let res = makeTable(d)
      return new Response(res);
    } 
    if (url.pathname === "/row"){
      let trigger = req.headers.get('hx-trigger')
      const { sn, row } = /^(?<sn>.+)-(?<row>\d+)$/.exec(trigger,).groups
      let res = makeRow(d, row,1)
      return new Response(res);
    } 
  },
});

function makeLive(d) {
  let wl = d.wavs[Math.trunc(Math.random()*d.wavs.length)]
  // gil = Math.trunc(Math.random()*50)/100
  // grl = Math.trunc(Math.random()*20 + 50)
  return `WL: ${wl} IL:${d.instrument.IL[0]} RL:${d.instrument.RL[0]}`
}

function makeTable(d) {
  let sn = d.sn
  let out =    `<thead>
                  <tr>
                    <td colspan = 10 id="P${sn}">P${sn}</td>
                  </tr>
                  <tr>
                    <th></th>`
  d.wavs.forEach(wl => {
    out = out + `<th${(d.hasrl) ? " colspan = 2" : ""}>${wl}</th>`
  })
  out = out +    `</tr>
                  <tr>
                    <th>Fiber</th>`
  d.wavs.forEach(wl => {
    out = out +    `<th>IL</th>\n${(d.hasrl) ? "<th>RL</th>\n" : ""}`
  })
  out = out +    `</tr>
                </thead>
                <tbody id="tbod">`
  out = out + makeTBody(d)
  out = out +  `</tbody>`
  return out
}

function makeTBody(d) {
  let n = d.fibers
  let out = ""
  for(let i = 1; i<=n; i++){
    out = out + makeRow(d, i, 1)
  }
  return out
}

function makeRow(d, f, n) {
  let sn = d.sn
  n = d.wavs.length
  //let out = `<tr class="${f}", id="${sn}-${f}" hx-post="/row" hx-trigger="click, sse:EventName, sse:event${f}" hx-swap="outerHTML">\n`
  // _="on click add .focused to next <tr/>"
  let out = `<tr class="r${(f==d.focus)? f + " focused" : f}", id="P${sn}-${f}" hx-post="/row" hx-trigger="click, keydown[key=='${f}'] from:body" hx-swap="outerHTML">\n`
  out = out + `<td>${f}</td>\n`
  for(let i = 1; i<=n; i++){
    out = out + makeCell(d, f, d.wavs[i-1], "IL")
    if (d.hasrl) {
      out = out + makeCell(d, f, d.wavs[i-1], "RL")
    }
  }
  out = out + `</tr>\n`
  return out
}

function makeCell(d, f ,wl, type) {
  let content = (type == "IL") ? d.IL[1][f][wl] : d.RL[1][f][wl]
  if (content == -100) content = ""
  return `<td id="${"P" + d.sn + "-A" + f + "-" + wl + "-" + type}">${content}</td>\n`
}