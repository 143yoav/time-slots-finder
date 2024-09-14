const { chromium } = require('playwright');

(async () => {
  // Launch the browser
  const browser = await chromium.launch({ headless: true }); // Set to true for headless mode
  const page = await browser.newPage();

  // Navigate to the website
  await page.goto('https://agendamentos.mne.gov.pt/en/login');

  // Wait for the page to load
  await page.waitForSelector('#username');

  // Fill in the username and password
  await page.fill('#username', 'your_username');
  await page.fill('#password', 'your_password');

  // Pause to show the filled form (remove in production)
  await page.waitForTimeout(5000);

  // Close the browser
  await browser.close();
})();