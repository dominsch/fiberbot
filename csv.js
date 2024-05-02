//sudo mount -t cifs //[IP_Address]/[share_name] /mnt/TestData -o username=[username]

import { file } from "bun"

export async function makeCSV(duts, sess) {
    let tester = "Anon"
    let chassis = sess.instrument.name
    let start = sess.startTime
    let end = new Date(Date.now())
    let partName = "" + sess.numEnds + "x" + sess.numFibers + "F" 
    let wlString = ""
    for (let wl of duts[0].wavs) {
        wlString += `,${wl}nm`
    }
    if (duts[0].hasrl) wlString += wlString
    console.log(tester, chassis, start, end, partName, wlString)

    let header = 
`PART#,${partName}\r
TESTER,${tester}\r
CHASSIS,${chassis}\r
MODULE,123\r
START,${start.toLocaleDateString('en-CA')} ${start.toLocaleTimeString('de-CA')}\r
FINISH,${end.toLocaleDateString('en-CA')} ${end.toLocaleTimeString('de-CA')}\r
CUSTOM1,\r
CUSTOM2,\r
CUSTOM3,\r
CUSTOM4,\r
CUSTOM5,\r
NOTES,\r
\r
RESULTS,,,IL(dB),${duts[0].hasrl ? "RL(dB)" : ""}\r
SERIAL#,INPUT,OUTPUT${wlString}\r\n`

    let results = ""
    for(let d of duts) {
        for (let e = 1; e <= sess.numEnds; e++) {
            for (let f = 1; f <= sess.numFibers; f++) {
                results += `${d.sn},Fiber ${f} End ${(e==1) ? "A" : "B"},Fiber ${f} End ${(e==1) ? "B" : "A"}`
                for (let wl of d.wavs) {
                    let entry = d.IL[e][f][wl]
                    results += (entry == "-100") ? "," : `,${entry}`
                }
                for (let wl of d.wavs) {
                    if (d.hasrl) {
                        let entry = d.RL[e][f][wl]
                        results += (entry == "-100") ? "," : `,${entry}`
                    }
                }
                results += "\r\n"
            }
        }
    }
    const csv = header + results
    const fileName = chassis + "_" + partName + "_P" + duts[0].sn + ((duts.length > 1) ? ("-P" + duts[duts.length-1].sn) : "") + ".csv"
    let path = (process.arch == "x64") ? "C:/TestData/" : "/mnt/TestData/Unprocessed"
    await Bun.write(path + fileName, csv);
}