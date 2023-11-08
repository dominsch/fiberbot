import {InstrumentManager} from './InstrumentManager.js'
let configs = {
    "MAP104": ["192.168.10.169", 8100, "Viavi"]
}
// let configs = {
//     "MAP104": ["localhost", 8100, "Viavi"]
// }

let im = new InstrumentManager(configs)
await im.initialize()
await im.setMode("MAP104", 'idle')

let channels = [1,2,3,4,5,6,7,8,9,10,11,12]
console.log("results", await im.readChannelsLive("MAP104", channels))