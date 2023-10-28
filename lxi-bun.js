import commands from "./commands.json"
import device_configs from "./devices.json"
// import device_configs from "./test.json"
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
        devices.push(new Device(...element))
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
                //console.log(d.name, " il: ", d.IL, " rl: ", d.RL, " busy ", d.busy, d.error)
            }

        })
        await Bun.sleep(1000);
    }
}

scpi()

const server = Bun.serve({
    port: 3000,
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") return new Response(Bun.file("index.html"));
        if (url.pathname === "/tb"){
            return new Response(makeTableBody())
        } 
    },
});

function makeTableBody() {
    let tb = ""
    for (let i = 0; i < devices.length; i++) {
        tb = tb + `<tr>\n<td>${devices[i].name}</td>\n` +
                        `<td>${devices[i].address}</td>\n` +
                        `<td>${devices[i].port}</td>\n` +
                        `<td>${devices[i].IL[0]}</td>\n` +
                        `<td>${devices[i].RL[0]}</td>\n` +
                        `<td>${devices[i].error}</td>\n</tr>\n`
    }
    //console.log(tb)
    return tb
}

// function makeVertTableBody() {
//     let tb = ""
//     for (let i = 0; i < devices.length; i++) {
//         tb = tb + `<tr>\n<td>${devices[i].name}</td>\n` +
//                         `<td>${devices[i].address}</td>\n` +
//                         `<td>${devices[i].port}</td>\n` +
//                         `<td>${devices[i].IL}</td>\n` +
//                         `<td>${devices[i].RL}</td>\n` +
//                         `<td>${devices[i].error}</td>\n</tr>\n`
//     }
//     //console.log(tb)
//     return tb
// }