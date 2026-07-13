import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test('home page loads', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.ok()).toBeTruthy()
    await expect(page.locator('body')).toBeVisible()
  })

  test('write page loads dictionary search UI', async ({ page }) => {
    await page.goto('/write')
    await expect(page.getByTestId('write-search-btn')).toBeVisible()
    await expect(page.getByRole('button', { name: /Potrivire|Începe cu|Conține/i }).first()).toBeVisible()
  })

  test('write search button stays disabled for single-letter query', async ({ page }) => {
    await page.goto('/write')
    const input = page.locator('input[inputmode="search"]').first()
    await input.fill('a')
    await expect(page.getByTestId('write-search-btn')).toBeDisabled()
    await input.fill('ab')
    await expect(page.getByTestId('write-search-btn')).toBeEnabled()
  })

  test('authors index responds', async ({ page }) => {
    const res = await page.goto('/authors')
    expect(res?.status()).toBeLessThan(500)
  })

  test('api words returns JSON for empty query', async ({ request }) => {
    const res = await request.get('/api/words')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toMatchObject({ results: [], total: 0, hasMore: false })
  })
})
