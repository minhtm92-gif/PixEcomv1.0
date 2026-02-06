import { PrismaClient, Role, Status, AssetType, EntityType, BudgetSourceUnit, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.session.deleteMany();
  await prisma.metricsDaily.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.adSet.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.syncRun.deleteMany();
  await prisma.creativeAsset.deleteMany();
  await prisma.sellpage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adAccount.deleteMany();
  await prisma.merchant.deleteMany();

  const merchant = await prisma.merchant.create({ data: { name: 'Demo Merchant' } });
  const passwordHash = await bcrypt.hash('Admin@12345', 10);
  await prisma.user.create({ data: { email: 'admin@pixecom.local', passwordHash, name: 'Admin User', role: Role.ADMIN, merchantId: merchant.id } });

  const product = await prisma.product.create({ data: { code: 'PX-001', name: 'Slim Shaper', merchantId: merchant.id, status: Status.ACTIVE } });
  await prisma.product.create({ data: { code: 'PX-002', name: 'Sleep Patch', merchantId: merchant.id, status: Status.ACTIVE } });
  const sellpage = await prisma.sellpage.create({ data: { slug: 'slim-shaper', domain: 'slim.demo.local', productId: product.id, merchantId: merchant.id, config: { theme: 'dark' } } });

  await prisma.creativeAsset.createMany({
    data: [
      { type: AssetType.VIDEO, version: 'V1', url: 'https://picsum.photos/seed/v1/400/240', spentCents: 23000, roas: 2.1, productId: product.id },
      { type: AssetType.IMAGE, version: 'I1', url: 'https://picsum.photos/seed/i1/400/240', spentCents: 12000, roas: 1.7, productId: product.id },
      { type: AssetType.THUMBNAIL, version: 'T1', url: 'https://picsum.photos/seed/t1/400/240', spentCents: 3000, roas: 2.4, productId: product.id },
      { type: AssetType.ADTEXT, version: 'A1', url: 'text://a1', textContent: 'Transform your shape in 7 days!', spentCents: 6000, roas: 2.8, productId: product.id },
      { type: AssetType.ADPOST, version: 'P1', url: 'https://facebook.com/post/1', spentCents: 45000, roas: 3.2, productId: product.id }
    ]
  });

  const adAccount = await prisma.adAccount.create({
    data: { platformId: 'act_10001', name: 'Main FB Account', currency: 'USD', timezone: 'UTC', merchantId: merchant.id }
  });

  const syncRun = await prisma.syncRun.create({ data: { merchantId: merchant.id, source: 'facebook', status: 'success', finishedAt: new Date() } });

  const session = await prisma.session.create({
    data: {
      sessionKey: 'sess_demo_1',
      merchantId: merchant.id,
      sellpageId: sellpage.id,
      utmSource: 'facebook',
      utmMedium: 'cpc',
      utmCampaign: 'cmp_1',
      utmContent: 'ad_1',
      fbclid: 'fbclid-demo'
    }
  });

  await prisma.pageView.createMany({
    data: [
      { merchantId: merchant.id, sellpageId: sellpage.id, sessionId: session.id, path: `/p/${sellpage.slug}` },
      { merchantId: merchant.id, sellpageId: sellpage.id, sessionId: session.id, path: `/p/${sellpage.slug}` },
      { merchantId: merchant.id, sellpageId: sellpage.id, sessionId: session.id, path: `/p/${sellpage.slug}` }
    ]
  });

  const order = await prisma.order.create({
    data: {
      merchantId: merchant.id,
      sellpageId: sellpage.id,
      sessionId: session.id,
      utmSource: session.utmSource,
      utmMedium: session.utmMedium,
      utmCampaign: session.utmCampaign,
      utmContent: session.utmContent,
      fbclid: session.fbclid,
      totalsCents: 15900,
      paymentStatus: PaymentStatus.PAID
    }
  });

  await prisma.orderItem.create({ data: { orderId: order.id, productId: product.id, quantity: 1, priceCents: 15900 } });

  const dateLocal = new Date();
  dateLocal.setUTCHours(0, 0, 0, 0);

  for (let i = 1; i <= 3; i++) {
    const configuredStatus = i % 2 ? Status.ACTIVE : Status.PAUSED;
    const campaign = await prisma.campaign.create({
      data: {
        platformId: `cmp_${i}`,
        name: `Campaign ${i}`,
        configuredStatus,
        effectiveStatus: configuredStatus,
        deliveryStatus: configuredStatus === Status.ACTIVE ? 'Active' : 'Inactive',
        dailyBudgetCents: i === 1 ? 8000 : 12000,
        budgetSourceUnit: i === 1 ? BudgetSourceUnit.MAJOR : BudgetSourceUnit.MINOR,
        startDate: new Date(),
        objective: 'Conversions',
        merchantId: merchant.id,
        adAccountId: adAccount.id,
        sellpageId: sellpage.id,
        lastSyncAt: new Date(),
        lastSeenSyncRunId: syncRun.id,
        hidden: false
      }
    });

    const adset = await prisma.adSet.create({
      data: {
        platformId: `adset_${i}`,
        name: `Ad Set ${i}`,
        configuredStatus,
        effectiveStatus: configuredStatus,
        deliveryStatus: configuredStatus === Status.ACTIVE ? 'Active' : 'Inactive',
        budgetCents: 3000 * i,
        merchantId: merchant.id,
        campaignId: campaign.id,
        targeting: { location: 'US', age: '18-45' },
        lastSeenSyncRunId: syncRun.id,
        hidden: false
      }
    });

    await prisma.ad.create({
      data: {
        platformId: `ad_${i}`,
        name: `Ad ${i}`,
        configuredStatus,
        effectiveStatus: configuredStatus,
        deliveryStatus: configuredStatus === Status.ACTIVE ? 'Active' : 'Inactive',
        merchantId: merchant.id,
        adSetId: adset.id,
        metrics: { roas: 1.5 + i / 10, ctr: 2 + i / 10, cpm: 8.2 + i },
        lastSeenSyncRunId: syncRun.id,
        hidden: false
      }
    });

    await prisma.metricsDaily.create({
      data: {
        entityType: EntityType.CAMPAIGN,
        platformId: campaign.platformId,
        dateLocal,
        timezone: adAccount.timezone,
        spendCents: i === 2 ? 0 : 2500 * i,
        impressions: 2200 * i,
        clicks: 130 * i,
        roas: 1.7 + i / 10,
        cpm: 9 + i,
        ctr: 2.3 + i / 10
      }
    });
  }
}

main().finally(async () => prisma.$disconnect());
