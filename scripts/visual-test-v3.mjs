#!/usr/bin/env node
/**
 * GUNDAM SITE 视觉检测工具 v3
 * 基于静态 HTML + CSS 分析的轻量级检测
 * 无需浏览器，执行快，可集成 CI
 * 
 * 运行: node scripts/visual-test-v3.mjs
 */

import https from 'https';
import http from 'http';
import { DOMParser } from 'linkedom';

const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: '首页', path: '/', viewport: 'desktop' },
  { name: '登录页', path: '/login', viewport: 'desktop' },
  { name: '注册页', path: '/register', viewport: 'desktop' },
  { name: '机体列表', path: '/mechas', viewport: 'desktop' },
  { name: '作品列表', path: '/creations', viewport: 'desktop' },
  { name: '首页-移动端', path: '/', viewport: 'mobile' },
];

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function parseHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc;
}

// ===================== 核心检测函数 =====================

function detectLayoutProblems(doc, html) {
  const issues = [];
  
  // 1. 检测重复的 z-index 值（可能导致层叠混乱）
  const zIndexMatches = html.match(/z-index:\s*(\d+)/gi) || [];
  if (zIndexMatches.length > 5) {
    const zValues = zIndexMatches.map(z => parseInt(z.match(/\d+/)[0]));
    const counts = {};
    zValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const duplicates = Object.entries(counts).filter(([, c]) => c > 1);
    if (duplicates.length > 0) {
      issues.push({
        type: 'z_index_collision',
        severity: 'warning',
        detail: `多个元素使用相同 z-index: ${duplicates.map(([v]) => v).join(', ')}`,
      });
    }
  }
  
  // 2. 检测 position: fixed 但没有 z-index 的元素
  const fixedNoZIndex = html.match(/position:\s*fixed[^;]*?(?<!z-index:\s*\d+[^;]*?);/gi) || [];
  // 简化：检查 fixed 定位
  const fixedElements = html.match(/position:\s*fixed/gi) || [];
  const zIndexForFixed = html.match(/position:\s*fixed[\s\S]{0,100}?z-index:\s*\d+/gi) || [];
  if (fixedElements.length > 3 && zIndexForFixed.length < fixedElements.length / 2) {
    issues.push({
      type: 'fixed_no_z_index',
      severity: 'info',
      detail: `${fixedElements.length} 个 fixed 元素中只有 ${zIndexForFixed.length} 个设置了 z-index`,
    });
  }
  
  // 3. 检测可能溢出视口的元素
  const widthMatches = html.match(/width:\s*(\d+)px/gi) || [];
  widthMatches.forEach(w => {
    const val = parseInt(w.match(/\d+/)[0]);
    if (val > 1920) {
      issues.push({
        type: 'excessive_width',
        severity: 'warning',
        detail: `发现固定宽度 ${val}px，可能在超大屏上异常`,
      });
    }
  });
  
  // 4. 检测缺少 overflow: hidden 的容器（可能导致滚动问题）
  const flexWithOverflow = html.match(/display:\s*flex[^}]{0,200}overflow:\s*auto/gi) || [];
  // 简化检测
  
  // 5. 检测 transform 使用（可能影响层叠上下文）
  const transformCount = (html.match(/transform:/gi) || []).length;
  if (transformCount > 10) {
    issues.push({
      type: 'heavy_transform',
      severity: 'info',
      detail: `页面使用了 ${transformCount} 次 transform，可能影响层叠和性能`,
    });
  }
  
  // 6. 检测 backdrop-filter（性能警告）
  const backdropCount = (html.match(/backdrop-filter:/gi) || []).length;
  if (backdropCount > 5) {
    issues.push({
      type: 'heavy_backdrop',
      severity: 'info',
      detail: `页面使用了 ${backdropCount} 次 backdrop-filter，复杂设备可能卡顿`,
    });
  }
  
  return issues;
}

function checkRequiredElements(doc, pageName, html) {
  const issues = [];
  
  const rules = {
    '首页': [
      { selector: 'nav', name: '导航栏', severity: 'error' },
      { selector: 'main', name: '主内容', severity: 'error' },
      { selector: 'footer', name: '页脚', severity: 'warning' },
    ],
    '登录页': [
      { selector: 'form', name: '登录表单', severity: 'error' },
    ],
    '注册页': [
      { selector: 'form', name: '注册表单', severity: 'error' },
    ],
    '机体列表': [
      { selector: 'nav', name: '导航栏', severity: 'error' },
    ],
    '作品列表': [
      { selector: 'nav', name: '导航栏', severity: 'error' },
    ],
  };
  
  const pageRules = rules[pageName] || [];
  
  for (const rule of pageRules) {
    const elements = doc.querySelectorAll(rule.selector);
    if (elements.length === 0) {
      issues.push({
        type: 'missing_element',
        element: rule.selector,
        name: rule.name,
        severity: rule.severity,
        detail: `缺少 ${rule.name} (${rule.selector})`,
      });
    }
  }
  
  return issues;
}

