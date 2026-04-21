const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    console.log(`REQUEST: ${req.method} ${req.originalUrl}`);
    next();
});

app.get("/", (req, res) => {
    res.send("Server läuft!");
});

app.post("/send-reset-email", async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).send("Email fehlt");
    }

    try {
        const url = `https://${process.env.PLAYFAB_TITLE_ID}.playfabapi.com/Server/SendCustomAccountRecoveryEmail`;

        const response = await axios.post(
            url,
            {
                Email: email,
                EmailTemplateId: process.env.PLAYFAB_TEMPLATE_ID
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-SecretKey": process.env.PLAYFAB_SECRET_KEY
                }
            }
        );

        console.log("PLAYFAB RECOVERY MAIL SENT:", response.data);
        res.send("OK");
    } catch (err) {
        console.error("SEND RESET ERROR:", err.response?.data || err.message);
        res.status(500).send("Error sending recovery email");
    }
});

app.get("/reset-password", (req, res) => {
    const token = req.query.token || "";

    res.send(`
        <html>
        <head>
            <meta charset="UTF-8" />
            <title>Passwort zurücksetzen</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 420px; margin: 40px auto; padding: 20px; }
                input, button { width: 100%; padding: 12px; margin-top: 12px; box-sizing: border-box; }
                .msg { margin-top: 16px; }
            </style>
        </head>
        <body>
            <h2>Passwort zurücksetzen</h2>
            <input id="pw1" type="password" placeholder="Neues Passwort" />
            <input id="pw2" type="password" placeholder="Passwort wiederholen" />
            <button onclick="resetPassword()">Passwort speichern</button>
            <div class="msg" id="msg"></div>

            <script>
                const token = ${JSON.stringify(token)};

                async function resetPassword() {
                    const pw1 = document.getElementById("pw1").value;
                    const pw2 = document.getElementById("pw2").value;
                    const msg = document.getElementById("msg");

                    if (!pw1 || !pw2) {
                        msg.innerText = "Bitte beide Felder ausfüllen.";
                        return;
                    }

                    if (pw1 !== pw2) {
                        msg.innerText = "Die Passwörter stimmen nicht überein.";
                        return;
                    }

                    try {
                        const res = await fetch("/api/reset-password", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                token: token,
                                password: pw1
                            })
                        });

                        const text = await res.text();
                        msg.innerText = text;
                    } catch (e) {
                        msg.innerText = "Fehler beim Zurücksetzen.";
                    }
                }
            </script>
        </body>
        </html>
    `);
});

app.post("/api/reset-password", async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).send("Token oder Passwort fehlt");
    }

    try {
        const url = `https://${process.env.PLAYFAB_TITLE_ID}.playfabapi.com/Admin/ResetPassword`;

        const response = await axios.post(
            url,
            {
                Token: token,
                Password: password
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-SecretKey": process.env.PLAYFAB_SECRET_KEY
                }
            }
        );

        console.log("PASSWORD RESET SUCCESS:", response.data);
        res.send("Passwort wurde erfolgreich geändert.");
    } catch (err) {
        console.error("RESET PASSWORD ERROR:", err.response?.data || err.message);
        res.status(500).send("Passwort konnte nicht geändert werden.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server läuft auf Port " + PORT);
});
