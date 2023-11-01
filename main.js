import {makeLive, makeCell, makeCellForm, makeRow, makeTable, makeForm, makeCard} from './templates.js'
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
        //console.log(req)
        const url = new URL(req.url);
        console.log(url.pathname, url.searchParams)
        let sn = parseInt(url.searchParams.get('sn'))
        let end = parseInt(url.searchParams.get('end'))
        let row = parseInt(url.searchParams.get('fiber'))
        let wl = parseInt(url.searchParams.get('wl'))
        let type = url.searchParams.get('type')
        let val = url.searchParams.get('content')

        if (url.pathname === "/") return new Response(Bun.file("table.html"));
        if (url.pathname === "/style.css") return new Response(Bun.file("style.css"));
        if (url.pathname === "/form") {
            let firstSN = parseInt(url.searchParams.get('firstSN'))
            let lastSN = parseInt(url.searchParams.get('lastSN'))
            let numFibers = parseInt(url.searchParams.get('numFibers'))
            let base = parseInt(url.searchParams.get('base'))
            let numEnds = parseInt(url.searchParams.get('numEnds'))
            let wl = parseInt(url.searchParams.get('wl'))
            let maxIL = parseFloat(url.searchParams.get('maxIL'))
            let minRL = parseInt(url.searchParams.get('minRL'))
            sess.configure(firstSN, lastSN, numFibers, base, numEnds, maxIL, minRL, wl)
            sess.makeDUTs()
            let res = ""
            for (let dut of sess.DUTs) {
                res = res + makeCard(dut)
            }
            return new Response(res)
        }
        if (url.pathname === "/settings") {
            return new Response(makeForm(sess))
        }
        if (url.pathname === "/clear") {
            let scope = url.searchParams.get('scope')
            let d = sess.getActiveDUT()
            console.log(scope)
            switch (scope) {
                case "row":
                    d.clearFiber(d.focusFiber)
                    return new Response(makeRow(d, d.focusFiber, true));
                case "dut":
                    d.clearAll()
                    d.focusFiber = 1
                    return new Response(makeCard(d, true));
                case "all":
                    sess.getActiveDUT().focus = 1
                    sess.getActiveDUT().isActive = false
                    sess.activeDUT = 0
                    sess.getActiveDUT().focus = 1
                    sess.getActiveDUT().isActive = true
                    let res = ""
                    for (let d of sess.DUTs) {
                        d.clearAll()
                        res = res + makeCard(d, true)
                    }
                    return new Response(res)
            }
        }
        if (url.pathname === "/ping") {
            makeCSV(sess.DUTs)
            return new Response("pong", {
                headers: { "HX-Trigger": "pong" }
            })
        }
        if (url.pathname === "/cap") {
            let d = sess.getActiveDUT()
            if (sess.IL < Math.abs(d.IL[d.focusEnd][d.focusFiber][d.wavs[0]])) d.IL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.IL
            if (sess.RL > d.RL[d.focusEnd][d.focusFiber][d.wavs[0]]) d.RL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.RL
            return new Response(makeRow(d, d.focusFiber, true))
        }
        if (url.pathname === "/capend") {
            let d = sess.getActiveDUT()
            let prevf = d.focusFiber
            if (!d.next()) {
                let res = makeCard(sess.DUTs[sess.activeDUT], true, false)
                sess.nextDUT()
                res = res + makeCard(sess.DUTs[sess.activeDUT], true)
                return new Response(res)
            }
            let res = makeRow(d, prevf, true) + makeRow(d, d.focusFiber, true)
            return new Response(res)
        }
        if (url.pathname === "/next") {
            let d = sess.getActiveDUT()
            console.log("next #1", d.ends, d.focusEnd, d.fibers, d.focusFiber)
            let prevf = d.focusFiber
            d.next()
            let res = makeRow(d, prevf, true) + makeRow(d, d.focusFiber, true)
            console.log("next #2", d.ends, d.focusEnd, d.fibers, d.focusFiber)
            return new Response(res)
        }
        if (url.pathname === "/nextDUT") {
            let res = makeCard(sess.DUTs[sess.activeDUT], true, false)
            sess.nextDUT()
            res = res + makeCard(sess.DUTs[sess.activeDUT], true)
            return new Response(res)
        }
        if (url.pathname === "/prev") {
            let d = sess.getActiveDUT()
            let prevf = d.focusFiber
            d.prev()
            let res = makeRow(d, prevf, true) + makeRow(d, d.focusFiber, true)
            return new Response(res);
        }
        if (url.pathname === "/prevDUT") {
            let res = makeCard(sess.DUTs[sess.activeDUT], true, false)
            sess.prevDUT()
            res = res + makeCard(sess.DUTs[sess.activeDUT], true)
            return new Response(res)
        }
        if (url.pathname === "/live") {
            return new Response(makeLive(sess, im));
        }
        if (url.pathname === "/tab") {
            let d = sess.getDUT(url.searchParams.get('sn'))
            return new Response(makeTable(d));
        }
        if (url.pathname === "/row") {
            let d = sess.getDUT(url.searchParams.get('sn'))
            return new Response(makeRow(d, row, true));
        }
        if (url.pathname === "/cell") {
            if (val != null && val != "" && val) console.log("old val", val)
            let type = url.searchParams.get('type')
            return new Response(makeCell(d, end, row, wl, type, val));
        }
        if (url.pathname === "/cellForm") {
            return new Response(makeCellForm(end, row, wl, type))
        }
        if (url.pathname === "/cellSubmit") {
            let d =sess.getDUT(sn)
            return new Response(makeCell(d, end, row, wl, type, true, val))
        }
    },
});

