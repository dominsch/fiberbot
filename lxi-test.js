import { privateEncrypt } from "crypto"
import * as lxi from "./lxi.js"

class Device {
    constructor(name, address, port, commands) {
        this.name = name
        this.address = address
        this.port = port
        this.connected = false
        this.waiting = false
        this.commandIL = commands.il
        this.commandRL = commands.rl
        this.commandIDN = commands.idn
    }
    IL;
    RL;
    connect() {
        try { 
            this.id = lxi.connect(this.address, this.port, this.name)
            this.connected = true
        } catch (e) {
            console.error(e)
        }
    }
    disconnect() {
        lxi.disconnect(this.id)
        this.connected = false
    }

}

const commandsViavi = {idn: "*IDN?\n",
                 il: ":FETCH:LOSS?\n",
                 rl: ":FETCH:ORL?\n"}
const commandsJGR = {idn: "*IDN?\n",
               il: "READ:IL:det1? 1550\n",
               rl: "READ:RL? 1550\n"}

// let dev_conf = [["map169", "192.168.10.169", 8301, commandsViavi],
//                 ["map104", "192.168.10.104", 8301, commandsViavi],
//                 ["jgr11", "192.168.10.11", 5025, commandsJGR]] 

let dev_conf = [["maplocal", "localhost", 8301, commandsViavi],
                ["map104", "localhost", 8302, commandsViavi]] 

var devices = []






async function scpi(socket) {
    lxi.init()
    dev_conf.forEach((element, index) => {
        console.log(element, index)
        try {
            devices.push(new Device(...element))
            console.log(devices[index])
            console.log("try to connect")
            devices[index].connect()
            console.log("connected")
        } catch (e) {
            console.error(e)
        }
    });
    while(true) {
        devices.forEach((d) => {
            console.log(d.connected)
            if (d.connected) {
                query(d, d.commandIDN).then((res) => {
                    d.name = res
                })
                query(d, d.commandIL).then((res) => {
                    d.IL = res
                })
                query(d, d.commandRL).then((res) => {
                    d.RL = res
                })
                console.log(d.name)
                console.log(d.IL)
                console.log(d.RL)
            } else {
                d.connect()
            }
        })
        
        await Bun.sleep(1000);
    }
}

async function query(d, q) {
    try {
        lxi.send(d.id, q)
        let res = lxi.receive(d.id)
        return res
    } catch (e) {
        console.error(e)
    }
}

scpi()