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
    setChannel(channel) {
        this.instruments[instrument].setChannel(channel)
    }
    readChannels(instrument, channels) {
        return this.instruments[instrument].readChannels(channels)
    }
    readChannelsLive(instrument, channels) {
        return this.instruments[instrument].readChannelsLive(channels)
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
            console.log("try to connect ", this.name, this.address, this.netport)
            try {
                this.socket = await Bun.connect({
                    hostname: this.address,
                    port: this.netport,
                    data: {instrument: this},
                    socket: {
                        open(socket) {
                            console.log("open")
                            socket.data.instrument.connected = true
                            socket.data.buffer = ""
                            
                        },
                        data(socket, buffer) {
                            socket.data.buffer += String.fromCharCode.apply(null, buffer).trim()
                            // console.log("data in: ", res)
                            let res = socket.data.buffer.split(",")
                            if (res.length >= socket.data.rsps-1) {
                                console.log("res: ", res.length, socket.data.rsps, res, typeof(res))
                                socket.data.resolver(res)
                                socket.data.buffer = ""
                            }
                            
                        },
                        close(socket) {
                            console.log("close")
                            socket.data.rejector("disconnect")
                            socket.data.instrument.connected = false
                        },
                        drain(socket) {console.log("drain")},
                        error(socket, error) {console.log("socket error:", error)}
                    }
                })
            } catch(e) {
                console.error("connect error", e)
            }
            await Bun.sleep(2000)
            if(!this.connected) await Bun.sleep(2000)
        }
    }
    async disconnect() {
        console.log(this.name, "disconnect")
        if (this.socket.data.rejector) this.socket.data.rejector("disconnect")
        this.socket.end()
        this.connected = false
        await this.connect()
    }
    async query(q, rsps = 1) {
        // console.log("data out: from ", this.name, " query: ", q)
        this.socket.data.rsps = rsps
        let written = this.socket.write(q+'\n')
        // console.log(written)
        let tries = 1
        while (written < 1) {
            if (tries > 5) {
                this.disconnect()
                
            }
            console.error("writing error")
            await Bun.sleep(200)
            console.error("retry")
            written = this.socket.write(q+'\n')
            tries++
        }
        return new Promise((resolve, reject) => {
            const resolver = (val) => {
                clearTimeout(timeoutId)
                resolve(val)
            }
            let timeoutId = setTimeout((e) => {
                    console.error("rejecting ", q)
                    reject(e)
            }, 2000, `ERROR:  got no response`);
            this.socket.data.resolver = resolver
            this.socket.data.rejector = reject
        });
    }
    setMode(mode) {
        console.log("changing mode to ", mode)
        this.mode = mode
        switch(mode){
            case "live": this.startLive(); break;
            case "continuous": this.startContinuous(); break;
            default: this.mode = "idle"; break;
        }
    }
}

class ViaviInstrument extends Instrument {
    constructor(name, address, netport) {
        super(name, address, netport);
    }
    async startLive(){
        while(this.mode == "live") {
            let idn = await this.query("*IDN?",4)
            console.log("name ", idn[0])
            try{
                this.IL = await this.query(":FETCH:LOSS? 1,1")
                this.RL = await this.query(":FETCH:ORL? 1,1")
            } catch(e){
                console.error("live error", e)
                this.disconnect()
            }
            await Bun.sleep(500)
        }
    }
    async switchChannel(c) {
        res = await this.query(`:PATH:CHAN 1,1,1,${c};:PATH:CHAN? 1,1,1`)
        if(res != c) {
            console.error("Channel Change Failed")
            return false
        }
        return true
    }
    async readChannels(channels) {
        let ILs = []
        let RLs = []
        for (chan of channels) {
            await this.switchChannel(chan)
            IL[chan] = await this.query(":MEAS:IL? 1,1")
            RL[chan] = await this.query(":MEAS:ORL? 1,1")
        }
        return [ILs, RLs]
    }
    async readChannelsLive(channels) {
        let ILs = []
        let RLs = []
        for (chan of channels) {
            await this.switchChannel(chan)
            IL[chan] = await this.query(":FETCH:LOSS? 1,1")
            RL[chan] = await this.query(":FETCH:ORL? 1,1")
        }
        return [ILs, RLs]
    }
    

}

class SantecInstrument extends Instrument {
    constructor(name, address, netport) {
        super(name, address, netport);
    }
    async startLive(){
        let idn = (await this.query("*IDN?",4))[0]
        console.log("name ", idn)
        while(this.mode == "live") {
            try{
                this.IL = await this.query("READ:IL:DET1? " + 1550)
                this.RL = (await this.query("READ:RL? " + 1550, 4))[0]
            } catch(e){
                console.error("live error", e)
                this.disconnect()
            }
            await Bun.sleep(800)
        }
    }
    async switchChannel(c) {
        res = await this.query(`SW1:CLOSE ${c};*OPC?`)
        console.log("channel switch success? ", res)
    }
}