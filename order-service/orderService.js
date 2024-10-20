const express = require("express");
const app = express();
const PORT = 3001;

app.use(express.json());

let orders = [];

// Get all orders
app.get("/orders", (req, res) => {
  res.json(orders);
});

// Add a new order
app.post("/orders", (req, res) => {
  const order = req.body;
  orders.push(order);
  res.status(201).json(order);
});

app.listen(PORT, () => {
  console.log(`Order Service running on http://localhost:${PORT}`);
});
