import {makeLive, makeStatus, makeCellInner, makeCellInnerForm, makeRow, makeTable, makeSettingsForm, makeNavigationForm, makeAdvancedForm, makeCard, makeCompactCard, makeCellOuter} from './templates.js'
import {SantecInstrument, ViaviInstrument} from './instrument.js'
import {Session} from './session.js'
import {makeCSV} from './csv.js'

let config = (Bun.argv[2]?.match( /.*\.json/g )) ? await Bun.file(Bun.argv[2].match( /.*\.json/g )[0]).json() : ["Local", "localhost", 8100, "Viavi"]
let serverPort = (config[1] == "localhost") ? 7000 : 7000 + parseInt((config[1]?.match(/\d+$/g))[0])
let inst = (config[3] == "Santec") ? new SantecInstrument(...config) : new ViaviInstrument(...config)
await inst.connect()
inst.setMode("live")

let sess = new Session(config[0])

console.log("starting server at ", serverPort)
const server = Bun.serve({
    port: serverPort,
    fetch(req) {
        const url = new URL(req.url);
        
        const sp = Object.fromEntries(url.searchParams)
        if(url.pathname != "/live" && url.pathname != "/status") console.log("url", url.pathname, "params:", sp, url.searchParams)
        
        let d = sess.getActiveDUT()
        let res = ""

        switch(url.pathname) {
            case "/": return new Response(Bun.file("index.html"))
            case "/style.css": return new Response(Bun.file("style.css"))
            case "/digital.woff2": return new Response(Bun.file("media/subset-Digital-7Mono.woff2"))
            case "/status": return new Response(makeStatus(sess, inst, server.port), {headers: { "Access-Control-Allow-Origin": "*" }})
            case "/submit/setup":
                sess.configure(sp.firstSN, sp.lastSN, sp.numFibers, sp.base, sp.numEnds, sp.maxILA, sp.maxILB, sp.minRLA, sp.minRLB, sp.wl)
                sess.makeDUTs()
                inst.activeWL = sp.wl
                sess.startTime = new Date(Date.now())
                return new Response("", {headers: { "HX-Trigger": "update-cards" }})
            case "/submit/navigation":
                if (sp.advance == "channel") {
                    sess.autoAdvance = "passing"
                } else {
                    sess.autoAdvance = sp.advance
                }
                sess.switchAdvance = (sp.advance == "channel")
                if(sess.next != sp.type || sess.backwards != (sp.direction == "prev")){
                    sess.next = sp.type
                    sess.backwards = (sp.direction == "prev")
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, false)
                    switch(sess.next) {
                        case "end":
                            sess.nextEnd = sess.getNext(sess.currentEnd, sess.next)
                            break;
                        case "fiber":
                            sess.nextFiber = sess.getNext(sess.currentFiber, sess.next)
                            break;
                        case "dut":
                            sess.nextDUT = sess.getNext(sess.currentDUT, sess.next)
                    }
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, true)
                }
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
                let sn = sp.id.match(/(\d+)/g)[0]
                makeCSV([sess.getDUT(sn)], sess)
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
                if (sess.switchAdvance) {
                    let chan = sess.currentFiber%sess.base
                    if (chan == 0) chan = sess.base
                    inst.targetCH = chan
                }
                res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, true)
                res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, d.wavs[0], true, true)
                return new Response(res)
            case "/cap":
                if (sess.valid) {
                    if (sess.IL != -100 && sess.IL < Math.abs(d.IL[sess.currentEnd][sess.currentFiber][d.wavs[0]])) d.IL[sess.currentEnd][sess.currentFiber][d.wavs[0]] = Number.parseFloat(sess.IL).toFixed(2)
                    if (sess.RL != -100 && sess.RL > d.RL[sess.currentEnd][sess.currentFiber][d.wavs[0]]) d.RL[sess.currentEnd][sess.currentFiber][d.wavs[0]] = Math.trunc(parseFloat(sess.RL))
                }
                return new Response(makeRow(sess, d, sess.currentFiber, true))
            case "/capend":
                if ((d.IL[sess.currentEnd][sess.currentFiber][sess.currentWL] <= sess.maxIL[sess.currentEnd] && d.RL[sess.currentEnd][sess.currentFiber][sess.currentWL] >= sess.minRL[sess.currentEnd]) || sess.autoAdvance == "always") {
                    console.log("advancing")
                    res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, d.wavs[0], true, false, false)
                    if (sess.autoAdvance != "never") sess.advance()
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, d.wavs[0], true, false, true)
                    res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, d.wavs[0], true, true)
                    if (sess.switchAdvance) {
                        let chan = sess.currentFiber%sess.base
                        if (chan == 0) chan = sess.base
                        sess.valid = false
                        inst.targetCH = chan
                    }
                }
                return new Response(res)
            case "/tab":
                d = sess.getDUT(sp.sn)
                return new Response(makeTable(sess, d))
            case "/cellInnerForm":
                d = sess.getDUT(sp.sn)
                return new Response(makeCellInnerForm(d, sp.end, sp.fiber, sp.wl, sp.type))
            case "/live":
                return new Response(makeLive(sess, inst))
            default:
                console.error("wrong endpoint", url.pathname)
                
        }
    },
});




