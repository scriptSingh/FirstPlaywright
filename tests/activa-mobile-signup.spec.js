// @ts-check
import { test, expect } from '@playwright/test';

const ACTIVA_URL = 'https://activa-mobile-stage.reachmobileplatform.com/';
const CUSTOMER = {
  firstName: 'Aarav',
  lastName: 'Sharma',
  phone: '8888877777',
  street: '4355 ashford',
};
const CARD = {
  number: '4111111111111111',
  month: '12-Dec',
  year: '2038',
  cvv: '999',
};

function createUniqueCredentials() {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  return {
    email: `test+${suffix}@gmail.com`,
    password: `Reach@${suffix.slice(-8)}A`,
  };
}

async function fillAccountDetails(page, credentials) {
  await page.getByRole('textbox', { name: 'Email address' }).fill(credentials.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(credentials.password);
  await page.getByRole('checkbox', { name: 'controlled' }).check();
  await page.getByRole('button', { name: 'Create Account' }).click();
}

async function fillPaymentDetails(page) {
  await page.locator('#cardNumber').fill(CARD.number);
  await page.locator('#CardExpMonth').selectOption({ label: CARD.month });
  await page.locator('#CardExpYear').selectOption(CARD.year);
  await page.locator('#cvv').fill(CARD.cvv);
  await page.locator('#submit').click({ force: true });
}

test('creates a unique Activa Mobile account and submits payment', async ({ page }) => {
  test.setTimeout(90000);
  const credentials = createUniqueCredentials();

  await page.goto(ACTIVA_URL);
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByRole('heading', { name: 'By the Gig' })).toBeVisible();
  await page.getByRole('button', { name: 'Select Plan' }).first().click();
  await page.getByRole('button', { name: 'Go to Cart' }).click();

  await page.getByRole('textbox', { name: 'First name' }).fill(CUSTOMER.firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(CUSTOMER.lastName);
  await page.getByRole('radio', { name: 'eSIM' }).check();
  await page.locator('input[type="checkbox"]').last().check();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();

  await expect(page.getByRole('textbox', { name: 'Email address' })).toBeEditable();
  await fillAccountDetails(page, credentials);

  await expect(page.getByText('Billing Address', { exact: true })).toBeVisible();
  const addCardButton = page.getByRole('button', { name: 'Proceed to add card details' });
  await expect(addCardButton).toBeVisible();
  await page.getByRole('textbox', { name: 'Billing phone number' }).fill(CUSTOMER.phone);
  await page.getByRole('textbox', { name: 'Street' }).fill(CUSTOMER.street);
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.getByRole('option').first().click();

  await addCardButton.click({ force: true });
  await page.waitForURL(/hpp-test\.ippay\.com\/display/, { timeout: 45000 });
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await fillPaymentDetails(page);
  await expect(page.locator('#submit')).toBeVisible();

  console.log(`Created unique test account: ${credentials.email}`);
});
