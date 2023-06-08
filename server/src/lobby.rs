use std::{
    collections::{HashMap, HashSet},
    str::FromStr,
};

use crate::messages::{ClientActorMessage, Connect, Disconnect, EventMessage, WebSocketMessage};
use actix::{Actor, Context, Handler, Recipient};
use serde::Serialize;
use serde_json::json;
use uuid::Uuid;

type Socket = Recipient<WebSocketMessage>;

// Data types sent with EventMessage
mod datas {
    use super::*;

    #[derive(Serialize)]
    pub struct UserId {
        pub id: Uuid,
    }

    #[derive(Serialize)]
    pub struct JoinRoom {
        pub room: String,
        pub id: Uuid,
    }
}

pub struct Lobby {
    /// self id -> self mail box
    pub sessions: HashMap<Uuid, Socket>,
    /// room id -> list of users id
    pub rooms: HashMap<String, HashSet<Uuid>>,
}

impl Default for Lobby {
    fn default() -> Self {
        Lobby {
            sessions: HashMap::new(),
            rooms: HashMap::new(),
        }
    }
}

impl Lobby {
    fn send_message(&self, message: &str, id_to: &Uuid) {
        if let Some(socket_recipient) = self.sessions.get(id_to) {
            socket_recipient.do_send(WebSocketMessage(message.to_owned()));
        } else {
            eprintln!("Attempting to send message but couldn't find user id.");
        }
    }

    fn send_event<T: Serialize>(&self, event: &str, data: T, id_to: &Uuid) {
        let event = EventMessage {
            event: String::from(event),
            data,
            targets: vec![],
        };
        self.send_message(&json!(event).to_string(), id_to);
    }
}

impl Actor for Lobby {
    type Context = Context<Self>;
}

impl Handler<Disconnect> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Self::Context) -> Self::Result {
        if self.sessions.remove(&msg.id).is_some() {
            // retrieve rooms holding msg.id
            let rooms: Vec<String> = self
                .rooms
                .iter()
                .filter(|(_, v)| v.contains(&msg.id))
                .map(|(k, _)| k.clone())
                .collect();

            let mut roommates: Vec<Uuid> = vec![];
            for room in rooms.iter() {
                for id in self.rooms.get(room).unwrap() {
                    if id != &msg.id {
                        roommates.push(id.clone());
                    }
                }
            }

            for id_to in roommates {
                self.send_event("disconnection", datas::UserId { id: msg.id }, &id_to);
            }

            for room in rooms {
                if let Some(lobby) = self.rooms.get_mut(&room) {
                    if lobby.len() > 1 {
                        lobby.remove(&msg.id);
                    } else {
                        // Only one in the lobby, remove it entirely
                        self.rooms.remove(&room);
                    }
                }
            }
        }
    }
}

impl Handler<Connect> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: Connect, _: &mut Self::Context) -> Self::Result {
        let global = String::new();

        // Create a room with "empty" name, all client belong there by default
        self.rooms
            .entry(global.clone())
            .or_insert(HashSet::new())
            .insert(msg.self_id);

        // Store the address
        self.sessions.insert(msg.self_id, msg.addr);

        // Send to connection response to client
        self.send_event("connection", datas::UserId { id: msg.self_id }, &msg.self_id);
    }
}

impl Handler<ClientActorMessage> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: ClientActorMessage, _: &mut Self::Context) -> Self::Result {
        if let Ok(event) = serde_json::from_str::<EventMessage<String>>(&msg.msg) {
            if event.targets.is_empty() {
                let rooms: Vec<String> = self
                    .rooms
                    .iter()
                    .filter(|(_, v)| v.contains(&msg.id))
                    .map(|(k, _)| k.clone())
                    .collect();
                for room in rooms {
                    if let Some(users) = self.rooms.get(&room) {
                        for target_id in users {
                            if *target_id != msg.id {
                                self.send_event(&event.event, event.data.clone(), target_id);
                            }
                        }
                    }
                }
            } else {
                for target in event.targets {
                    if let Ok(target_id) = Uuid::from_str(&target) {
                        // client ID
                        self.send_event(&event.event, event.data.clone(), &target_id);
                    } else {
                        // room name
                        let room = target;
                        if let Some(users) = self.rooms.get(&room) {
                            for target_id in users {
                                if *target_id != msg.id {
                                    self.send_event(&event.event, event.data.clone(), target_id);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            eprintln!("Bad event type.");
        }
    }
}
