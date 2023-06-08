import { WebSocketConnection } from "./socket";
import { useEffect, useRef, useState } from "react";
import "./App.css";

const socket = new WebSocketConnection("ws://localhost:8080/ws");

type Message = {
  text: string;
  incoming: boolean;
};

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log(socket.getId());
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onMessage = (message: string) => {
      setMessages((messages) => [
        ...messages,
        { text: message, incoming: true },
      ]);
    };

    socket.on("connection", onConnect);
    socket.on("disconnection", onDisconnect);
    socket.on("message", onMessage);

    return () => {
      socket.off("connection", onConnect);
      socket.off("disconnection", onDisconnect);
      socket.off("message", onMessage);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const input: HTMLInputElement = event.currentTarget.message;
    const message = input.value;
    if (message) {
      setMessages([...messages, { text: message, incoming: false }]);
      socket.emit("message", message);
      input.value = "";
    }
  };

  const clearButtonOnClick: React.MouseEventHandler<HTMLButtonElement> = (
    e
  ) => {
    e.preventDefault();
    setMessages([]);
  };

  const connectionButtonOnClick = (connected: boolean) => {
    if (connected) {
      socket.disconnect();
    } else {
      socket.reconnect();
    }
  };

  return (
    <div>
      <header>
        <form onSubmit={onSubmit}>
          <input type="text" name="message" />
          <button type="submit">send</button>
          <button onClick={clearButtonOnClick}>clear</button>
        </form>
        <button
          className="connection-btn"
          onClick={(e) => {
            e.preventDefault();
            connectionButtonOnClick(isConnected);
          }}
        >
          {isConnected ? "disconnect" : "connect"}
          <span>{isConnected ? "✔️" : "❌"}</span>
        </button>
      </header>
      {messages.length ? (
        <div className="messages" ref={containerRef}>
          <ul>
            {messages.map((message, i) => (
              <li key={i} className={message.incoming ? "right" : ""}>
                <p className="message">{message.text}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>No message</p>
      )}
    </div>
  );
}

export default App;
