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
      channel.assertExchange("user_events", "fanout", { durable: false });
      channel.assertExchange("order_events", "fanout", { durable: false }); // Declare the order_events exchange

      // Create a temporary queue for consuming messages
      channel.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;

        // Bind the queue to the order events exchange
        channel.bindQueue(q.queue, "order_events", "");

        console.log("Waiting for order messages in %s", q.queue);
        channel.consume(q.queue, handleOrderMessage, { noAck: true });
      });
    });
  });
}

// Handle incoming order messages
function handleOrderMessage(msg) {
  const order = JSON.parse(msg.content.toString());
  console.log(
    `Order created for userId ${order.userId}: ${JSON.stringify(order)}`
  );
  // You can perform actions here based on the new order, like updating user status, etc.
}

// Register a user
function registerUser(req, res) {
  const { username, email } = req.body;
  const newUser = { id: users.length + 1, username, email };
  users.push(newUser);

  // Publish user event to RabbitMQ
  channel.publish("user_events", "", Buffer.from(JSON.stringify(newUser)));
  console.log(`User registered: ${JSON.stringify(newUser)}`);

  res.status(201).send(newUser);
}

// Start the server
function startServer() {
  app.post("/register", registerUser);

  // Get all users
  app.get("/users", (req, res) => {
    res.status(200).json(users);
  });

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