function detectOverlapRisk(doc, html) {
  const issues = [];
  
  // 找所有 fixed 和 sticky 定位的元素
  const fixedPattern = /class="([^"]*fixed[^"]*)"|class="([^"]*sticky[^"]*)"/gi;
  const fixedClasses = [];
  let match;
  
  while ((match = fixedPattern.exec(html)) !== null) {
    const cls = match[1] || match[2];
    if (cls && !fixedClasses.includes(cls)) {
      fixedClasses.push(cls);
    }
  }
  
  // 检测 z-index 缺失的 fixed 元素（支持 Tailwind z-数字 和 CSS z-index）
  const fixedNoZIndex = fixedClasses.filter(cls => {
    // 检查是否有 Tailwind z-数字 class 或 CSS z-index
    const hasTailwindZ = /z-\d+/.test(cls);
    const clsEscaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`class="${clsEscaped}"[\\s\\S]{0,200}?z-index:\\s*\\d+`, 'i');
    const hasCssZIndex = regex.test(html);
    return !hasTailwindZ && !hasCssZIndex;
  });
  
  if (fixedNoZIndex.length > 0) {
    issues.push({
      type: 'fixed_no_z_index',
      severity: 'warning',
      detail: `${fixedNoZIndex.length} 个 fixed/sticky 元素缺少 z-index: ${fixedNoZIndex.slice(0, 3).join(', ')}...`,
    });
  }
  
  // 检测 z-index 差距过大的相邻元素
  const zIndexPattern = /z-index:\s*(\d+)/gi;
  const zValues = [];
  let zMatch;
  while ((zMatch = zIndexPattern.exec(html)) !== null) {
    zValues.push(parseInt(zMatch[1]));
  }
  
  if (zValues.length > 1) {
    const max = Math.max(...zValues);
    const min = Math.min(...zValues);
    if (max - min > 100) {
      issues.push({
        type: 'z_index_gap',
        severity: 'info',
        detail: `z-index 从 ${min} 到 ${max}，差距较大，注意层叠顺序`,
      });
    }
  }
  
  return issues;
}

function detectStyleConsistency(doc, html) {
  const issues = [];
  
  // 检测设计风格 class 是否存在
  const styleChecks = [
    { pattern: /neon/i, name: '霓虹效果', severity: 'warning' },
    { pattern: /glass/i, name: '玻璃态', severity: 'warning' },
    { pattern: /cyber/i, name: '赛博风格', severity: 'info' },
  ];
  
  for (const check of styleChecks) {
    if (!check.pattern.test(html)) {
      issues.push({
        type: 'missing_style',
        name: check.name,
        severity: check.severity,
        detail: `未检测到 ${check.name} 相关 class，可能设计规范未应用`,
      });
    }
  }
  
  // 检测主色调使用
  const hasPrimary = html.includes('primary');
  if (!hasPrimary) {
    issues.push({
      type: 'missing_color',
      name: '主色调',
      severity: 'warning',
      detail: '未检测到 primary class，可能颜色配置问题',
    });
  }
  
  return issues;
}

function detectResponsiveIssues(doc, html) {
  const issues = [];
  
  // 响应式断点检测 - 统计各断点的使用频率
  const breakpoints = [
    { pattern: /sm:/i, name: 'sm (640px)' },
    { pattern: /md:/i, name: 'md (768px)' },
    { pattern: /lg:/i, name: 'lg (1024px)' },
    { pattern: /xl:/i, name: 'xl (1280px)' },
  ];
  
  const found = breakpoints.filter(bp => {
    const matches = html.match(new RegExp(bp.pattern.source, 'gi')) || [];
    return matches.length >= 3; // 至少使用3次才算有效
  });
  
  const usage = breakpoints.map(bp => {
    const matches = html.match(new RegExp(bp.pattern.source, 'gi')) || [];
    return { name: bp.name, count: matches.length };
  });
  
  if (found.length < 2) {
    const usageList = usage.map(u => `${u.name}(${u.count}次)`).join(', ');
    issues.push({
      type: 'responsive',
      name: '响应式断点',
      severity: 'warning',
      detail: `响应式断点使用情况: ${usageList}，建议 sm/md/lg 至少各用3次以上`,
    });
  }
  
  // 检测是否使用 px 固定宽度（可能不支持响应式）
  const pxWidths = html.match(/(?<!max-)width:\s*\d+px/gi) || [];
  if (pxWidths.length > 10) {
    issues.push({
      type: 'fixed_pixel_width',
      name: '固定像素宽度',
      severity: 'info',
      detail: `检测到 ${pxWidths.length} 处固定 px 宽度，建议使用相对单位`,
    });
  }
  
  return issues;
}

