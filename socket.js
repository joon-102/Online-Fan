const SocketIO = require("socket.io");

let step = 2
let username = "아 더워.."

module.exports = (server) => {
  const io = SocketIO(server, { path: "/socket.io" });

  io.on("connection", (socket) => {
    console.log("socket on")

    socket.emit("step", { step : step , username : username });

    socket.on("plus", async (arg) => {
      console.log("plus")
      if (step < 5) {
        step++;
      }
      username = arg.username
      io.sockets.emit('step', { step : step , username : username })
    })

    socket.on("minus", async (arg) => {
      console.log("minus")
      if (step > 1) {
        step--;
      }
      username = arg.username
      io.sockets.emit('step', { step : step , username : username })
    })

    socket.on('disconnect', function () {
      // do nothing
    });
    
  });
};