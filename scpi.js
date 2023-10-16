let ending = "\n"

Bun.listen({
	hostname: "localhost",
	port: Bun.argv[2] || 8301,
	socket: {
        data(socket, data) {
        console.log(data, data.toString())
            if (data.toString().search(/\*IDN\?/g) != -1){
                socket.write(`bun server 1` + ending)
            }
            if (data.toString().search(/:FETCH:LOSS\?/g) != -1){
                socket.write(Math.trunc(Math.random()*50)/100 + ending)
            }
            if (data.toString().search(/:FETCH:ORL\?/g) != -1){
                socket.write(Math.trunc(Math.random()*20 + 50) + ending)
            }
        }, // message received from client
        open(socket) {console.log("open")}, // socket opened
        close(socket) {console.log("close")}, // socket closed
        drain(socket) {console.log("drain")}, // socket ready for more data
        error(socket, error) {console.log("error")}, // error handler
	},
});

  