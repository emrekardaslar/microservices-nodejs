const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

let orders = []; // In-memory storage for orders
let channel; // RabbitMQ channel

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) throw err;
    connection.createChannel((err, ch) => {
      if (err) throw err;
      channel = ch;
      channel.assertExchange("order_events", "fanout", { durable: false });
      channel.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;
        channel.bindQueue(q.queue, "order_events", "");

        console.log("Waiting for messages in %s", q.queue);
        channel.consume(q.queue, handleOrderMessage, { noAck: true });
      });
    });
  });
}

// Handle incoming order messages
function handleOrderMessage(msg) {
  const order = JSON.parse(msg.content.toString());
  console.log(`Order received: ${JSON.stringify(order)}`);
}

// Place an order
function placeOrder(req, res) {
  const { userId, items } = req.body;
  const newOrder = { id: orders.length + 1, userId, items };
  orders.push(newOrder);

  // Publish event to RabbitMQ
  channel.publish("order_events", "", Buffer.from(JSON.stringify(newOrder)));

  res.status(201).send(newOrder);
}

// Start the server
function startServer() {
  app.post("/order", placeOrder);

  app.listen(PORT, () => {
    console.log(`Order Service running on http://localhost:${PORT}`);
  });
}

// Initialize the service
function init() {
  connectRabbitMQ();
  startServer();
}

init();
