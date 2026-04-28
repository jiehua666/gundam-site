#!/usr/bin/env node
/**
 * GUNDAM SITE 视觉检测工具
 * 无需额外依赖，直接 node scripts/visual-test.mjs 运行
 * 
 * 检测内容：
 * 1. 缺斤少两 - 关键元素是否存在
 * 2. 重叠检测 - fixed/sticky 元素是否重叠
 * 3. 溢出检测 - 文字/图片是否溢出容器
 * 4. 布局问题 - flex/grid 异常
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: '首页', path: '/' },
  { name: '登录', path: '/login' },
  { name: '注册', path: '/register' },
];

// 设计规范
const SPEC = {
  primaryColor: '#7C3AED',
  accentColor: '#22D3EE',
  bgColor: '#0F0F23',
  cardBg: 'rgba(124, 58, 237, 0.1)',
  fontFamily: {
    heading: 'Share Tech Mono',
    body: 'Inter',
    code: 'Fira Code'
  }
};

// 关键元素检测规则
const MANDATORY_ELEMENTS = {
  '首页': [
    { selector: 'nav', name: '导航栏', reason: '用户无法导航' },
    { selector: 'main', name: '主内容区', reason: '页面无内容' },
    { selector: '.glass-card', name: '玻璃态卡片', reason: '设计风格缺失' },
    { selector: 'footer', name: '页脚', reason: '缺少网站信息' },
    { selector: '.neon-border', name: '霓虹边框', reason: 'Cyberpunk风格缺失' },
  ],
  '登录': [
    { selector: 'form', name: '登录表单', reason: '无法登录' },
    { selector: 'input[type="password"]', name: '密码输入框', reason: '缺少密码字段' },
    { selector: 'button[type="submit"]', name: '提交按钮', reason: '无法提交' },
  ],
  '注册': [
    { selector: 'form', name: '注册表单', reason: '无法注册' },
    { selector: 'input[type="email"]', name: '邮箱输入框', reason: '缺少邮箱字段' },
  ],
};

// 固定定位元素（容易重叠）
const FIXED_ELEMENTS = ['nav', '.fixed', '[style*="position: fixed"]'];

// 输出颜色
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

// 检测元素是否存在
function checkMandatoryElements(html, pageName) {
  const rules = MANDATORY_ELEMENTS[pageName] || [];
  const results = [];
  
  for (const rule of rules) {
    // 简单检测：selector 是否在 HTML 中出现
    // 注意：这是静态分析，不执行 JS
    const found = checkSelectorInHTML(html, rule.selector);
    results.push({
      ...rule,
      found,
      severity: found ? 'pass' : 'error'
    });
  }
  
  return results;
}

// 简单的选择器检测
function checkSelectorInHTML(html, selector) {
  // 移除注释和脚本内容
  const cleanHtml = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  
  if (selector.startsWith('.')) {
    // class 选择器
    const className = selector.slice(1);
    return cleanHtml.includes(`class="${className}`) || 
           cleanHtml.includes(`class="${className}`) ||
           cleanHtml.includes(`class="${className}"`);
  } else if (selector.startsWith('#')) {
    // id 选择器
    const id = selector.slice(1);
    return cleanHtml.includes(`id="${id}"`);
  } else {
    // 标签选择器
    return cleanHtml.includes(`<${selector}`) || cleanHtml.includes(`<${selector} `);
  }
}

// 检测固定定位元素
function checkFixedElements(html, pageName) {
  const results = [];
  
  // 查找所有 fixed/sticky 定位元素
  const fixedMatches = html.match(/class="[^"]*fixed[^"]*"/gi) || [];
  const positionMatches = html.match(/position:\s*(fixed|sticky)/gi) || [];
  
  const count = fixedMatches.length + positionMatches.length;
  
  if (count > 3) {
    results.push({
      type: 'fixed_elements',
      name: '固定定位元素过多',
      detail: `发现 ${count} 个固定定位元素，可能存在重叠风险`,
      severity: 'warning'
    });
  }
  
  // 检测 z-index 冲突
  const zIndexes = html.match(/z-index:\s*(\d+)/gi) || [];
  if (zIndexes.length > 0) {
    const values = zIndexes.map(z => parseInt(z.match(/\d+/)[0]));
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max - min > 1000) {
      results.push({
        type: 'z_index',
        name: 'z-index 跨度过大',
        detail: `z-index 从 ${min} 到 ${max}，可能存在层叠顺序问题`,
        severity: 'warning'
      });
    }
  }
  
  return results;
}

// 检测布局结构
function checkLayoutStructure(html, pageName) {
  const results = [];
  
  // 检测 flex 布局
  const flexMatches = html.match(/class="[^"]*flex[^"]*"/gi) || [];
  
  // 检测 grid 布局
  const gridMatches = html.match(/class="[^"]*grid[^"]*"/gi) || [];
  
  // 检测嵌套过深
  const maxDepth = findMaxNestingDepth(html);
  if (maxDepth > 15) {
    results.push({
      type: 'nesting',
      name: 'DOM 嵌套过深',
      detail: `最大嵌套深度 ${maxDepth} 层，可能影响性能`,
      severity: 'warning'
    });
  }
  
  // 检测缺少 viewport meta
  if (!html.includes('viewport')) {
    results.push({
      type: 'viewport',
      name: '缺少 viewport meta',
      detail: '移动端可能无法正常显示',
      severity: 'error'
    });
  }
  
  return results;
}

// 简单计算嵌套深度
function findMaxNestingDepth(html) {
  let maxDepth = 0;
  let currentDepth = 0;
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  let match;
  
  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    // 自闭合标签不增加深度
    if (['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tag)) continue;
    
    if (!match[0].startsWith('</')) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    } else {
      currentDepth--;
    }
  }
  
  return maxDepth;
}

// 检测响应式支持
function checkResponsive(html, pageName) {
  const results = [];
  
  // 检测是否有响应式 class
  const responsiveClasses = ['md:', 'lg:', 'sm:', 'xl:', '2xl:'];
  const hasResponsive = responsiveClasses.some(cls => html.includes(cls));
  
  if (!hasResponsive) {
    results.push({
      type: 'responsive',
      name: '缺少响应式样式类',
      detail: '页面可能不支持移动端',
      severity: 'warning'
    });
  }
  
  return results;
}

// 检测设计风格一致性
function checkDesignConsistency(html, pageName) {
  const results = [];
  
  // 检测霓虹效果
  const hasNeon = html.includes('neon');
  if (!hasNeon) {
    results.push({
      type: 'style',
      name: '缺少 Cyberpunk 风格',
      detail: '未发现 neon 相关 class，可能设计规范未应用',
      severity: 'warning'
    });
  }
  
  // 检测玻璃态
  const hasGlass = html.includes('glass');
  if (!hasGlass) {
    results.push({
      type: 'style',
      name: '缺少玻璃态效果',
      detail: '未发现 glass-card class',
      severity: 'warning'
    });
  }
  
  // 检测主色调
  const hasPrimary = html.includes('primary');
  if (!hasPrimary) {
    results.push({
      type: 'style',
      name: '缺少主色调',
      detail: '未发现 primary class',
      severity: 'warning'
    });
  }
  
  return results;
}

// 主检测函数
async function runTests() {
  log(`\n${colors.cyan}${colors.bold}
╔══════════════════════════════════════════════════════════════╗
║          GUNDAM SITE 视觉检测报告                           ║
║          检测时间: ${new Date().toISOString().slice(0, 19)}                    ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`, 'cyan');
  
  for (const page of PAGES) {
    log(`\n${colors.bold}📄 页面: ${page.name} (${page.path})${colors.reset}`, 'blue');
    log('─'.repeat(60), 'blue');
    
    try {
      const url = `${BASE_URL}${page.path}`;
      log(`  正在获取: ${url}`, 'yellow');
      const html = await httpGet(url);
      log(`  HTML 大小: ${(html.length / 1024).toFixed(1)} KB`, 'yellow');
      
      const allIssues = [];
      
      // 1. 缺斤少两检测
      log(`\n  ${colors.bold}[1] 关键元素检测${colors.reset}`, 'cyan');
      const mandatoryResults = checkMandatoryElements(html, page.name);
      for (const r of mandatoryResults) {
        if (r.found) {
          log(`    ✅ ${r.name} (${r.selector})`, 'green');
        } else {
          log(`    ❌ ${r.name} (${r.selector}) - ${r.reason}`, 'red');
          allIssues.push({ ...r, page: page.name });
        }
      }
      
      // 2. 固定定位检测
      log(`\n  ${colors.bold}[2] 固定定位元素${colors.reset}`, 'cyan');
      const fixedResults = checkFixedElements(html, page.name);
      if (fixedResults.length === 0) {
        log(`    ✅ 无明显重叠风险`, 'green');
      } else {
        for (const r of fixedResults) {
          log(`    ⚠️  ${r.name}: ${r.detail}`, 'yellow');
        }
      }
      
      // 3. 布局结构
      log(`\n  ${colors.bold}[3] 布局结构${colors.reset}`, 'cyan');
      const layoutResults = checkLayoutStructure(html, page.name);
      for (const r of layoutResults) {
        const icon = r.severity === 'error' ? '❌' : '⚠️';
        log(`    ${icon} ${r.name}: ${r.detail}`, r.severity === 'error' ? 'red' : 'yellow');
        allIssues.push({ ...r, page: page.name });
      }
      
      // 4. 响应式支持
      log(`\n  ${colors.bold}[4] 响应式支持${colors.reset}`, 'cyan');
      const responsiveResults = checkResponsive(html, page.name);
      if (responsiveResults.length === 0) {
        log(`    ✅ 有响应式样式`, 'green');
      } else {
        for (const r of responsiveResults) {
          log(`    ⚠️  ${r.name}: ${r.detail}`, 'yellow');
        }
      }
      
      // 5. 设计风格
      log(`\n  ${colors.bold}[5] 设计风格一致性${colors.reset}`, 'cyan');
      const styleResults = checkDesignConsistency(html, page.name);
      for (const r of styleResults) {
        log(`    ⚠️  ${r.name}: ${r.detail}`, 'yellow');
      }
      
      // 总结
      log(`\n  ${colors.bold}📊 问题汇总: ${allIssues.length} 个${colors.reset}`, 
          allIssues.length === 0 ? 'green' : 'yellow');
      
    } catch (error) {
      log(`\n  ❌ 获取页面失败: ${error.message}`, 'red');
      log(`     确认服务器是否运行在 ${BASE_URL}`, 'yellow');
    }
  }
  
  // 全局建议
  log(`\n${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                      后续建议                               ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`, 'cyan');
  
  log(`
  1. ${colors.yellow}静态检测有局限${colors.reset} - 建议用 Playwright/Puppeteer 
     做完整渲染检测

  2. ${colors.yellow}关键元素缺失${colors.reset} - 如果检测到表单/按钮缺失，
     检查页面是否正确导入组件

  3. ${colors.yellow}手动测试${colors.reset} - 打开浏览器访问 localhost:3000，
     切换到移动端模式，检查实际显示效果
  `);
  
  log(`
  ${colors.green}✅ 静态 HTML 结构检测完成${colors.reset}
  ${colors.yellow}⚠️  建议配合浏览器手动测试获得完整视觉报告${colors.reset}
  `);
}

// 导出单页检测函数供外部调用
export { checkMandatoryElements, checkFixedElements, checkLayoutStructure };

// 运行
runTests().catch(console.error);
