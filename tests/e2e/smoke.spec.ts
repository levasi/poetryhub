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

  test('write page shows workspace toolbar actions', async ({ page }) => {
    await page.goto('/write')
    await expect(page.getByRole('button', { name: /Publică poezia|Publish poem/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Salvează$|^Save$/i })).toBeVisible()
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

  test('login page loads with auth shell', async ({ page }) => {
    const res = await page.goto('/login')
    expect(res?.ok()).toBeTruthy()
    await expect(page.getByRole('heading', { name: /Bine ai revenit|Welcome back/i })).toBeVisible()
  })

  test('main nav shows home link', async ({ page }) => {
    await page.goto('/descopera')
    await expect(page.getByRole('link', { name: /^Acasă$|^Home$/i }).first()).toBeVisible()
  })

  test('home nav shows discover link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Descoperă|Discover/i }).first()).toBeVisible()
  })

  test('main nav shows insta post link', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Post Insta|Insta post/i }).first()).toBeVisible()
  })

  test('discover page loads with feed tabs', async ({ page }) => {
    await page.goto('/descopera')
    await expect(page.getByRole('tab', { name: /Pentru tine|For you/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Alese de redacție|Editor's picks/i })).toBeVisible()
  })

  test('landing page shows hero and explore CTA', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Cuvinte care|Words that/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Explorează poezii|Explore poems/i })).toBeVisible()
  })

  test('favorites empty state uses editorial empty', async ({ page }) => {
    await page.goto('/favorites')
    await expect(page.getByText(/Nicio poezie salvată|No saved poems yet/i).first()).toBeVisible()
  })

  test('api words returns JSON for empty query', async ({ request }) => {
    const res = await request.get('/api/words')
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body).toMatchObject({ results: [], total: 0, hasMore: false })
  })
})
