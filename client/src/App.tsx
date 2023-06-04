import { socket } from "./socket";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const onOpen = () => {
      console.log("Connected to web socket server.");

      socket.send("Hello world");
    };

    const onClose = () => {
      console.log("Disconnected from web socket server");
    };

    const onMessage = (e: any) => {
      const data = e.data;
      setMessages((messages) => [...messages, data]);
    };

    const onError = (error: any) => {
      console.error("Web socket error : ", error);
    };

    const callbacks = [
      ["open", onOpen],
      ["close", onClose],
      ["message", onMessage],
      ["error", onError],
    ];

    callbacks.forEach(([event, callback]: any) => {
      socket.addEventListener(event, callback);
    });

    return () => {
      callbacks.forEach(([event, callback]: any) =>
        socket.removeEventListener(event, callback)
      );
    };
  }, []);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const input: HTMLInputElement = event.currentTarget.message;
    socket.send(input.value);
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <input type="text" name="message" />
        <button>send</button>
      </form>
      <ul>
        {messages.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
