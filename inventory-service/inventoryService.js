const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const amqp = require("amqplib/callback_api");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json"); // Adjust the path if needed

const app = express();
const PORT = 3002;

app.use(bodyParser.json());

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// PostgreSQL connection
const sequelize = new Sequelize(
  "inventory_db",
  "inventory_user",
  "inventory_password",
  {
    host: "postgres-inventory",
    dialect: "postgres",
  }
);
const Inventory = sequelize.define("Inventory", {
  product_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) throw err;
    connection.createChannel((err, ch) => {
      if (err) throw err;
      channel = ch;
      channel.assertExchange("inventory_events", "fanout", { durable: false });

      // Create a temporary queue for consuming messages
      channel.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;

        // Bind the queue to the inventory events exchange
        channel.bindQueue(q.queue, "inventory_events", "");

        console.log("Waiting for inventory messages in %s", q.queue);
        channel.consume(q.queue, handleInventoryMessage, { noAck: true });
      });
    });
  });
}

// Handle inventory message
function handleInventoryMessage(msg) {
  const inventoryUpdate = JSON.parse(msg.content.toString());
  console.log(`Inventory updated: ${JSON.stringify(inventoryUpdate)}`);
}

// Update or create inventory item
async function updateInventory(req, res) {
  const { productName, quantity } = req.body;

  try {
    if (!productName || !quantity) {
      return res
        .status(400)
        .json({ message: "Product name and quantity are required." });
    }

    const updatedItem = await Inventory.create({
      product_name: productName, // Use correct field name here
      quantity,
    });

    res.status(201).json(updatedItem);
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Start server
async function startServer() {
  await sequelize.sync();
  app.post("/inventory", updateInventory);

  app.get("/inventory", async (req, res) => {
    const inventory = await Inventory.findAll();
    res.status(200).json(inventory);
  });

  app.listen(PORT, () => {
    console.log(`Inventory Service running on http://localhost:${PORT}`);
    console.log(`API docs available at http://localhost:${PORT}/api-docs`);
  });
}

// Initialize
async function init() {
  try {
    await sequelize.authenticate();
    console.log("Inventory DB connected");
    connectRabbitMQ();
    startServer();
  } catch (error) {
    console.error("Error initializing inventory service:", error);
  }
}

init();
