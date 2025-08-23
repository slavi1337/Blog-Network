const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");

const sessionConfig = require("./config/session");

const publicRoutes = require("./api/routes/public.routes");
const commentRoutes = require("./api/routes/comment.routes");
const postRoutes = require("./api/routes/post.routes");
const adminRoutes = require("./api/routes/admin.routes");
const profileRoutes = require("./api/routes/profile.routes");
const userRoutes = require("./api/routes/user.routes");
const notificationRoutes = require("./api/routes/notification.routes");
const issueRoutes = require("./api/routes/issue.routes");
const mediaRoutes = require("./api/routes/media.routes");
const webhookRoutes = require("./api/routes/webhook.routes");
const utilityRoutes = require("./api/routes/utility.routes");
const metaRoutes = require("./api/routes/meta.routes");

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(session(sessionConfig));

app.use("/api/admin", adminRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api", mediaRoutes);
app.use("/api", utilityRoutes);
app.use("/api", metaRoutes);

app.use(express.static(path.join(__dirname, "../../dist")));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../dist", "index.html"));
});

module.exports = app;
