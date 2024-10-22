const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3002;

app.use(bodyParser.json());

let inventory = [
  { id: 1, item: "Laptop", quantity: 100 },
  { id: 2, item: "Phone", quantity: 200 },
]; // In-memory storage for inventory items
let channel;

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

        console.log("Waiting for order messages in %s", q.queue);
        channel.consume(q.queue, handleOrderMessage, { noAck: true });
      });
    });
  });
}

// Handle incoming order messages
function handleOrderMessage(msg) {
  const order = JSON.parse(msg.content.toString());
  console.log(`Processing order in Inventory: ${JSON.stringify(order)}`);
  // Here, you would update the inventory based on the ordered items.
}

// Get inventory
app.get("/inventory", (req, res) => {
  res.status(200).json(inventory);
});

app.listen(PORT, () => {
  console.log(`Inventory Service running on http://localhost:${PORT}`);
  connectRabbitMQ();
});
