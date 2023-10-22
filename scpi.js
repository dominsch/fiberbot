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
    devices[0] = ["tester", "localhost", parseInt(Bun.argv[2]) || 8301]
}

devices.forEach(async d => {
    console.log(`${d[0]} started listening on ${d[1]}:${d[2]}`)
    Bun.listen({
        hostname: d[1],
        port: d[2],
        socket: {
            async data(socket, data) {
                console.log(d[0], data.toString())
                await Bun.sleep(Math.random()*500)
                if(Math.random() <= 0.02) {
                    console.log("oops")
                    return 0
                }
                if (data.toString().search(/\*IDN\?/g) != -1){
                    socket.write(d[0] + ending)
                }
                if (data.toString().search(/:FETCH:LOSS\?/g) != -1){
                    socket.write(Math.trunc(Math.random()*50)/100 + ending)
                }
                if (data.toString().search(/:FETCH:ORL\?/g) != -1){
                    socket.write(Math.trunc(Math.random()*20 + 50) + ending)
                }
            }, // message received from client
            open(socket) {console.log("open ", d[0])}, // socket opened
            close(socket) {console.log("close ", d[0])}, // socket closed
            drain(socket) {console.log("drain ", d[0])}, // socket ready for more data
            error(socket, error) {console.log("error ", d[0])}, // error handler
        },
    });
});

