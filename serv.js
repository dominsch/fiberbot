import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { maxHeaderSize } from "node:http";

class DUT {
  constructor(sn, ends, fibers, wavs, hasrl) {
    this.sn = sn
    this.fibers = fibers
    this.ends = ends
    this.wavs = wavs
    this.hasrl = hasrl
    this.focus = 1
    this.IL = []
    this.RL = []
    this.clear()
  }
  clear() {
    for(let e = 1; e<=this.ends; e++) {
      this.IL[e] = []
      this.RL[e] = []
      for(let f = 1; f<=this.fibers; f++) {
        this.IL[e][f] = {}
        this.RL[e][f] = {}
        this.wavs.forEach(wl => {
          this.IL[e][f][wl] = -100
          this.RL[e][f][wl] = -100
        })
      }
    }
  }
  next() {
    (d.focus >= d.fibers) ? d.focus = 1 : d.focus++
  }
  prev() {
    (d.focus <= 1) ? d.focus = d.fibers : d.focus--
  }
}

let d = new DUT(Math.trunc(Math.random()*100000000),1,12,[1550],true)
let il
let rl

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    //console.log(req)
    const url = new URL(req.url);
    console.log(url.pathname)
    if (url.pathname === "/") return new Response(Bun.file("table.html"));
    if (url.pathname === "/clear") {
      d.clear()
      d.focus = 1
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/cap") {
      if (il < Math.abs(d.IL[1][d.focus][d.wavs[0]])) d.IL[1][d.focus][d.wavs[0]] = il
      if (rl > d.RL[1][d.focus][d.wavs[0]]) d.RL[1][d.focus][d.wavs[0]] = rl
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/capend") {
      d.next()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/next") {
      d.next()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/prev") {
      d.prev()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/live"){
      let res = makeLive()
      return new Response(res);
    } 
    if (url.pathname === "/tab"){
      let res = makeTable(d)
      return new Response(res);
    } 
    if (url.pathname === "/row"){
      let trigger = req.headers.get('hx-trigger')
      const { sn, row } = /^(?<sn>.+)-(?<row>\d+)$/.exec(trigger,).groups
      let res = makeRow(d, row,1)
      return new Response(res);
    } 
  },
});

function makeLive() {
  let wl = d.wavs[Math.trunc(Math.random()*d.wavs.length)]
  il = Math.trunc(Math.random()*50)/100
  rl = Math.trunc(Math.random()*20 + 50)
  return `WL: ${wl} IL:${il} RL:${rl}`
}

function makeTable(d) {
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

function makeTBody(d) {
  let n = d.fibers
  let out = ""
  for(let i = 1; i<=n; i++){
    out = out + makeRow(d, i, 1)
  }
  return out
}

function makeRow(d, f, n) {
  let sn = d.sn
  n = d.wavs.length
  //let out = `<tr class="${f}", id="${sn}-${f}" hx-post="/row" hx-trigger="click, sse:EventName, sse:event${f}" hx-swap="outerHTML">\n`
  // _="on click add .focused to next <tr/>"
  let out = `<tr class="r${(f==d.focus)? f + " focused" : f}", id="P${sn}-${f}" hx-post="/row" hx-trigger="click, keydown[key=='${f}'] from:body" hx-swap="outerHTML">\n`
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

function makeCell(d, f ,wl, type) {
  let content = (type == "IL") ? d.IL[1][f][wl] : d.RL[1][f][wl]
  if (content == -100) content = ""
  return `<td id="${"P" + d.sn + "-A" + f + "-" + wl + "-" + type}">${content}</td>\n`
}