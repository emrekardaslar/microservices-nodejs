const express = require("express");
const amqp = require("amqplib/callback_api"); // RabbitMQ library
const app = express();
const PORT = 3001;

app.use(express.json());

let orders = [];

// Function to consume messages from RabbitMQ
function consumeFromQueue(queue) {
  amqp.connect("amqp://rabbitmq", (error0, connection) => {
    if (error0) throw error0;
    connection.createChannel((error1, channel) => {
      if (error1) throw error1;
      channel.assertQueue(queue, { durable: false });
      console.log(`[*] Waiting for messages in ${queue}. To exit press CTRL+C`);
      channel.consume(queue, (msg) => {
        if (msg !== null) {
          const event = JSON.parse(msg.content.toString());
          const user = event.user;
          // Create a new order when a user is created
          orders.push({
            item: `Welcome package for ${user.name}`,
            quantity: 1,
          });
          console.log(`Order created for ${user.name}`);
          channel.ack(msg); // Acknowledge the message
        }
      });
    });
  });
}

// Get all orders
app.get("/orders", (req, res) => {
  res.json(orders);
});

// Start consuming userCreated events
consumeFromQueue("userCreated");

app.listen(PORT, () => {
  console.log(`Order Service running on http://localhost:${PORT}`);
});
