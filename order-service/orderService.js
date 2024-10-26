const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const amqp = require("amqplib/callback_api");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json"); // Adjust the path if needed

const app = express();
const PORT = 3001;

app.use(bodyParser.json());

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// PostgreSQL connection
const sequelize = new Sequelize("order_db", "db_user", "password", {
  host: "postgres-order", // Use the service name here
  dialect: "postgres",
});

// Order model definition compatible with the database schema
const Order = sequelize.define("Order", {
  user_id: {
    // Match the database field name
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  product_name: {
    // Add product_name field
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    // Add quantity field
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order_date: {
    // Add order_date field
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Setting up RabbitMQ channel
let channel;

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) throw err;
    connection.createChannel((err, ch) => {
      if (err) throw err;
      channel = ch;

      // Existing order events queue
      channel.assertExchange("order_events", "fanout", { durable: false });

      // New user registration events queue
      channel.assertExchange("user_events", "fanout", { durable: false });

      // Create a temporary queue for consuming order messages
      channel.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;

        // Bind the queue to the order events exchange
        channel.bindQueue(q.queue, "order_events", "");

        console.log("Waiting for order messages in %s", q.queue);
        channel.consume(q.queue, handleOrderMessage, { noAck: true });
      });

      // Create a temporary queue for consuming user registration messages
      channel.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;

        // Bind the queue to the user events exchange
        channel.bindQueue(q.queue, "user_events", "");
        console.log("Waiting for user registration messages in %s", q.queue);
        channel.consume(q.queue, handleUserRegistration, { noAck: true });
      });
    });
  });
}

// Handle incoming order messages
function handleOrderMessage(msg) {
  const order = JSON.parse(msg.content.toString());
  console.log(`Order created: ${JSON.stringify(order)}`);
}

// Handle incoming user registration messages
function handleUserRegistration(msg) {
  const user = JSON.parse(msg.content.toString());
  console.log(`User registered: ${JSON.stringify(user)}`);

  // Optionally create a welcome order for the new user
  createWelcomeOrder(user);
}

// Function to create a welcome order for the new user
async function createWelcomeOrder(user) {
  const welcomeOrder = {
    user_id: user.id, // Assuming the user object has an 'id' field
    product_name: "Welcome Gift",
    quantity: 1,
  };

  const newOrder = await Order.create(welcomeOrder);
  console.log(`Welcome order created: ${JSON.stringify(newOrder)}`);
}

// Place an order
async function placeOrder(req, res) {
  const { user_id, product_name, quantity } = req.body; // Adjusted to match new model fields

  // Validate input
  if (!user_id || !product_name || !quantity) {
    return res
      .status(400)
      .json({ message: "user_id, product_name, and quantity are required." });
  }

  const newOrder = await Order.create({
    user_id,
    product_name,
    quantity,
  }); // Match the database fields

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
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
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
