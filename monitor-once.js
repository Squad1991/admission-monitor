const { chromium } = require("playwright");

const URL =
  process.env.CHECK_URL ||
  "https://akshara.ethdigitalcampus.com/OAWeb/form/jsp_admission/Enquiry.jsp";

const KEYWORDS = [
  "nursery",
  "pre nursery",
  "pre-nursery",
  "prenursery",
  "nur",
  "jr kg",
  "junior kg",
  "lkg",
  "lower kindergarten"
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(URL, {
      waitUntil: "networkidle",
      timeout: 60000
    });

    const bodyText = (await page.locator("body").innerText()).toLowerCase();

    const selectOptions = await page.locator("select option").allTextContents();
    const optionText = selectOptions.join(" ").toLowerCase();

    const combinedText = `${bodyText} ${optionText}`;

    const matchedKeyword = KEYWORDS.find(keyword =>
      combinedText.includes(keyword)
    );

    console.log("Checked at:", new Date().toISOString());
    console.log("Page URL:", URL);
    console.log("Matched keyword:", matchedKeyword || "none");

    if (matchedKeyword) {
      console.log("🚨 Nursery-related admission option may be available!");
      console.log(`Matched: ${matchedKeyword}`);
      console.log(`Open now: ${URL}`);

      // This intentionally fails the GitHub Action
      // so GitHub can notify you by email/app notification.
      process.exit(1);
    }

    console.log("No Nursery-related option found.");
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error("Monitor failed:", error);
  process.exit(1);
});
