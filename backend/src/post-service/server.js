require("dotenv").config({ path: "../../.env" });

const express = require("express");
const cors = require("cors");

const postRoutes = require("./routes/post.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Post service running on port ${PORT}`);
});