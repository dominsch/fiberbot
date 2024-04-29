import { main } from "bun"

module.exports = {
  apps : [{
    name   : "status",
    script : "./status.js",
    interpreter: "/home/admin/.bun/bin/bun"
  },{
    name   : "map1",
    script : "./main.js",
    interpreter: "/home/admin/.bun/bin/bun",
    interpreter_args : "map137.json"
  }]
}

//pm2 start main.js --name "map3" --interpreter "/home/admin/.bun/bin/bun" -- map3.json
