import {makeLive, makeCell, makeRow, makeTable, makeTBody} from './ui.js'
import {InstrumentManager} from './InstrumentManager.js'

let configs = {
    "BUN1": ["localhost", 8301, "Viavi"]
}

let im = new InstrumentManager(configs)
await im.initialize()

let val = im.getValue("BUN1", "IL")
console.log("ret: ", val)
await Bun.sleep(2000)
val = im.getValue("BUN1", "IL")
console.log("ret: ", val)
// await Bun.sleep(2000)
// im.setMode("BUN1", "idle")
// await Bun.sleep(2000)
// im.setMode("BUN1", "live")
// await Bun.sleep(2000)
// im.setMode("BUN1", "idle")
// await Bun.sleep(2000)
// im.setMode("BUN1", "live")
// await Bun.sleep(2000)
// im.setMode("BUN1", "idle")
// await Bun.sleep(2000)
// im.setMode("BUN1", "live")
// await Bun.sleep(2000)
// im.setMode("BUN1", "idle")
// await Bun.sleep(2000)
// im.setMode("BUN1", "live")