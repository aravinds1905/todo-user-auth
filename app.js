require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
const SECRET_KEY = process.env.JWT_SECRET;

app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Helper: Authenticate JWT
const tokenMiddleware = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("Token required");
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(401).send("Invalid token");
    req.user = user;
    next();
  });
};

// Register
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error registering user");
      }
      res.status(201).send("User registered");
    }
  );
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error logging in");
      }
      if (results.length === 0) {
        return res.status(401).send("Invalid credentials");
      }
      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).send("Invalid credentials");
      }
      const token = jwt.sign({ id: user.id }, SECRET_KEY);
      res.json({ token });
    }
  );
});

// Create Todo
app.post("/todos", tokenMiddleware, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).send("Title required");

  db.query(
    "INSERT INTO todos (user_id, title) VALUES (?, ?)",
    [req.user.id, title, description],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error creating todo");
      }
      res.status(201).send("Todo created");
    }
  );
});

// Get Todos
app.get("/todos", tokenMiddleware, (req, res) => {
  db.query(
    "SELECT * FROM todos WHERE user_id = ?",
    [req.user.id],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching todos");
      }
      res.status(200).json(results);
    }
  );
});

// Delete Todo
app.delete("/todos/:id", tokenMiddleware, (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM todos WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error deleting todo");
      }
      res.status(200).send("Todo deleted");
    }
  );
});

app.put("/todos/:id", (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  const sql = "UPDATE todos SET completed = ? WHERE id = ?";
  db.query(sql, [completed, id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Todo updated successfully" });
  });
});

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
