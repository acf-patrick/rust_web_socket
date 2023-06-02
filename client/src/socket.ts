const socket = new WebSocket(
  "ws://127.0.0.1:8080/cc72be40-deff-4b21-9465-3278d5195203"
);

socket.addEventListener("open", () => {
  console.log("Connected to web socket server.");

  socket.send("Hello world");
});

socket.addEventListener("close", () => {
  console.log("Disconnected from web socket server");
});

socket.addEventListener("message", (e) => {
  const data = e.data;
  console.log("received message : ", data);
});

socket.addEventListener("error", (error) => {
  console.error("Web socket error : ", error);
});

export { socket };
