export function makeSettingsForm(sess) {
    return /*html*/`
        <form hx-get="/submit/setup" hx-target="#card-container" hx-swap="innerHTML">
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
            <label>End A Max IL</label>
            <input type="number" step="0.01" name="maxILA" value="${sess.maxIL[1]}">
            <label>End A Min RL</label>
            <input type="number" name="minRLA" value="${sess.minRL[1]}">
            
                <label class="spec-b hidden">End B Max IL</label>
                <input class="spec-b hidden" type="number" step="0.01" name="maxILB" value="${sess.maxIL[2]}">
                <label class="spec-b hidden">End B Min RL</label>
                <input class="spec-b hidden" type="number" name="minRLB" value="${sess.minRL[2]}">
            
            
        </div>
        <fieldset>
            <legend>Ends</legend>
            <div class="option">
                <input type="radio" id="setup-E1" name="numEnds" value="1" _="on click add .hidden to .spec-b" checked />
                <label for="setup-E1">single</label>
            </div>
            <div class="option">
                <input type="radio" id="setup-E2" name="numEnds" value="2" _="on click remove .hidden from .spec-b"/>
                <label for="setup-E2">both</label>
            </div>
        </fieldset>
        <fieldset>
            <legend>Wavelength</legend>
            <div class="option">
                <input type="radio" id="setup-850" name="wl" value="850" />
                <label for ="setup-850">850</label>
            </div>
            <div class="option">
                <input type="radio" id="setup-1300" name="wl" value="1300" />
                <label for ="setup-1300">1300</label>
            </div>
            <div class="option">
                <input type="radio" id="setup-1310" name="wl" value="1310" />
            <label for ="setup-1310">1310</label>
            </div>
            <div class="option">
                <input type="radio" id="setup-1550" name="wl" value="1550" checked/>
                <label for ="setup-1550">1550</label>
            </div>
        </fieldset>
        <button class ="btn" onclick="this.blur();">Submit</button>
        </form>`
}

export function makeNavigationForm(sess) {
    return /*html*/`
        <form hx-get="/submit/navigation" hx-swap="none">
        <fieldset>
            <legend>Direction</legend>
            <div class="option">
                <input type="radio" name="direction" value="prev" ${(sess.backwards) ? "checked" : ""}/>
                <label>previous</label>
            </div>
            <div class="option">
                <input type="radio" name="direction" value="next" ${(!sess.backwards) ? "checked" : ""}/>
                <label>next</label>
            </div>
        </fieldset>
        <fieldset>
            <legend>Auto Advance</legend>
            <div class="option">
                <input type="radio" name="advance" value="never"/>
                <label>disabled</label>
            </div>
            <div class="option">
                <input type="radio" name="advance" value="passing" checked/>
                <label>passing</label>
            </div>
            <div class="option">
                <input type="radio" name="advance" value="channel" />
                <label>passing + switch channel</label>
            </div>
            <div class="option">
                <input type="radio" name="advance" value="always" />
                <label>always</label>
            </div>
        </fieldset>
        <fieldset>
            <legend>Next</legend>
            <div class="option">
                <input type="radio" name="type" value="end" ${(sess.next == "end") ? "checked" : ""}/>
                <label>End</label>
            </div>
            <div class="option">
                <input type="radio" name="type" value="wl" ${(sess.next == "wl") ? "checked" : ""}/>
                <label>Wavelength</label>
            </div>
            <div class="option">
                <input type="radio" name="type" value="fiber" ${(sess.next == "fiber") ? "checked" : ""}/>
                <label>Fiber</label>
            </div>
            <div class="option">
                <input type="radio" name="type" value="dut" ${(sess.next == "dut") ? "checked" : ""}/>
                <label>DUT</label>
            </div>
        </fieldset>
        <div _="on click toggle .hidden on #advanced">advanced</div>
        <button class ="btn" onclick="this.blur();">Submit</button>
        </form>`
}

{/* <div class="switch">
                <input type="checkbox" id="advance" name="advance" ${(sess.autoAdvance) ? "checked" : ""}/>
                <label for ="850">enabled</label>
            </div> */}

export function makeAdvancedForm(sess) {
    return /*html*/`
        <form hx-get="/submit/advanced" hx-swap="none">
        <fieldset>
            <legend>Port Map</legend>
            <div class="option">
                <input type="radio" name="direction" value="prev" ${(sess.backwards) ? "checked" : ""}/>
                <label>previous</label>
            </div>
            <div class="option">
                <input type="radio" name="direction" value="next" ${(!sess.backwards) ? "checked" : ""}/>
                <label>next</label>
            </div>
        </fieldset>
        <fieldset>
            <legend>Negative Reading correction</legend>
            <div class="switch">
                <input type="checkbox" id="advance" name="advance" value="enabled" ${(sess.autoAdvance) ? "checked" : ""}/>
                <label for ="850">enabled</label>
            </div>
        </fieldset>
        <fieldset>
            <legend>Next</legend>
            <div class="option">
                <input type="radio" name="type" value="end" ${(sess.next == "end") ? "checked" : ""}/>
                <label>End</label>
            </div>
            <div class="option">
                <input type="radio" name="type" value="wl" ${(sess.next == "wl") ? "checked" : ""}/>
                <label>Wavelength</label>
            </div>
            <div class="option">
                <input type="radio" name="type" value="fiber" ${(sess.next == "fiber") ? "checked" : ""}/>
                <label>Fiber</label>
            </div>
            <div class="option">
                <input type="radio" name="type" value="dut" ${(sess.next == "dut") ? "checked" : ""}/>
                <label>DUT</label>
            </div>
        </fieldset>
        
        <button class ="btn" onclick="this.blur();">Submit</button>
        </form>`
}

