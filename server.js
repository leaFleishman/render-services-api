require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.RENDER_API_KEY;

if (!apiKey) {
  throw new Error("Missing RENDER_API_KEY");
}

// הכתובת שאליה פונים כדי לקבל את רשימת השירותים
app.get("/services", async (req, res) => {
  try {
    const services = [];
    let cursor;

    // איסוף הרשימה גם כאשר Render מחלקת אותה לעמודים
    do {
      const query = new URLSearchParams({ limit: "100" });

      if (cursor) {
        query.set("cursor", cursor);
      }

      const response = await fetch(
        `https://api.render.com/v1/services?${query}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        return res.status(502).json({
          error: "Render API request failed",
          renderStatus: response.status,
        });
      }

      const page = await response.json();

      // החזרת שם וסוג של כל שירות
      services.push(
        ...page.map(({ service }) => ({
          name: service.name,
          type: service.type,
        }))
      );

      cursor = page.length === 100
        ? page[page.length - 1].cursor
        : undefined;
    } while (cursor);

    res.json(services);
  } catch {
    res.status(502).json({
      error: "Could not retrieve services from Render",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});