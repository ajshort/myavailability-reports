const { kv } = require('@vercel/kv');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer');
const { TOTP } = require('totp-generator');

export async function token() {
  if (await kv.exists('token')) {
    console.log('Existing access token found');

    const existing = await kv.get('token');

    try {
      const decoded = await jwt.decode(existing);
      const { exp } = decoded;

      // Check if the token is expired, or expires in the next 5 minutes
      if (Date.now() < (exp - 5 * 60) * 1000) {
        return existing;
      }

      console.log('Existing access token is expired, requesting new token');
    } catch (err) {
      console.warn('Unable to token access token', err);
    }
  }

  const token = await login();

  await kv.set('token', token);

  return token;
}

export async function login() {
  const opts = { timeout: 5000 };

  console.log('Logging in with puppeteer');

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://myavailability.ses.nsw.gov.au', opts);
  await page.locator('button', opts).click();

  console.log('Authenticating with username and password');

  await page.locator('input', opts).fill(process.env.SES_USERNAME, opts);
  await page.locator('input[type=submit]', opts).click();

  await page.locator('input[type=password]', opts).fill(process.env.SES_PASSWORD, opts);
  await page.locator('input[type=submit]', opts).click();

  console.log('Authenticating with TOTP');

  await page.locator('div[data-se=okta_verify-totp] a', opts).click();

  const { otp } = TOTP.generate(process.env.OKTA_SHARED_SECRET);
  await page.locator('input', opts).fill(otp, opts);
  await page.locator('input[type=submit]', opts).click();

  console.log('Waiting for access token');

  const get = () => window.localStorage.getItem('accessToken');
  await page.waitForFunction(get, opts);
  const token = await page.evaluate(get);

  await browser.close();

  return token;
}
