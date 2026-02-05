import { Body, Controller, Get, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { DraftSource, Status } from '@prisma/client';

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
    const campaigns = await this.prisma.campaign.findMany();
    for (const c of campaigns) {
      await this.prisma.campaign.update({ where: { id: c.id }, data: { spendCents: c.spendCents + 100, lastSyncAt: new Date() } });
    }
    return { message: 'sync complete' };
  }

  @Get('ads-manager/campaigns')
  campaigns(@Query('status') status?: Status) {
    return this.prisma.campaign.findMany({ where: { status: status || undefined, lastSyncAt: { not: null } } });
  }
  @Get('ads-manager/adsets')
  adsets() { return this.prisma.adSet.findMany(); }
  @Get('ads-manager/ads')
  ads() { return this.prisma.ad.findMany(); }

  @Post('ad-wizard/draft')
  async draft(@Body() body: any) {
    if (body.id) return this.prisma.adCreationDraft.update({ where: { id: body.id }, data: body });
    const merchant = await this.prisma.merchant.findFirstOrThrow();
    return this.prisma.adCreationDraft.create({ data: { merchantId: merchant.id, strategy: body.strategy || 'Scale', sellpageId: body.sellpageId, adAccountId: body.adAccountId, budgetCents: body.budgetCents, audience: body.audience, sourceType: body.sourceType || DraftSource.CONTENT_SOURCE, payload: body } });
  }

  @Post('ad-wizard/submit')
  async submit(@Body() body: any) {
    if (body.sourceType === 'EXISTING_POST' && (!body.postId || body.postId.length === 0)) {
      return { error: 'No posts available. Please create a new ad post from Content Source.' };
    }
    const merchant = await this.prisma.merchant.findFirstOrThrow();
    const account = await this.prisma.adAccount.findFirstOrThrow();
    const campaign = await this.prisma.campaign.create({ data: { platformId: `cmp_${Date.now()}`, name: body.name || 'New Wizard Campaign', status: body.status === 'PAUSED' ? Status.PAUSED : Status.ACTIVE, deliveryStatus: body.status === 'PAUSED' ? 'Inactive' : 'Active', dailyBudgetCents: body.budgetCents || 10000, spendCents: 0, startDate: new Date(), objective: body.optimizationGoal || 'Conversions', merchantId: merchant.id, adAccountId: account.id, lastSyncAt: new Date() } });
    const adset = await this.prisma.adSet.create({ data: { platformId: `adset_${Date.now()}`, name: 'Wizard AdSet', status: campaign.status, deliveryStatus: campaign.deliveryStatus, budgetCents: body.budgetCents || 10000, spendCents: 0, merchantId: merchant.id, campaignId: campaign.id } });
    const ad = await this.prisma.ad.create({ data: { platformId: `ad_${Date.now()}`, name: 'Wizard Ad', status: campaign.status, deliveryStatus: campaign.deliveryStatus, spendCents: 0, merchantId: merchant.id, adSetId: adset.id } });
    return { campaign, adset, ad };
  }
}
