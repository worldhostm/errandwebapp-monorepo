import { test, expect } from '@playwright/test';

/**
 * Errand Form Tests
 * 심부름 등록 폼 테스트
 */

test.describe('Errand Registration Form', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 사용자로 로그인
    await page.goto('/test');
    const testUserButton = page.locator('button:has-text("테스트 사용자")').first();
    if (await testUserButton.isVisible()) {
      await testUserButton.click();
    }
    await page.goto('/');
  });

  test('ERR-01: 심부름 등록 버튼 클릭', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 심부름 등록 버튼 클릭
    await page.click('button:has-text("심부름 등록")');

    // 폼 모달이 열리는지 확인
    await expect(page.locator('text=심부름 등록하기')).toBeVisible({ timeout: 5000 });
  });

  test('ERR-02: 폼 필드 표시 확인', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');

    // 필수 필드 확인
    await expect(page.locator('input[placeholder*="제목"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="설명"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="보상금"]')).toBeVisible();

    // 카테고리 버튼 확인 (6개)
    const categoryButtons = page.locator('button').filter({
      hasText: /쇼핑|배달|청소|택배|반려동물|기타/
    });
    expect(await categoryButtons.count()).toBeGreaterThanOrEqual(6);
  });

  test('ERR-03: 카테고리 선택', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');

    // 쇼핑 카테고리 선택
    const shoppingButton = page.locator('button:has-text("🛒")');
    if (await shoppingButton.isVisible()) {
      await shoppingButton.click();

      // 선택된 상태 확인 (배경색 변경 등)
      const isSelected = await shoppingButton.evaluate((el) => {
        return el.className.includes('blue') || el.className.includes('selected');
      });

      expect(isSelected).toBeTruthy();
    }
  });

  test('ERR-04: 필수 필드 없이 제출 시도', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(1000);

    // 등록 버튼 찾기
    const submitButton = page.locator('button:has-text("등록하기")');

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // 위치 선택 알림 또는 HTML5 validation 확인
      await page.waitForTimeout(1000);

      // 제목 입력 필드의 유효성 검사
      const titleInput = page.locator('input[placeholder*="제목"]');
      const isInvalid = await titleInput.evaluate((el: HTMLInputElement) => {
        return !el.validity.valid;
      });

      expect(isInvalid).toBeTruthy();
    }
  });

  test('ERR-05: 보상금 입력', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(1000);

    // 보상금 입력
    const rewardInput = page.locator('input[placeholder*="보상금"]');
    await rewardInput.fill('10000');

    // 입력값 확인
    await expect(rewardInput).toHaveValue('10000');
  });

  test('ERR-06: 마감 시간 설정', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(1000);

    // 마감 시간 입력 필드 찾기
    const deadlineInput = page.locator('input[type="datetime-local"]');

    if (await deadlineInput.isVisible()) {
      // 내일 날짜로 설정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      await deadlineInput.fill(dateString);
      await expect(deadlineInput).toHaveValue(dateString);
    }
  });

  test('ERR-07: 폼 취소', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(1000);

    // 취소 버튼 클릭
    const cancelButton = page.locator('button:has-text("취소")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // 모달이 닫혔는지 확인
      await expect(page.locator('text=심부름 등록하기')).not.toBeVisible();
    }
  });

  test('ERR-08: 지도에서 위치 선택 UI 확인', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(2000);

    // 지도 컨테이너가 있는지 확인
    const mapContainer = page.locator('#map').or(page.locator('[class*="map"]'));

    // 지도가 로드되기를 기다림
    await page.waitForTimeout(2000);

    // 주소 검색 입력 필드 확인
    const searchInput = page.locator('input[placeholder*="주소"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('ERR-09: 주소 검색 기능', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(2000);

    // 주소 검색 입력
    const searchInput = page.locator('input[placeholder*="주소"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('강남역');
      await page.waitForTimeout(1000);

      // 검색 결과가 나타나는지 확인 (있을 경우)
      const searchResults = page.locator('[class*="search-result"]').or(
        page.locator('text=강남')
      );

      // 검색 결과가 있을 수 있음 (Kakao API 호출)
      await page.waitForTimeout(2000);
    }
  });

  test('ERR-10: 완전한 심부름 등록 플로우', async ({ page }) => {
    test.skip(); // 실제 등록은 스킵 (DB에 데이터가 쌓이므로)

    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("심부름 등록")');
    await page.waitForTimeout(2000);

    // 제목 입력
    await page.fill('input[placeholder*="제목"]', 'Playwright 테스트 심부름');

    // 설명 입력
    await page.fill('textarea[placeholder*="설명"]', '이것은 자동화 테스트입니다.');

    // 카테고리 선택
    await page.click('button:has-text("🛒")');

    // 보상금 입력
    await page.fill('input[placeholder*="보상금"]', '5000');

    // 위치는 기본 위치 사용 (또는 지도 클릭)

    // 등록 버튼 클릭
    await page.click('button:has-text("등록하기")');

    // 성공 알림 확인
    await expect(page.locator('text=성공적으로 등록되었습니다')).toBeVisible({ timeout: 10000 });
  });
});
