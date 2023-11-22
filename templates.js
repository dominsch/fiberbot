export function makeForm(sess) {
    return /*html*/`
            <form hx-get="/submit/settings" hx-target=".card-container" hx-swap="innerHTML">
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
            <button class ="btn" onclick="this.blur();">Submit</button>
            </form>`
}

export function makeCard(d, oob = false, active = d.isActive) {
    return /*html*/`
        <li id="P${d.sn}-C" ${(oob) ? ` hx-swap-oob="true" ` : ""} hx-vals='{"sn": "${d.sn}"}' class="card">
            <div class="buttons">
                <button _="on click js(me) me.blur(); htmx.ajax('PUT', '/action/flush', {swap:'none', values:{id: me.closest('.card').id}}); end" class="material-icons">save_alt</button>
                <button _="on click toggle .dark on the next <table/> js(me) me.blur() end" class="material-icons" onclick="this.blur();">visibility_off</button>
                <button hx-put="/action/clear" hx-vals='{"scope": "dut"}' class="material-icons" onclick="this.blur();">clear</button>
            </div>
            <table hx-get="/tab" hx-trigger="load" hx-swap="innerHTML"></table>
        </li>`
}

export function makeCompactCard(duts) {
    return /*html*/`
        <li class="card">
        <table>
            <thead class="compact">
                <tr class="wl">
                    <th></th>
                    ${duts[0].wavs.reduce((updated, latest) => updated.concat(/*html*/`
                    <th>${latest}</th>`
                    ), '')}
                </tr>
                <tr class="desc">
                    <th class="compact">SN</th>
                    ${/*html*/`
                    <th class="cell">
                        <div>IL</div>
                        ${(duts[0].hasrl) ? "<div>RL</div>" : ""}
                    </th>`
                    .repeat(duts[0].numEnds * duts[0].numFibers * duts[0].wavs.length)}
                </tr>
            </thead>
            <tbody class="compact">
                ${duts.reduce((updated, latest) => updated.concat(/*html*/`
                ${makeRowCompact(latest)}`
                ), '')}
            </tbody>
        </table>
        </li>`
}

export function makeTable(d, oob = false) {
    let sn = d.sn
    return /*html*/`
        <thead class="full">
            <tr class="sn">
                <td colspan="100%">P${sn}</td>
            </tr>
            <tr class="wl">
                <th></th>
                ${d.wavs.reduce((updated, latest) => updated.concat(/*html*/`
                <th>${latest}</th>`
                ), '')}
            </tr>
            <tr class="desc">
                <th>Fiber</th>
                ${/*html*/`
                <th class="cell">
                    <div>IL</div>
                    ${(d.hasrl) ? "<div>RL</div>" : ""}
                </th>`
                .repeat(d.numEnds * d.wavs.length)}
            </tr>
        </thead>
        <tbody id="P${sn}-B" class="full">
            ${makeTBody(d)}
        </tbody>`
}

export function makeTBody(d) {
    let row = ""
    for (let i = 1; i <= d.numFibers; i++) {
        row += makeRow(d, i)
    }
    return row
}

export function makeRowCompact(d) {
    let cells = ""
    for (let e = 1; e <= d.numEnds; e++) {
        for (let f = 1; f <= d.numFibers; f++) {
            for(let wl of d.wavs) {
                cells += makeCellOuter(d, e, f, wl)
            }
        }
    }
    console.log("row", d.numEnds, d.numFibers, d.wavs, cells)
    return /*html*/`
        <tr id="P${d.sn}-C" hx-vals='{"sn": "${d.sn}"}' class="card-compact">
            <td class="sn">${d.sn}</td>
            ${cells}
        </tr>`
}

export function makeRow(d, f, oob = false) {
    let cells = ""
    for (let e = 1; e <= d.numEnds; e++) {
        for(let wl of d.wavs) {
            cells += makeCellOuter(d, e, f, wl)
        }
    }
    return /*html*/`
        <tr class="r${((f - 1) % d.base + 1)}" id="P${d.sn}-F${f}"' 
            ${(oob) ? `hx-swap-oob="true"` : ""} 
            _="on htmx:afterSettle if my lastElementChild match .focused then log 'child' go to the middle of me" 
            hx-swap="outerHTML">
            <td>${f}</td>
            ${cells}
        </tr>`
}

export function makeCellOuter(d, e, f, wl, oob = false){
    return /*html*/`
        <td class="cell${(f == d.focusFiber && e == d.focusEnd && d.isActive) ? " focused" : ""}"
            hx-vals='{"end": "${e}", "fiber": ${f}, "wl": "${wl}"}'
            _="on click if I do not match <:has(>form)/> then toggle .focused on me">
            ${makeCellInner(d, e, f, wl, "IL", oob)}
            ${(d.hasrl) ? makeCellInner(d, e, f, wl, "RL", oob) : ""}
        </td>`
}

export function makeCellInner(d, e, f, wl, type, oob = false, value) {
    let c, content
    if (value) {
        console.log("value", value)
        if (type == "IL") { 
            d.IL[e][f][wl] = value
        } else { 
            d.RL[e][f][wl] = value
        }
    }
    content = (type == "IL") ? d.IL[e][f][wl] : d.RL[e][f][wl];
    if (content == -100) {
        content = " "
        c = "empty"
    } else {
        (type == "IL" && content > d.maxIL || type == "RL" && content < d.minRL) ? c = "bad" : c = "good"
    }
    // console.log("log", id, d.isActive, e, d.focusEnd, f, d.focusFiber, wl, type, (f == d.focusFiber && e == d.focusEnd && d.isActive))
    return /*html*/`
        <div id="P${d.sn}-E${e}-F${f}-${wl}-${type}" class="${c}" hx-trigger="click[event.target.parentNode.classList.contains('focused')]" hx-vals='{"type": "${type}"}' hx-get="/cellInnerForm" ${(oob) ? ` hx-swap-oob="true" ` : ""} hx-swap="outerHTML">
            ${content}
        </div>`
}

export function makeCellInnerForm(d, e, f, wl, type, value) {
    value ||= (type == "IL") ? d.IL[e][f][wl] : d.RL[e][f][wl]
    return /*html*/`
        <form id="P${d.sn}-E${e}-F${f}-${wl}-${type}-Form" class="cell_form" hx-trigger="submit" hx-get="/submit/cellInnerForm" hx-vals='{"type": "${type}"}' hx-swap="outerHTML" >
            <input class="cell_input" type="number" step="${type=="IL" ? "0.01" : "1"}" name="value" _="on focusout send submit to the closest <form/>" placeholder="${value}" autofocus>
            <input class="cell_submit" type="submit" >
        </form> `
}



export function makeLive(sess, im) {
    sess.IL = im.getValue(sess.instrument, "IL")
    sess.RL = im.getValue(sess.instrument, "RL")
    return `WL: ${sess.WL} IL:${sess.IL} RL:${sess.RL}`
}
