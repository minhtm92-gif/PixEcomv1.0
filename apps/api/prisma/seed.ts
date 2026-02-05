import { PrismaClient, Role, Status, AssetType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.ad.deleteMany();
  await prisma.adSet.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.order.deleteMany();
  await prisma.creativeAsset.deleteMany();
  await prisma.sellpage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.merchant.deleteMany();

  const merchant = await prisma.merchant.create({ data: { name: 'Demo Merchant' } });
  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  await prisma.user.create({
    data: {
      email: 'admin@pixecom.local',
      passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
      merchantId: merchant.id
    }
  });

  const p1 = await prisma.product.create({ data: { code: 'PX-001', name: 'Slim Shaper', merchantId: merchant.id, status: Status.ACTIVE } });
  const p2 = await prisma.product.create({ data: { code: 'PX-002', name: 'Sleep Patch', merchantId: merchant.id, status: Status.ACTIVE } });
  const sp = await prisma.sellpage.create({ data: { slug: 'slim-shaper', domain: 'slim.demo.local', productId: p1.id, merchantId: merchant.id, config: { theme: 'dark' } } });

  for (const source of ['Facebook', 'Pinterest', 'Google', 'Applovin']) {
    await prisma.order.create({ data: { sellpageId: sp.id, source, revenueCents: 100000 + source.length * 5000 } });
  }

  const assets = [
    { type: AssetType.VIDEO, version: 'V1', url: 'https://picsum.photos/seed/v1/400/240', spentCents: 23000, roas: 2.1 },
    { type: AssetType.IMAGE, version: 'I1', url: 'https://picsum.photos/seed/i1/400/240', spentCents: 12000, roas: 1.7 },
    { type: AssetType.THUMBNAIL, version: 'T1', url: 'https://picsum.photos/seed/t1/400/240', spentCents: 3000, roas: 2.4 },
    { type: AssetType.ADTEXT, version: 'A1', url: 'text://a1', textContent: 'Transform your shape in 7 days!', spentCents: 6000, roas: 2.8 },
    { type: AssetType.ADPOST, version: 'P1', url: 'https://facebook.com/post/1', spentCents: 45000, roas: 3.2 }
  ];
  for (const a of assets) {
    await prisma.creativeAsset.create({ data: { ...a, productId: p1.id } as any });
  }

  const account = await prisma.adAccount.create({ data: { platformId: 'act_10001', name: 'Main FB Account', currency: 'USD', timezone: 'UTC', merchantId: merchant.id } });

  for (let i = 1; i <= 5; i++) {
    const campaign = await prisma.campaign.create({
      data: {
        platformId: `cmp_${i}`,
        name: `Campaign ${i}`,
        status: i % 2 ? Status.ACTIVE : Status.PAUSED,
        deliveryStatus: i % 2 ? 'Active' : 'Inactive',
        dailyBudgetCents: 5000 * i,
        spendCents: 2300 * i,
        startDate: new Date(),
        objective: 'Conversions',
        merchantId: merchant.id,
        adAccountId: account.id,
        lastSyncAt: new Date()
      }
    });

    const adset = await prisma.adSet.create({
      data: {
        platformId: `adset_${i}`,
        name: `Ad Set ${i}`,
        status: campaign.status,
        deliveryStatus: campaign.deliveryStatus,
        budgetCents: 3000 * i,
        spendCents: 1300 * i,
        merchantId: merchant.id,
        campaignId: campaign.id,
        targeting: { location: 'US', age: '18-45' }
      }
    });

    await prisma.ad.create({
      data: {
        platformId: `ad_${i}`,
        name: `Ad ${i}`,
        status: campaign.status,
        deliveryStatus: campaign.deliveryStatus,
        spendCents: 1100 * i,
        merchantId: merchant.id,
        adSetId: adset.id,
        metrics: { roas: 1.5 + i / 10, ctr: 2 + i / 10, cpm: 8.2 + i }
      }
    });
  }
}

main().finally(async () => prisma.$disconnect());
