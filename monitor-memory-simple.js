#!/usr/bin/env node

/**
 * 메모리 모니터링 스크립트
 * npm run dev를 실행하면서 메모리 사용량을 주기적으로 출력합니다.
 */

const { spawn } = require('child_process');

// 색상 정의
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
};

function formatMemory(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

function formatPercent(percent) {
  if (percent < 50) return `${colors.green}${percent.toFixed(1)}%${colors.reset}`;
  if (percent < 80) return `${colors.yellow}${percent.toFixed(1)}%${colors.reset}`;
  return `${colors.red}${percent.toFixed(1)}%${colors.reset}`;
}

console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}🚀 npm run dev 시작 - 메모리 모니터링${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);

const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'inherit', 'inherit'],
  shell: true,
});

// 메모리 모니터링 (2초마다)
let startTime = Date.now();
let maxHeap = 0;
let maxRss = 0;
let samples = 0;

const monitorInterval = setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsed = parseFloat(formatMemory(memUsage.heapUsed));
  const heapTotal = parseFloat(formatMemory(memUsage.heapTotal));
  const rss = parseFloat(formatMemory(memUsage.rss));
  const external = parseFloat(formatMemory(memUsage.external));
  const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (heapUsed > maxHeap) maxHeap = heapUsed;
  if (rss > maxRss) maxRss = rss;
  samples++;

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  process.stdout.write(
    `\r⏱️  ${elapsed.toString().padStart(3)}s | ` +
    `Heap: ${heapUsed.toFixed(1)}/${heapTotal.toFixed(1)} MB (${formatPercent(heapPercent)}) | ` +
    `RSS: ${rss.toFixed(1)} MB | ` +
    `최대: ${maxRss.toFixed(1)} MB        `
  );
}, 2000);

devProcess.on('exit', (code) => {
  clearInterval(monitorInterval);
  console.log('\n');
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}📊 메모리 사용 통계${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`최대 힙 사용량:  ${maxHeap.toFixed(2)} MB`);
  console.log(`최대 RSS:        ${maxRss.toFixed(2)} MB`);
  console.log(`측정 횟수:       ${samples}`);
  console.log(`실행 시간:       ${Math.floor((Date.now() - startTime) / 1000)}초`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
  process.exit(code);
});

process.on('SIGINT', () => {
  clearInterval(monitorInterval);
  console.log('\n중단됨');
  devProcess.kill();
});
