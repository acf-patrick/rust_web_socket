// use std::time::{Duration, Instant};

// use actix::{Addr, Actor, AsyncContext};
// use actix_web_actors::ws;
// use uuid::Uuid;

// const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
// const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

// struct WebSocketConn {
//     room: Uuid,
//     addr: Addr<Lobby>,
//     hb: Instant,
//     id: Uuid,
// }

// impl WebSocketConn {
//     pub fn new(room: Uuid, lobby: Addr<Lobby>) -> WebSocketConn {
//         WebSocketConn {
//             room,
//             addr: lobby,
//             hb: Instant::now(),
//             id: Uuid::new_v4(),
//         }
//     }
// }

// impl Actor for WebSocketConn {
//   type Context = ws::WebsocketContext<Self>;

//   fn started(&mut self, ctx: &mut Self::Context) {
//     self.hb(ctx);

//     let addr = ctx.address();
    
//   }
// }