export function makeCard(s, d, oob = false, active = d.sn-s.firstSN==s.currentDUT) {
    return /*html*/`
        <li id="P${d.sn}-C" ${(oob) ? ` hx-swap-oob="true" ` : ""} hx-vals='{"sn": "${d.sn}"}' class="card">
            <div class="buttons">
                <button _="on click js(me) me.blur(); htmx.ajax('GET', '/flush/dut', {swap:'none', values:{id: me.closest('.card').id}}); end" class="material-icons">save_alt</button>
                <button _="on click toggle .dark on the next <table/> js(me) me.blur() end" class="material-icons" onclick="this.blur();">visibility_off</button>
                <button hx-get="/clear/dut" hx-vals='{"scope": "dut"}' class="material-icons" onclick="this.blur();">clear</button>
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

export function makeTable(s, d, oob = false) {
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
            ${makeTBody(s, d)}
        </tbody>`
}

export function makeTBody(s, d) {
    let row = ""
    for (let i = 1; i <= s.numFibers; i++) {
        row += makeRow(s, d, i)
    }
    return row
}

export function makeRowCompact(s, d) {
    let cells = ""
    for (let e = 1; e <= d.numEnds; e++) {
        for (let f = 1; f <= d.numFibers; f++) {
            for(let wl of d.wavs) {
                cells += makeCellOuter(s, d, e, f, wl)
            }
        }
    }
    // console.log("row", d.numEnds, d.numFibers, d.wavs, cells)
    return /*html*/`
        <tr id="P${d.sn}-C" hx-vals='{"sn": "${d.sn}"}' class="card-compact">
            <td class="sn">${d.sn}</td>
            ${cells}
        </tr>`
}

export function makeRow(s, d, f, oob = false) {
    let cells = ""
    for (let e = 1; e <= s.numEnds; e++) {
        for(let wl of d.wavs) {
            cells += makeCellOuter(s, d, e, f, wl, false, (d.sn-s.firstSN==s.currentDUT&&f==s.currentFiber&&e==s.currentEnd), (d.sn-s.firstSN==s.nextDUT&&f==s.nextFiber&&e==s.nextEnd))
        }
    }
    return /*html*/`
        <tr class="r${((f - 1) % d.base + 1)}" id="P${d.sn}-F${f}"' 
            ${(oob) ? `hx-swap-oob="true"` : ""} 
            _="on htmx:afterSettle if I match <:has(.focused)/> then log 'scroll' js(me) me.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })" 
            hx-swap="outerHTML">
            <td>${f}</td>
            ${cells}
        </tr>`
}

export function makeCellOuter(s, d, e, f, wl, oob = false, iscurrent = false, isnext = false){
    // console.log(d, e, f, wl, oob)
    let c = "" //(f == d.focusFiber && e == d.focusEnd && d.isActive) ? " focused" : ""
    if (iscurrent) c = " focused"
    if (isnext) c = " next"
    // _="on click if I do not match <:has(>form)/> then take .focused remove .next from .next send focus to me"
    return /*html*/`
        <td hx-get="/focus" hx-trigger="focus" hx-swap="none" id="P${d.sn}-E${e}-F${f}-${wl}" class="cell${c}"
            hx-vals='{"end": "${e}", "fiber": ${f}, "wl": "${wl}"}'
            _="on click if I do not match .focused then take .focused remove .next from .next send focus to me"
            ${(oob) ? ` hx-swap-oob="true" ` : ""}>
            ${makeCellInner(s, d, e, f, wl, "IL", oob)}
            ${(d.hasrl) ? makeCellInner(s, d, e, f, wl, "RL", oob) : ""}
        </td>`
}

export function makeCellInner(s, d, e, f, wl, type, oob = false, value) {
    // console.log(d.sn, e, f, wl, type,  oob)
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
        (type == "IL" && content > s.maxIL[e] || type == "RL" && content < s.minRL[e]) ? c = "bad" : c = "good"
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
    sess.CH = im.getValue(sess.instrument, "activeCH")
    sess.valid = true
    return `WL: ${sess.WL} CH: ${sess.CH} IL:${sess.IL} RL:${sess.RL} <button id="upload-button" hx-get="/flush/all" hx-swap="none" onclick="this.blur();">upload all</button>`
}
