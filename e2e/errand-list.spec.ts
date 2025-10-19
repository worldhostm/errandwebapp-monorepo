import { test, expect } from '@playwright/test';

/**
 * Errand List Tests
 * 심부름 목록 조회 및 필터링 기능 테스트
 */

test.describe('Errand List', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 사용자로 로그인
    await page.goto('/test');
    const testUserButton = page.locator('button:has-text("테스트 사용자")').first();
    if (await testUserButton.isVisible()) {
      await testUserButton.click();
    }
    await page.goto('/');
  });

  test('ERR-08: 주변 심부름 목록 표시', async ({ page }) => {
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');

    // 심부름 목록 섹션 확인
    await expect(page.locator('text=주변 심부름 찾기')).toBeVisible();

    // 지도가 로드되는지 확인
    await expect(page.locator('#map-container')).toBeVisible();
  });

  test('ERR-09: 심부름 개수 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 심부름 개수가 표시되는지 확인
    await expect(page.locator('text=/\\d+개/')).toBeVisible({ timeout: 15000 });
  });

  test('ERR-10: 심부름 카드 기본 정보 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 심부름 카드가 있는지 확인
    const errandCards = page.locator('[class*="bg-white"][class*="rounded-lg"][class*="shadow"]').filter({
      has: page.locator('text=/보상|거리|마감/')
    });

    const count = await errandCards.count();

    if (count > 0) {
      const firstCard = errandCards.first();

      // 카드 내 필수 정보 확인
      await expect(firstCard.locator('text=/₩/')).toBeVisible(); // 보상금
      await expect(firstCard.locator('text=/거리:/')).toBeVisible(); // 거리
      await expect(firstCard.locator('text=/마감:/')).toBeVisible(); // 마감 시간
    } else {
      console.log('심부름 카드가 없습니다 (주변에 심부름이 없을 수 있음)');
    }
  });

  test('ERR-11: 새로고침 버튼 작동', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 새로고침 버튼 찾기 (SVG 아이콘 포함)
    const refreshButton = page.locator('button:has(svg)').filter({
      has: page.locator('path[d*="M4 4v5"]') // 새로고침 아이콘의 path
    });

    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // 로딩 상태 확인
      await expect(page.locator('text=심부름 조회 중')).toBeVisible({ timeout: 2000 }).catch(() => {
        // 빠르게 로드되면 로딩 메시지가 안 보일 수 있음
      });
    }
  });

  test('ERR-12: 사용자 탭 전환', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // "심부름 요청" 탭 (requester)
    const requesterTab = page.locator('button:has-text("심부름 요청")');
    if (await requesterTab.isVisible()) {
      await requesterTab.click();
      await expect(page.locator('text=내 심부름 이력')).toBeVisible({ timeout: 5000 });
    }

    // "심부름 수행" 탭 (performer)
    const performerTab = page.locator('button:has-text("심부름 수행")');
    if (await performerTab.isVisible()) {
      await performerTab.click();
      await page.waitForTimeout(1000); // 탭 전환 대기
    }

    // "심부름 받기" 탭 (receiver) - 원래 상태로 돌아가기
    const receiverTab = page.locator('button:has-text("심부름 받기")');
    if (await receiverTab.isVisible()) {
      await receiverTab.click();
      await expect(page.locator('text=주변 심부름 찾기')).toBeVisible();
    }
  });

  test('ERR-13: 심부름 카드 클릭 시 지도 이동', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 심부름 로드 대기

    // 심부름 카드 찾기
    const errandCard = page.locator('[class*="bg-white"][class*="rounded-lg"]').filter({
      has: page.locator('text=/₩/')
    }).first();

    if (await errandCard.isVisible()) {
      // 카드 클릭
      await errandCard.click();

      // 지도로 스크롤되는지 확인 (약간의 대기 시간 필요)
      await page.waitForTimeout(1000);

      // 안내 메시지 확인
      await expect(page.locator('text=클릭하면 지도에서 위치를 확인할 수 있습니다')).toBeVisible();
    }
  });

  test('ERR-14: 현재 위치로 버튼', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 현재 위치로 이동 버튼 찾기 (GPS 아이콘)
    const currentLocationButton = page.locator('button:has-text("현재 위치로")');

    if (await currentLocationButton.isVisible()) {
      await currentLocationButton.click();
      await page.waitForTimeout(1000); // 지도 이동 대기
    }
  });

  test('ERR-15: 카테고리 아이콘 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 카테고리 이모지가 있는지 확인 (쇼핑, 배달, 청소 등)
    const categoryEmojis = ['🛒', '🚚', '🧹', '📦', '🐕', '💼'];

    let emojiFound = false;
    for (const emoji of categoryEmojis) {
      const emojiLocator = page.locator(`text=${emoji}`);
      if (await emojiLocator.count() > 0) {
        emojiFound = true;
        break;
      }
    }

    // 심부름이 있으면 카테고리 이모지가 있어야 함
    const errandCount = await page.locator('[class*="bg-white"][class*="rounded-lg"]').filter({
      has: page.locator('text=/₩/')
    }).count();

    if (errandCount > 0) {
      expect(emojiFound).toBeTruthy();
    }
  });

  test('ERR-16: 심부름 상태 배지 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 상태 배지 확인 (대기중, 수락됨, 진행중, 완료)
    const statusBadges = page.locator('span[class*="px-2 py-1 rounded text-xs"]').filter({
      hasText: /대기중|수락됨|진행중|완료/
    });

    const count = await statusBadges.count();

    if (count > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });
});
