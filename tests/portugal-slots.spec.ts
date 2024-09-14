import { expect, defineConfig } from '@playwright/test';
import { test } from '../common/fixtures';
import fs from 'fs';
import FormData from 'form-data';
import consts from '../common/consts';

defineConfig({
  use: {
    userAgent: consts.userAgent,
  },
});

test('open slots', async ({ page }) => {
  const fetch = (await import('node-fetch')).default;

  await page.goto(consts.url, { waitUntil: 'networkidle', timeout: 1200000000 });
  await page.waitForTimeout(2000);
  await page.getByText('Authentication via credentials').click();

  const emailInput = await page.getByLabel('username');
  await emailInput.fill(consts.username);
  await emailInput.press('Enter');

  const passwordInput = await page.getByPlaceholder('***********');
  await passwordInput.fill(consts.password);
  await passwordInput.press('Enter');

  const captchaFrame = await page.frameLocator('iframe[src*="recaptcha"]').first();
  const captchaCheckbox = captchaFrame.locator('.recaptcha-checkbox-border').first();
  await captchaCheckbox.waitFor({ state: 'visible' });
  await captchaCheckbox.click();
  await page.waitForTimeout(2000);

  await page.waitForSelector(
    '#rc-imageselect > div.rc-footer > div.rc-controls > div.primary-controls > div.rc-buttons > div.button-holder.help-button-holder'
  );
  await page.evaluate(() => {
    // Function to recursively search for the button in shadow DOMs
    function findButton(root) {
      if (root.querySelector) {
        const button = root.querySelector('#solver-button');
        if (button) return button;
      }
      if (root.shadowRoot) {
        return findButton(root.shadowRoot);
      }
      const elements = root.querySelectorAll('*');
      for (const elem of elements) {
        if (elem.shadowRoot) {
          const found = findButton(elem.shadowRoot);
          if (found) return found;
        }
      }
      return null;
    }

    // Start search from the document body
    const button = findButton(document.body);
    if (button) {
      button.click();
    } else {
      throw new Error('Button not found');
    }
  });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'captcha.png' });

  const formData = new FormData();
  formData.append('key', '17501880666437eb5779f9763aa7e055');
  formData.append('method', 'base64');
  formData.append('body', fs.readFileSync('captcha.png').toString('base64'));

  const response = await fetch('https://2captcha.com/in.php', {
    method: 'POST',
    body: formData,
  });
  const responseText = (await response.text()).substring(3);
  await page.waitForTimeout(5000);

  let solution: any = null;
  let counter = 0;

  while (!solution && counter < 5) {
    const checkResponse = await fetch(
      `https://2captcha.com/res.php?key=17501880666437eb5779f9763aa7e055&action=get&id=${responseText}`
    );
    const resultText = await checkResponse.text();

    counter++;
    if (resultText === 'CAPCHA_NOT_READY') {
      await new Promise((res) => setTimeout(() => res(true), 3000));
    } else {
      solution = resultText;
    }
  }

  await page.fill('input[name=captcha]', solution);
  await page.click('button[type=submit]', solution);

  await page.getByText('Login').click();
  await page.pause();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});
