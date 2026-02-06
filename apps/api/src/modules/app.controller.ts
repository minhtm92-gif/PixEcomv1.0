import { Body, Controller, Get, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { BudgetSourceUnit, DraftSource, EntityType, PaymentStatus, Status } from '@prisma/client';
import { normalizeBudgetToCents, validateUniquePlatforms } from './ads-manager.logic';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  @Post('auth/login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    const payload = { sub: user.id, merchantId: user.merchantId, role: user.role };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '1h' }),
      refreshToken: this.jwt.sign(payload, { secret: process.env.JWT_REFRESH_SECRET || 'refreshsecret', expiresIn: '7d' })
    };
  }

  @Post('auth/refresh')
  refresh(@Body() body: { refreshToken: string }) {
    const decoded = this.jwt.verify(body.refreshToken, { secret: process.env.JWT_REFRESH_SECRET || 'refreshsecret' });
    return { accessToken: this.jwt.sign({ sub: decoded.sub, merchantId: decoded.merchantId, role: decoded.role }, { expiresIn: '1h' }) };
  }

  @Get('me')
  async me(@Query('email') email = 'admin@pixecom.local') {
    return this.prisma.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, role: true, merchantId: true } });
  }

  @Get('products')
  products() { return this.prisma.product.findMany(); }

  @Get('products/:id')
  product(@Param('id') id: string) { return this.prisma.product.findUnique({ where: { id } }); }

  @Get('sellpages')
  sellpages() { return this.prisma.sellpage.findMany({ include: { product: true } }); }

  @Get('sellpages/:id')
  sellpage(@Param('id') id: string) { return this.prisma.sellpage.findUnique({ where: { id }, include: { product: true } }); }

  @Post('tracking/session')
  async upsertSession(@Body() body: any) {
    const sellpage = await this.prisma.sellpage.findUniqueOrThrow({ where: { slug: body.slug } });
    return this.prisma.session.upsert({
      where: { sessionKey: body.sessionKey },
      create: {
        sessionKey: body.sessionKey,
        merchantId: sellpage.merchantId,
        sellpageId: sellpage.id,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmContent: body.utmContent,
        utmTerm: body.utmTerm,
        fbclid: body.fbclid,
        gclid: body.gclid
      },
      update: {
        sellpageId: sellpage.id,
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmContent: body.utmContent,
        utmTerm: body.utmTerm,
        fbclid: body.fbclid,
        gclid: body.gclid
      }
    });
  }

  @Post('tracking/pageview')
  async createPageView(@Body() body: { sessionKey: string; slug: string; path?: string }) {
    const session = await this.prisma.session.findUniqueOrThrow({ where: { sessionKey: body.sessionKey } });
    const sellpage = await this.prisma.sellpage.findUniqueOrThrow({ where: { slug: body.slug } });
    return this.prisma.pageView.create({
      data: {
        merchantId: sellpage.merchantId,
        sellpageId: sellpage.id,
        sessionId: session.id,
        path: body.path || `/p/${body.slug}`
      }
    });
  }

  @Post('checkout/submit')
  async checkout(@Body() body: { sessionKey: string; sellpageId: string; items: Array<{ productId: string; quantity: number; priceCents: number }> }) {
    const session = await this.prisma.session.findUniqueOrThrow({ where: { sessionKey: body.sessionKey } });
    const total = body.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);

    const order = await this.prisma.order.create({
      data: {
        merchantId: session.merchantId,
        sellpageId: body.sellpageId,
        sessionId: session.id,
        utmSource: session.utmSource,
        utmMedium: session.utmMedium,
        utmCampaign: session.utmCampaign,
        utmContent: session.utmContent,
        utmTerm: session.utmTerm,
        fbclid: session.fbclid,
        gclid: session.gclid,
        totalsCents: total,
        paymentStatus: PaymentStatus.PENDING,
        items: { create: body.items }
      }
    });

    return order;
  }

  @Patch('checkout/payment-update/:orderId')
  updatePayment(@Param('orderId') orderId: string, @Body() body: { paymentStatus: PaymentStatus }) {
    return this.prisma.order.update({ where: { id: orderId }, data: { paymentStatus: body.paymentStatus } });
  }

  @Get('sellpages/:id/metrics')
  async sellpageMetrics(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    const sellpage = await this.prisma.sellpage.findUniqueOrThrow({ where: { id } });
    const account = await this.prisma.adAccount.findFirstOrThrow({ where: { merchantId: sellpage.merchantId } });

    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const toDate = to ? new Date(to) : new Date();

    const views = await this.prisma.pageView.count({ where: { sellpageId: id, createdAt: { gte: fromDate, lte: toDate } } });
    const paidOrders = await this.prisma.order.findMany({
      where: { sellpageId: id, paymentStatus: PaymentStatus.PAID, createdAt: { gte: fromDate, lte: toDate } }
    });

    const revenueCents = paidOrders.reduce((sum, o) => sum + o.totalsCents, 0);
    const ordersCount = paidOrders.length;

    const linkedCampaigns = await this.prisma.campaign.findMany({ where: { sellpageId: id, hidden: false } });
    const campaignPlatformIds = linkedCampaigns.map((c) => c.platformId);

    const spendAgg = await this.prisma.metricsDaily.aggregate({
      where: {
        entityType: EntityType.CAMPAIGN,
        platformId: { in: campaignPlatformIds.length ? campaignPlatformIds : ['__none__'] },
        timezone: account.timezone,
        dateLocal: { gte: fromDate, lte: toDate }
      },
      _sum: { spendCents: true }
    });

    const spendCents = spendAgg._sum.spendCents ?? 0;
    const roas = spendCents > 0 ? revenueCents / spendCents : 0;
    const cvr = views > 0 ? ordersCount / views : 0;

    return { views, orders: ordersCount, revenueCents, spendCents, roas, cvr, timezone: account.timezone };
  }

  @Get('creatives')
  creatives(@Query('type') type?: any, @Query('productId') productId?: string) {
    return this.prisma.creativeAsset.findMany({ where: { type: type || undefined, productId: productId || undefined } });
  }

  @Get('integrations/facebook/ad-accounts')
  accounts() { return this.prisma.adAccount.findMany(); }

  @Post('integrations/facebook/sync')
  async sync() {
    const merchant = await this.prisma.merchant.findFirstOrThrow();
    const account = await this.prisma.adAccount.findFirstOrThrow({ where: { merchantId: merchant.id } });
    const sellpage = await this.prisma.sellpage.findFirstOrThrow({ where: { merchantId: merchant.id } });
    const syncRun = await this.prisma.syncRun.create({ data: { merchantId: merchant.id, source: 'facebook', status: 'running' } });

    const insightsCampaign = [
      { platformId: 'cmp_1', name: 'Campaign 1', configuredStatus: Status.ACTIVE, effectiveStatus: Status.ACTIVE, deliveryStatus: 'Active', budget: 80, budgetUnit: 'MAJOR' as BudgetSourceUnit, spend: 2300 },
      { platformId: 'cmp_2', name: 'Campaign 2', configuredStatus: Status.PAUSED, effectiveStatus: Status.PAUSED, deliveryStatus: 'Inactive', budget: 8000, budgetUnit: 'MINOR' as BudgetSourceUnit, spend: 0 },
      { platformId: 'cmp_3', name: 'Campaign 3', configuredStatus: Status.ACTIVE, effectiveStatus: Status.ACTIVE, deliveryStatus: 'Active', budget: 120, budgetUnit: 'MAJOR' as BudgetSourceUnit, spend: 5100 }
    ];

    const seenCampaignPlatforms = new Set<string>();
    const dateLocal = new Date();
    dateLocal.setUTCHours(0, 0, 0, 0);

    for (const item of insightsCampaign) {
      seenCampaignPlatforms.add(item.platformId);
      const budget = normalizeBudgetToCents(item.budget, item.budgetUnit);

      await this.prisma.campaign.upsert({
        where: { merchantId_platformId: { merchantId: merchant.id, platformId: item.platformId } },
        create: {
          platformId: item.platformId,
          name: item.name,
          configuredStatus: item.configuredStatus,
          effectiveStatus: item.effectiveStatus,
          deliveryStatus: item.deliveryStatus,
          dailyBudgetCents: budget.cents,
          budgetSourceUnit: budget.unit,
          startDate: new Date(),
          objective: 'Conversions',
          merchantId: merchant.id,
          adAccountId: account.id,
          sellpageId: sellpage.id,
          lastSyncAt: new Date(),
          lastSeenSyncRunId: syncRun.id,
          hidden: false
        },
        update: {
          name: item.name,
          configuredStatus: item.configuredStatus,
          effectiveStatus: item.effectiveStatus,
          deliveryStatus: item.deliveryStatus,
          dailyBudgetCents: budget.cents,
          budgetSourceUnit: budget.unit,
          lastSyncAt: new Date(),
          lastSeenSyncRunId: syncRun.id,
          hidden: false
        }
      });

      await this.prisma.metricsDaily.upsert({
        where: {
          entityType_platformId_dateLocal_timezone: {
            entityType: EntityType.CAMPAIGN,
            platformId: item.platformId,
            dateLocal,
            timezone: account.timezone
          }
        },
        create: {
          entityType: EntityType.CAMPAIGN,
          platformId: item.platformId,
          dateLocal,
          timezone: account.timezone,
          spendCents: item.spend,
          impressions: 10000,
          clicks: 240,
          roas: 2.1,
          cpm: 8.2,
          ctr: 2.4
        },
        update: { spendCents: item.spend }
      });
    }

    await this.prisma.campaign.updateMany({
      where: { merchantId: merchant.id, platformId: { notIn: [...seenCampaignPlatforms] } },
      data: { hidden: true }
    });

    await this.prisma.syncRun.update({ where: { id: syncRun.id }, data: { status: 'success', finishedAt: new Date() } });
    return { message: 'sync complete', syncRunId: syncRun.id };
  }

  @Patch('ads-manager/campaigns/:id/configured-status')
  updateConfiguredStatus(@Param('id') id: string, @Body() body: { configuredStatus: Status }) {
    return this.prisma.campaign.update({ where: { id }, data: { configuredStatus: body.configuredStatus } });
  }

  @Get('ads-manager/campaigns')
  async campaigns(@Query('status') status?: Status, @Query('from') from?: string, @Query('to') to?: string) {
    const rows = await this.prisma.campaign.findMany({
      where: { configuredStatus: status || undefined, hidden: false, lastSeenSyncRunId: { not: null } },
      distinct: ['platformId'],
      orderBy: [{ platformId: 'asc' }, { lastSyncAt: 'desc' }]
    });

    const account = await this.prisma.adAccount.findFirst();
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const toDate = to ? new Date(to) : new Date();

    const metrics = await this.prisma.metricsDaily.findMany({
      where: {
        entityType: EntityType.CAMPAIGN,
        platformId: { in: rows.map((r) => r.platformId) },
        timezone: account?.timezone,
        dateLocal: { gte: fromDate, lte: toDate }
      }
    });

    const spendByCampaign = new Map<string, number>();
    for (const m of metrics) spendByCampaign.set(m.platformId, (spendByCampaign.get(m.platformId) ?? 0) + m.spendCents);

    const validation = validateUniquePlatforms(rows.map((r) => r.platformId));
    console.log('[ads-manager] campaign unique validation', validation);

    return rows.map((c) => ({
      ...c,
      spendCents: spendByCampaign.get(c.platformId) ?? 0,
      budgetDisplay: c.dailyBudgetCents / 100,
      budgetDebug: { cents: c.dailyBudgetCents, sourceUnit: c.budgetSourceUnit }
    }));
  }

  @Get('ads-manager/adsets')
  adsets() { return this.prisma.adSet.findMany({ where: { hidden: false }, distinct: ['platformId'], orderBy: { platformId: 'asc' } }); }

  @Get('ads-manager/ads')
  ads() { return this.prisma.ad.findMany({ where: { hidden: false }, distinct: ['platformId'], orderBy: { platformId: 'asc' } }); }

  @Get('ads-manager/validations')
  async validations() {
    const campaigns = await this.prisma.campaign.findMany({ where: { hidden: false }, distinct: ['platformId'] });
    const uniqueStats = validateUniquePlatforms(campaigns.map((c) => c.platformId));
    const zeroSpendCount = await this.prisma.metricsDaily.count({ where: { entityType: EntityType.CAMPAIGN, spendCents: 0 } });
    const budgetSanity = campaigns.map((c) => ({ platformId: c.platformId, displayBudget: c.dailyBudgetCents / 100, sourceUnit: c.budgetSourceUnit }));
    return { uniqueStats, zeroSpendCount, budgetSanity };
  }

  @Post('ad-wizard/draft')
  async draft(@Body() body: any) {
    if (body.id) return this.prisma.adCreationDraft.update({ where: { id: body.id }, data: body });
    const merchant = await this.prisma.merchant.findFirstOrThrow();
    return this.prisma.adCreationDraft.create({
      data: {
        merchantId: merchant.id,
        strategy: body.strategy || 'Scale',
        sellpageId: body.sellpageId,
        adAccountId: body.adAccountId,
        budgetCents: body.budgetCents,
        audience: body.audience,
        sourceType: body.sourceType || DraftSource.CONTENT_SOURCE,
        payload: body
      }
    });
  }

  @Post('ad-wizard/submit')
  async submit(@Body() body: any) {
    if (body.sourceType === 'EXISTING_POST' && (!body.postId || body.postId.length === 0)) {
      return { error: 'No posts available. Please create a new ad post from Content Source.' };
    }
    const merchant = await this.prisma.merchant.findFirstOrThrow();
    const account = await this.prisma.adAccount.findFirstOrThrow({ where: { merchantId: merchant.id } });
    const budget = normalizeBudgetToCents(body.budget ?? 100, body.budgetUnit as BudgetSourceUnit | undefined);

    const campaign = await this.prisma.campaign.create({
      data: {
        platformId: `cmp_${Date.now()}`,
        name: body.name || 'New Wizard Campaign',
        configuredStatus: body.status === 'PAUSED' ? Status.PAUSED : Status.ACTIVE,
        effectiveStatus: body.status === 'PAUSED' ? Status.PAUSED : Status.ACTIVE,
        deliveryStatus: body.status === 'PAUSED' ? 'Inactive' : 'Active',
        dailyBudgetCents: budget.cents,
        budgetSourceUnit: budget.unit,
        startDate: new Date(),
        objective: body.optimizationGoal || 'Conversions',
        merchantId: merchant.id,
        adAccountId: account.id,
        sellpageId: body.sellpageId,
        lastSyncAt: new Date(),
        hidden: false
      }
    });

    const adset = await this.prisma.adSet.create({
      data: {
        platformId: `adset_${Date.now()}`,
        name: 'Wizard AdSet',
        configuredStatus: campaign.configuredStatus,
        effectiveStatus: campaign.effectiveStatus,
        deliveryStatus: campaign.deliveryStatus,
        budgetCents: budget.cents,
        merchantId: merchant.id,
        campaignId: campaign.id,
        hidden: false
      }
    });

    const ad = await this.prisma.ad.create({
      data: {
        platformId: `ad_${Date.now()}`,
        name: 'Wizard Ad',
        configuredStatus: campaign.configuredStatus,
        effectiveStatus: campaign.effectiveStatus,
        deliveryStatus: campaign.deliveryStatus,
        merchantId: merchant.id,
        adSetId: adset.id,
        hidden: false
      }
    });

    return { campaign, adset, ad };
  }
}
