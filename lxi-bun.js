import { privateEncrypt } from "crypto"


class Device {
    constructor(name, address, port) {
        this.name = name
        this.address = address
        this.port = port
        this.connected = false
    }
    IL;
    RL;
    socket;
    connect() {
        try { 
            this.socket = Bun.connect(this.address, this.port)
            this.connected = true
        } catch (e) {
            console.error(e)
        }
    }
    async query(q) {
        this.socket.write(d.id, q)
        return lxi.receive(d.id)
    }
    disconnect() {
        this.socket.end()
        this.connected = false
    }

}
//console.log(lxi)
// try {
//     lxi.init()
//     let d = new Device("map104", "192.168.10.104", 8301)
//     d.connect()
//     lxi.send(d.id, "*IDN?")
//     console.log(lxi.receive(d.id))
//     d.disconnect()
// } catch (e) {
//     console.log(e)
// }

async function query(d, q) {
    lxi.send(d.id, q)
    return lxi.receive(d.id)
}


async function scpi(socket){
    let myres = ""
    try {
        lxi.init()
        let d = new Device("map104", "192.168.10.104", 8301)
    } catch (e) {
        console.error(e)
    }
    console.log(d.connected)
    while(true) {
        query(d, "*IDN?").then((res) => {
            myres = res
        })
        console.log(myres)
        await Bun.sleep(100);
    }
  }