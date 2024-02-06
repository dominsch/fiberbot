let devices = []
let ending = "\n"
let path
if (Bun.argv[2]) {
    path = Bun.argv[2].match( /.*\.json/g )
}
console.log(path)
if (path) {
    const file = Bun.file(path[0]);
    console.log(file)
    devices = await file.json();
    console.log(devices)
} else {
    devices[0] = ["tester", "localhost", parseInt(Bun.argv[2]) || 8100]
}

devices.forEach(async d => {
    console.log(`${d[0]} started listening on ${d[1]}:${d[2]}`)
    Bun.listen({
        hostname: d[1],
        port: d[2],
        socket: {
            async data(socket, data) {
                console.log("> ", d[0], data.toString().trim(), " #", data.length)
                await Bun.sleep(Math.random()*1000)
                let res = ""
                if(Math.random() <= 0.0005) {
                    console.log("oops")
                    return 0
                }
                if (data.toString().search(/\*IDN\?/g) != -1){

                    res = d[0] + ",1,1,1"
                }
                if (data.toString().search(/:FETCH:LOSS\?/g) != -1){
                    res = (Math.random()*0.5-0.1).toFixed(2)
                }
                if (data.toString().search(/:FETCH:ORL\?/g) != -1){
                    res = ((Math.random()*20) + 50).toFixed(1)
                }
                if (data.toString().search(/OPC\?/g) != -1){
                    res = 1
                }
                console.log("< ", res + ending)
                socket.write(res + ending)
            }, // message received from client
            open(socket) {console.log("open ", d[0])}, // socket opened
            close(socket) {console.log("close ", d[0])}, // socket closed
            drain(socket) {console.log("drain ", d[0])}, // socket ready for more data
            error(socket, error) {console.log("error ", d[0])}, // error handler
        },
    });
});

