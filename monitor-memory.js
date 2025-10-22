#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// 메모리를 MB 단위로 포맷팅
function formatMemory(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

// 모니터링 시작
console.log('🚀 Development 서버 시작 및 메모리 모니터링...\n');

const isWindows = os.platform() === 'win32';
const devProcess = spawn(isWindows ? 'cmd' : 'sh',
  isWindows ? ['/c', 'npm run dev'] : ['-c', 'npm run dev'],
  {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: process.cwd()
  }
);

let maxMemory = 0;
let startTime = Date.now();

// 메모리 사용량 주기적으로 체크 (1초마다)
const memoryCheckInterval = setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsed = memUsage.heapUsed;
  const heapTotal = memUsage.heapTotal;
  const external = memUsage.external;
  const rss = memUsage.rss;

  if (heapUsed > maxMemory) {
    maxMemory = heapUsed;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  process.stdout.write(
    `\r⏱️  ${elapsed}s | Heap: ${formatMemory(heapUsed)}/${formatMemory(heapTotal)} MB | RSS: ${formatMemory(rss)} MB | Max: ${formatMemory(maxMemory)} MB`
  );
}, 1000);

devProcess.on('exit', (code) => {
  clearInterval(memoryCheckInterval);
  console.log('\n\n📊 메모리 사용 통계:');
  console.log(`최대 힙 사용량: ${formatMemory(maxMemory)} MB`);
  process.exit(code);
});

process.on('SIGINT', () => {
  clearInterval(memoryCheckInterval);
  devProcess.kill();
});
