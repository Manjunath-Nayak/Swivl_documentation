// app.js

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = "your_secret_key"; // Change this to a secure secret key

// Initialize SQLite database
const db = new sqlite3.Database("travel_diary.db");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Generate JWT token
function generateToken(user) {
  return jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
}

// Middleware for user authentication
function authenticateUser(req, res, next) {
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authorizationHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.user = decodedToken;
    next();
  });
}

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get all travel entries
app.get("/api/entries", authenticateUser, (req, res) => {
  db.all("SELECT * FROM entries", (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(rows);
  });
});

// Create a new travel entry
app.post("/api/entries", authenticateUser, (req, res) => {
  const { title, location, date, description } = req.body;
  db.run(
    "INSERT INTO entries (title, location, date, description) VALUES (?, ?, ?, ?)",
    [title, location, date, description],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.redirect("/");
    }
  );
});

// Update a travel entry
app.put("/api/entries/:id", authenticateUser, (req, res) => {
  const id = req.params.id;
  const { title, location, date, description } = req.body;
  db.run(
    "UPDATE entries SET title = ?, location = ?, date = ?, description = ? WHERE id = ?",
    [title, location, date, description, id],
    function (err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }
      res.json({ message: "Entry updated successfully" });
    }
  );
});

// Delete a travel entry
app.delete("/api/entries/:id", authenticateUser, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM entries WHERE id = ?", [id], function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json({ message: "Entry deleted successfully" });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
