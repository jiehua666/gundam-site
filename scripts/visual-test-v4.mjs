#!/usr/bin/env node
/**
 * visual-test-v4.mjs
 * Playwright 视觉检测工具 v4
 * 连接 Windows Chrome (localhost:9222) 进行运行时 DOM 检测
 */

import { chromium } from 'playwright';

const PAGES = [
  { name: '首页', path: '/', id: 'home' },
  { name: '登录', path: '/auth/login', id: 'login' },
  { name: '注册', path: '/auth/register', id: 'register' },
  { name: '机体列表', path: '/mechas', id: 'mechas' },
  { name: '作品列表', path: '/creations', id: 'creations' },
  { name: '机体详情', path: '/mechas/1', id: 'mecha-detail' },
  { name: '作品详情', path: '/creations/1', id: 'creation-detail' },
  { name: '用户页', path: '/users/1', id: 'user-page' },
];

const BASE = 'http://localhost:3000';

// ─── 检测函数 ─────────────────────────────────────────────────────────────

function detectFixedOverlap(els) {
  const fixed = els.filter(e => getComputedStyle(e).position === 'fixed');
  const warnings = [];
  for (let i = 0; i < fixed.length; i++) {
    for (let j = i + 1; j < fixed.length; j++) {
      const a = fixed[i].getBoundingClientRect();
      const b = fixed[j].getBoundingClientRect();
      if (a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left) {
        warnings.push(`${fixed[i].tagName}#${fixed[i].id || ''}.${fixed[i].className} vs ${fixed[j].tagName}#${fixed[j].id || ''}.${fixed[j].className}`);
      }
    }
  }
  return warnings;
}

function detectOverflow(container, depth = 0) {
  if (depth > 5) return [];
  const warnings = [];
  const style = getComputedStyle(container);
  const rect = container.getBoundingClientRect();
  const scrollW = container.scrollWidth;
  const scrollH = container.scrollHeight;

  if (rect.width > 0 && rect.height > 0) {
    if (scrollW > rect.width + 1 || scrollH > rect.height + 1) {
      const overflowX = scrollW > rect.width + 1;
      const overflowY = scrollH > rect.height + 1;
      warnings.push(`${container.tagName}#${container.id || ''} overflow${overflowX ? '-x' : ''}${overflowY ? '-y' : ''} scrollW=${scrollW} rectW=${Math.round(rect.width)} scrollH=${scrollH} rectH=${Math.round(rect.height)}`);
    }
  }

  const children = Array.from(container.children);
  for (const child of children) {
    warnings.push(...detectOverflow(child, depth + 1));
  }
  return warnings;
}

function detectTinyElements(els) {
  return els
    .filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.width < 10 || r.height < 10);
    })
    .map(e => `${e.tagName}#${e.id || ''} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
}

function detectInvisibleElements(els) {
  return els
    .filter(e => {
      const r = e.getBoundingClientRect();
      const style = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && (style.opacity === '0' || style.visibility === 'hidden');
    })
    .map(e => `${e.tagName}#${e.id || ''} opacity=${style.opacity} visibility=${style.visibility}`);
}

function detectTextTruncation(els) {
  return els
    .filter(e => {
      const s = getComputedStyle(e);
      return s.overflow === 'hidden' && e.scrollWidth > e.clientWidth;
    })
    .map(e => `${e.tagName}#${e.id || ''}.${e.className} text-overflowed w=${e.scrollWidth} cw=${e.clientWidth}`);
}

function detectResponsiveBreakpoints(page) {
  const bp = { sm: 0, md: 0, lg: 0, xl: 0, '2xl': 0 };
  const src = page.content();
  const regex = /class="[^"]*(sm:|md:|lg:|xl:|2xl:)[^"]*"/g;
  let m;
  while ((m = regex.exec(src)) !== null) {
    const cls = m[0].match(/sm:|md:|lg:|xl:|2xl:/)[0].replace(':', '');
    bp[cls]++;
  }
  return bp;
}

function detectMissingAlt(els) {
  return els
    .filter(e => e.tagName === 'IMG' && !e.alt)
    .map(e => `IMG${e.src ? ' src=' + e.src.slice(-30) : ''}`);
}

function detectEmptyLinks(els) {
  return els
    .filter(e => e.tagName === 'A' && !e.textContent.trim() && !e.href)
    .map(e => `A#${e.id || ''}.${e.className}`);
}

// ─── 响应式检测 ─────────────────────────────────────────────────────────────

async function checkMobile(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const els = await page.$$('*');
  const fixed = await detectFixedOverlap(els);
  return { viewport: 'mobile', fixed };
}

