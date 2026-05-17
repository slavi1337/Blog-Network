require("dotenv").config({ path: "../../.env" });
const express = require("express");
const cors = require("cors");

const notificationRoutes = require("./routes/notification.routes");

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

app.use("/api/notifications", notificationRoutes);

const PORT = 5003;

app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});