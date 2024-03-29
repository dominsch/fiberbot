import {makeCSV} from './csv.js'

class Session {
    constructor() {
        //this.instrument =
        this.activeDUT = 0
        this.activeRow = 1
        this.activeEnd = 1
        this.numEnds = 1
        this.maxIL = 0.4
        this.minRL = 55
        this.WL = 1550
        this.IL = -100
        this.RL = -100
    }
    configure(firstSN, lastSN, numFibers, numEnds, maxIL, minRL) {
        this.firstSN = firstSN
        this.lastSN = lastSN
        this.numFibers = numFibers
        this.numEnds = numEnds
        this.maxIL = maxIL
        this.minRL = minRL
        this.base = 12
    }
    makeDUTs() {
        this.DUTs = []
        for (let i = 0; i <= this.lastSN - this.firstSN; i++) {
            this.DUTs[i] = new DUT(this.firstSN + i, this.numEnds, this.numFibers, [1550], true, 1, (i == 0))
        }
    }
    getDUT(sn) {
        for (let dut of this.DUTs) {
            if (dut.sn == sn) return dut
        }
    }
    getActiveDUT() {
        return this.DUTs[this.activeDUT]
    }
    nextDUT() {
        if (this.activeDUT < this.DUTs.length - 1) {
            this.getActiveDUT().isActive = false
            this.activeDUT++
            this.getActiveDUT().isActive = true
        }
    }
    prevDUT() {
        if (this.activeDUT > 0) {
            this.getActiveDUT().isActive = false
            this.activeDUT--
            this.getActiveDUT().isActive = true
        }
    }
}

class DUT {
    constructor(sn, ends, fibers, wavs, hasrl, focus, isActive) {
        this.sn = sn
        this.fibers = fibers
        this.ends = ends
        this.wavs = wavs
        this.hasrl = hasrl
        this.focusFiber = focus
        this.focusEnd = 1
        this.isActive = isActive
        this.IL = []
        this.RL = []
        this.clearAll()
    }
    clearAll() {
        for (let e = 1; e <= this.ends; e++) {
            this.clearEnd(e)
        }
    }
    clearEnd(e) {
        this.IL[e] = []
        this.RL[e] = []
        for (let f = 1; f <= this.fibers; f++) {
            this.clearFiber(f, e)
        }
    }
    clearFiber(f, e = 1) {
        this.IL[e][f] = {}
        this.RL[e][f] = {}
        this.wavs.forEach(wl => {
            this.IL[e][f][wl] = -100
            this.RL[e][f][wl] = -100
        })
    }
    next() {
        if (this.focusEnd == this.ends) {
           if (this.focusFiber >= this.fibers) {
                this.focusFiber = 1
                return false
            }
            else {
                this.focusFiber++
                if (this.focusEnd > 1) this.focusEnd--
                return true
            } 
        } else {
            this.focusEnd++
            return true
        }
    }
    prev() {
        if (this.focusEnd == 1) {
            if (this.focusFiber <= 1) {
                this.focusFiber = this.fibers
                return false
            }
            else {
                this.focusFiber--
                if (this.ends > 1) this.focusEnd++
                return true
            }
        } else {
            this.focusEnd--
            return true
        }
    }
}

//let duts = []//= new DUT(Math.trunc(Math.random()*100000000),1,12,[1550],true)
let il
let rl

let sess = new Session()

