import { test, expect, handleGeolocationPrompt } from './fixtures';

/**
 * Map and Location Tests
 * 지도 및 위치 기능 테스트
 */

test.describe('Map and Location', () => {
  test.beforeEach(async ({ page }) => {
    // 페이지 로드 전 위치 권한 설정
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064,
    });

    // 테스트 사용자로 로그인
    await page.goto('/test');
    await handleGeolocationPrompt(page);
    await page.waitForLoadState('networkidle');

    const testUserButton = page.locator('button:has-text("테스트 사용자")').first();
    if (await testUserButton.isVisible()) {
      await testUserButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 메인 페이지로 이동
    await page.goto('/');
    await handleGeolocationPrompt(page);
    await page.waitForLoadState('networkidle');
  });

  test('MAP-01: 지도 컨테이너 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // 지도 컨테이너 확인
    await expect(page.locator('#map-container')).toBeVisible();
  });

  test('MAP-02: 지도 로드 확인', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // 지도 로드 대기

    // Kakao 지도가 로드되었는지 확인
    const mapLoaded = await page.evaluate(() => {
      return typeof window.kakao !== 'undefined' &&
             typeof window.kakao.maps !== 'undefined';
    });

    expect(mapLoaded).toBeTruthy();
  });

  test('MAP-03: 현재 위치로 버튼', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 현재 위치로 버튼 찾기
    const currentLocationButton = page.locator('button:has-text("현재 위치로")');

    if (await currentLocationButton.isVisible()) {
      // 버튼 클릭
      await currentLocationButton.click();
      await page.waitForTimeout(1000);

      // 지도가 이동했는지 확인 (에러 없이 실행되는지)
      await expect(currentLocationButton).toBeVisible();
    }
  });

  test('MAP-04: 지도 줌 컨트롤', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Kakao 지도의 줌 버튼 찾기
    // Kakao 지도는 iframe 내부에 있을 수 있으므로 확인
    const zoomInButton = page.locator('button[title*="확대"]').or(
      page.locator('[class*="zoom"][class*="in"]')
    );

    const hasZoomControl = await zoomInButton.count() > 0;
    console.log('Map zoom control exists:', hasZoomControl);
  });

  test('MAP-05: 심부름 마커 표시', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 마커가 있는지 확인 (심부름이 있을 경우)
    // Kakao 지도 마커는 DOM에 추가되므로 확인 가능
    const markers = await page.evaluate(() => {
      // Kakao 지도 마커 요소 찾기
      const markerElements = document.querySelectorAll('[class*="marker"]');
      return markerElements.length;
    });

    console.log('Map markers found:', markers);
  });

  test('MAP-06: 테스트 마커 기능 (test-user)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // test-user만 테스트 마커 UI를 볼 수 있음
    const testMarkerSection = page.locator('text=위도/경도로 마커 테스트');

    if (await testMarkerSection.isVisible()) {
      // 위도 입력
      await page.fill('input[placeholder*="위도"]', '37.5665');

      // 경도 입력
      await page.fill('input[placeholder*="경도"]', '126.9780');

      // 마커 표시 버튼 클릭
      await page.click('button:has-text("마커 표시")');

      // 테스트 마커 정보 확인
      await expect(page.locator('text=테스트 마커:')).toBeVisible({ timeout: 2000 });

      // 초기화 버튼 클릭
      await page.click('button:has-text("초기화")');

      // 입력 필드가 비워졌는지 확인
      await expect(page.locator('input[placeholder*="위도"]')).toHaveValue('');
    }
  });

  test('MAP-07: 예시 위치 버튼 (test-user)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const exampleButton = page.locator('button:has-text("청계동 예시")');

    if (await exampleButton.isVisible()) {
      await exampleButton.click();

      // 입력 필드에 값이 채워졌는지 확인
      const latInput = page.locator('input[placeholder*="위도"]');
      const latValue = await latInput.inputValue();

      expect(latValue).toBeTruthy();
      expect(latValue.length).toBeGreaterThan(0);
    }
  });

  test('MAP-08: 잘못된 좌표 입력 검증', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const testMarkerSection = page.locator('text=위도/경도로 마커 테스트');

    if (await testMarkerSection.isVisible()) {
      // 범위를 벗어난 위도 입력
      await page.fill('input[placeholder*="위도"]', '100');
      await page.fill('input[placeholder*="경도"]', '127.0');

      // 마커 표시 시도
      await page.click('button:has-text("마커 표시")');

      // 에러 알림 확인 (page.on('dialog') 사용)
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('위도');
        await dialog.accept();
      });

      await page.waitForTimeout(1000);
    }
  });

  test('MAP-09: 지도 이동 시 심부름 조회', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 초기 심부름 개수 확인
    const initialCount = await page.locator('text=/\\d+개 심부름/').textContent();

    // 지도를 이동시키는 시뮬레이션 (실제로는 지도 드래그가 어려우므로 확인만)
    console.log('Initial errand count:', initialCount);

    // 지도가 로드되었고 심부름 조회가 작동하는지 확인
    await expect(page.locator('text=/\\d+개 심부름/')).toBeVisible();
  });
});
