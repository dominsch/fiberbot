import { privateEncrypt, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { maxHeaderSize } from "node:http";
import { type } from "node:os";

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
    (this.focus >= this.fibers) ? this.focus = 1 : this.focus++
  }
  prev() {
    (this.focus <= 1) ? this.focus = this.fibers : this.focus--
  }
}

let duts = []//= new DUT(Math.trunc(Math.random()*100000000),1,12,[1550],true)
let il
let rl

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    console.log(req)
    const url = new URL(req.url);
    console.log(url.searchParams)
    if (url.pathname === "/") return new Response(Bun.file("table.html"));
    if (url.pathname === "/style.css") return new Response(Bun.file("style.css"));
    if (url.pathname === "/form") {
      let firstSN = url.searchParams.get('firstSN')
      let lastSN = url.searchParams.get('lastSN')
      let numFibers = parseInt(url.searchParams.get('numFibers'))
      let out = ""
      for (let sn = firstSN;sn <= lastSN; sn++){
        
        duts[sn] = new DUT(sn,1,numFibers,[1550],true)
        out = out + 
        `<li id="tab${sn}" class="item${sn-firstSN+1} ${(sn==1)? "center" : "hidden"}"><table hx-get="/tab" hx-vals='{"sn": "${sn}"}' hx-trigger="load" hx-swap="innerHTML">
        </table></li>`
        console.log("loop", out)
      }
      return new Response(out,{
        headers: {
          "HX-Replace-URL": "/"
        }
      });
    }
    if (url.pathname === "/clear") {
      let d = duts[parseInt(url.searchParams.get('sn'))]
      d.clear()
      d.focus = 1
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/cap") {
      let d = duts[parseInt(url.searchParams.get('sn'))]
      if (il < Math.abs(d.IL[1][d.focus][d.wavs[0]])) d.IL[1][d.focus][d.wavs[0]] = il
      if (rl > d.RL[1][d.focus][d.wavs[0]]) d.RL[1][d.focus][d.wavs[0]] = rl
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/capend") {
      let d = duts[parseInt(url.searchParams.get('sn'))]
      d.next()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/next") {
      let sn = parseInt(url.searchParams.get('sn'))
      console.log(sn)
      let d = duts[sn]
      d.next()
      return new Response(makeTBody(d), {
        headers: {
          "HX-Trigger": "myEvent"
        }
      });
    }
    if (url.pathname === "/prev") {
      let d = duts[parseInt(url.searchParams.get('sn'))]
      d.prev()
      return new Response(makeTBody(d));
    }
    if (url.pathname === "/live"){
      let d = duts[parseInt(url.searchParams.get('sn'))]
      return new Response(makeLive(d));
    } 
    if (url.pathname === "/tab"){
      let d = duts[parseInt(url.searchParams.get('sn'))]
      return new Response(makeTable(d));
    } 
    if (url.pathname === "/row"){
      let sn = url.searchParams.get('sn')
      let row = url.searchParams.get('fiber')
      let d = duts[parseInt(sn)]
      //let trigger = req.headers.get('hx-trigger')
      //const { sn, row } = /^(?<sn>.+)-(?<row>\d+)$/.exec(trigger,).groups
      return new Response(makeRow(d, row,1));
    } 
  },
});

function makeLive(d) {
  let wl = "1550" //d.wavs[Math.trunc(Math.random()*d.wavs.length)]
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

function makeCell(d, f ,wl, type) {
  let content = (type == "IL") ? d.IL[1][f][wl] : d.RL[1][f][wl]
  if (content == -100) content = ""
  return `<td id="${"P" + d.sn + "-A" + f + "-" + wl + "-" + type}">${content}</td>\n`
}