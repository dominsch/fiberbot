const { ReadStream } = require("fs")

class Session {
    constructor() {
        //this.instrument =
        this.activeDUT = 0
        this.activeRow = 1
    }
    configure(firstSN, lastSN, numFibers, numEnds, maxIL, minRL) {
        console.log("configuring", firstSN, lastSN, numFibers)
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
            this.DUTs[i] = new DUT(this.firstSN + i, 1, this.numFibers, [1550], true, 1, (i == 0))
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
        this.focus = focus
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
        if (this.focus >= this.fibers) {
            this.focus = 1
            return false
        }
        else {
            this.focus++
            return true
        }
    }
    prev() {
        if (this.focus <= 1) {
            this.focus = this.fibers
            return false
        }
        else {
            this.focus--
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
                    d.clearFiber(d.focus)
                    return new Response(makeRow(d, d.focus, true));
                case "dut":
                    d.clearAll()
                    d.focus = 1
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
        if (url.pathname === "/cap") {
            let d = sess.getActiveDUT()
            if (il < Math.abs(d.IL[1][d.focus][d.wavs[0]])) d.IL[1][d.focus][d.wavs[0]] = il
            if (rl > d.RL[1][d.focus][d.wavs[0]]) d.RL[1][d.focus][d.wavs[0]] = rl
            return new Response(makeRow(d, d.focus, true))
        }
        if (url.pathname === "/capend") {
            let d = sess.getActiveDUT()
            let prevf = d.focus
            if (!d.next()) {
                let res = makeCard(sess.DUTs[sess.activeDUT], true, false)
                sess.nextDUT()
                res = res + makeCard(sess.DUTs[sess.activeDUT], true)
                return new Response(res)
            }
            let res = makeRow(d, prevf, true) + makeRow(d, d.focus, true)
            return new Response(res)
        }
        if (url.pathname === "/next") {
            let d = sess.getActiveDUT()
            let prevf = d.focus
            d.next()
            let res = makeRow(d, prevf, true) + makeRow(d, d.focus, true)
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
            let prevf = d.focus
            d.prev()
            let res = makeRow(d, prevf, true) + makeRow(d, d.focus, true)
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
            return new Response(makeRow(d, row, 1));
        }
    },
});

function makeLive(d) {
    console.log("live")
    let wl = "1550" //d.wavs[Math.trunc(Math.random()*d.wavs.length)]
    il = Math.trunc(Math.random() * 50) / 100
    rl = Math.trunc(Math.random() * 20 + 50)
    return `WL: ${wl} IL:${il} RL:${rl}`
}

function makeTable(d, oob = false) {
    let sn = d.sn
    let out = `<thead>\n<tr>\n<td colspan = 10 id="P${sn}-T">P${sn}</td></tr><tr><th></th>`
    d.wavs.forEach(wl => {
        out = out + `<th${(d.hasrl) ? " colspan = 2" : ""}>${wl}</th>`
    })
    out = out + `</tr><tr><th>Fiber</th>`
    d.wavs.forEach(wl => {
        out = out + `<th>IL</th>\n${(d.hasrl) ? "<th>RL</th>\n" : ""}`
    })
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
    //let out = `<tr class="${f}", id="${sn}-${f}" hx-post="/row" hx-trigger="click, sse:EventName, sse:event${f}" hx-swap="outerHTML">\n` `{"updateRow": {"sn": "1", "fiber": "4"}}`
    // _="on click add .focused to next <tr/>"
    let out = `<tr class="r${(f == d.focus && d.isActive) ? f % sess.base + " focused" : f % sess.base}" ` +
        `id="P${sn}-R${f}" ` +
        `hx-get="/row?fiber=${f}" ` +
        `${(oob) ? `hx-swap-oob="true"` : ""} ` +
        //`hx-trigger="click, updateRow[detail.sn=='${sn}'] from:body" ` +
        `hx-swap="outerHTML">\n` +
        `<td>${f}</td>\n`
    for (let i = 1; i <= n; i++) {
        out = out + makeCell(d, f, d.wavs[i - 1], "IL")
        if (d.hasrl) {
            out = out + makeCell(d, f, d.wavs[i - 1], "RL")
        }
    }
    out = out + `</tr>\n`
    return out
}

function makeCell(d, f, wl, type, oob = false) {
    let c
    let content = (type == "IL") ? d.IL[1][f][wl] : d.RL[1][f][wl];
    if (content == -100) {
        content = ""
        c = "empty"
    } else {
        (type == "IL" && content > sess.maxIL || type == "RL" && content < sess.minRL) ? c = "bad" : c = "good"
    }
    console.log(type, content, sess.maxIL, sess.minRL, c)
    return `<td id="${"P" + d.sn + "-A" + f + "-" + wl + "-" + type}" ` +
            `class="${c}">${content}</td>\n`
}

function makeCard(d, oob = false, active = d.isActive) {
    return `<li id="P${d.sn}-C" ` +
        `class="item${d.sn - sess.firstSN + 1} ${(active) ? " center" : " hidden"} "` +
        `${(oob) ? `hx-swap-oob="true"` : ""}>` +
        `<table hx-get="/tab" hx-vals='{"sn": "${d.sn}"}' hx-trigger="load" hx-swap="innerHTML">` +
        `</table></li>`
}

function makeForm() {
    return `<form hx-get="/form" hx-target="#tables" hx-swap="innerHTML">` +
        `<label>First SN</label>` +
        `<input type="number" name="firstSN" value="1">\n` +
        `<label>Last SN</label>` +
        `<input type="number" name="lastSN" value="10">\n` +
        `<label>Number of Fibers</label>` +
        `<input type="number" name="numFibers" value="6">\n` +
        `<label>Number of Ends</label>` +
        `<input type="number" name="numEnds" value="1">\n` +
        `<label>Max IL</label>` +
        `<input type="number" name="maxIL" value="0.4">\n` +
        `<label>Min RL</label>` +
        `<input type="number" name="minRL" value="55">\n` +
        `<button class="btn">Submit</button>` +
        `</form>`
}