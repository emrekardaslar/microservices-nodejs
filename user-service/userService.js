// userService.js
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let users = [];

// Endpoint to get all users
app.get("/users", (req, res) => {
  res.json(users);
});

// Endpoint to add a new user
app.post("/users", (req, res) => {
  const user = req.body;
  users.push(user);
  res.status(201).json(user);
});

app.listen(PORT, () => {
  console.log(`User Service running on http://localhost:${PORT}`);
});
