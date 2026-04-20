const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.post("/send-reset-email", async (req, res) => {
    const { email } = req.body;

    try {
        await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "Siege of Sanctum",
                    email: process.env.SENDER_EMAIL
                },
                to: [
                    {
                        email: email
                    }
                ],
                subject: "Passwort zurücksetzen",
                htmlContent: `<p>Klicke hier um dein Passwort zurückzusetzen:</p>
                              <a href="https://dein-link-hier.com">Passwort zurücksetzen</a>`
            },
            {
                headers: {
                    "api-key": process.env.BREVO_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        res.send("Email sent!");
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send("Error sending email");
    }
});

app.get("/", (req, res) => {
    res.send("Server läuft!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server läuft auf Port " + PORT);
});
