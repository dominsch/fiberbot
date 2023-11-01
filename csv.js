export async function makeCSV(duts) {
    let wlString = ""
    for (let wl of duts[0].wavs) {
        wlString += `,${wl}nm`
    }
    if (duts[0].hasrl) wlString += wlString
    let header = 
`PART#,DUT
TESTER,Anon
CHASSIS,1234
MODULE,123
START,2023
FINISH,2023
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
        console.log("dut", d.sn)
        for (let e = 1; e <= d.ends; e++) {
            console.log("end", e)
            for (let f = 1; f <= d.fibers; f++) {
                console.log("f", f)
                results += `${d.sn},Fiber ${f} End ${(e==1) ? "A" : "B"},Fiber ${f} End ${(e==1) ? "B" : "A"}`
                for (let wl of d.wavs) {
                    results += `,${d.IL[e][f][wl]}`
                }
                if (d.hasrl) {
                    for (let wl of d.wavs) {
                        results += d.hasrl ? `,${d.RL[e][f][wl]}\n` : "\n"
                    }
                }
            }
        }
    }
    const csv = header + results
    console.log(csv)
    await Bun.write("test.csv", csv);
}