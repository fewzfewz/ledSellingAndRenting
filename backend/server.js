const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db");
const { verifyToken, requireRole } = require("./middleware/auth");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Authorization"],
  })
);
app.use(express.json());

// HTTP routes
app.get("/", (req, res) => {
  res.send("LED Screen Seller & Renter API is running");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/products", require("./routes/products"));
app.use("/api/inventory", require("./routes/inventory"));
app.use("/api/rentals", require("./routes/rentals"));
app.use("/api/sales_orders", require("./routes/sales_orders"));
app.use("/api/learn", require("./routes/learn"));
app.use("/api/portfolio", require("./routes/portfolio"));
app.use("/api/community", require("./routes/community"));
app.use("/api/quotes", require("./routes/quotes"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/chats", require("./routes/chat")); // <-- Add route

// START HTTP SERVER
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// START SOCKET.IO
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: { origin: "*" },
});

// Store connected users
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Identify user
  socket.on("join", (userId) => {
    onlineUsers[userId] = socket.id;
  });

  // Receive a message from a user
  socket.on("send_message", async (data) => {
    const { user_id, sender, message } = data;

    const chatRes = await pool.query(
      "INSERT INTO chats (user_id, sender, message) VALUES ($1, $2, $3) RETURNING *",
      [user_id, sender, message]
    );

    const chat = chatRes.rows[0];

    // Send message to ADMIN PANEL
    io.emit("new_message_admin", chat);

    // Send message to USER (if online)
    if (onlineUsers[user_id]) {
      io.to(onlineUsers[user_id]).emit("new_message_user", chat);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
