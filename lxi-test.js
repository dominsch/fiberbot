import { privateEncrypt } from "crypto"
import * as lxi from "./lxi.js"

class Device {
    constructor(name, address, port) {
        this.name = name
        this.address = address
        this.port = port
        this.connected = false
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

async function query(d, q) {
    try {
        lxi.send(d.id, q)
        let res = lxi.receive(d.id)
        return res
    } catch (e) {
        console.error(e)
    }
}

let dev_conf = [["maplocal", "localhost", 8301],
            ["map104", "localhost", 8302]] 
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
    console.log("2")
    while(true) {
        devices.forEach((d) => {
            console.log(d.connected)
            if (d.connected) {
                query(d, "*IDN?").then((res) => {
                    d.name = res
                })
                query(d, ":FETCH:LOSS?").then((res) => {
                    d.IL = res
                })
                query(d, ":FETCH:ORL?").then((res) => {
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

  scpi()