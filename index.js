const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// 🔥 LOG ALLES
app.use((req, res, next) => {
    console.log("REQUEST:", req.method, req.url);
    next();
});

app.post("/send-reset-email", async (req, res) => {
    console.log("RESET ROUTE HIT!");
    console.log("BODY:", req.body);

    const { email } = req.body;

    try {
        await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "Siege of Sanctum",
                    email: process.env.SENDER_EMAIL
                },
                to: [{ email }],
                subject: "Passwort zurücksetzen",
                htmlContent: `<p>Klicke hier:</p>
                              <a href="https://dein-link-hier.com">Reset</a>`
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("EMAIL SENT!");
        res.send("OK");
    } catch (err) {
        console.error("ERROR:", err.response?.data || err.message);
        res.status(500).send("ERROR");
    }
});

app.get("/", (req, res) => {
    res.send("Server läuft!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server läuft auf Port " + PORT);
});
