import { expect, test } from '@playwright/test';

const demoBoardPath = '/locations/hq/boards/welcome';

async function seedSlides(page: any) {
  await page.evaluate(() => {
    const mockSlides = [
      { id: 'slide-1', title: 'Hero', description: 'Opening hero block' },
      { id: 'slide-2', title: 'Menu', description: 'Daily specials' },
      { id: 'slide-3', title: 'Promo', description: 'Upsell widget' },
    ];
    window.localStorage.setItem('mock-slides', JSON.stringify(mockSlides));
  });
}

test.describe('Board editing flows', () => {
  test.beforeEach(async ({ page }) => {
    await seedSlides(page);
    await page.goto(demoBoardPath);
  });

  test('supports drag and drop reordering in the slide stack', async ({ page }) => {
    const firstSlide = page.locator('[data-slide-id="slide-1"]');
    const targetSlide = page.locator('[data-slide-id="slide-3"]');

    await expect(firstSlide).toBeVisible();
    await firstSlide.dragTo(targetSlide);

    const orderedIds = await page.locator('[data-slide-id]').evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-slide-id'))
    );

    expect(orderedIds[0]).not.toBe('slide-1');
  });

  test('updates URL as users switch boards', async ({ page }) => {
    await page.getByRole('link', { name: /seasonal board/i }).click();
    await expect(page).toHaveURL(/\/locations\/hq\/boards\/seasonal/);

    await page.getByRole('link', { name: /welcome/i }).click();
    await expect(page).toHaveURL(demoBoardPath);
  });
});
