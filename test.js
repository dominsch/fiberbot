var mutex
var resolver
function lock(){
    mutex = new Promise((resolve) => {
        resolver = resolve
    })
    return mutex
}
function unlock() {
    resolver()
}


async function f() {
    console.log("1")
    await lock()
    console.log("2")
}

f()

console.log("3")
unlock()