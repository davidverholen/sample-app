import { test, expect } from '@playwright/test'

test('homepage loads and displays correctly', async ({ page }) => {
  await page.goto('/')

  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/DevSaaS - Developer Tools Platform/)

  // Verify main content is visible
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('text=Built for Developers')).toBeVisible()
})
