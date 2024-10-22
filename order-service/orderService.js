const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

// PostgreSQL connection
const sequelize = new Sequelize("order_db", "db_user", "password", {
  host: "postgres-order", // Use the service name here
  dialect: "postgres",
});

// Order model definition
const Order = sequelize.define("Order", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

let channel; // RabbitMQ channel

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) throw err;
    connection.createChannel((err, ch) => {
      if (err) throw err;
      channel = ch;
      channel.assertExchange("order_events", "fanout", { durable: false });

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
  console.log(`Order created: ${JSON.stringify(order)}`);
}

// Place an order
async function placeOrder(req, res) {
  const { userId, items } = req.body;
  const newOrder = await Order.create({ userId, items });

  // Publish event to RabbitMQ
  channel.publish("order_events", "", Buffer.from(JSON.stringify(newOrder)));
  console.log(`Order published: ${JSON.stringify(newOrder)}`);

  res.status(201).send(newOrder);
}

// Start the server
async function startServer() {
  await sequelize.sync(); // Synchronize the model with the database
  app.post("/order", placeOrder);

  // Get all orders
  app.get("/orders", async (req, res) => {
    const orders = await Order.findAll();
    res.status(200).json(orders);
  });

  app.listen(PORT, () => {
    console.log(`Order Service running on http://localhost:${PORT}`);
  });
}

// Initialize the service
async function init() {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    connectRabbitMQ();
    startServer();
  } catch (error) {
    console.error("Error initializing service:", error);
  }
}

init();
