const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const amqp = require("amqplib/callback_api");

const app = express();
const PORT = 3003;

app.use(bodyParser.json());

// PostgreSQL connection
const sequelize = new Sequelize("shipping_db", "db_shipping_user", "password", {
  host: "postgres-shipping", // Use the service name here
  dialect: "postgres",
});

const Shipment = sequelize.define("Shipment", {
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  shipping_address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "pending",
  },
  shipped_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivery_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) throw err;
    connection.createChannel((err, ch) => {
      if (err) throw err;
      channel = ch;
      channel.assertExchange("shipping_events", "fanout", { durable: false });

      // Bind the queue for consuming messages
      channel.assertQueue("", { exclusive: true }, (err, q) => {
        if (err) throw err;
        channel.bindQueue(q.queue, "shipping_events", "");
        console.log("Waiting for shipping messages in %s", q.queue);
        channel.consume(q.queue, handleShippingMessage, { noAck: true });
      });
    });
  });
}

// Handle incoming shipping messages
function handleShippingMessage(msg) {
  const shipmentData = JSON.parse(msg.content.toString());
  console.log(`New shipment: ${JSON.stringify(shipmentData)}`);

  // Save shipment to the database
  Shipment.create({
    order_id: shipmentData.order_id,
    shipping_address: shipmentData.shipping_address,
    status: shipmentData.status,
  })
    .then((shipment) => {
      console.log(`Shipment saved: ${JSON.stringify(shipment)}`);
    })
    .catch((error) => {
      console.error("Error saving shipment:", error);
    });
}

// Create a shipment
async function createShipment(req, res) {
  const { order_id, shipping_address } = req.body;

  try {
    const shipment = await Shipment.create({
      order_id,
      shipping_address,
      status: "pending",
    });
    res.status(201).send(shipment);
  } catch (error) {
    console.error("Error creating shipment:", error);
    res.status(500).send("Internal Server Error");
  }
}

// Function to get all shipments
async function getShipments(req, res) {
  try {
    const shipments = await Shipment.findAll(); // Fetch all shipments from the database
    res.status(200).json(shipments);
  } catch (error) {
    console.error("Error fetching shipments:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching shipments." });
  }
}

// Start the server
async function startServer() {
  try {
    await sequelize.sync();

    app.post("/shipment", createShipment); // Create shipment endpoint
    app.get("/shipments", getShipments); // Get all shipments endpoint

    app.listen(PORT, () => {
      console.log(`Shipping Service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}

// Initialize the service
async function init() {
  try {
    await sequelize.authenticate();
    console.log("Shipping Database connected successfully");
    connectRabbitMQ();
    startServer();
  } catch (error) {
    console.error("Error initializing service:", error);
  }
}

init();
