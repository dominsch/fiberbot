//sudo mount -t cifs //[IP_Address]/[share_name] /mnt/TestData -o username=[username]

export async function makeCSV(duts, sess) {
    let tester = "Anon"
    let chassis = sess.instrument
    let start = sess.startTime
    let end = new Date(Date.now())
    let partName = "" + sess.numEnds + "X" + sess.numFibers + "f" 
    let wlString = ""
    for (let wl of duts[0].wavs) {
        wlString += `,${wl}nm`
        partName += "-" + wl
    }
    if (duts[0].hasrl) wlString += wlString
    console.log(tester, chassis, start, end, partName, wlString)

    let header = 
`PART#,${partName}
TESTER,${tester}
CHASSIS,${chassis}
MODULE,123
START,${start.toLocaleDateString('en-CA')} ${start.toLocaleTimeString('de-CA')}
FINISH,${end.toLocaleDateString('en-CA')} ${end.toLocaleTimeString('de-CA')}
CUSTOM1,
CUSTOM2,
CUSTOM3,
CUSTOM4,
CUSTOM5,
NOTES,

RESULTS,,,IL(dB),${duts[0].hasrl ? "RL(dB)" : ""}
SERIAL#,INPUT,OUTPUT${wlString}\n`

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
                results += "\n"
            }
        }
    }
    const csv = header + results
    await Bun.write("test.csv", csv);
}