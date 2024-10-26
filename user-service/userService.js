const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");
const amqp = require("amqplib/callback_api");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json"); // Adjust the path if needed

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// PostgreSQL connection
const sequelize = new Sequelize("user_db", "db_user", "password", {
  host: "postgres-user", // Use the service name here
  dialect: "postgres",
});

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Setting up RabbitMQ channel
let channel;

// Connect to RabbitMQ
function connectRabbitMQ() {
  amqp.connect("amqp://rabbitmq", (err, connection) => {
    if (err) {
      console.error("Error connecting to RabbitMQ:", err);
      return;
    }
    connection.createChannel((err, ch) => {
      if (err) {
        console.error("Error creating RabbitMQ channel:", err);
        return;
      }
      channel = ch;
      channel.assertExchange("user_events", "fanout", { durable: false });
      console.log("RabbitMQ connected and exchange created");
    });
  });
}

// Register a user
async function registerUser(req, res) {
  try {
    const { username, email } = req.body;
    const newUser = await User.create({ username, email });

    // Publish user registration event
    channel.publish("user_events", "", Buffer.from(JSON.stringify(newUser)));
    console.log(
      `User registered and event published: ${JSON.stringify(newUser)}`
    );

    res.status(201).send(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Internal Server Error");
  }
}

// Start the server
async function startServer() {
  try {
    await sequelize.sync();
    app.post("/register", registerUser);

    app.get("/users", async (req, res) => {
      try {
        const users = await User.findAll();
        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    app.listen(PORT, () => {
      console.log(`User Service running on http://localhost:${PORT}`);
      console.log(`API docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
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