const server = Bun.serve({
    port: 3000,
    fetch(req) {
        //console.log(req)
        const url = new URL(req.url);
        console.log(url.pathname, url.searchParams)
        if (url.pathname === "/") return new Response(Bun.file("table.html"));
        if (url.pathname === "/style.css") return new Response(Bun.file("style.css"));
        if (url.pathname === "/form") {
            let firstSN = parseInt(url.searchParams.get('firstSN'))
            let lastSN = parseInt(url.searchParams.get('lastSN'))
            let numFibers = parseInt(url.searchParams.get('numFibers'))
            let numEnds = parseInt(url.searchParams.get('numEnds'))
            let maxIL = parseFloat(url.searchParams.get('maxIL'))
            let minRL = parseInt(url.searchParams.get('minRL'))
            sess.configure(firstSN, lastSN, numFibers, numEnds, maxIL, minRL)
            sess.makeDUTs()
            let res = ""
            for (let dut of sess.DUTs) {
                res = res + makeCard(dut)
            }
            return new Response(res)
        }
        if (url.pathname === "/settings") {
            return new Response(makeForm())
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
            if (il < Math.abs(d.IL[d.focusEnd][d.focusFiber][d.wavs[0]])) d.IL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.IL
            if (rl > d.RL[d.focusEnd][d.focusFiber][d.wavs[0]]) d.RL[d.focusEnd][d.focusFiber][d.wavs[0]] = sess.RL
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
            let d = sess.getDUT(url.searchParams.get('sn'))
            return new Response(makeLive(d));
        }
        if (url.pathname === "/tab") {
            let d = sess.getDUT(url.searchParams.get('sn'))
            let res = makeTable(d)
            return new Response(res);
        }
        if (url.pathname === "/row") {
            let sn = parseInt(url.searchParams.get('sn'))
            let row = parseInt(url.searchParams.get('fiber'))
            let d = sess.getDUT(url.searchParams.get('sn'))
            return new Response(makeRow(d, row, true));
        }
        if (url.pathname === "/cell") {
            let d = sess.getActiveDUT()
            let end = parseInt(url.searchParams.get('end'))
            let row = parseInt(url.searchParams.get('fiber'))
            let wl = parseInt(url.searchParams.get('wl'))
            let val = url.searchParams.get('content')
            if (val != null && val != "" && val) console.log("old val", val)
            let type = url.searchParams.get('type')
            return new Response(makeCell(d, end, row, wl, type, val));
        }
        if (url.pathname === "/cellForm") {
            let end = parseInt(url.searchParams.get('end'))
            let row = parseInt(url.searchParams.get('fiber'))
            let wl = parseInt(url.searchParams.get('wl'))
            let type = url.searchParams.get('type')
            return new Response(makeCellForm(end, row, wl, type))
        }
        if (url.pathname === "/cellSubmit") {
            let sn = parseInt(url.searchParams.get('sn'))
            let end = parseInt(url.searchParams.get('end'))
            let row = parseInt(url.searchParams.get('fiber'))
            let wl = parseInt(url.searchParams.get('wl'))
            let type = url.searchParams.get('type')
            let val = url.searchParams.get('content')
            let d =sess.getDUT(sn)
            console.log("A", end, row, wl, type)
            return new Response(makeCell(d, end, row, wl, type, true, val))
        }
    },
});

function makeLive(d) {
    sess.IL = Math.trunc(Math.random() * 50) / 100
    sess.RL = Math.trunc(Math.random() * 20 + 50)
    return `WL: ${sess.WL} IL:${sess.IL} RL:${sess.RL}`
}

function makeTable(d, oob = false) {
    let sn = d.sn
    let out = `<thead>\n<tr>\n<td colspan = 10 id="P${sn}-T">P${sn}</td></tr><tr><th></th>`
    d.wavs.forEach(wl => {
        out = out + `<th colspan = "${(d.hasrl) ? `${sess.numEnds * 2}` : `${sess.numEnds}`}">${wl}</th>`
    })
    out = out + `</tr><tr><th>Fiber</th>`
    for (let e = 1; e <= sess.numEnds; e++) {
        d.wavs.forEach(wl => {
            out = out + `<th>IL</th>\n${(d.hasrl) ? "<th>RL</th>\n" : ""}`
        })
    }
    out = out + `</tr></thead><tbody id="P${sn}-B">` + makeTBody(d) + `</tbody>`
    return out
}

function makeTBody(d) {
    let n = d.fibers
    let out = ""
    for (let i = 1; i <= n; i++) {
        out = out + makeRow(d, i)
    }
    return out
}

