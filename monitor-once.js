const { chromium } = require("playwright");
const nodemailer = require("nodemailer");

const URL = process.env.CHECK_URL;
const KEYWORDS = [
  "nursery",
  "pre nursery",
  "pre-nursery",
  "prenursery",
  "nur",
  "jr kg",
  "junior kg",
  "lkg"
];

async function sendTelegram(message) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;

  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message
    })
  });
}

async function sendEmail(message) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ALERT_TO) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_TO,
    subject: "Nursery admission may be available",
    text: message
  });
}

async function main() {
  if (!URL) throw new Error("CHECK_URL is missing");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    const selectOptions = await page.locator("select option").allTextContents();
    const optionText = selectOptions.join(" ").toLowerCase();

    const combinedText = `${bodyText} ${optionText}`;

    const matchedKeyword = KEYWORDS.find(k => combinedText.includes(k));

    console.log("Checked at:", new Date().toISOString());
    console.log("Matched keyword:", matchedKeyword || "none");

    if (matchedKeyword) {
      const message =
        `🚨 Nursery-related admission option may be available!\n\n` +
        `Matched: ${matchedKeyword}\n\n` +
        `Open now:\n${URL}`;

      await sendTelegram(message);
      await sendEmail(message);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
