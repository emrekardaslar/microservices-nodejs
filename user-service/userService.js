const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

let users = []; // In-memory storage for users
let channel; // RabbitMQ channel

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) throw err;
    connection.createChannel((err, ch) => {
      if (err) throw err;
      channel = ch;
      channel.assertExchange("order_events", "fanout", { durable: false });
    });
  });
}

// Register a user
function registerUser(req, res) {
  const { username, email } = req.body;
  const newUser = { id: users.length + 1, username, email };
  users.push(newUser);
  res.status(201).send(newUser);
}

// Start the server
function startServer() {
  app.post("/register", registerUser);

  app.listen(PORT, () => {
    console.log(`User Service running on http://localhost:${PORT}`);
  });
}

// Initialize the service
function init() {
  connectRabbitMQ();
  startServer();
}

init();
