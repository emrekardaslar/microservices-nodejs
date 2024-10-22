const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3003;

app.use(bodyParser.json());

let shipments = []; // In-memory storage for shipments
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
  const shipment = {
    id: shipments.length + 1,
    orderId: order.id,
    status: "Processing",
  };
  shipments.push(shipment);
  console.log(
    `Shipment created for order ${order.id}: ${JSON.stringify(shipment)}`
  );
}

// Get all shipments
app.get("/shipments", (req, res) => {
  res.status(200).json(shipments);
});

app.listen(PORT, () => {
  console.log(`Shipping Service running on http://localhost:${PORT}`);
  connectRabbitMQ();
});
