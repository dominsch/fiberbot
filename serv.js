import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

class DUT {
  constructor(sn, ends, fibers, wavs, hasrl) {
    this.sn = sn
    this.fibers = fibers
    this.ends = ends
    this.wavs = wavs
    this.hasrl = hasrl
    this.IL = []
    this.RL = []
    for(let e = 1; e<=ends; e++) {
      this.IL[e] = []
      this.RL[e] = []
      for(let f = 1; f<=fibers; f++) {
        this.IL[e][f] = {}
        this.RL[e][f] = {}
        this.wavs.forEach(wl => {
          this.IL[e][f][wl] = -100+f-wl*0.001
          this.RL[e][f][wl] = -100+f-wl*0.001
        })
      }
    }
  }
}

const sseEvents = new EventEmitter();
let d = new DUT("1231432",1,12,[1310, 1550, 850],true)

setInterval(() => {
  let f = Math.trunc(Math.random()*d.fibers)+1
  d.IL[1][f][d.wavs[0]] = Math.trunc(Math.random()*50)/100
  d.RL[1][f][d.wavs[0]] = Math.trunc(Math.random()*20 + 50)
  // sseEvents.emit(
  //   "sse",
  //   `event: live\ndata: Fiber: ${f} IL:${d.IL[1][f][d.wavs[0]]} RL:${d.RL[1][f][d.wavs[0]]}\n\n`
  // );
}, 10);

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    //console.log(req)
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response(Bun.file("table.html"));
    if (url.pathname === "/keydown") {
      lowest = Math.min(lowest, IL)
      return new Response(`${lowest}`);
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
    if (url.pathname === "/event"){
      const stream = new ReadableStream({
        start(controller) {
          sseEvents.once("sse", () => {
            controller.enqueue(`retry: 3000\n\n`);
          });
        },
        pull(controller) {
          sseEvents.on("sse", (data) => {
            const queue = [Buffer.from(data)];
            const chunk = queue.shift();
            controller.enqueue(chunk);
          });
        },
        cancel(controller) {
          sseEvents.removeAllListeners("sse");
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/event-stream;charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }
  },
});

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
                <tbody id="P${sn}-tbod">`
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
  let out = `<tr class="${f}", id="P${sn}-A${f}" hx-post="/row" hx-trigger="click, keydown[key=='${f}'] from:body" hx-swap="outerHTML">\n`
  out = out + `<td>${f}</td>\n`
  for(let i = 1; i<=n; i++){
    out = out + makeCell(d, f, d.wavs[i-1], "IL")
    if (d.hasrl) out = out + makeCell(d, f, d.wavs[i-1], "RL")
  }
  out = out + `</tr>\n`
  return out
}

function makeCell(d, f ,wl, type) {
  return `<td id="${"P" + d.sn + "-A" + f + "-" + wl + "-" + type}">${(type = "IL") ? d.IL[1][f][wl] : d.RL[1][f][wl]}</td>\n`
}