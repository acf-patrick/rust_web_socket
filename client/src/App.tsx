import { WebSocketConnection } from "./socket";
import { useEffect, useRef, useState } from "react";
import "./App.css";

const socket = new WebSocketConnection("ws://localhost:8080/ws");

type Message = {
  text: string;
  incoming: boolean;
};

type RoomEventData = {
  id: string;
  room: string;
};

let intervalHandle = -1;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const roomInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isConnected) {
      intervalHandle = setInterval(() => {
        socket.reconnect();
        console.log("reconnecting...");
      }, 3000);
    } else {
      clearInterval(intervalHandle);
      intervalHandle = -1;
    }

    return () => {
      clearInterval(intervalHandle);
      intervalHandle = -1;
    };
  }, [isConnected]);

  useEffect(() => {
    const onConnect = () => {
      console.log(`Connected with ID : ${socket.getId()}`);
      setIsConnected(true);
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

    const onJoinRoom = (data: RoomEventData) => {
      console.log(data);
    };

    const onLeaveRoom = (data: RoomEventData) => {
      console.log(data);
    };

    const callbacks: { [key: string]: any } = {
      connection: onConnect,
      disconnection: onDisconnect,
      join: onJoinRoom,
      leave: onLeaveRoom,
      message: onMessage,
    };

    for (const event in callbacks) socket.on(event, callbacks[event]);

    return () => {
      for (const event in callbacks) socket.off(event, callbacks[event]);
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

  const roomOnSubmit = (room: string, join: boolean) => {
    if (join) {
      socket.join(room);
      setRooms((rooms) => [...rooms, room]);
    } else {
      socket.leave(room);
      setRooms((rooms) => rooms.filter((r) => r !== room));
    }
  };

  return (
    <div>
      <header>
        <form className="room-input" onSubmit={(e) => e.preventDefault()}>
          <input type="text" ref={roomInputRef} />
          <button
            onClick={(e) => {
              e.preventDefault();
              const input = roomInputRef.current;
              if (input) {
                roomOnSubmit(input.value, true);
              }
            }}
          >
            join
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              const input = roomInputRef.current;
              if (input) {
                roomOnSubmit(input.value, false);
              }
            }}
          >
            leave
          </button>
        </form>
        <form className="message-input" onSubmit={onSubmit}>
          <input type="text" name="message" />
          <button title="send message" type="submit">
            ✉️
          </button>
          <button title="clear messages" onClick={clearButtonOnClick}>
            🛇
          </button>
        </form>
        <button
          className="connection-btn"
          onClick={(e) => {
            e.preventDefault();
            connectionButtonOnClick(isConnected);
          }}
        >
          <span>{isConnected ? "disconnect" : "connect"}</span>
          <div className="pipe"></div>
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
