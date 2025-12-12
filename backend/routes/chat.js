// routes/chats.js
const express = require("express");
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/chats  - user sends message
router.post("/", verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    const result = await pool.query(
      `INSERT INTO chats (user_id, sender, message) VALUES ($1, $2, $3) RETURNING id, user_id, sender, message, reply, created_at`,
      [req.user.id, "user", message]
    );

    res.json({ chat: result.rows[0] });
  } catch (err) {
    console.error("Error creating chat:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/chats - get logged-in user's chats
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, sender, message, reply, created_at
       FROM chats
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.id]
    );

    res.json({ chats: result.rows });
  } catch (err) {
    console.error("Error fetching user chats:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/chats/mark-read - mark messages as read for logged-in user
router.post("/mark-read", verifyToken, async (req, res) => {
  try {
    const { chatIds } = req.body; // optional array of chat UUIDs; if omitted, mark all as read
    if (chatIds && !Array.isArray(chatIds))
      return res.status(400).json({ error: "chatIds must be an array" });

    if (chatIds && chatIds.length > 0) {
      await pool.query(
        `UPDATE chats SET is_read = true WHERE id = ANY($1::uuid[]) AND user_id = $2`,
        [chatIds, req.user.id]
      );
    } else {
      await pool.query(`UPDATE chats SET is_read = true WHERE user_id = $1`, [
        req.user.id,
      ]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error marking read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
