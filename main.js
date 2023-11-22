import {makeLive, makeCellInner, makeCellInnerForm, makeRow, makeTable, makeSettingsForm, makeNavigationForm, makeCard, makeCompactCard, makeCellOuter} from './templates.js'
import {InstrumentManager} from './InstrumentManager.js'
import {Session} from './SessionManager.js'
import {makeCSV} from './csv.js'

// let configs = {
//     "MAP104": ["192.168.10.104", 8301, "Viavi"]
// }
let configs = {
    "MAP104": ["localhost", 8301, "Viavi"]
}

let im = new InstrumentManager(configs)
await im.initialize()

let sess = new Session("MAP104")


const server = Bun.serve({
    port: 3000,
    fetch(req) {
        const url = new URL(req.url);
        // const [_, base, endpoint] = url.pathname.split("/")
        // console.log(base, endpoint)
        
        const sp = Object.fromEntries(url.searchParams)
        console.log("url", url.pathname, "params:", sp, url.searchParams)
        let d = sess.getActiveDUT()
        let res = ""
        
        switch(url.pathname) {
            case "/": return new Response(Bun.file("table.html"))
            case "/style.css": return new Response(Bun.file("style.css"))
            case "/digital.woff2": return new Response(Bun.file("media/subset-Digital-7Mono.woff2"))
            case "/submit/settings":
                sess.configure(sp.firstSN, sp.lastSN, sp.numFibers, sp.base, sp.numEnds, sp.maxIL, sp.minRL, sp.wl)
                sess.makeDUTs()
                sess.startTime = new Date(Date.now())
                return new Response("", {headers: { "HX-Trigger": "update-cards" }})
            case "/submit/cellInnerForm":
                d =sess.getDUT(sp.sn)
                return new Response(makeCellInner(d, sp.end, sp.fiber, sp.wl, sp.type, false, sp.value))
            case "/clear/row":
                d.clearFiber(d.focusFiber)
                return new Response(makeRow(d, d.focusFiber, true));
            case "/clear/dut":
                d =sess.getDUT(sp.sn)
                d.clearAll()
                d.focusFiber = 1
                return new Response(makeCard(d, true));
            case "/clear/all":
                sess.makeDUTs()
                for (let d of sess.DUTs) {
                    res = res + makeCard(d, true)
                }
                return new Response(res)
            case "/flush/dut":
                // let sn = sp.id.match(/(\d+)/g)[0]
                makeCSV([sess.getDUT(sp.sn)], sess)
                return new Response("")
            case "/flush/all":
                makeCSV(sess.DUTs, sess)
                return new Response("")
            case "/cards":
                if(sess.numFibers > 2) {
                    for (let dut of sess.DUTs) {
                        res += makeCard(dut)
                    }
                } else {
                    res = makeCompactCard(sess.DUTs)
                }
                return new Response(res)
            case "/settings":
                return new Response(makeSettingsForm(sess))
            case "/navigation":
                return new Response(makeNavigationForm(sess))
            case "/ping":
                return new Response("pong", { headers: { "HX-Trigger": "pong" }})
            case "/cap":
                if (sess.IL < Math.abs(d.IL[d.focusEnd][d.focusFiber][d.wavs[0]])) d.IL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.IL
                if (sess.RL > d.RL[d.focusEnd][d.focusFiber][d.wavs[0]]) d.RL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.RL
                return new Response(makeRow(d, d.focusFiber, true))
            case "/capend":
                if(sess.numFibers > 2) {
                    let prevf = d.focusFiber
                    if (!d.next()) {
                        res = makeCard(sess.DUTs[sess.activeDUT], true, false)
                        sess.nextDUT()
                        res = res + makeCard(sess.DUTs[sess.activeDUT], true)
                        return new Response(res)
                    }
                    res = makeRow(d, prevf, true) + makeRow(d, d.focusFiber, true)
                    return new Response(res)
                }
                return new Response(makeCellOuter(d, d.focusEnd, d.focusFiber, d.wavs[0], true))
            case "/tab":
                d = sess.getDUT(sp.sn)
                return new Response(makeTable(d))
            case "/cellInnerForm":
                d = sess.getDUT(sp.sn)
                return new Response(makeCellInnerForm(d, sp.end, sp.fiber, sp.wl, sp.type))
            case "/live":
                return new Response(makeLive(sess, im))
            default:
                console.error("wrong endpoint", url.pathname)
                
        }
    },
});

function focus() {
    
}




// if (url.pathname === "/next") {
//     let d = sess.getActiveDUT()
//     console.log("next #1", d.numEnds, d.focusEnd, d.numFibers, d.focusFiber)
//     let prevf = d.focusFiber
//     d.next()
//     let res = makeRow(d, prevf, true) + makeRow(d, d.focusFiber, true)
//     console.log("next #2", d.numEnds, d.focusEnd, d.numFibers, d.focusFiber)
//     return new Response(res)
// }
// if (url.pathname === "/nextDUT") {
//     let res = makeCard(sess.DUTs[sess.activeDUT], true, false)
//     sess.nextDUT()
//     res = res + makeCard(sess.DUTs[sess.activeDUT], true)
//     return new Response(res)
// }
// if (url.pathname === "/prev") {
//     let d = sess.getActiveDUT()
//     let prevf = d.focusFiber
//     d.prev()
//     let res = makeRow(d, prevf, true) + makeRow(d, d.focusFiber, true)
//     return new Response(res);
// }
// if (url.pathname === "/prevDUT") {
//     let res = makeCard(sess.DUTs[sess.activeDUT], true, false)
//     sess.prevDUT()
//     res = res + makeCard(sess.DUTs[sess.activeDUT], true)
//     return new Response(res)
// }