function makeRow(d, f, oob = false) {
    let sn = d.sn
    let n = d.wavs.length
    let out = `<tr class="r${(f == d.focusFiber && d.isActive) ? ((f-1) % sess.base+1) + " focused" : ((f-1) % sess.base+1)}" ` +
        `id="P${sn}-R${f}" ` +
        `${(oob) ? `hx-swap-oob="true"` : ""} ` +
        `hx-swap="outerHTML">\n` +
        `<td>${f}</td>\n`
    for (let e = 1; e <= sess.numEnds; e++) {
        for (let i = 1; i <= n; i++) {
            out = out + makeCell(d, e, f, d.wavs[i - 1], "IL")
            if (d.hasrl) {
                out = out + makeCell(d, e, f, d.wavs[i - 1], "RL")
            }
        }
    }
    out = out + `</tr>\n`
    return out
}

function makeCell(d, e, f, wl, type, oob = false, value) {
    let c, content
    if(value) {
        (type == "IL") ? d.IL[e][f][wl] = value : d.RL[e][f][wl] = value;
    }
    let id = "P" + d.sn + "-" + e + "-" + f + "-" + wl + "-" + type
    content = (type == "IL") ? d.IL[e][f][wl] : d.RL[e][f][wl];
    if (content == -100) {
        content = ""
        c = "empty"
    } else {
        (type == "IL" && content > sess.maxIL || type == "RL" && content < sess.minRL) ? c = "bad" : c = "good"
    }
    console.log(type, content, sess.maxIL, sess.minRL, c)
    return `<td id="${id}" class="${c}"` +
            `hx-get="/cellForm?end=${e}&fiber=${f}&wl=${wl}&type=${type}"` +
            `hx-trigger="click"` +
            `${(oob) ? ` hx-swap-oob="true" ` : ""}` +
            `hx-swap="innerHTML" ` +
            `>${content}</td>\n`
}

function makeCellForm(e, f, wl, type) {
    return `<form class="cell_form" hx-get="/cellSubmit?end=${e}&fiber=${f}&wl=${wl}&type=${type}"` +
            ` hx-swap="innerHTML" ` +
            `><input class="cell_input" type="text" name="content" autofocus><input class="cell_submit" type="submit"></form> `
}

function makeCard(d, oob = false, active = d.isActive) {
    return `<li id="P${d.sn}-C" ` +
        `class="card ${(active) ? " center" : " hidden"} "` +
        `${(oob) ? `hx-swap-oob="true"` : ""}>` +
        `<table hx-get="/tab" hx-vals='{"sn": "${d.sn}"}' hx-trigger="load" hx-swap="innerHTML">` +
        `</table></li>`
}

function makeForm() {
    return `<form hx-get="/form" hx-target="#tables" hx-swap="innerHTML">` +
        `<p><label>First SN</label>` +
        `<input type="number" name="firstSN" value="${sess.firstSN}"></p>\n` +
        `<p><label>Last SN</label>` +
        `<input type="number" name="lastSN" value="${sess.lastSN}"></p>\n` +
        `<p><label>Number of Fibers</label>` +
        `<input type="number" name="numFibers" value="${sess.numFibers}"></p>\n` +
        `<p><label>Number of Ends</label>` +
        `<input type="number" name="numEnds" value="${sess.numEnds}"></p>\n` +
        `<p><label>Max IL</label>` +
        `<input type="number" name="maxIL" value="${sess.maxIL}"></p>\n` +
        `<p><label>Min RL</label>` +
        `<input type="number" name="minRL" value="${sess.minRL}"></p>\n` +
        `<fieldset>
        <legend>Wavelength</legend>
        <p><input type="radio" id="850" name="wl" value="850" checked />
            <label>850</label></p>
            <input type="radio" id="1310" name="wl" value="1310" />
            <label for="1310">1310</label>
            <input type="radio" id="1550" name="wl" value="1550" />
            <label for="1550">1550</label>
            </fieldset>` +
        `<button class="btn">Submit</button>` +
        `</form>`
}


