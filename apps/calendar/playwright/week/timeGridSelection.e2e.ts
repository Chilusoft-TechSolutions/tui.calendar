import type { Locator } from '@playwright/test';
import { expect, test } from '@playwright/test';

import type { FormattedTimeString } from '../../types/time/datetime';
import { WEEK_VIEW_PAGE_URL } from '../configs';
import { dragAndDrop, getBoundingBox, getTimeGridLineSelector } from '../utils';

test.beforeEach(async ({ page }) => {
  await page.goto(WEEK_VIEW_PAGE_URL);
});

async function assertTimeGridSelection(
  selectionLocator: Locator,
  expected: {
    startTop: number;
    endBottom: number;
    totalElements: number;
    formattedTimes: FormattedTimeString[];
  }
) {
  const timeGridSelectionElements = (await selectionLocator.evaluateAll(
    (selection) => selection
  )) as HTMLElement[];
  const expectedFormattedTime = expected.formattedTimes.join(' - ');

  expect(timeGridSelectionElements).toHaveLength(expected.totalElements);

  await expect(selectionLocator.first()).toHaveText(expectedFormattedTime);

  const firstElementBoundingBox = await getBoundingBox(selectionLocator.first());
  expect(firstElementBoundingBox.y).toBeCloseTo(expected.startTop, 0);

  const lastElementBoundingBox = await getBoundingBox(selectionLocator.last());
  expect(lastElementBoundingBox.y + lastElementBoundingBox.height).toBeCloseTo(
    expected.endBottom,
    0
  );
}

// NOTE: Only firefox automatically scrolls into view at some random tests, so narrowing the range of movement.
// Maybe `scrollIntoViewIfNeeded` is not supported in the firefox?
// reference: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
test.describe('TimeGrid Selection in week', () => {
  const BASE_GRIDLINE_LOCATOR = 'data-testid=gridline-03:00-03:30';
  const GRID_SELECTION_SELECTOR = '[data-testid*="time-grid-selection"]';

  test('should be able to select a time slot with clicking', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);
    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);

    // When
    await startGridLineLocator.click({ force: true, delay: 1 });
    await timeGridSelectionLocator.waitFor(); // Test for debounced click handler.

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 1,
      formattedTimes: ['03:00', '03:30'],
      startTop: startGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });

  test('should be able to select a time slot with double clicking', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);
    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);

    // When
    await startGridLineLocator.dblclick({ force: true, delay: 1 });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 1,
      formattedTimes: ['03:00', '03:30'],
      startTop: startGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time from bottom to top', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const targetGridLineLocator = page.locator(getTimeGridLineSelector('01:00'));
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);
    const targetGridLineBoundingBox = await getBoundingBox(targetGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, targetGridLineLocator);

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 1,
      formattedTimes: ['01:00', '03:30'],
      startTop: targetGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time to upper right', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const targetGridLineLocator = page.locator(getTimeGridLineSelector('01:00'));
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);
    const targetGridLineBoundingBox = await getBoundingBox(targetGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, targetGridLineLocator, {
      targetPosition: {
        x: targetGridLineBoundingBox.width,
        y: startGridLineBoundingBox.height,
      },
    });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 4,
      formattedTimes: ['03:00'],
      startTop: startGridLineBoundingBox.y,
      endBottom: targetGridLineBoundingBox.y + targetGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time to right', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, startGridLineLocator, {
      targetPosition: {
        x: startGridLineBoundingBox.width,
        y: 1,
      },
    });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 4,
      formattedTimes: ['03:00'],
      startTop: startGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time to lower right', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const targetGridLineLocator = page.locator(getTimeGridLineSelector('05:00'));
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);
    const targetGridLineBoundingBox = await getBoundingBox(targetGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, targetGridLineLocator, {
      targetPosition: {
        x: targetGridLineBoundingBox.width,
        y: targetGridLineBoundingBox.height,
      },
    });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 4,
      formattedTimes: ['03:00'],
      startTop: startGridLineBoundingBox.y,
      endBottom: targetGridLineBoundingBox.y + targetGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time from top to bottom', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const targetGridLineLocator = page.locator(getTimeGridLineSelector('05:00'));
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);
    const targetGridLineBoundingBox = await getBoundingBox(targetGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, targetGridLineLocator);

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 1,
      formattedTimes: ['03:00', '05:30'],
      startTop: startGridLineBoundingBox.y,
      endBottom: targetGridLineBoundingBox.y + targetGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time to lower left', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const targetGridLineLocator = page.locator(getTimeGridLineSelector('05:00'));
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);
    const targetGridLineBoundingBox = await getBoundingBox(targetGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, targetGridLineLocator, {
      targetPosition: {
        x: 0,
        y: targetGridLineBoundingBox.height,
      },
    });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 4,
      formattedTimes: ['05:00'],
      startTop: targetGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time to left', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, startGridLineLocator, {
      targetPosition: {
        x: 1,
        y: 1,
      },
    });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 4,
      formattedTimes: ['03:00'],
      startTop: startGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });

  test('should be able to select a range of time to upper left', async ({ page }) => {
    // Given
    const startGridLineLocator = page.locator(BASE_GRIDLINE_LOCATOR);
    const targetGridLineLocator = page.locator(getTimeGridLineSelector('01:00'));
    const timeGridSelectionLocator = page.locator(GRID_SELECTION_SELECTOR);

    const startGridLineBoundingBox = await getBoundingBox(startGridLineLocator);
    const targetGridLineBoundingBox = await getBoundingBox(targetGridLineLocator);

    // When
    await dragAndDrop(page, startGridLineLocator, targetGridLineLocator, {
      targetPosition: {
        x: 1,
        y: 1,
      },
    });

    // Then
    await assertTimeGridSelection(timeGridSelectionLocator, {
      totalElements: 4,
      formattedTimes: ['01:00'],
      startTop: targetGridLineBoundingBox.y,
      endBottom: startGridLineBoundingBox.y + startGridLineBoundingBox.height,
    });
  });
});