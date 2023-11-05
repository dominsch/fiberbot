export function makeLive(sess, im) {
    sess.IL = im.getValue(sess.instrument, "IL")
    sess.RL = im.getValue(sess.instrument, "RL")
    return `WL: ${sess.WL} IL:${sess.IL} RL:${sess.RL}`
}

export function makeTable(d, oob = false) {
    let sn = d.sn
    let out = `<thead>\n<tr>\n<td colspan = 10 id="P${sn}-T">P${sn}</td></tr><tr><th></th>`
    d.wavs.forEach(wl => {
        out = out + `<th colspan = "${(d.hasrl) ? `${d.numEnds * 2}` : `${d.numEnds}`}">${wl}</th>`
    })
    out = out + `</tr><tr><th>Fiber</th>`
    for (let e = 1; e <= d.numEnds; e++) {
        d.wavs.forEach(wl => {
            out = out + `<th>IL</th>\n${(d.hasrl) ? "<th>RL</th>\n" : ""}`
        })
    }
    out = out + `</tr></thead><tbody id="P${sn}-B">` + makeTBody(d) + `</tbody>`
    return out
}

export function makeTBody(d) {
    let n = d.fibers
    let out = ""
    for (let i = 1; i <= n; i++) {
        out = out + makeRow(d, i)
    }
    return out
}

export function makeRow(d, f, oob = false) {
    let sn = d.sn
    let n = d.wavs.length
    let out = `<tr class="r${(f == d.focusFiber && d.isActive) ? ((f - 1) % d.base + 1) + " focused" : ((f - 1) % d.base + 1)}" ` +
        `id="P${sn}-R${f}" ` +
        `${(oob) ? `hx-swap-oob="true"` : ""} ` +
        `hx-swap="outerHTML">\n` +
        `<td>${f}</td>\n`
    for (let e = 1; e <= d.numEnds; e++) {
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

export function makeCell(d, e, f, wl, type, oob = false, value) {
    let c, content
    if (value) {
        (type == "IL") ? d.IL[e][f][wl] = value : d.RL[e][f][wl] = value;
    }
    let id = "P" + d.sn + "-" + e + "-" + f + "-" + wl + "-" + type
    content = (type == "IL") ? d.IL[e][f][wl] : d.RL[e][f][wl];
    if (content == -100) {
        content = ""
        c = "empty"
    } else {
        (type == "IL" && content > d.maxIL || type == "RL" && content < d.minRL) ? c = "bad" : c = "good"
    }
    // console.log(type, content, sess.maxIL, sess.minRL, c)
    return `<td id="${id}" class="${c}"` +
        `hx-get="/cellForm?end=${e}&fiber=${f}&wl=${wl}&type=${type}"` +
        `hx-trigger="click"` +
        `${(oob) ? ` hx-swap-oob="true" ` : ""}` +
        `hx-swap="innerHTML" ` +
        `>${content}</td>\n`
}

export function makeCellForm(e, f, wl, type) {
    return `<form class="cell_form" hx-get="/cellSubmit?end=${e}&fiber=${f}&wl=${wl}&type=${type}"` +
        ` hx-swap="innerHTML" ` +
        `><input class="cell_input" type="number" step="${type=="IL" ? "0.01" : "1"}" name="content" autofocus><input class="cell_submit" type="submit"></form> `
}

export function makeCard(d, oob = false, active = d.isActive) {
    return `<li id="P${d.sn}-C" ` +
        `class="card smooth ${(active) ? " center" : " hidden"} "` +
        `${(oob) ? `hx-swap-oob="true"` : ""}>` +
        `<table hx-get="/tab" hx-vals='{"sn": "${d.sn}"}' hx-trigger="load" hx-swap="innerHTML">` +
        `</table></li>`
}

export function makeForm(sess) {
    return `<form hx-get="/form" hx-target="#card-container" hx-swap="innerHTML">
            <div>
                <legend>Serial Number</legend>
                <label>First</label>
                <input type="number" name="firstSN" value="${sess.firstSN}">
                <label>Last</label>
                <input type="number" name="lastSN" value="${sess.lastSN}">
            </div>
            <div>
                <legend>Characteristics</legend>
                <label>Number of Fibers</label>
                <input type="number" name="numFibers" value="${sess.numFibers}">
                <label>Base</label>
                <input type="number" name="base" value="${sess.base}">
            </div>
            <div>
                <legend>Spec</legend>
                <label>Max IL</label>
                <input type="number" step="0.01" name="maxIL" value="${sess.maxIL}">
                <label>Min RL</label>
                <input type="number" name="minRL" value="${sess.minRL}">
            </div>
            <fieldset>
                <legend>Ends</legend>
                <div class="option">
                    <input type="radio" name="numEnds" value="1" checked />
                    <label>single</label>
                </div>
                <div class="option">
                    <input type="radio" name="numEnds" value="2" />
                    <label>both</label>
                </div>
            </fieldset>
            <fieldset>
                <legend>Wavelength</legend>
                <div class="option">
                    <input type="radio" id="850" name="wl" value="850" />
                    <label for ="850">850</label>
                </div>
                <div class="option">
                    <input type="radio" id="1300" name="wl" value="1300" />
                    <label for ="1300">1300</label>
                </div>
                <div class="option">
                    <input type="radio" id="1310" name="wl" value="1310" />
                <label for ="1310">1310</label>
                </div>
                <div class="option">
                    <input type="radio" id="1550" name="wl" value="1550" checked/>
                    <label for ="1550">1550</label>
                </div>
            </fieldset>
            <button class ="btn">Submit</button>
            </form>`
}