// ─── 主流程 ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 启动 Playwright Chromium...');

  let browser;
  try {
    // Playwright 自带 Chromium，不指定路径
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  } catch (e) {
    console.error(`❌ 启动浏览器失败: ${e.message}`);
    process.exit(1);
  }

  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // 预热
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const p of PAGES) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📄 ${p.name} (${p.path})`);
    console.log('─'.repeat(60));

    try {
      await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);

      const els = await page.$$('*');

      // 1. Fixed 重叠
      const fixedOverlap = await detectFixedOverlap(els);
      if (fixedOverlap.length > 0) {
        console.log(`⚠️  Fixed 重叠 (${fixedOverlap.length})`);
        fixedOverlap.forEach(w => console.log(`   ${w}`));
        totalWarnings += fixedOverlap.length;
      }

      // 2. Overflow
      const overflowEls = els.filter(async e => {
        const s = getComputedStyle(e);
        return s.overflow && s.overflow !== 'visible' && s.overflow !== 'hidden';
      });
      const overflowWarnings = await page.evaluate(() => {
        const allEls = document.querySelectorAll('*');
        return Array.from(allEls).map(e => {
          const s = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          if (r.width > 0 && r.height > 0 && (e.scrollWidth > r.width + 2 || e.scrollHeight > r.height + 2)) {
            return `${e.tagName}#${e.id || ''} sw=${e.scrollWidth} rw=${Math.round(r.width)} sh=${e.scrollHeight} rh=${Math.round(r.height)}`;
          }
          return null;
        }).filter(Boolean);
      });
      if (overflowWarnings.length > 0) {
        console.log(`⚠️  Overflow (${overflowWarnings.length})`);
        overflowWarnings.slice(0, 5).forEach(w => console.log(`   ${w}`));
        if (overflowWarnings.length > 5) console.log(`   ... 还有 ${overflowWarnings.length - 5} 个`);
        totalWarnings += overflowWarnings.length;
      }

      // 3. 响应式断点
      const bp = await page.evaluate(() => {
        const src = document.documentElement.innerHTML;
        const counts = { sm: 0, md: 0, lg: 0, xl: 0, '2xl': 0 };
        const regex = /class="([^"]*)"/g;
        let m;
        while ((m = regex.exec(src)) !== null) {
          const cls = m[1];
          if (/sm:/.test(cls)) counts.sm++;
          if (/md:/.test(cls)) counts.md++;
          if (/lg:/.test(cls)) counts.lg++;
          if (/xl:/.test(cls)) counts.xl++;
          if (/2xl:/.test(cls)) counts['2xl']++;
        }
        return counts;
      });
      const bpReport = Object.entries(bp).map(([k, v]) => `${k}:(${v}次)`).join(' ');
      console.log(`📱 响应式断点: ${bpReport}`);

      // 4. 缺失 alt
      const noAlt = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(i => !i.alt).map(i => i.src ? i.src.slice(-40) : 'no-src');
      });
      if (noAlt.length > 0) {
        console.log(`⚠️  IMG 缺失 alt (${noAlt.length})`);
        noAlt.slice(0, 3).forEach(a => console.log(`   ${a}`));
        totalWarnings += noAlt.length;
      }

      // 5. 文字截断
      const truncated = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).map(e => {
          const s = getComputedStyle(e);
          if ((s.overflow === 'hidden' || s.overflowX === 'hidden') && e.scrollWidth > e.clientWidth + 2) {
            return `${e.tagName}#${e.id || ''}.${e.className} text-clipped w=${e.scrollWidth} cw=${e.clientWidth}`;
          }
          return null;
        }).filter(Boolean).slice(0, 5);
      });
      if (truncated.length > 0) {
        console.log(`⚠️  文字截断 (${truncated.length})`);
        truncated.forEach(t => console.log(`   ${t}`));
        totalWarnings += truncated.length;
      }

      // 6. 透明/隐藏元素
      const invisible = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*')).map(e => {
          const r = e.getBoundingClientRect();
          const s = getComputedStyle(e);
          if (r.width > 20 && r.height > 20 && (s.opacity === '0' || s.visibility === 'hidden')) {
            return `${e.tagName}#${e.id || ''} opacity=${s.opacity} vis=${s.visibility}`;
          }
          return null;
        }).filter(Boolean);
      });
      if (invisible.length > 0) {
        console.log(`⚠️  透明/隐藏元素 (${invisible.length})`);
        invisible.slice(0, 3).forEach(t => console.log(`   ${t}`));
        totalWarnings += invisible.length;
      }

      if (fixedOverlap.length === 0 && overflowWarnings.length === 0 && noAlt.length === 0 && truncated.length === 0 && invisible.length === 0) {
        console.log(`✅ 无视觉问题`);
      }

    } catch (e) {
      console.error(`❌ 加载失败: ${e.message}`);
      totalErrors++;
    }
  }

  // Mobile 额外检测
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📱 移动端检测 (375x812)`);
  console.log('─'.repeat(60));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const mobileFixed = await page.evaluate(() => {
    const fixed = Array.from(document.querySelectorAll('*')).filter(e => getComputedStyle(e).position === 'fixed');
    const pairs = [];
    for (let i = 0; i < fixed.length; i++) {
      for (let j = i + 1; j < fixed.length; j++) {
        const a = fixed[i].getBoundingClientRect();
        const b = fixed[j].getBoundingClientRect();
        if (a.top < b.bottom && a.bottom > b.top) {
          pairs.push(`${fixed[i].tagName} vs ${fixed[j].tagName} overlap-y`);
        }
      }
    }
    return pairs;
  });
  if (mobileFixed.length > 0) {
    console.log(`⚠️  Mobile fixed 重叠 (${mobileFixed.length})`);
    mobileFixed.forEach(w => console.log(`   ${w}`));
    totalWarnings += mobileFixed.length;
  } else {
    console.log(`✅ Mobile 无 fixed 重叠`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 汇总: ${totalErrors} 错误, ${totalWarnings} 警告`);

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
