#!/usr/bin/env node
/**
 * GUNDAM SITE 视觉检测工具 v2
 * 使用 JSDOM 执行 JavaScript 后检测
 * 
 * 运行: node scripts/visual-test-v2.mjs
 */

import https from 'https';
import http from 'http';
import { JSDOM } from 'jsdom';

const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: '首页', path: '/', width: 1280, height: 800 },
  { name: '登录页', path: '/login', width: 1280, height: 800 },
  { name: '注册页', path: '/register', width: 1280, height: 800 },
  { name: '机体列表', path: '/mechas', width: 1280, height: 800 },
  { name: '作品列表', path: '/creations', width: 1280, height: 800 },
  { name: '首页-移动端', path: '/', width: 375, height: 812 },
];

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchAndRender(url) {
  const html = await httpGet(url);
  
  // 使用 JSDOM 模拟浏览器环境
  const dom = new JSDOM(html, {
    url,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
  });
  
  // 等待 JS 执行
  await sleep(3000);
  
  return dom.window.document;
}

function checkMandatoryElements(doc, pageName) {
  const checks = [];
  
  const rules = {
    '首页': [
      { selector: 'nav', name: '导航栏' },
      { selector: 'main', name: '主内容区' },
      { selector: '[class*="glass"]', name: '玻璃态卡片' },
      { selector: 'footer', name: '页脚' },
      { selector: '[class*="neon"]', name: '霓虹效果' },
    ],
    '登录页': [
      { selector: 'form', name: '登录表单' },
      { selector: 'input[type="password"]', name: '密码输入框' },
      { selector: 'button[type="submit"]', name: '提交按钮' },
      { selector: '[class*="cyber"]', name: '赛博风格按钮' },
    ],
    '注册页': [
      { selector: 'form', name: '注册表单' },
      { selector: 'input[type="email"]', name: '邮箱输入框' },
      { selector: 'button[type="submit"]', name: '提交按钮' },
    ],
    '机体列表': [
      { selector: 'nav', name: '导航栏' },
      { selector: 'main', name: '主内容区' },
      { selector: '[class*="grid"]', name: '网格布局' },
    ],
    '作品列表': [
      { selector: 'nav', name: '导航栏' },
      { selector: 'main', name: '主内容区' },
      { selector: '[class*="grid"]', name: '瀑布流/网格' },
    ],
  };
  
  const pageRules = rules[pageName] || rules['首页'];
  
  for (const rule of pageRules) {
    const elements = doc.querySelectorAll(rule.selector);
    checks.push({
      selector: rule.selector,
      name: rule.name,
      found: elements.length > 0,
      count: elements.length,
    });
  }
  
  return checks;
}

function checkOverlapping(doc) {
  const issues = [];
  
  // 找所有 fixed/sticky 定位元素
  const fixedElements = doc.querySelectorAll('*');
  const fixedList = [];
  
  fixedElements.forEach(el => {
    const style = doc.defaultView.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    if (style.position === 'fixed' || style.position === 'sticky') {
      if (rect.width > 0 && rect.height > 0) {
        fixedList.push({
          tag: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          height: rect.height,
          width: rect.width,
        });
      }
    }
  });
  
  // 检测重叠
  for (let i = 0; i < fixedList.length; i++) {
    for (let j = i + 1; j < fixedList.length; j++) {
      const a = fixedList[i];
      const b = fixedList[j];
      
      // 检测垂直重叠
      const verticalOverlap = !(a.bottom <= b.top || b.bottom <= a.top);
      const horizontalOverlap = !(a.right <= b.left || b.right <= a.left);
      
      if (verticalOverlap && horizontalOverlap) {
        issues.push({
          type: 'overlap',
          element1: `${a.tag}${a.id ? '#' + a.id : '.' + a.className.split(' ')[0]}`,
          element2: `${b.tag}${b.id ? '#' + b.id : '.' + b.className.split(' ')[0]}`,
          detail: `元素重叠: ${a.tag} (${Math.round(a.top)}px-${Math.round(a.bottom)}px) 与 ${b.tag} (${Math.round(b.top)}px-${Math.round(b.bottom)}px)`,
          severity: 'warning',
        });
      }
    }
  }
  
  return { elements: fixedList, issues };
}

