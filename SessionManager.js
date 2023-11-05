export class Session {
    constructor(instrument) {
        this.instrument = instrument
        this.activeDUT = 0
        this.activeRow = 1
        this.activeEnd = 1
        this.numEnds = 1
        this.numFibers = 12
        this.firstSN = 1292001
        this.lastSN = 1292002
        this.maxIL = 0.4
        this.minRL = 55
        this.base = 12
        this.WL = 1550
        this.IL = -100
        this.RL = -100
        this.DUTs = []
    }
    configure(firstSN, lastSN, numFibers, base, numEnds, maxIL, minRL, wl) {
        this.firstSN = firstSN
        this.lastSN = lastSN
        this.numFibers = numFibers
        this.base = base
        this.numEnds = numEnds
        this.maxIL = maxIL
        this.minRL = minRL
        this.WL = wl
    }
    makeDUTs() {
        this.DUTs = []
        for (let i = 0; i <= this.lastSN - this.firstSN; i++) {
            this.DUTs[i] = new DUT( this.firstSN + i,
                                    this.numEnds,
                                    this.numFibers,
                                    [this.WL],
                                    true,
                                    this.numEnds,
                                    this.maxIL,
                                    this.minRL,
                                    this.base,
                                    1,
                                    i==this.activeDUT)
        }
    }
    getDUT(sn) {
        for (let dut of this.DUTs) {
            if (dut.sn == sn) return dut
        }
    }
    getActiveDUT() {
        return this.DUTs[this.activeDUT]
    }
    nextDUT() {
        if (this.activeDUT < this.DUTs.length - 1) {
            this.getActiveDUT().isActive = false
            this.activeDUT++
            this.getActiveDUT().isActive = true
        }
    }
    prevDUT() {
        if (this.activeDUT > 0) {
            this.getActiveDUT().isActive = false
            this.activeDUT--
            this.getActiveDUT().isActive = true
        }
    }
}

class DUT {
    constructor(sn, ends, fibers, wavs, hasrl, numEnds, maxIL, minRL, base, focus, isActive) {
        this.sn = sn
        this.fibers = fibers
        this.ends = ends
        this.wavs = wavs
        this.hasrl = hasrl
        this.numEnds = numEnds
        this.maxIL = maxIL
        this.minRL = minRL
        this.base = base
        this.focusFiber = focus
        this.focusEnd = 1
        this.isActive = isActive
        this.IL = []
        this.RL = []
        this.clearAll()
    }
    clearAll() {
        for (let e = 1; e <= this.ends; e++) {
            this.clearEnd(e)
        }
    }
    clearEnd(e) {
        this.IL[e] = []
        this.RL[e] = []
        for (let f = 1; f <= this.fibers; f++) {
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
    next() {
        if (this.focusEnd == this.ends) {
           if (this.focusFiber >= this.fibers) {
                this.focusFiber = 1
                return false
            }
            else {
                this.focusFiber++
                if (this.focusEnd > 1) this.focusEnd--
                return true
            } 
        } else {
            this.focusEnd++
            return true
        }
    }
    prev() {
        if (this.focusEnd == 1) {
            if (this.focusFiber <= 1) {
                this.focusFiber = this.fibers
                return false
            }
            else {
                this.focusFiber--
                if (this.ends > 1) this.focusEnd++
                return true
            }
        } else {
            this.focusEnd--
            return true
        }
    }
}