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

  await page.getByText('Login').click();
  await page.pause();

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});