function detectPerformanceRedFlags(doc, html) {
  const issues = [];
  
  // 检测 inline style 过多（维护性问题）
  const inlineStyles = html.match(/style="/gi) || [];
  if (inlineStyles.length > 20) {
    issues.push({
      type: 'inline_styles',
      name: '过多内联样式',
      severity: 'info',
      detail: `${inlineStyles.length} 处内联样式，建议统一使用 CSS 类`,
    });
  }
  
  // 检测缺少 defer/async 的脚本
  const scriptsWithoutDefer = html.match(/<script(?![^>]*\b(defer|async)\b)[^>]*>/gi) || [];
  if (scriptsWithoutDefer.length > 3) {
    issues.push({
      type: 'render_blocking_scripts',
      name: '渲染阻塞脚本',
      severity: 'info',
      detail: `${scriptsWithoutDefer.length} 个脚本缺少 defer/async，可能影响加载`,
    });
  }
  
  // 检测图片缺少 alt
  const imgs = html.match(/<img[^>]*>/gi) || [];
  const imgsWithoutAlt = imgs.filter(img => !/\balt="/.test(img));
  if (imgsWithoutAlt.length > 0) {
    issues.push({
      type: 'missing_alt',
      name: '图片缺少 alt',
      severity: 'warning',
      detail: `${imgsWithoutAlt.length} 张图片缺少 alt 属性，影响无障碍访问`,
    });
  }
  
  return issues;
}

function analyzeVisualHierarchy(doc, html) {
  const issues = [];
  
  // 检测 H1 数量
  const h1s = html.match(/<h1/gi) || [];
  if (h1s.length === 0) {
    issues.push({
      type: 'missing_h1',
      name: '缺少 H1',
      severity: 'error',
      detail: '页面缺少 H1 标题，影响 SEO 和可访问性',
    });
  } else if (h1s.length > 1) {
    issues.push({
      type: 'multiple_h1',
      name: '多个 H1',
      severity: 'warning',
      detail: `页面有 ${h1s.length} 个 H1，建议只用一个`,
    });
  }
  
  // 检测标题层级是否连续
  const hTags = html.match(/<h[1-6][^>]*>/gi) || [];
  if (hTags.length > 3) {
    const levels = hTags.map(h => parseInt(h.match(/<h([1-6])/i)[1]));
    const gaps = [];
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i + 1] - levels[i] > 1) {
        gaps.push(`${levels[i]} → ${levels[i + 1]}`);
      }
    }
    if (gaps.length > 0) {
      issues.push({
        type: 'heading_gap',
        name: '标题层级跳跃',
        severity: 'info',
        detail: `标题层级不连续: ${gaps.join(', ')}`,
      });
    }
  }
  
  return issues;
}

// ===================== 主程序 =====================

