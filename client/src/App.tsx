import { socket } from "./socket";
import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(false);

  const [messages, setMessages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onMessage = (message: string) => {
      setMessages((messages) => [...messages, message]);
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
      setMessages([...messages, message]);
      socket.emit("message", message);
    }
  };

  const clearButtonOnClick: React.MouseEventHandler<HTMLButtonElement> = (
    e
  ) => {
    e.preventDefault();
    setMessages([]);
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input type="text" name="message" />
        <button type="submit">send</button>
        <button onClick={clearButtonOnClick}>clear</button>
      </form>
      {messages.length ? (
        <div className="messages" ref={containerRef}>
          <ul>
            {messages.map((message, i) => (
              <li key={i} className={i % 2 ? "right" : ""}>
                <p className="message">{message}</p>
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
