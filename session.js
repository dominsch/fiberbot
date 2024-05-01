export class Session {
    constructor(instrument) {
        this.instrument = instrument
        this.currentDUT = 0
        this.currentFiber = 1
        this.currentEnd = 1
        this.currentWL = instrument.activeWL
        this.nextDUT = 0
        this.nextFiber = 2
        this.nextEnd = 1
        this.nextWL = instrument.activeWL
        this.numEnds = 1
        this.numFibers = 12
        this.wavelengths = []
        this.firstSN = 1292001
        this.lastSN = 1292002
        this.maxIL = [0, 0.4, 0.4]
        this.minRL = [0, 55, 55]
        this.base = 12
        this.next = "end"
        this.backwards = false
        this.autoAdvance = true
        this.switchAdvance = false

        this.strict = false
        
        this.IL = -100
        this.RL = -100
        this.valid = false
        this.DUTs = []
    }
    configure(firstSN, lastSN, numFibers, base, numEnds, maxILA, maxILB, minRLA, minRLB, wls) {
        console.log("configure: ", firstSN, lastSN, numFibers, base, numEnds, maxILA, maxILB, minRLA, minRLB, wls)
        this.firstSN = parseInt(firstSN)
        this.lastSN = parseInt(lastSN)
        this.numFibers = parseInt(numFibers)
        this.base = parseInt(base)
        this.numEnds = parseInt(numEnds)
        this.maxIL[1] = parseFloat(maxILA)
        this.maxIL[2] = parseFloat(maxILB)
        this.minRL[1] = parseInt(minRLA)
        this.minRL[2] = parseInt(minRLB)
        this.wavelengths = wls.map(function (x) {return parseInt(x)})
        this.currentWL = parseInt(wls[0])
        this.nextWL = this.currentWL
        this.DUTs = []
    }
    makeDUTs() {
        this.DUTs = []
        for (let i = 0; i <= this.lastSN - this.firstSN; i++) {
            this.DUTs[i] = new DUT( this.firstSN + i,
                                    this.numEnds,
                                    this.numFibers,
                                    this.wavelengths,
                                    true,
                                    // this.maxIL,
                                    // this.minRL,
                                    this.base,
                                    1,
                                    i==this.currentDUT)
        }
    }
    getDUT(sn) {
        for (let dut of this.DUTs) {
            if (dut.sn == sn) return dut
        }
    }
    getActiveDUT() {
        return this.DUTs[this.currentDUT]
    }
    advance() {
        this.valid = false
        this.currentEnd = this.nextEnd
        this.currentFiber = this.nextFiber
        this.currentDUT = this.nextDUT
        this.currentWL = this.nextWL
        console.log("current position: ", this.currentEnd , this.nextEnd,
            this.currentFiber , this.nextFiber,
            this.currentDUT ,this.nextDUT,
            this.currentWL,this.nextWL)
        switch(this.next) {
            case "end":
                this.nextEnd = this.getNext(this.currentEnd, this.next)
                break;
            case "fiber":
                this.nextFiber = this.getNext(this.currentFiber, this.next)
                break;
            case "wl":
                console.log("current wl ", this.currentWL, " next wl ", this.nextWL)
                this.nextWL = this.getNext(this.currentWL, this.next)
                console.log("current wl ", this.currentWL, " next wl ", this.nextWL)
                break;
            case "dut":
                this.nextDUT = this.getNext(this.currentDUT, this.next)
                break;

        }     
    }
    getNext(n, t) {
        switch(t) {
            case "end":
                if (!this.backwards) {
                    if (n < this.numEnds) return ++n
                    this.nextFiber = this.getNext(this.currentFiber, "fiber")
                    return 1
                } else {
                    if (n > 1) return --n
                    this.nextFiber = this.getNext(this.currentFiber, "fiber")
                    return this.numEnds
                }
            case "fiber":
                if (!this.backwards) {
                    if (n < this.numFibers) return ++n
                    this.nextDUT = this.getNext(this.currentDUT, "dut")
                    return 1
                } else {
                    if (n > 1) return --n
                    this.nextDUT = this.getNext(this.currentDUT, "dut")
                    return this.numFibers
                }
            case "wl":
                console.log("wlll", this.wavelengths, this.wavelengths.indexOf(1310), this.wavelengths.indexOf(n), this.wavelengths.indexOf(n+1),this.wavelengths.indexOf(n))
                let i = this.wavelengths.indexOf(n)
                if (!this.backwards) {
                    if (i < this.wavelengths.length-1){
                        console.log("debug ", i < this.wavelengths.length-1,n, this.wavelengths[i+1])
                        return this.wavelengths[++i]
                    } 
                    this.nextFiber = this.getNext(this.currentFiber, "fiber")
                    return this.wavelengths[0]
                } else {
                    if (this.wavelengths.indexOf(n) > 0) return this.wavelengths[--i]
                    this.nextFiber = this.getNext(this.currentFiber, "fiber")
                    return this.wavelengths[1]
                }
            case "dut":
                if (!this.backwards) {
                    if (n < (this.DUTs.length-1)) return ++n
                    return 0
                } else {
                    if (n > 0) return --n
                    return (this.DUTs.length-1)
                }

        }
    }
}

class DUT {
    constructor(sn, numEnds, numFibers, wavs, hasrl, base, focus, isActive) {
        this.sn = sn
        this.numFibers = numFibers
        this.numEnds = numEnds
        this.wavs = wavs
        this.hasrl = hasrl
        this.base = base
        this.focusFiber = focus
        this.focusEnd = 1
        this.isActive = isActive
        this.IL = []
        this.RL = []
        this.clearAll()
    }
    clearAll() {
        for (let e = 1; e <= this.numEnds; e++) {
            this.clearEnd(e)
        }
    }
    clearEnd(e) {
        this.IL[e] = []
        this.RL[e] = []
        for (let f = 1; f <= this.numFibers; f++) {
            this.clearFiber(f, e)
        }
    }
    clearFiber(f, e = 1) {
        this.IL[e][f] = {}
        this.RL[e][f] = {}
        this.wavs.forEach(wl => {
            this.IL[e][f][wl] = -100
            this.RL[e][f][wl] = -100
        })
    }
}
