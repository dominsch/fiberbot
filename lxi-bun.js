import { privateEncrypt } from "crypto"


class Instrument {
    constructor(name, address, port, commands) {
        this.name = name
        this.address = address
        this.port = port
        this.commands = commands
    }
    IL;
    RL;
    socket;
    connected;
    async connect() {
        try { 
            console.log("try")
            this.socket = await Bun.connect({hostname: this.address, port: this.port, socket: handlers})
            this.socket.data = {
                instrument: this,
                mode: "idle",
                respType: "",
                busy: false
            }
            console.log("suc")
            this.connected = true
        } catch (e) {
            console.log(e)            
        }
    }
    setMode(mode) {
        this.socket.data.mode = mode
        if (mode == "live") {
            this.socket.data.busy = true
            this.socket.data.respType = "IL"
            this.socket.write(this.socket.data.instrument.commands.il)
            this.socket.data.busy = false
        }
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
    async data(socket, buffer) {
        while (socket.data.busy == true) await Bun.sleep(100)
        socket.data.busy = true
        if (socket.data.mode == "live") {
            switch (socket.data.respType) {
                case "IL":
                    socket.data.instrument.IL = String.fromCharCode.apply(null, buffer)
                    socket.data.respType = "RL"
                    await socket.write(socket.data.instrument.commands.rl)
                    await Bun.sleep(100);
                    break
                case "RL":
                    socket.data.instrument.RL = String.fromCharCode.apply(null, buffer)
                    socket.data.respType = "IL"
                    await socket.write(socket.data.instrument.commands.il)
                    await Bun.sleep(100);
                    break 
            }
        }
        socket.data.busy = false
    },
    close(socket) {
        console.log("close")
        socket.data.instrument.connected = false
    }, // socket closed
    drain(socket) {console.log("drain")}, // socket ready for more data
    error(socket, error) {console.log("error")}, // error handler
  };
  
const commandsViavi =  {idn: "*IDN?\n",
                        il: ":FETCH:LOSS?\n",
                        rl: ":FETCH:ORL?\n"}
const commandsJGR =    {idn: "*IDN?\n",
                        il: "READ:IL:det1? 1550\n",
                        rl: "READ:RL? 1550\n"}

let dev_configs = [["maplocal", "localhost", 8301, commandsViavi],
                ["map104", "localhost", 8302, commandsViavi]] 




async function scpi(socket){
    var instruments = []
    dev_configs.forEach(async (element, index) => {
        try {
            instruments.push(new Instrument(...element))
            await instruments[index].connect()
            await instruments[index].setMode("live")
            console.log("connected")
        } catch (e) {
            console.error(e)
        }
    });
    while(true) {
        instruments.forEach(async (d) => {
            if(d.connected == false) {
                await d.connect()
                await d.setMode("live")
            }
            console.log(d.name, " il: ", d.IL, " rl: ", d.RL)
        })
        await Bun.sleep(200);
    }
  }

  scpi()