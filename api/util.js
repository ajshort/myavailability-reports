const { kv } = require('@vercel/kv');
const puppeteer = require('puppeteer');
const { TOTP } = require('totp-generator');

export async function token() {
  const existing = await kv.get('token');

  if (existing) {
    return existing;
  }

  const token = await login();
  await kv.put('token', token);

  return token;
}

export async function login() {
  const opts = { timeout: 3000 };

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://myavailability.ses.nsw.gov.au', opts);
  await page.locator('button', opts).click();

  await page.locator('input', opts).fill(process.env.SES_USERNAME, opts);
  await page.locator('input[type=submit]', opts).click();

  await page.locator('input[type=password]', opts).fill(process.env.SES_PASSWORD, opts);
  await page.locator('input[type=submit]', opts).click();

  await page.locator('div[data-se=okta_verify-totp] a', opts).click();

  const { otp } = TOTP.generate(process.env.OKTA_SHARED_SECRET);
  await page.locator('input', opts).fill(otp, opts);
  await page.locator('input[type=submit]', opts).click();

  const get = () => window.localStorage.getItem('accessToken');
  await page.waitForFunction(get, opts);
  const token = await page.evaluate(get);

  await browser.close();

  return token;
}
