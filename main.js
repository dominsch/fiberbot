import {makeLive, makeCellInner, makeCellInnerForm, makeRow, makeTable, makeSettingsForm, makeNavigationForm, makeAdvancedForm, makeCard, makeCompactCard, makeCellOuter} from './templates.js'
import {InstrumentManager} from './InstrumentManager.js'
import {Session} from './SessionManager.js'
import {makeCSV} from './csv.js'

let configs = {
    "MAP104": ["192.168.10.224", 8100, "Viavi"]
}
// let configs = {
//     "MAP104": ["localhost", 8301, "Viavi"]
// }
// let configs = {
//     "MAP104": ["192.168.10.105", 5025, "Santec"]
// }

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
        if(url.pathname != "/live") console.log("url", url.pathname, "params:", sp, url.searchParams)
        
        let d = sess.getActiveDUT()
        let res = ""
        
        switch(url.pathname) {
            case "/": return new Response(Bun.file("table.html"))
            case "/style.css": return new Response(Bun.file("style.css"))
            case "/digital.woff2": return new Response(Bun.file("media/subset-Digital-7Mono.woff2"))
            case "/submit/setup":
                sess.configure(sp.firstSN, sp.lastSN, sp.numFibers, sp.base, sp.numEnds, sp.maxILA, sp.maxILB, sp.minRLA, sp.minRLB, sp.wl)
                sess.makeDUTs()
                sess.startTime = new Date(Date.now())
                return new Response("", {headers: { "HX-Trigger": "update-cards" }})
            case "/submit/navigation":
                sess.next = sp.type
                sess.backwards = (sp.direction == "prev")
                sess.autoAdvance = (sp.advance == "on")
                res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, false)
                switch(sess.next) {
                    case "end":
                        sess.nextEnd = sess.getNext(sess.currentEnd, sess.next)
                        sess.nextDUT = sess.currentDUT
                        sess.nextFiber = sess.currentFiber
                        break;
                    case "fiber":
                        sess.nextFiber = sess.getNext(sess.currentFiber, sess.next)
                        sess.nextDUT = sess.currentDUT
                        sess.nextEnd = sess.currentEnd
                        break;
                    case "dut":
                        sess.nextDUT = sess.getNext(sess.currentDUT, sess.next)
                        sess.nextEnd = sess.currentEnd
                        sess.nextFiber = sess.currentFiber
                }
                res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, true)
                return new Response(res, {headers: { "HX-Trigger": "update-navigation" }})
            case "/submit/cellInnerForm":
                d =sess.getDUT(sp.sn)
                return new Response(makeCellInner(sess, d, sp.end, sp.fiber, sp.wl, sp.type, false, sp.value))
            case "/clear/row":
                d.clearFiber(d.focusFiber)
                return new Response(makeRow(sess, d, d.focusFiber, true));
            case "/clear/dut":
                d =sess.getDUT(sp.sn)
                d.clearAll()
                d.focusFiber = 1
                return new Response(makeCard(sess, d, true));
            case "/clear/all":
                sess.makeDUTs()
                for (let d of sess.DUTs) {
                    res = res + makeCard(sess, d, true)
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
                // if(sess.numFibers > 2) {
                    for (let dut of sess.DUTs) {
                        res += makeCard(sess, dut)
                    }
                // } else {
                //     res = makeCompactCard(sess.DUTs)
                // }
                return new Response(res)
            case "/settings/setup":
                return new Response(makeSettingsForm(sess))
            case "/settings/navigation":
                return new Response(makeNavigationForm(sess))
            case "/settings/advanced":
                return new Response(makeAdvancedForm(sess))
            case "/ping":
                return new Response("pong", { headers: { "HX-Trigger": "pong" }})

            case "/focus":
                sess.nextDUT = parseInt(sp.sn) - sess.firstSN
                sess.nextFiber = parseInt(sp.fiber)
                sess.nextEnd = parseInt(sp.end)
                sess.advance()
                res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, true)
                res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, d.wavs[0], true, true)
                return new Response(res)
            case "/cap":
                // if (sess.IL < Math.abs(d.IL[d.focusEnd][d.focusFiber][d.wavs[0]])) d.IL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.IL
                // if (sess.RL > d.RL[d.focusEnd][d.focusFiber][d.wavs[0]]) d.RL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.RL
                // return new Response(makeRow(d, d.focusFiber, true))
                if (sess.IL < Math.abs(d.IL[sess.currentEnd][sess.currentFiber][d.wavs[0]])) d.IL[sess.currentEnd][sess.currentFiber][d.wavs[0]] = sess.IL.toFixed(2)
                if (sess.RL > d.RL[sess.currentEnd][sess.currentFiber][d.wavs[0]]) d.RL[sess.currentEnd][sess.currentFiber][d.wavs[0]] = sess.RL.toFixed(1)
                console.log("makerow", sess.currentDUT, sess.currentEnd, d.sn, sess.currentFiber)
                return new Response(makeRow(sess, d, sess.currentFiber, true))
            case "/capend":
                if (d.IL[sess.currentEnd][sess.currentFiber][1550] <= sess.maxIL[sess.currentEnd] && d.RL[sess.currentEnd][sess.currentFiber][1550] >= sess.minRL[sess.currentEnd]) {
                    res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, d.wavs[0], true, false, false)
                    sess.advance()
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, true)
                    res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, d.wavs[0], true, true)
                } else {
                    console.log("no advance")
                }
                return new Response(res)
            case "/tab":
                d = sess.getDUT(sp.sn)
                return new Response(makeTable(sess, d))
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