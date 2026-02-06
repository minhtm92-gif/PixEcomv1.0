import { Body, Controller, Get, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { BudgetSourceUnit, DraftSource, EntityType , Status } from '@prisma/client';
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

  @Get('sellpages/:id/metrics')
  async sellpageMetrics(@Param('id') id: string) {
    const orders = await this.prisma.order.findMany({ where: { sellpageId: id } });
    const revenue = orders.reduce((a, o) => a + o.revenueCents, 0);
    const spend = 50000;
    return { views: 12456, orders: orders.length, revenueCents: revenue, spendCents: spend, roas: revenue / Math.max(spend, 1) };
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
    const account = await this.prisma.adAccount.findFirstOrThrow();
    const syncRun = await this.prisma.syncRun.create({ data: { merchantId: merchant.id, source: 'facebook', status: 'running' } });

    const fbCampaigns = [
      { platformId: 'cmp_1', name: 'Campaign 1', configuredStatus: Status.ACTIVE, effectiveStatus: Status.ACTIVE, deliveryStatus: 'Active', budget: 80, budgetUnit: 'MAJOR' as BudgetSourceUnit, spend: 2300 },
      { platformId: 'cmp_2', name: 'Campaign 2', configuredStatus: Status.PAUSED, effectiveStatus: Status.PAUSED, deliveryStatus: 'Inactive', budget: 8000, budgetUnit: 'MINOR' as BudgetSourceUnit, spend: 0 },
      { platformId: 'cmp_3', name: 'Campaign 3', configuredStatus: Status.ACTIVE, effectiveStatus: Status.ACTIVE, deliveryStatus: 'Active', budget: 120, budgetUnit: 'MAJOR' as BudgetSourceUnit, spend: 5100 }
    ];

    const seenCampaignPlatforms = new Set<string>();
    const metricDate = new Date();
    metricDate.setUTCHours(0, 0, 0, 0);

    for (const fb of fbCampaigns) {
      seenCampaignPlatforms.add(fb.platformId);
      const budget = normalizeBudgetToCents(fb.budget, fb.budgetUnit);

      await this.prisma.campaign.upsert({
        where: { id: `sync_${fb.platformId}_${merchant.id}` },
        create: {
          id: `sync_${fb.platformId}_${merchant.id}`,
          platformId: fb.platformId,
          name: fb.name,
          configuredStatus: fb.configuredStatus,
          effectiveStatus: fb.effectiveStatus,
          deliveryStatus: fb.deliveryStatus,
          dailyBudgetCents: budget.cents,
          budgetSourceUnit: budget.unit,
          spendCents: fb.spend,
          startDate: new Date(),
          objective: 'Conversions',
          merchantId: merchant.id,
          adAccountId: account.id,
          lastSyncAt: new Date(),
          lastSeenSyncRunId: syncRun.id,
          hidden: false
        },
        update: {
          name: fb.name,
          configuredStatus: fb.configuredStatus,
          effectiveStatus: fb.effectiveStatus,
          deliveryStatus: fb.deliveryStatus,
          dailyBudgetCents: budget.cents,
          budgetSourceUnit: budget.unit,
          spendCents: fb.spend,
          lastSyncAt: new Date(),
          lastSeenSyncRunId: syncRun.id,
          hidden: false
        }
      });

      await this.prisma.metricsDaily.upsert({
        where: {
          entityType_platformId_metricDate_timezone: {
            entityType: EntityType.CAMPAIGN,
            platformId: fb.platformId,
            metricDate,
            timezone: account.timezone
          }
        },
        create: {
          entityType: EntityType.CAMPAIGN,
          platformId: fb.platformId,
          metricDate,
          timezone: account.timezone,
          spendCents: fb.spend,
          impressions: 10000,
          clicks: 240,
          roas: 2.1,
          cpm: 8.2,
          ctr: 2.4
        },
        update: { spendCents: fb.spend, roas: 2.1, cpm: 8.2, ctr: 2.4 }
      });
    }

    await this.prisma.campaign.updateMany({
      where: { merchantId: merchant.id, platformId: { notIn: [...seenCampaignPlatforms] } },
      data: { hidden: true }
    });

    await this.prisma.syncRun.update({ where: { id: syncRun.id }, data: { status: 'success', finishedAt: new Date() } });

    return { message: 'sync complete', syncRunId: syncRun.id, seenCampaigns: [...seenCampaignPlatforms] };
  }

  @Patch('ads-manager/campaigns/:id/configured-status')
  async updateConfiguredStatus(@Param('id') id: string, @Body() body: { configuredStatus: Status }) {
    return this.prisma.campaign.update({ where: { id }, data: { configuredStatus: body.configuredStatus } });
  }

  @Get('ads-manager/campaigns')
  async campaigns(@Query('status') status?: Status) {
    const rows = await this.prisma.campaign.findMany({
      where: { configuredStatus: status || undefined, hidden: false, lastSeenSyncRunId: { not: null } },
      distinct: ['platformId'],
      orderBy: [{ platformId: 'asc' }, { lastSyncAt: 'desc' }]
    });

    const metricRows = await this.prisma.metricsDaily.findMany({
      where: { entityType: EntityType.CAMPAIGN, platformId: { in: rows.map((r) => r.platformId) } },
      orderBy: { metricDate: 'desc' }
    });

    const latestMetricByPlatform = new Map<string, (typeof metricRows)[number]>();
    for (const metric of metricRows) {
      if (!latestMetricByPlatform.has(metric.platformId)) latestMetricByPlatform.set(metric.platformId, metric);
    }

    const validation = validateUniquePlatforms(rows.map((r) => r.platformId));
    console.log('[ads-manager] campaign list validation', validation);

    return rows.map((c) => {
      const metric = latestMetricByPlatform.get(c.platformId);
      const spendCents = metric ? metric.spendCents : 0;
      if (spendCents === 0) console.log(`[ads-manager] spend is zero from insights for campaign ${c.platformId}`);
      return {
        ...c,
        spendCents,
        budgetDebug: { cents: c.dailyBudgetCents, sourceUnit: c.budgetSourceUnit }
      };
    });
  }

  @Get('ads-manager/adsets')
  adsets() {
    return this.prisma.adSet.findMany({ where: { hidden: false }, distinct: ['platformId'], orderBy: { platformId: 'asc' } });
  }

  @Get('ads-manager/ads')
  ads() {
    return this.prisma.ad.findMany({ where: { hidden: false }, distinct: ['platformId'], orderBy: { platformId: 'asc' } });
  }

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
    const account = await this.prisma.adAccount.findFirstOrThrow();
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
        spendCents: 0,
        startDate: new Date(),
        objective: body.optimizationGoal || 'Conversions',
        merchantId: merchant.id,
        adAccountId: account.id,
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
        spendCents: 0,
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
        spendCents: 0,
        merchantId: merchant.id,
        adSetId: adset.id,
        hidden: false
      }
    });

    return { campaign, adset, ad };
  }
}