async function runTests() {
  console.log(`\n${colors.cyan}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║     GUNDAM SITE 视觉结构检测 v3 (静态分析)                 ║
║     时间: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}                              ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  let totalIssues = [];
  const pageResults = {};
  
  for (const page of PAGES) {
    log(`\n${colors.bold}📄 ${page.name} (${page.path}) ${colors.dim}[${page.viewport}]${colors.reset}`, 'blue');
    log('─'.repeat(60), 'blue');
    
    try {
      const url = `${BASE_URL}${page.path}`;
      log(`  获取: ${url}`, 'yellow');
      const html = await httpGet(url);
      log(`  HTML: ${(html.length / 1024).toFixed(1)} KB`, 'dim');
      
      const doc = parseHTML(html);
      const pageIssues = [];
      
      // 执行各项检测
      const checks = [
        { name: '关键元素', fn: () => checkRequiredElements(doc, page.name, html) },
        { name: '重叠风险', fn: () => detectOverlapRisk(doc, html) },
        { name: '布局问题', fn: () => detectLayoutProblems(doc, html) },
        { name: '响应式', fn: () => detectResponsiveIssues(doc, html) },
        { name: '风格一致性', fn: () => detectStyleConsistency(doc, html) },
        { name: '性能警示', fn: () => detectPerformanceRedFlags(doc, html) },
        { name: '视觉层级', fn: () => analyzeVisualHierarchy(doc, html) },
      ];
      
      for (const check of checks) {
        const results = check.fn();
        if (results.length > 0) {
          log(`\n  ${colors.bold}[${check.name}]${colors.reset}`, 'cyan');
          for (const issue of results) {
            const icon = issue.severity === 'error' ? '❌' : 
                        issue.severity === 'warning' ? '⚠️' : 'ℹ️';
            const color = issue.severity === 'error' ? 'red' : 
                         issue.severity === 'warning' ? 'yellow' : 'dim';
            log(`    ${icon} ${issue.detail}`, color);
            pageIssues.push({ ...issue, check: check.name });
          }
        }
      }
      
      if (pageIssues.length === 0) {
        log(`\n  ✅ 无明显问题`, 'green');
      }
      
      const errors = pageIssues.filter(i => i.severity === 'error');
      const warnings = pageIssues.filter(i => i.severity === 'warning');
      
      log(`\n  ${colors.bold}小计:${colors.reset} ${errors.length > 0 ? colors.red + '❌' + errors.length : colors.green + '✅'} 错误  ${warnings.length > 0 ? colors.yellow + '⚠️' + warnings.length : ''} 警告`, 
          errors.length > 0 ? 'red' : 'green');
      
      totalIssues.push(...pageIssues.map(i => ({ ...i, page: page.name })));
      pageResults[page.name] = { errors, warnings, total: pageIssues.length };
      
    } catch (error) {
      log(`\n  ❌ 失败: ${error.message}`, 'red');
      log(`     确认服务是否运行在 ${BASE_URL}`, 'yellow');
    }
  }
  
  // ===================== 汇总报告 =====================
  
  log(`\n${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                        汇总报告                             ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);
  
  const totalErrors = totalIssues.filter(i => i.severity === 'error').length;
  const totalWarnings = totalIssues.filter(i => i.severity === 'warning').length;
  const totalInfo = totalIssues.filter(i => i.severity === 'info').length;
  
  log(`\n  检查页面: ${PAGES.length}`, 'blue');
  log(`  ${colors.red}❌ 错误: ${totalErrors}${colors.reset}`);
  log(`  ${colors.yellow}⚠️  警告: ${totalWarnings}${colors.reset}`);
  log(`  ${colors.dim}ℹ️  提示: ${totalInfo}${colors.reset}`);
  
  if (totalErrors > 0) {
    log(`\n  ${colors.red}${colors.bold}🔴 必须修复:${colors.reset}`, 'red');
    totalIssues.filter(i => i.severity === 'error').forEach(issue => {
      log(`    ❌ [${issue.page}] ${issue.check}: ${issue.detail}`, 'red');
    });
  }
  
  if (totalWarnings > 0) {
    log(`\n  ${colors.yellow}${colors.bold}🟡 建议修复:${colors.reset}`, 'yellow');
    // 按类型分组
    const byType = {};
    totalIssues.filter(i => i.severity === 'warning').forEach(issue => {
      const key = issue.type;
      if (!byType[key]) byType[key] = [];
      byType[key].push(issue);
    });
    
    Object.entries(byType).forEach(([type, issues]) => {
      log(`\n  ${colors.bold}▸ ${type.replace(/_/g, ' ')}${colors.reset} (${issues.length})`, 'yellow');
      issues.forEach(issue => {
        log(`    - [${issue.page}] ${issue.detail}`, 'yellow');
      });
    });
  }
  
  if (totalInfo > 0) {
    log(`\n  ${colors.dim}${colors.bold}🔵 优化建议:${colors.reset}`, 'dim');
    const byType = {};
    totalIssues.filter(i => i.severity === 'info').forEach(issue => {
      const key = issue.type;
      if (!byType[key]) byType[key] = [];
      byType[key].push(issue);
    });
    
    Object.entries(byType).slice(0, 5).forEach(([type, issues]) => {
      log(`\n  ${colors.bold}▸ ${type.replace(/_/g, ' ')}${colors.reset} (${issues.length})`, 'dim');
      issues.slice(0, 3).forEach(issue => {
        log(`    - [${issue.page}] ${issue.detail}`, 'dim');
      });
      if (issues.length > 3) {
        log(`    ... 还有 ${issues.length - 3} 项`, 'dim');
      }
    });
  }
  
  log(`\n${colors.bold}${colors.green}
╔══════════════════════════════════════════════════════════════╗
║  ✅ 检测完成                                                    ║
║  💡 注意: 静态分析无法检测运行时渲染问题                        ║
║  📸 建议用浏览器 DevTools 截图核查                             ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
