import { socket } from "./socket";
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [isConnected, setIsConnected] = useState(false);

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
    </div>
  );
}

export default App;