function checkOverflow(doc) {
  const issues = [];
  
  // 检测文字溢出
  const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a');
  
  textElements.forEach(el => {
    const style = doc.defaultView.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    // 检测水平溢出
    if (el.scrollWidth > rect.width && rect.width > 0) {
      const overflowAmount = el.scrollWidth - rect.width;
      if (overflowAmount > 10) {
        issues.push({
          type: 'text_overflow',
          element: `${el.tagName}.${el.className.split(' ')[0]}`,
          text: el.textContent.slice(0, 30) + '...',
          detail: `文字溢出 ${Math.round(overflowAmount)}px: "${el.textContent.slice(0, 20)}..."`,
          severity: 'warning',
        });
      }
    }
  });
  
  // 检测图片变形
  const images = doc.querySelectorAll('img');
  images.forEach(img => {
    const rect = img.getBoundingClientRect();
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    if (naturalWidth > 0 && naturalHeight > 0 && rect.width > 0 && rect.height > 0) {
      const displayedRatio = rect.width / rect.height;
      const naturalRatio = naturalWidth / naturalHeight;
      const ratioDiff = Math.abs(displayedRatio - naturalRatio);
      
      if (ratioDiff > 0.5) {
        issues.push({
          type: 'image_distortion',
          element: `${img.tagName}.${img.className.split(' ')[0]}`,
          detail: `图片变形: 显示 ${Math.round(rect.width)}x${Math.round(rect.height)}, 自然 ${naturalWidth}x${naturalHeight}`,
          severity: 'warning',
        });
      }
    }
  });
  
  return issues;
}

function checkLayoutIssues(doc) {
  const issues = [];
  
  // 检测负 margin
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const style = doc.defaultView.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    
    // 负 margin 可能导致布局问题
    if (marginTop < 0 || marginBottom < 0 || marginLeft < 0 || marginRight < 0) {
      const tag = el.tagName.toLowerCase();
      const cls = el.className.split(' ')[0] || '';
      issues.push({
        type: 'negative_margin',
        element: `${tag}${cls ? '.' + cls : ''}`,
        detail: `负 margin: top=${marginTop}, bottom=${marginBottom}, left=${marginLeft}, right=${marginRight}`,
        severity: 'info',
      });
    }
  });
  
  // 检测元素超出 viewport
  const body = doc.body;
  if (body) {
    const bodyRect = body.getBoundingClientRect();
    const viewWidth = doc.defaultView.innerWidth;
    const viewHeight = doc.defaultView.innerHeight;
    
    if (bodyRect.width > viewWidth && bodyRect.width > 0) {
      issues.push({
        type: 'overflow_viewport',
        element: 'body',
        detail: `内容宽度 ${Math.round(bodyRect.width)}px 超出视口 ${viewWidth}px`,
        severity: 'warning',
      });
    }
  }
  
  return issues;
}

