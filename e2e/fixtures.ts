import { test as base, expect } from '@playwright/test';

/**
 * 공통 테스트 픽스처
 * 모든 E2E 테스트에서 사용하는 공통 기능을 제공합니다
 */

export const test = base.extend({
  // 페이지 설정 후 위치 권한 처리
  page: async ({ page }, use) => {
    // 위치 권한 자동 허용 설정
    await page.context().grantPermissions(['geolocation']);

    // 기본 위치 설정 (부림이 서비스 중심 좌표)
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064
    });

    // 페이지 로드 시 위치 권한 모달 자동 처리
    page.on('dialog', async (dialog) => {
      console.log(`Dialog type: ${dialog.type()}, message: ${dialog.message()}`);
      if (dialog.type() === 'confirm') {
        await dialog.accept(); // 모달 자동 승인
      }
    });

    await use(page);
  },
});

/**
 * 공통 함수들
 */

/**
 * 페이지 로드 후 위치 권한 모달 대기 및 처리
 */
export async function handleGeolocationPrompt(page: any) {
  try {
    // 권한 요청 다이얼로그 감시
    const permissionPromise = page.once('dialog', async (dialog: any) => {
      if (dialog.message().includes('위치') || dialog.message().includes('location')) {
        console.log('🎯 위치 권한 모달 감지 - 자동 승인');
        await dialog.accept();
      }
    });

    // 권한 요청이 발생할 수 있으므로 약간 대기
    await Promise.race([
      permissionPromise,
      page.waitForTimeout(2000).catch(() => {}),
    ]);
  } catch (error) {
    console.log('위치 권한 처리 중 오류:', error);
  }
}

/**
 * 테스트 사용자로 로그인
 */
export async function loginAsTestUser(page: any) {
  await page.goto('/test');

  // 테스트 사용자 버튼 클릭
  const testUserBtn = page.locator('button:has-text("테스트 사용자")').first();

  if (await testUserBtn.isVisible()) {
    await testUserBtn.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ 테스트 사용자로 로그인 완료');
  } else {
    console.log('⚠️ 테스트 사용자 버튼을 찾을 수 없음');
  }
}

/**
 * 위치 권한 확인
 */
export async function ensureGeolocationPermission(page: any) {
  try {
    // 이미 권한이 있는지 확인
    const permission = await page.context().permissions();
    if (!permission.includes('geolocation')) {
      // 권한 부여
      await page.context().grantPermissions(['geolocation']);
    }

    // 위치 정보 설정
    await page.context().setGeolocation({
      latitude: 37.195317655506145,
      longitude: 127.1191887685064,
    });
  } catch (error) {
    console.log('지오로케이션 설정 중 오류:', error);
  }
}

export { expect };
