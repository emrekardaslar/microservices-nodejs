const express = require("express");
const amqp = require("amqplib/callback_api"); // RabbitMQ library
const app = express();
const PORT = 3000;

app.use(express.json());

let users = [];

// Function to publish a message to RabbitMQ
function publishToQueue(queue, message) {
  amqp.connect("amqp://rabbitmq", (error0, connection) => {
    if (error0) throw error0;
    connection.createChannel((error1, channel) => {
      if (error1) throw error1;
      channel.assertQueue(queue, { durable: false });
      channel.sendToQueue(queue, Buffer.from(message));
      console.log(" [x] Sent %s", message);
    });
    setTimeout(() => {
      connection.close();
    }, 500);
  });
}

// Get all users
app.get("/users", (req, res) => {
  res.json(users);
});

// Add a new user and publish an event
app.post("/users", (req, res) => {
  const user = req.body;
  users.push(user);

  // Publish an event to RabbitMQ
  const message = JSON.stringify({ user });
  publishToQueue("userCreated", message);

  res.status(201).json(user);
});

app.listen(PORT, () => {
  console.log(`User Service running on http://localhost:${PORT}`);
});
