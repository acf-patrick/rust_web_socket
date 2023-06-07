type Event = {
  event: string;
  targets: string[];
  data: any;
};

type Callback = (data?: any) => void;

class SocketConnection {
  private socket: WebSocket;
  private targets: string[];
  private callbacks: Map<string, Set<Callback>>; // event -> callback list
  private oneTimeCallbacks: Map<string, Set<Callback>>; // event -> callback list
  private id: string = "";

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.targets = [];
    this.callbacks = new Map();
    this.oneTimeCallbacks = new Map();

    this.once("connection", (data: { id: string }) => {
      this.id = data.id;
    });

    this.socket.onclose = () => {
      let callbacks = this.callbacks.get("disconnection");
      if (callbacks) {
        for (const callback of callbacks) callback();
      }

      callbacks = this.oneTimeCallbacks.get("disconnection");
      if (callbacks) {
        for (const callback of callbacks) callback();
      }
      this.oneTimeCallbacks.delete("disconnection");

      this.id = "";
    };

    this.socket.onmessage = (event) => {
      try {
        const msg: Event = JSON.parse(event.data);
        const eventType = msg.event;

        // handle in method 'onclose'
        if (eventType === "disconnection") return;

        {
          const callbacks = this.callbacks.get(eventType);
          if (callbacks) {
            for (const callback of callbacks) {
              callback(msg.data);
            }
          }
        }

        const callbacks = this.oneTimeCallbacks.get(eventType);
        if (callbacks) {
          for (const callback of callbacks) {
            callback(msg.data);
          }
        }
        this.oneTimeCallbacks.delete(eventType);
      } catch (e) {
        console.error(e);
      }
    };
  }

  to(target: string) {
    this.targets.push(target);
    return this;
  }

  emit(event: string, data: any) {
    if (event === "disconnection" || event === "connection") {
      console.error("Not allowed to emit this event.");
      return;
    }

    const msg: Event = {
      event: event,
      data: data,
      targets: this.targets,
    };
    this.socket.send(JSON.stringify(msg));
    this.targets = [];
  }

  once(event: string, callback: Callback) {
    if (!this.oneTimeCallbacks.has(event))
      this.oneTimeCallbacks.set(event, new Set());
    const callbacks = this.oneTimeCallbacks.get(event)!;
    callbacks.add(callback);
  }

  on(event: string, callback: Callback) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    const callbacks = this.callbacks.get(event)!;
    callbacks.add(callback);
  }

  off(event: string, callback?: Callback) {
    if (callback) {
      {
        const callbacks = this.callbacks.get(event);
        if (callbacks) callbacks.delete(callback);
      }

      const callbacks = this.oneTimeCallbacks.get(event);
      if (callbacks) callbacks.delete(callback);
    } else {
      this.callbacks.delete(event);
      this.oneTimeCallbacks.delete(event);
    }
  }

  getId() {
    return this.id.slice();
  }
}

const socket = new SocketConnection("ws://localhost:8080/ws");

export { socket };
