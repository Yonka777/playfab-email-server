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
                body {
                    font-family: Arial, sans-serif;
                    max-width: 420px;
                    margin: 40px auto;
                    padding: 20px;
                }
                input, button {
                    width: 100%;
                    padding: 12px;
                    margin-top: 12px;
                    box-sizing: border-box;
                }
                .msg {
                    margin-top: 16px;
                }
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

app.get("/email-verified", async (req, res) => {
    const token =
        req.query.token ||
        req.query.Token ||
        req.query.t ||
        "";

    if (!token) {
        return res.status(400).send(`
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Bestätigung fehlgeschlagen</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 520px; margin: 60px auto; padding: 24px; text-align: center;">
                <h1 style="color:#c62828;">Bestätigung fehlgeschlagen</h1>
                <p>Es wurde kein Token in der URL gefunden.</p>
            </body>
            </html>
        `);
    }

    try {
        const url = `https://${process.env.PLAYFAB_TITLE_ID}.playfabapi.com/Server/ConfirmContactEmail`;

        const response = await axios.post(
            url,
            {
                Token: token
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-SecretKey": process.env.PLAYFAB_SECRET_KEY
                }
            }
        );

        console.log("EMAIL CONFIRM SUCCESS:", response.data);

        return res.send(`
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>E-Mail bestätigt</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 520px;
                        margin: 60px auto;
                        padding: 24px;
                        text-align: center;
                        line-height: 1.5;
                    }
                    h1 { color: #1f8b24; }
                    .box {
                        border: 1px solid #ddd;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
                    }
                </style>
            </head>
            <body>
                <div class="box">
                    <h1>E-Mail erfolgreich bestätigt</h1>
                    <p>Deine E-Mail-Adresse wurde erfolgreich verifiziert.</p>
                    <p>Du kannst jetzt zurück ins Spiel wechseln.</p>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        console.error("EMAIL CONFIRM ERROR:", err.response?.data || err.message);

        return res.status(500).send(`
            <html>
            <head>
                <meta charset="UTF-8" />
                <title>Bestätigung fehlgeschlagen</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 520px;
                        margin: 60px auto;
                        padding: 24px;
                        text-align: center;
                        line-height: 1.5;
                    }
                    h1 { color: #c62828; }
                    .box {
                        border: 1px solid #ddd;
                        border-radius: 12px;
                        padding: 24px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.06);
                    }
                </style>
            </head>
            <body>
                <div class="box">
                    <h1>Bestätigung fehlgeschlagen</h1>
                    <p>Der Link war ungültig oder ist abgelaufen.</p>
                    <p>Bitte fordere im Spiel eine neue Bestätigungs-Mail an.</p>
                </div>
            </body>
            </html>
        `);
    }
});

app.get("/email-error", (req, res) => {
    res.send(`
        <html>
        <head>
            <meta charset="UTF-8" />
            <title>Bestätigung fehlgeschlagen</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 520px;
                    margin: 60px auto;
                    padding: 24px;
                    text-align: center;
                    line-height: 1.5;
                }
                h1 { color: #c62828; }
                .box {
                    border: 1px solid #ddd;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.06);
                }
            </style>
        </head>
        <body>
            <div class="box">
                <h1>Bestätigung fehlgeschlagen</h1>
                <p>Die E-Mail konnte nicht bestätigt werden.</p>
                <p>Bitte fordere im Spiel eine neue Bestätigungs-Mail an.</p>
            </div>
        </body>
        </html>
    `);
});

// ----------------------------------------------------
// HILFSFUNKTIONEN FÜR VERIFIKATIONS-STATUS
// ----------------------------------------------------

function normalizeVerificationValue(value) {
    if (value === true) return true;
    if (typeof value === "string") {
        const v = value.toLowerCase();
        return v === "confirmed" || v === "verified" || v === "true";
    }
    return false;
}

function extractVerificationStatus(accountInfo) {
    const candidates = [
        accountInfo?.TitleInfo?.Origination,
        accountInfo?.PrivateInfo?.VerificationStatus,
        accountInfo?.ContactEmailAddresses?.[0]?.VerificationStatus,
        accountInfo?.UserPrivateAccountInfo?.VerificationStatus,
        accountInfo?.EmailVerificationStatus
    ];

    for (const value of candidates) {
        if (value !== undefined && value !== null) {
            const asString = String(value).toLowerCase();

            if (
                asString === "confirmed" ||
                asString === "verified" ||
                asString === "true"
            ) {
                return { raw: value, verified: true };
            }
        }
    }

    return { raw: null, verified: false };
}

function extractEmail(accountInfo) {
    return (
        accountInfo?.PrivateInfo?.Email ||
        accountInfo?.UserPrivateAccountInfo?.Email ||
        accountInfo?.TitleInfo?.DisplayName ||
        null
    );
}

// ----------------------------------------------------
// NEUER ENDPOINT: VERIFIKATIONSSTATUS SERVERSEITIG PRÜFEN
// ----------------------------------------------------

app.post("/check-email-verification", async (req, res) => {
    const { playFabId, email, username } = req.body || {};

    if (!playFabId && !email && !username) {
        return res.status(400).json({
            success: false,
            message: "playFabId, email oder username fehlt"
        });
    }

    try {
        const url = `https://${process.env.PLAYFAB_TITLE_ID}.playfabapi.com/Admin/GetUserAccountInfo`;

        const body = {};

        if (playFabId) body.PlayFabId = playFabId;
        else if (email) body.Email = email;
        else if (username) body.Username = username;

        const response = await axios.post(
            url,
            body,
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-SecretKey": process.env.PLAYFAB_SECRET_KEY
                }
            }
        );

        console.log("CHECK EMAIL VERIFICATION RAW RESPONSE:", JSON.stringify(response.data, null, 2));

        const accountInfo = response.data?.data?.UserInfo || null;

        const extractedEmail =
            accountInfo?.PrivateInfo?.Email ||
            accountInfo?.UserPrivateAccountInfo?.Email ||
            null;

        const verificationRaw =
            accountInfo?.PrivateInfo?.VerificationStatus ??
            accountInfo?.ContactEmailAddresses?.[0]?.VerificationStatus ??
            accountInfo?.UserPrivateAccountInfo?.VerificationStatus ??
            accountInfo?.EmailVerificationStatus ??
            null;

        const verified =
            String(verificationRaw).toLowerCase() === "confirmed" ||
            String(verificationRaw).toLowerCase() === "verified" ||
            verificationRaw === true;

        return res.json({
            success: true,
            linked: !!extractedEmail,
            email: extractedEmail,
            verified: verified,
            verificationRaw: verificationRaw
        });
    } catch (err) {
        console.error("CHECK EMAIL VERIFICATION ERROR:", err.response?.data || err.message);

        return res.status(500).json({
            success: false,
            message: "Verifikationsstatus konnte nicht abgefragt werden",
            error: err.response?.data || err.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server läuft auf Port " + PORT);
});
