import { copyFileSync } from "fs"

export class Session {
    constructor(instrument) {
        this.instrument = instrument
        this.currentDUT = 0
        this.currentFiber = 1
        this.currentEnd = 1
        this.nextDUT = 0
        this.nextFiber = 2
        this.nextEnd = 1
        this.numEnds = 1
        this.numFibers = 12
        this.firstSN = 1292001
        this.lastSN = 1292002
        this.maxIL = 0.4
        this.minRL = 55
        this.base = 12
        this.next = "end"
        this.backwards = false
        this.autoAdvance = true
        this.WL = 1550
        this.IL = -100
        this.RL = -100
        this.DUTs = []
    }
    configure(firstSN, lastSN, numFibers, base, numEnds, maxIL, minRL, wl) {
        this.firstSN = parseInt(firstSN)
        this.lastSN = parseInt(lastSN)
        this.numFibers = parseInt(numFibers)
        this.base = parseInt(base)
        this.numEnds = parseInt(numEnds)
        this.maxIL = parseFloat(maxIL)
        this.minRL = parseInt(minRL)
        this.WL = parseInt(wl)
        this.DUTs = []
    }
    makeDUTs() {
        this.DUTs = []
        for (let i = 0; i <= this.lastSN - this.firstSN; i++) {
            this.DUTs[i] = new DUT( this.firstSN + i,
                                    this.numEnds,
                                    this.numFibers,
                                    [this.WL],
                                    true,
                                    this.maxIL,
                                    this.minRL,
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
        if (this.autoAdvance) {
            console.log("advance", this.next ,this.currentDUT, this.currentEnd, this.currentFiber,this.nextDUT, this.nextEnd, this.nextFiber)
            this.currentEnd = this.nextEnd
            this.currentFiber = this.nextFiber
            this.currentDUT = this.nextDUT
            switch(this.next) {
                case "end":
                    this.nextEnd = this.getNext(this.currentEnd, this.next)
                    break;
                case "fiber":
                    this.nextFiber = this.getNext(this.currentFiber, this.next)
                    break;
                case "wl":
                    // this.currentEnd = this.nextEnd
                    // this.nextEnd += 1
                    break;
                case "dut":
                    this.nextDUT = this.getNext(this.currentDUT, this.next)
                    break;

            }
            console.log("advance after", this.next ,this.currentDUT, this.currentEnd, this.currentFiber,this.nextDUT, this.nextEnd, this.nextFiber)
            return true
        }
        return false
    }
    getNext(n, t) {
        switch(t) {
            case "end":
                if (!this.backwards) {
                    console.log("end forward", n, (n < this.numEnds))
                    if (n < this.numEnds) return ++n
                    this.nextFiber = this.getNext(this.currentFiber, "fiber")
                    return 1
                } else {
                    console.log("end backwards", n, (n > 1))
                    if (n > 1) return --n
                    this.nextFiber = this.getNext(this.currentFiber, "fiber")
                    return this.numEnds
                }
            case "fiber":
                if (!this.backwards) {
                    console.log("fiber forward", n, (n < this.numFibers))
                    if (n < this.numFibers) return ++n
                    this.nextDUT = this.getNext(this.currentDUT, "dut")
                    return 1
                } else {
                    console.log("fiber backwards", n, (n > 1))
                    if (n > 1) return --n
                    this.nextDUT = this.getNext(this.currentDUT, "dut")
                    return this.numFibers
                }
            case "wl":
                break;
            case "dut":
                if (!this.backwards) {
                    console.log("dut forward", n, (this.DUTs.length-1), (n < (this.DUTs.length-1)))
                    if (n < (this.DUTs.length-1)) return ++n
                    return 0
                } else {
                    console.log("dut backwards", n, (n > 1))
                    if (n > 0) return --n
                    return (this.DUTs.length-1)
                }

        }
    }
}

class DUT {
    constructor(sn, numEnds, numFibers, wavs, hasrl, maxIL, minRL, base, focus, isActive) {
        this.sn = sn
        this.numFibers = numFibers
        this.numEnds = numEnds
        this.wavs = wavs
        this.hasrl = hasrl
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

// nextDUT() {
//     if (this.currentDUT < this.DUTs.length - 1) {
//         this.getActiveDUT().isActive = false
//         this.currentDUT++
//         this.getActiveDUT().isActive = true
//     }
// }
// prevDUT() {
//     if (this.currentDUT > 0) {
//         this.getActiveDUT().isActive = false
//         this.currentDUT--
//         this.getActiveDUT().isActive = true
//     }
// }
// nextFiber() {
//     if (this.currentFiber < this.numFibers) {
//         this.currentFiber++
//     } else {
//         this.currentFiber = 1
//         this.nextDUT()
//     }
// }
// prevDUT() {
//     if (this.currentDUT > 0) {
//         this.getActiveDUT().isActive = false
//         this.currentDUT--
//         this.getActiveDUT().isActive = true
//     }
// }
// nextEnd() {
//     if (this.currentEnd < this.numEnds) {
//         this.currentEnd++
//     } else {
//         this.currentEnd = 1
//         this.nextDUT()
//     }
// }
// prevEnd() {
//     if (this.currentEnd <= 1) {
//         this.currentEnd--
//     } else {
//         this.currentEnd = this.numEnds
//         this.prevDUT()
//     }
// }

// next() {
//     if (this.focusEnd == this.numEnds) {
//        if (this.focusFiber >= this.numFibers) {
//             this.focusFiber = 1
//             return false
//         }
//         else {
//             this.focusFiber++
//             if (this.focusEnd > 1) this.focusEnd--
//             return true
//         } 
//     } else {
//         this.focusEnd++
//         return true
//     }
// }
// prev() {
//     if (this.focusEnd == 1) {
//         if (this.focusFiber <= 1) {
//             this.focusFiber = this.numFibers
//             return false
//         }
//         else {
//             this.focusFiber--
//             if (this.numEnds > 1) this.focusEnd++
//             return true
//         }
//     } else {
//         this.focusEnd--
//         return true
//     }
// }