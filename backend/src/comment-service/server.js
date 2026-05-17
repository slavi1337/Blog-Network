require("dotenv").config({ path: "../../.env" });

const express = require("express");
const cors = require("cors");

const commentRoutes = require("./routes/comment.routes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/api/comments", commentRoutes);

const PORT = 5005;

app.listen(PORT, () => {
  console.log(`Comment service running on port ${PORT}`);
});