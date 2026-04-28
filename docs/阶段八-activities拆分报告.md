# 阶段八补充报告：Activities 页面拆分

## 完成时间
2026-04-27

## 背景问题
原 `activities/page.tsx` 承载了太多功能（签到+任务+成就+卡牌），全部堆在一个页面用 Tab 切换，导致：
1. 代码臃肿，难以维护
2. 无法直接分享特定功能页面的 URL
3. 组件职责不清晰
4. 后期维护成本高

## 解决方案

将 activities 拆分为独立的模块化页面结构：

### 页面结构

| 页面 | URL | 说明 |
|------|-----|------|
| 活动中心首页 | `/activities` | 快速入口卡片 |
| 任务中心 | `/activities/missions` | 任务列表 + 签到卡片 |
| 成就中心 | `/activities/achievements` | 成就列表 |
| 卡牌收藏 | `/activities/cards` | 卡牌收藏 |

### 组件结构

```
src/components/activities/
├── CheckinCard.tsx          # 签到卡片（未改动）
├── CardCollection.tsx       # 卡牌收藏（未改动）
├── MissionCard.tsx          # 单个任务/成就卡片（新）
├── MissionList.tsx          # 任务列表组件（新）
└── AchievementList.tsx     # 成就列表组件（新）
```

### 职责划分

| 组件 | 职责 |
|------|------|
| `MissionCard` | 显示单个任务/成就的卡片 UI |
| `MissionList` | 获取任务数据，渲染任务列表 |
| `AchievementList` | 获取成就数据，渲染成就列表 |
| `CheckinCard` | 签到功能（未改动） |
| `CardCollection` | 卡牌收藏（未改动） |

## API 无变更
所有 API 保持不变，只是前端组件重构。

## 迁移指南

### 旧 URL（已重定向）
- `/activities` → 仍然是活动中心首页（但现在是快速入口形式）

### 新页面访问方式
```
/activities                    # 首页快速入口
/activities/missions           # 任务中心
/activities/achievements       # 成就中心
/activities/cards              # 卡牌收藏
```

## 测试清单

- [ ] `/activities` 首页显示4个快速入口卡片
- [ ] `/activities/missions` 显示签到卡片和任务列表
- [ ] `/activities/achievements` 显示成就列表
- [ ] `/activities/cards` 显示卡牌收藏
- [ ] 签到功能正常工作
- [ ] 任务按钮跳转正常
- [ ] 成就显示正常

## 文件清单

**新增文件：**
```
src/app/activities/missions/page.tsx          # 任务中心页面
src/app/activities/achievements/page.tsx       # 成就中心页面
src/app/activities/cards/page.tsx               # 卡牌收藏页面
src/components/activities/MissionCard.tsx      # 任务卡片组件
src/components/activities/MissionList.tsx       # 任务列表组件
src/components/activities/AchievementList.tsx  # 成就列表组件
```

**修改文件：**
```
src/app/activities/page.tsx                   # 重构为快速入口首页
```

## 后续维护建议

1. **新增活动类型**：只需创建新组件 + 新页面，在首页添加入口
2. **修改任务逻辑**：只需修改 `MissionList` 组件
3. **修改成就逻辑**：只需修改 `AchievementList` 组件
4. **独立部署**：未来可以将特定页面拆分为独立应用
