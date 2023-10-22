export class InstrumentManager {
    constructor(configs) {
        this.instruments = {}
        for (const [name, params] of Object.entries(configs)) {
            switch(params[2]){
                case "Viavi": 
                    this.instruments[name] = new ViaviInstrument(name, ...params)
                    break;
                case "Santec": 
                    this.instruments[name] = new SantecInstrument(name, ...params)
                    break;
            }
        }
    }
    async initialize() {
        for (const name in this.instruments) {
            await this.instruments[name].connect()
            await this.instruments[name].setMode("live")
        }
    }
    getValue(instrument, value){
        let inst = this.instruments[instrument]
        return inst[value]
    }
    setMode(instrument, mode) {
        this.instruments[instrument].setMode(mode)
    }
}

class Instrument {
    constructor(name, address, netport) {
        this.name = name
        this.address = address
        this.netport = netport
        this.connected = false
        this.activeWL = []
        this.IL = -100
        this.RL = -100
    }
    async connect() {
        while(!this.connected) {
            console.log("try to connect ", this.name)
            this.socket = await Bun.connect({
                hostname: this.address,
                port: this.netport,
                socket: {
                    open(socket) {
                        console.log("open")
                        this.connected = true
                    },
                    data(socket, buffer) {
                        let res = String.fromCharCode.apply(null, buffer).trim()
                        console.log("data in: ", res)
                        socket.data.resolver(res)
                    },
                    close(socket) {
                        console.log("close")
                        this.connected = false
                    },
                    drain(socket) {console.log("drain")},
                    error(socket, error) {console.log("socket error:", error)}
                }
            })
            if(!this.connected) await Bun.sleep(1000)
        }
        // return new Promise(async (resolve, reject) => {
        //     try {
        //         console.log("try to connect ", this.name)
        //         this.socket = await Bun.connect({
        //             hostname: this.address,
        //             port: this.netport,
        //             socket: {
        //                 open(socket) {console.log("open")},
        //                 data(socket, buffer) {
        //                     let res = String.fromCharCode.apply(null, buffer).trim()
        //                     console.log("data in: ", res)
        //                     socket.data.resolver(res)
        //                 },
        //                 close(socket) {
        //                     console.log("close")
        //                     this.connected = false
        //                 },
        //                 drain(socket) {console.log("drain")},
        //                 error(socket, error) {console.log("socket error:", error)}
        //             }
        //         })
        //         this.socket.data = {}
        //         this.connected = true
        //         if (this.unlock) this.unlock()
        //         resolve(true)
        //     }
        //     catch (e) {
        //         console.error("im connect error", e)
        //         reject(false)
        //     }
        // })
    }
    async disconnect() {
        console.log(this.name, "disconnect")
        try {this.socket.data.resolver("cleanup")} catch {}
        this.socket.end()
        this.connected = false
        await this.connect()
    }
    getLock() {
    }
    async query(q, num) {
        console.log("data out: from ", this.name, " query: ", q)
        let written = this.socket.write(q)
        let tries = 1
        while (written < 1) {
            if (tries > 5) {
                this.disconnect()
                
            }
            console.error("writing error")
            await Bun.sleep(200)
            console.error("retry")
            written = this.socket.write(q)
            tries++
        }
        return new Promise((resolve, reject) => {
            let timeoutId = setTimeout((e) => {
                
                if (this.connected) {
                    console.error("rejecting #", num, q)
                    reject(e)
                }
            }, 5000, `ERROR: #${num} ${q} got no response`);
            this.socket.data.resolver = (val) => {
                console.log("CLEAR #", num, q, val, timeoutId)
                clearTimeout(timeoutId)
                resolve(val)
            }
        });
    }
    setMode(mode) {
        console.log("changing mode to ", mode)
        this.mode = mode
        switch(mode){
            case "live": this.startLive() 
        }
    }
}

class ViaviInstrument extends Instrument {
    constructor(name, address, netport) {
        super(name, address, netport);
    }
    async startLive(){
        let i = 0
        while(this.mode == "live") {
            
            try{
                this.IL = await this.query(":FETCH:LOSS?", i)
                i++
                this.RL = await this.query(":FETCH:ORL?", i)
                i++
                console.log(`mode: ${this.mode}, IL: ${this.IL}, RL: ${this.RL}`)
            } catch(e){
                console.error("live error", e)
                this.disconnect()
            }
        }
    }
}

class SantecInstrument extends Instrument {
    constructor(name, address, netport) {
        super(name, address, netport);
    }
}



// async function scpi(socket){
//     device_configs.forEach((element, index) => {
//         if (index == 0) devices.push(new Instrument(...element))
//         //devices.element[0] = new Device(...element)
//     });
//     while(true) {
//         devices.forEach(async (d) => {
//             //console.log(d)
//             if(d.connected == false) {
//                 try {
//                     console.log("try to connect", d.name)
//                     let succ = await d.connect()
//                     if (succ) console.log("connection successful")
//                     await d.setMode("live")
//                 } catch (e) {
//                     console.error(e)
//                 }
//             } else {
//                 d.query(d.commands.il, "IL")
//                 d.query(d.commands.rl, "RL")
//                 // gil = parseFloat(d.IL)
//                 // grl = parseInt(d.RL)
//                 //console.log(d.name, " il: ", d.IL, " rl: ", d.RL, " busy ", d.busy, d.error)
//             }

//         })
//         await Bun.sleep(400);
//     }
// }

// scpi()