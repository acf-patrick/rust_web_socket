mod lobby;
mod messages;
mod ws;

use actix::{Actor, Addr};
use actix_cors::Cors;
use actix_web::{get, web, App, Error, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_web_actors::ws::start as ws_start;
use lobby::Lobby;
use uuid::Uuid;

use ws::WebSocketConn;

#[get("/{group_id}")]
pub async fn start_connection(
    req: HttpRequest,
    stream: web::Payload,
    group_id: web::Path<Uuid>,
    srv: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, Error> {
    let ws = WebSocketConn::new(group_id.to_owned(), srv.get_ref().clone());
    let res = ws_start(ws, &req, stream)?;
    Ok(res)
}

#[get("/")]
async fn index() -> impl Responder {
    "Hello world!"
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Create and spin up a lobby
    let chat_server = Lobby::default().start();

    println!("Server running on port 8080");
    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();
        App::new()
            .wrap(cors)
            .service(index)
            .service(start_connection)
            .app_data(web::Data::new(chat_server.clone()))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
