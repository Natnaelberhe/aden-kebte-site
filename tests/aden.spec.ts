import { test, expect } from '@playwright/test';

const url = 'http://localhost:3000/';

test.describe('Aden Kebte – CTAs, attribution, Apollo + fallback', () => {

  test('CTAs prefill interest and scroll to #contact', async ({ page }) => {
    await page.goto(url);

    const ctas = [
      { selector: 'button[data-interest="foundation"]', value: 'foundation' },
      { selector: 'button[data-interest="growth"]',     value: 'growth'     },
      { selector: 'button[data-interest="scale"]',      value: 'scale'      },
      { selector: 'button[data-interest="seo"]',        value: 'seo'        },
      { selector: 'button[data-interest="social"]',     value: 'social'     },
      { selector: 'button[data-interest="email"]',      value: 'email'      },
    ];

    for (const { selector, value } of ctas) {
      await page.click(selector);
      await expect(page.locator('#contact')).toBeInViewport();
      await expect(page.locator('#interest')).toHaveValue(value);
    }
  });

  test('Hidden fields populate from URL params', async ({ page }) => {
    const qs = '?utm_source=ads&utm_medium=cpc&utm_campaign=fall';
    await page.goto(url + qs);
    await expect(page.locator('#utm_source')).toHaveValue('ads');
    await expect(page.locator('#utm_medium')).toHaveValue('cpc');
    await expect(page.locator('#utm_campaign')).toHaveValue('fall');
    const pageUrl = await page.locator('#url').inputValue();
    expect(pageUrl).toContain(qs);
    await expect(page.locator('#lead_source')).toHaveValue('Website');
  });

  test('Honeypot blocks bots (no Apollo call)', async ({ page }) => {
    // IMPORTANT: stub BEFORE navigation so it applies to this page
    await page.addInitScript(() => {
      (window as any).ApolloMeetings = {
        calls: 0,
        submit: function () { this.calls = (this.calls || 0) + 1; }
      };
    });
    await page.goto(url);

    await page.fill('#name', 'Bot');
    await page.fill('#email', 'bot@example.com');
    await page.selectOption('#interest', 'seo');
    await page.fill('#hp_field', 'I am a bot');

    await page.click('button[type="submit"]');
    await expect(page.locator('#toast')).toContainText('Thanks!');

    // Defensive read: if stub is missing, treat as 0 calls
    const calls = await page.evaluate(() => (window as any).ApolloMeetings?.calls ?? 0);
    expect(calls).toBe(0);
  });

  test('Apollo present → success toast', async ({ page }) => {
    // Stub BEFORE navigation
    await page.addInitScript(() => {
      (window as any).ApolloMeetings = {
        submit: ({ onSuccess }: any) => { if (onSuccess) onSuccess(); }
      };
    });
    await page.goto(url);

    await page.fill('#name', 'Jane Doe');
    await page.fill('#email', 'jane@example.com');
    await page.selectOption('#interest', 'growth');
    await page.click('button[type="submit"]');
    await expect(page.locator('#toast')).toContainText('Scheduled!');
  });

  test('Apollo absent → fallback toast, no console errors', async ({ page }) => {
    // Ensure no stub is injected for this test
    await page.addInitScript(() => { (window as any).ApolloMeetings = undefined; });
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto(url);
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await page.selectOption('#interest', 'custom');
    await page.click('button[type="submit"]');
    await expect(page.locator('#toast')).toContainText('Thanks!');
    expect(errors).toEqual([]);
  });
});
