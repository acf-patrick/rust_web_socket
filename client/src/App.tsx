import { WebSocketConnection } from "./socket";
import { useEffect, useRef, useState } from "react";
import "./App.css";

const socket = new WebSocketConnection("ws://10.13.104.216:8080/ws");

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
  const [rooms, setRooms] = useState<
    {
      name: string;
      target: boolean;
    }[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
      setRooms([]);
    };

    const onMessage = (message: string) => {
      setMessages((messages) => [
        ...messages,
        { text: message, incoming: true },
      ]);
    };

    const onJoinRoom = () => {
      // console.log(data);
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

      let send = false;
      rooms.forEach((room) => {
        if (room.target) {
          send = true;
          socket.to(room.name);
        }
      });
      if (send) socket.emit("message", message);

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

  const joinRoom = (room: string) => {
    socket.join(room);
    setMessages([]);
    setRooms((rooms) =>
      rooms.find((r) => r.name === room)
        ? rooms
        : [...rooms, { name: room, target: true }]
    );
  };

  return (
    <div id="app-container">
      <div className="rooms" ref={sidebarRef}>
        <button
          className="close"
          onClick={() => {
            const sidebar = sidebarRef.current;
            if (sidebar) {
              sidebar.style.transform = "translateX(-120%)";
            }
          }}
        >
          ❌
        </button>
        <form
          className="room-input"
          onSubmit={(e) => {
            e.preventDefault();
            const input: HTMLInputElement = e.currentTarget.input;
            joinRoom(input.value);
          }}
        >
          <input name="input" type="text" placeholder="Join a room" />
          <button id="join">🔗</button>
        </form>
        <p>Joined rooms 🏠</p>
        <ul>
          {rooms.map((room, i) => (
            <li key={i}>
              <div className="room">
                <label
                  className="name"
                  title="Select as target"
                  htmlFor={`${i}`}
                >
                  {room.name}
                </label>
                <input
                  type="checkbox"
                  name="used"
                  id={`${i}`}
                  checked={room.target}
                  onChange={() => {
                    setRooms((r) => {
                      const rooms = r.map((room) => {
                        return { name: room.name, target: room.target };
                      });
                      const room = rooms[i];
                      room.target = !room.target;
                      return [...rooms];
                    });
                  }}
                />
                <button
                  onClick={(e) => {
                    const parent = e.currentTarget.parentElement;
                    parent?.classList.toggle("disappear", true);

                    setTimeout(() => {
                      parent?.classList.toggle("disappear", false);
                      socket.leave(room.name);
                      setRooms((rooms) =>
                        rooms.filter((r) => r.name !== room.name)
                      );
                    }, 500);
                  }}
                  title="Leave"
                >
                  🏃🏽‍♂️
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <main>
        <header>
          <button
            className="room-menu"
            onClick={() => {
              const sidebar = sidebarRef.current;
              if (sidebar) {
                sidebar.style.transform = "translateX(0)";
              }
            }}
          >
            🏘️
          </button>
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
      </main>
    </div>
  );
}

export default App;