async function runTests() {
  log(`\n${colors.cyan}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║        GUNDAM SITE 视觉检测工具 v2 (JSDOM)                  ║
║        检测时间: ${new Date().toISOString().slice(0, 19)}                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`, 'cyan');
  
  let totalIssues = [];
  
  for (const page of PAGES) {
    log(`\n${colors.bold}📄 ${page.name} (${page.path}) [${page.width}x${page.height}]${colors.reset}`, 'blue');
    log('─'.repeat(60), 'blue');
    
    try {
      const url = `${BASE_URL}${page.path}`;
      log(`  获取页面: ${url}`, 'yellow');
      
      const doc = await fetchAndRender(url);
      
      // 设置视口大小
      if (doc.defaultView) {
        doc.defaultView.resizeTo(page.width, page.height);
      }
      
      const pageIssues = [];
      
      // 1. 关键元素检测
      log(`\n  ${colors.bold}[1] 关键元素检测${colors.reset}`, 'cyan');
      const elementChecks = checkMandatoryElements(doc, page.name);
      for (const check of elementChecks) {
        const icon = check.found ? '✅' : '❌';
        const color = check.found ? 'green' : 'red';
        log(`    ${icon} ${check.name} (${check.selector}) - 找到 ${check.count} 个`, color);
        if (!check.found) {
          pageIssues.push({ ...check, severity: 'error', category: 'missing' });
        }
      }
      
      // 2. 重叠检测
      log(`\n  ${colors.bold}[2] 固定定位元素重叠检测${colors.reset}`, 'cyan');
      const { elements: fixedList, issues: overlapIssues } = checkOverlapping(doc);
      log(`    固定/粘性定位元素: ${fixedList.length} 个`, 'yellow');
      
      if (fixedList.length > 0) {
        log(`    列表:`, 'yellow');
        fixedList.forEach(el => {
          log(`      - ${el.tag} [${Math.round(el.top)}px-${Math.round(el.bottom)}px]`, 'yellow');
        });
      }
      
      if (overlapIssues.length > 0) {
        for (const issue of overlapIssues) {
          log(`    ⚠️  ${issue.detail}`, 'yellow');
          pageIssues.push({ ...issue, category: 'overlap' });
        }
      } else {
        log(`    ✅ 无重叠问题`, 'green');
      }
      
      // 3. 溢出检测
      log(`\n  ${colors.bold}[3] 溢出检测${colors.reset}`, 'cyan');
      const overflowIssues = checkOverflow(doc);
      if (overflowIssues.length > 0) {
        for (const issue of overflowIssues.slice(0, 5)) {
          log(`    ⚠️  ${issue.element}: ${issue.detail}`, 'yellow');
          pageIssues.push({ ...issue, category: 'overflow' });
        }
        if (overflowIssues.length > 5) {
          log(`    ... 还有 ${overflowIssues.length - 5} 个溢出问题`, 'yellow');
        }
      } else {
        log(`    ✅ 无明显溢出问题`, 'green');
      }
      
      // 4. 布局问题
      log(`\n  ${colors.bold}[4] 布局问题${colors.reset}`, 'cyan');
      const layoutIssues = checkLayoutIssues(doc);
      if (layoutIssues.length > 0) {
        for (const issue of layoutIssues.slice(0, 5)) {
          log(`    ℹ️  ${issue.element}: ${issue.detail}`, 'yellow');
        }
      } else {
        log(`    ✅ 无布局异常`, 'green');
      }
      
      // 总结
      const errorCount = pageIssues.filter(i => i.severity === 'error').length;
      const warnCount = pageIssues.filter(i => i.severity === 'warning').length;
      
      log(`\n  ${colors.bold}📊 ${page.name} 问题汇总:${colors.reset}`, 'blue');
      if (errorCount > 0) {
        log(`    ❌ 错误: ${errorCount}`, 'red');
      }
      if (warnCount > 0) {
        log(`    ⚠️  警告: ${warnCount}`, 'yellow');
      }
      if (errorCount === 0 && warnCount === 0) {
        log(`    ✅ 无问题`, 'green');
      }
      
      totalIssues.push(...pageIssues.map(i => ({ ...i, page: page.name })));
      
    } catch (error) {
      log(`\n  ❌ 检测失败: ${error.message}`, 'red');
      if (error.stack) {
        log(`     ${error.stack.split('\n')[1]}`, 'red');
      }
    }
  }
  
  // 全局汇总
  log(`\n${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                      检测汇总                               ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`, 'cyan');
  
  const totalErrors = totalIssues.filter(i => i.severity === 'error').length;
  const totalWarns = totalIssues.filter(i => i.severity === 'warning').length;
  
  log(`\n  总检查页面: ${PAGES.length}`, 'blue');
  log(`  总错误数: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
  log(`  总警告数: ${totalWarns}`, totalWarns > 0 ? 'yellow' : 'green');
  
  if (totalErrors > 0) {
    log(`\n  ${colors.red}${colors.bold}需要修复的错误:${colors.reset}`, 'red');
    totalIssues.filter(i => i.severity === 'error').forEach(issue => {
      log(`    ❌ [${issue.page}] ${issue.name || issue.element}: ${issue.detail}`, 'red');
    });
  }
  
  if (totalWarns > 0) {
    log(`\n  ${colors.yellow}${colors.bold}需要注意的警告:${colors.reset}`, 'yellow');
    totalIssues.filter(i => i.severity === 'warning').forEach(issue => {
      log(`    ⚠️  [${issue.page}] ${issue.element}: ${issue.detail}`, 'yellow');
    });
  }
  
  log(`
  ${colors.green}✅ JSDOM 渲染检测完成${colors.reset}
  ${colors.yellow}⚠️  JSDOM 局限性: 某些 JS 组件可能无法完全渲染${colors.reset}
  ${colors.cyan}💡 建议: 配合浏览器 DevTools 手动验证${colors.reset}
  `);
}

runTests().catch(console.error);
