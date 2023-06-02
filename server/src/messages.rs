use actix::{Message, Recipient};
use uuid::Uuid;

/// WebSocketConn responds to this to pipe it through to the actual client
#[derive(Message)]
#[rtype(result = "()")]
pub struct WebSocketMessage(pub String);

/// WebSocketConn sends this to the lobby to request login
#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub addr: Recipient<WebSocketMessage>,
    pub lobby_id: Uuid,
    pub self_id: Uuid,
}

/// WebSocketConn sends this to a lobby to request logout
#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub room_id: Uuid,
    pub id: Uuid,
}

/// Client sends this to the lobby for the lobby to echo out.
#[derive(Message)]
#[rtype(result = "()")]
pub struct ClientActorMessage {
    pub id: Uuid,
    pub msg: String,
    pub room_id: Uuid,
}

