import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // ==================== 1. 创建测试账号 ====================
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLR/e6F0P3G', // 密码: admin123
      nickname: '管理员',
      email: 'admin@gundam-site.com',
      role: 'founder',
      level: 30,
      totalXp: 60000,
      status: 'active',
    },
  });
  console.log('Created admin user:', admin.username);

  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiLR/e6F0P3G', // 密码: admin123
      nickname: '测试用户',
      email: 'test@gundam-site.com',
      role: 'user',
      level: 1,
      totalXp: 0,
      status: 'active',
    },
  });
  console.log('Created test user:', testUser.username);

  // ==================== 1.5 创建用户统计 ====================
  await prisma.userStats.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      totalXp: 60000,
      level: 30,
      checkinDays: 0,
      consecutiveDays: 0,
      bestConsecutiveDays: 0,
      creationCount: 0,
      commentCount: 0,
      likedCount: 0,
      followerCount: 0,
    },
  });
  console.log('Created admin stats');

  await prisma.userStats.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      totalXp: 0,
      level: 1,
      checkinDays: 0,
      consecutiveDays: 0,
      bestConsecutiveDays: 0,
      creationCount: 0,
      commentCount: 0,
      likedCount: 0,
      followerCount: 0,
    },
  });
  console.log('Created testuser stats');

  // ==================== 2. 创建30级等级数据 ====================
  const levels = [
    { level: 1, name: '新人', xpRequired: 0, titleRequired: '初来乍到', creationCount: 0, commentCount: 0, likeCount: 0 },
    { level: 2, name: '见习', xpRequired: 100, titleRequired: null, creationCount: 1, commentCount: 0, likeCount: 0 },
    { level: 3, name: '学员', xpRequired: 300, titleRequired: null, creationCount: 3, commentCount: 0, likeCount: 0 },
    { level: 4, name: '驾驶员', xpRequired: 600, titleRequired: null, creationCount: 5, commentCount: 0, likeCount: 0 },
    { level: 5, name: '机师', xpRequired: 1000, titleRequired: '崭露头角', creationCount: 8, commentCount: 5, likeCount: 0 },
    { level: 6, name: '老兵', xpRequired: 1500, titleRequired: null, creationCount: 10, commentCount: 15, likeCount: 0 },
    { level: 7, name: '士官', xpRequired: 2500, titleRequired: null, creationCount: 13, commentCount: 30, likeCount: 10 },
    { level: 8, name: '军官', xpRequired: 4000, titleRequired: null, creationCount: 16, commentCount: 50, likeCount: 30 },
    { level: 9, name: '队长', xpRequired: 6000, titleRequired: null, creationCount: 20, commentCount: 80, likeCount: 60 },
    { level: 10, name: '连长', xpRequired: 8000, titleRequired: '小有名气', creationCount: 25, commentCount: 100, likeCount: 100 },
    { level: 11, name: '副连长', xpRequired: 9400, titleRequired: null, creationCount: 28, commentCount: 120, likeCount: 120 },
    { level: 12, name: '排长', xpRequired: 10800, titleRequired: null, creationCount: 31, commentCount: 140, likeCount: 140 },
    { level: 13, name: '副排长', xpRequired: 12200, titleRequired: null, creationCount: 34, commentCount: 160, likeCount: 160 },
    { level: 14, name: '班长', xpRequired: 13600, titleRequired: null, creationCount: 37, commentCount: 180, likeCount: 180 },
    { level: 15, name: '副营长', xpRequired: 15000, titleRequired: '初窥门径', creationCount: 40, commentCount: 200, likeCount: 300 },
    { level: 16, name: '营长', xpRequired: 17000, titleRequired: null, creationCount: 45, commentCount: 220, likeCount: 340 },
    { level: 17, name: '副团长', xpRequired: 19000, titleRequired: null, creationCount: 50, commentCount: 250, likeCount: 380 },
    { level: 18, name: '团长', xpRequired: 21000, titleRequired: null, creationCount: 55, commentCount: 280, likeCount: 420 },
    { level: 19, name: '副旅长', xpRequired: 23000, titleRequired: null, creationCount: 60, commentCount: 320, likeCount: 480 },
    { level: 20, name: '旅长', xpRequired: 25000, titleRequired: '登堂入室', creationCount: 60, commentCount: 400, likeCount: 600 },
    { level: 21, name: '副师长', xpRequired: 28000, titleRequired: null, creationCount: 65, commentCount: 440, likeCount: 660 },
    { level: 22, name: '师长', xpRequired: 31000, titleRequired: null, creationCount: 70, commentCount: 480, likeCount: 720 },
    { level: 23, name: '副军长', xpRequired: 34000, titleRequired: null, creationCount: 75, commentCount: 520, likeCount: 800 },
    { level: 24, name: '军长', xpRequired: 37000, titleRequired: null, creationCount: 80, commentCount: 560, likeCount: 900 },
    { level: 25, name: '副司令', xpRequired: 40000, titleRequired: '炉火纯青', creationCount: 80, commentCount: 600, likeCount: 1000 },
    { level: 26, name: '司令', xpRequired: 44000, titleRequired: null, creationCount: 85, commentCount: 650, likeCount: 1100 },
    { level: 27, name: '副司令员', xpRequired: 48000, titleRequired: null, creationCount: 90, commentCount: 700, likeCount: 1200 },
    { level: 28, name: '司令员', xpRequired: 52000, titleRequired: null, creationCount: 95, commentCount: 750, likeCount: 1300 },
    { level: 29, name: '大将', xpRequired: 56000, titleRequired: null, creationCount: 98, commentCount: 780, likeCount: 1400 },
    { level: 30, name: '元帅', xpRequired: 60000, titleRequired: '传说', creationCount: 100, commentCount: 800, likeCount: 1500 },
  ];

  for (const level of levels) {
    await prisma.level.upsert({
      where: { level: level.level },
      update: level,
      create: level,
    });
  }
  console.log('Created 30 levels');

  // ==================== 3. 创建预置机体（10个） ====================
  const mechas = [
    {
      name: 'RX-78-2 元祖高达',
      series: 'RX-78',
      grade: 'RG',
      classification: '地球联邦',
      summary: '一年战争时期联邦军的王牌机体，是整个高达系列最具代表性的标志。',
      height: '18.0m',
      weight: '43.4t',
      powerSystem: '米诺夫斯基推进器',
      armor: '月神钛合金',
      contentSource: 'official',
    },
    {
      name: '独角兽高达',
      series: 'UC',
      grade: 'PG',
      classification: '地球联邦',
      summary: '装备了精神感应框架的NT专用机，拥有独角兽的称号。',
      height: '21.7m',
      weight: '23.7t',
      powerSystem: '米诺夫斯基推进器',
      armor: '精神感应框架',
      contentSource: 'official',
    },
    {
      name: '自由高达',
      series: 'Seed',
      grade: 'MG',
      classification: '地球联合',
      summary: '自由和正义是，扎夫特的NT专用机，拥有强大的火力输出。',
      height: '18.0m',
      weight: '71.5t',
      powerSystem: '核动力',
      armor: 'PS装甲',
      contentSource: 'official',
    },
    {
      name: '红色扎古',
      series: 'MS-06',
      grade: 'MG',
      classification: '吉恩',
      summary: '夏亚的专属机体，全身涂成红色，在战场上所向披靡。',
      height: '17.0m',
      weight: '56.2t',
      powerSystem: '热核反应炉',
      armor: '超硬度钢合金',
      contentSource: 'official',
    },
    {
      name: '沙扎比',
      series: 'CCA',
      grade: 'MG',
      classification: '吉恩',
      summary: '阿姆罗的最终座驾，继承了RX-78的设计理念。',
      height: '19.0m',
      weight: '36.0t',
      powerSystem: '米诺夫斯基推进器',
      armor: '高达尼姆合金',
      contentSource: 'official',
    },
    {
      name: '飞翼高达',
      series: 'W',
      grade: 'EW',
      classification: 'OZ',
      summary: '由海尔曼博士开发的零式系统搭载机，拥有惊人的破坏力。',
      height: '16.0m',
      weight: '7.2t',
      powerSystem: '太阳能系统',
      armor: '高达合金',
      contentSource: 'official',
    },
    {
      name: '零式飞翼高达',
      series: 'W',
      grade: 'EW',
      classification: 'OZ',
      summary: '飞翼高达的零式系统版本，全身雪白涂装。',
      height: '16.0m',
      weight: '7.2t',
      powerSystem: '太阳能系统',
      armor: ' 高达合金',
      contentSource: 'official',
    },
    {
      name: '神高达',
      series: 'G',
      grade: 'MG',
      classification: '其他',
      summary: '东方不败驾驶的究极格斗机体，格斗能力史上最强。',
      height: '16.3m',
      weight: '7.0t',
      powerSystem: '太阳能系统',
      armor: '光辉阿尔比昂合金',
      contentSource: 'official',
    },
    {
      name: '强袭自由高达',
      series: 'Seed Destiny',
      grade: 'MG',
      classification: '地球联合',
      summary: '自由高达的后继机，由基拉·大和驾驶。',
      height: '18.0m',
      weight: '65.4t',
      powerSystem: '核动力',
      armor: 'PS装甲',
      contentSource: 'official',
    },
    {
      name: '命运高达',
      series: 'Seed Destiny',
      grade: 'MG',
      classification: '扎夫特',
      summary: '由真·飞鸟驾驶的命运高达，拥有强大的火力配置。',
      height: '18.0m',
      weight: '63.2t',
      powerSystem: '核动力',
      armor: 'PS装甲',
      contentSource: 'official',
    },
  ];

  for (const mecha of mechas) {
    await prisma.mecha.create({
      data: mecha,
    });
  }
  console.log('Created 10 mechas');

  // ==================== 4. 创建预设标签 ====================
  const tags = ['原创', '二创', '教程', '测评', '讨论'];

  for (const tag of tags) {
    const existing = await prisma.tag.findFirst({ where: { name: tag } });
    if (!existing) {
      await prisma.tag.create({
        data: { name: tag },
      });
    }
  }
  console.log('Created 5 tags');

  // ==================== 4.5 创建任务数据 ====================
  const missions = [
    { name: '每日登录', description: '每天登录网站', type: 'daily', xpReward: 10 },
    { name: '完善资料', description: '填写个人简介', type: 'once', xpReward: 50 },
    { name: '首次评论', description: '发表第一条评论', type: 'once', xpReward: 30 },
    { name: '首次作品', description: '发布第一个作品', type: 'once', xpReward: 100 },
    { name: '每日签到', description: '每天签到一次', type: 'daily', xpReward: 15 },
    { name: '获得10赞', description: '作品获得10个赞', type: 'progress', xpReward: 50 },
    { name: '关注5人', description: '关注5个其他用户', type: 'progress', xpReward: 30 },
    { name: '评论10次', description: '发表评论10次', type: 'progress', xpReward: 40 },
  ];

  for (const mission of missions) {
    await prisma.mission.create({
      data: mission,
    });
  }
  console.log('Created missions');

  // ==================== 4.6 创建机体参数和配色 ====================
  const mechaData = [
    {
      name: 'RX-78-2 元祖高达',
      specs: [
        { specKey: '武装', specValue: '光束步枪、光束军刀、超级火箭筒' },
        { specKey: '最大速度', specValue: '马赫 6' },
        { specKey: '发电机功率', specValue: '1380kW' },
      ],
      palettes: [
        { name: '经典红白蓝', primaryColor: '#E53935', secondaryColor: '#1565C0', accentColor: '#FDD835' },
        { name: '夏亚专用', primaryColor: '#C62828', secondaryColor: '#212121', accentColor: '#FFD600' },
      ],
    },
    {
      name: '独角兽高达',
      specs: [
        { specKey: '武装', specValue: '光束麦林枪、光束军刀、火箭炮' },
        { specKey: '最大速度', specValue: '马赫 5.8' },
        { specKey: '感应系统', specValue: '精神感应框架' },
      ],
      palettes: [
        { name: '独角兽白', primaryColor: '#FAFAFA', secondaryColor: '#1565C0', accentColor: '#E53935' },
      ],
    },
    {
      name: '自由高达',
      specs: [
        { specKey: '武装', specValue: '龙骑兵系统、光束炮、光束剑' },
        { specKey: '最大速度', specValue: '马赫 7' },
        { specKey: '装甲材质', specValue: 'PS装甲' },
      ],
      palettes: [
        { name: '自由蓝', primaryColor: '#1565C0', secondaryColor: '#E53935', accentColor: '#FDD835' },
      ],
    },
    {
      name: '红色扎古',
      specs: [
        { specKey: '武装', specValue: '280mm火箭炮、ZMP-99机关枪' },
        { specKey: '最大速度', specValue: '马赫 4.5' },
      ],
      palettes: [
        { name: '经典红', primaryColor: '#C62828', secondaryColor: '#424242', accentColor: null },
      ],
    },
    {
      name: '沙扎比',
      specs: [
        { specKey: '武装', specValue: '光束斧、腕部火神炮' },
        { specKey: '最大速度', specValue: '马赫 6.5' },
      ],
      palettes: [
        { name: '沙扎比紫', primaryColor: '#7B1FA2', secondaryColor: '#1565C0', accentColor: '#FDD835' },
      ],
    },
    {
      name: '飞翼高达',
      specs: [
        { specKey: '武装', specValue: '火神炮、光束炮、流星装备' },
        { specKey: '最大速度', specValue: '马纬 8' },
      ],
      palettes: [
        { name: '飞翼白', primaryColor: '#FAFAFA', secondaryColor: '#1565C0', accentColor: '#E53935' },
      ],
    },
    {
      name: '零式飞翼高达',
      specs: [
        { specKey: '武装', specValue: '零式系统、火神炮、光束炮' },
        { specKey: '最大速度', specValue: '马赫 8.5' },
      ],
      palettes: [
        { name: '零式白', primaryColor: '#FAFAFA', secondaryColor: '#424242', accentColor: '#FFD600' },
      ],
    },
    {
      name: '神高达',
      specs: [
        { specKey: '武装', specValue: '龙拳、爆热神之手' },
        { specKey: '最大速度', specValue: '马赫 6' },
      ],
      palettes: [
        { name: '神红金', primaryColor: '#D32F2F', secondaryColor: '#FFD700', accentColor: '#1565C0' },
      ],
    },
    {
      name: '强袭自由高达',
      specs: [
        { specKey: '武装', specValue: '龙骑兵、光束炮、磁轨炮' },
        { specKey: '最大速度', specValue: '马赫 7.5' },
      ],
      palettes: [
        { name: '强袭蓝', primaryColor: '#1565C0', secondaryColor: '#E53935', accentColor: '#FDD835' },
      ],
    },
    {
      name: '命运高达',
      specs: [
        { specKey: '武装', specValue: '掌中炮、光束爪、超级火箭筒' },
        { specKey: '最大速度', specValue: '马赫 6.2' },
      ],
      palettes: [
        { name: '命运红', primaryColor: '#D32F2F', secondaryColor: '#1565C0', accentColor: '#FDD835' },
      ],
    },
  ];

  for (const mecha of mechaData) {
    const dbMecha = await prisma.mecha.findFirst({ where: { name: mecha.name } });
    if (dbMecha) {
      for (const spec of mecha.specs) {
        await prisma.mechaSpec.create({
          data: { mechaId: dbMecha.id, ...spec },
        });
      }
      for (const palette of mecha.palettes) {
        await prisma.paletteScheme.create({
          data: { mechaId: dbMecha.id, ...palette },
        });
      }
    }
  }
  console.log('Created mecha specs and palettes');

  // ==================== 5. 创建Banner ====================
  await prisma.banner.create({
    data: {
      imageUrl: '/banners/gundam-banner-1.jpg',
      link: '/mecha/1',
      sortOrder: 1,
      status: 'active',
    },
  });
  console.log('Created sample banner');

  // ==================== 6. 创建公告 ====================
  await prisma.announcement.create({
    data: {
      title: '欢迎来到 GUNDAM SITE！',
      content: '这里是机体百科和创作者社区的结合平台，欢迎大家分享自己的高达作品！',
      isTop: true,
      status: 'published',
      publishedAt: new Date(),
    },
  });
  console.log('Created welcome announcement');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
