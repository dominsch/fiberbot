export function makeLive() {
    let wl = "1550" //d.wavs[Math.trunc(Math.random()*d.wavs.length)]
    let il = Math.trunc(Math.random()*50)/100
    let rl = Math.trunc(Math.random()*20 + 50)
    return `WL: ${wl} IL:${il} RL:${rl}`
  }
  
  export function makeTable(d) {
    let sn = d.sn
    let out =    `<thead>
                    <tr>
                      <td colspan = 10 id="P${sn}">P${sn}</td>
                    </tr>
                    <tr>
                      <th></th>`
    d.wavs.forEach(wl => {
      out = out + `<th${(d.hasrl) ? " colspan = 2" : ""}>${wl}</th>`
    })
    out = out +    `</tr>
                    <tr>
                      <th>Fiber</th>`
    d.wavs.forEach(wl => {
      out = out +    `<th>IL</th>\n${(d.hasrl) ? "<th>RL</th>\n" : ""}`
    })
    out = out +    `</tr>
                  </thead>
                  <tbody id="tbod">`
    out = out + makeTBody(d)
    out = out +  `</tbody>`
    return out
  }
  
  export function makeTBody(d) {
    let n = d.fibers
    let out = ""
    for(let i = 1; i<=n; i++){
      out = out + makeRow(d, i, 1)
    }
    return out
  }
  
  export function makeRow(d, f, n) {
    let sn = d.sn
    n = d.wavs.length
    //let out = `<tr class="${f}", id="${sn}-${f}" hx-post="/row" hx-trigger="click, sse:EventName, sse:event${f}" hx-swap="outerHTML">\n`
    // _="on click add .focused to next <tr/>"
    let out = `<tr class="r${(f==d.focus)? f + " focused" : f}", id="P${sn}-${f}" hx-get="/row" hx-vals='{"sn": "${sn}", "fiber": "${f}"} hx-trigger="click, keydown[key=='${f}'] from:body" hx-swap="outerHTML">\n`
    out = out + `<td>${f}</td>\n`
    for(let i = 1; i<=n; i++){
      out = out + makeCell(d, f, d.wavs[i-1], "IL")
      if (d.hasrl) {
        out = out + makeCell(d, f, d.wavs[i-1], "RL")
      }
    }
    out = out + `</tr>\n`
    return out
  }
  
  export function makeCell(d, f ,wl, type) {
    let content = (type == "IL") ? d.IL[1][f][wl] : d.RL[1][f][wl]
    if (content == -100) content = ""
    return `<td id="${"P" + d.sn + "-A" + f + "-" + wl + "-" + type}">${content}</td>\n`
  }
