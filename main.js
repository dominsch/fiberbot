import {makeLive, makeStatus, makeCellInner, makeCellInnerForm, makeRow, makeTable, makeSettingsForm, makeNavigationForm, makeAdvancedForm, makeCard, makeCompactCard, makeCellOuter} from './templates.js'
import {SantecInstrument, ViaviInstrument} from './instrument.js'
import {Session} from './session.js'
import {makeCSV} from './csv.js'
import { $ } from "bun"

let ip = (process.arch == "x64") ? "127.0.0.1" : await $`ip addr show eth0 | grep "inet\\b" | awk '{print $2}' | cut -d/ -f1`?.text()


let config = await Bun.file(Bun.argv[2].match( /.*\.json/g )[0]).json()
//console.log("config = ", config)
let serverPort = (config.ip == "localhost") ? 7000 : 7000 + parseInt(config.ip.match( /\d+$/g )[0])
//console.log(config, config.port, serverPort)
let inst = (config.manufacturer == "Santec") ? new SantecInstrument(config) : new ViaviInstrument(config)

await inst.connect()
inst.setMode("live")

let sess = new Session(inst)

console.log("starting server at ", serverPort)
const server = Bun.serve({
    port: serverPort,
    fetch(req) {
        const url = new URL(req.url);
        
        let sp = Object.fromEntries(url.searchParams)
        if (url.searchParams.has("wls")) sp.wls = url.searchParams.getAll("wls")

        if(url.pathname != "/live" && url.pathname != "/status") console.log("url", url.pathname, "params:", sp)
        
        let d = sess.getActiveDUT()
        let res = ""

        switch(url.pathname) {
            case "/": return new Response(Bun.file("index.html"))
            case "/style.css": return new Response(Bun.file("style.css"))
            case "/digital.woff2": return new Response(Bun.file("media/subset-Digital-7Mono.woff2"))
            case "/status": return new Response(makeStatus(sess, ip, inst, server.port), {headers: { "Access-Control-Allow-Origin": "*" }})
            case "/submit/setup":
                sess.configure(sp.firstSN, sp.lastSN, sp.numFibers, sp.base, sp.numEnds, sp.maxILA, sp.maxILB, sp.minRLA, sp.minRLB, sp.wls)
                sess.makeDUTs()
                inst.targetWL = sp.wls[0]
                inst.orl.forEach((o) => {
                    if(o.wavelengths.includes(inst.activeWL)) {
                        inst.activeORL = o.address
                    }   
                });
                sess.valid = false
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
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, sess.nextWL, true, false, false)
                    switch(sess.next) {
                        case "end":
                            sess.nextEnd = sess.getNext(sess.currentEnd, sess.next)
                            break;
                        case "fiber":
                            sess.nextFiber = sess.getNext(sess.currentFiber, sess.next)
                            break;
                        case "wl":
                            sess.nextWL = sess.getNext(sess.currentWL, sess.next)
                            break;
                        case "dut":
                            sess.nextDUT = sess.getNext(sess.currentDUT, sess.next)
                    }
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, sess.nextWL, true, false, true)
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
                return new Response(makeSettingsForm(sess, inst))
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
                sess.nextWL = parseInt(sp.wl)
                sess.advance()
                if (sess.switchAdvance) {
                    let chan = sess.currentFiber%sess.base
                    if (chan == 0) chan = sess.base
                    inst.targetCH = chan
                }
                inst.targetWL = sess.currentWL
                res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, sess.nextWL, true, false, true)
                res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, sess.currentWL, true, true)
                return new Response(res)
            case "/cap":
                if (sess.valid) {
                    if (sess.IL != -100 && sess.IL < Math.abs(d.IL[sess.currentEnd][sess.currentFiber][sess.currentWL])) d.IL[sess.currentEnd][sess.currentFiber][sess.currentWL] = Number.parseFloat(sess.IL).toFixed(2)
                    if (sess.RL != -100 && sess.RL > d.RL[sess.currentEnd][sess.currentFiber][sess.currentWL]) d.RL[sess.currentEnd][sess.currentFiber][sess.currentWL] = Math.trunc(parseFloat(sess.RL))
                }
                return new Response(makeRow(sess, d, sess.currentFiber, true))
            case "/capend":
                if ((d.IL[sess.currentEnd][sess.currentFiber][sess.currentWL] <= sess.maxIL[sess.currentEnd] && d.RL[sess.currentEnd][sess.currentFiber][sess.currentWL] >= sess.minRL[sess.currentEnd]) || sess.autoAdvance == "always") {
                    console.log("advancing")
                    res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, sess.currentWL, true, false, false)
                    if (sess.autoAdvance != "never") sess.advance()
                    res += makeCellOuter(sess, sess.DUTs[sess.nextDUT], sess.nextEnd, sess.nextFiber, sess.currentWL, true, false, true)
                    res += makeCellOuter(sess, sess.DUTs[sess.currentDUT], sess.currentEnd, sess.currentFiber, sess.currentWL, true, true)
                    if (sess.switchAdvance) {
                        let chan = sess.currentFiber%sess.base
                        if (chan == 0) chan = sess.base
                        sess.valid = false
                        inst.targetCH = chan
                        inst.targetWL = sess.currentWL
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




