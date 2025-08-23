require("dotenv").config();

const app = require("./src/app");
const { pool } = require("./src/config/db");
const { publishScheduledPosts } = require("./src/jobs/postScheduler");
const { scheduleWeeklyJob } = require("./src/jobs/blogOfTheWeekSelector");

const port = 3000;

app.listen(port, () => {
  console.log(`Backend server sluša na http://localhost:${port}`);
  console.log("Pokrećem periodičnu provjeru zakazanih objava svakih 5min...");

  setInterval(() => {
    publishScheduledPosts(pool);
  }, 5 * 60 * 1000);

  scheduleWeeklyJob(pool);
});
