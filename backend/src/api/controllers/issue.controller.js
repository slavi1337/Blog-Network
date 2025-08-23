const { pool } = require("../../config/db");
const { getInternalUserId } = require("../../services/userService");

exports.reportIssue = async (req, res) => {
  const clerkId = req.auth.userId;
  const { issueType, description, screenshotUrl } = req.body;

  if (!issueType || !description) {
    return res.status(400).json({ error: "Tip problema i opis su obavezni." });
  }
  const validIssueTypes = [
    "bug_report",
    "inappropriate_content",
    "spam",
    "other",
  ];
  if (!validIssueTypes.includes(issueType)) {
    return res.status(400).json({ error: "Nevažeći tip problema." });
  }

  try {
    const reporterUserId = await getInternalUserId(clerkId);

    const query = `
            INSERT INTO reported_issues 
                (reporter_user_id, issue_type, description, screenshot_url)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;
    const values = [
      reporterUserId,
      issueType,
      description,
      screenshotUrl || null,
    ];

    await pool.query(query, values);

    res.status(201).json({
      message: "Problem je uspješno prijavljen. Hvala vam na pomoći!",
    });
  } catch (error) {
    console.error("Greška pri prijavi problema:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
};
