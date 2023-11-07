import {InstrumentManager} from './InstrumentManager.js'
let configs = {
    "MAP104": ["192.168.10.169", 8100, "Viavi"]
}

let im = new InstrumentManager(configs)
await im.initialize()

let channels = [1,2,3,4,5,6,7,8]
console.log(im.readChannels("MAP104", channels))