-- AlterTable
ALTER TABLE "User" ADD COLUMN "coinBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "BillingInterval" AS ENUM ('ONCE', 'MONTHLY', 'YEARLY');
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "RecurringStatus" AS ENUM ('CREATED', 'AUTHENTICATED', 'ACTIVE', 'PAUSED', 'HALTED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "listAmount" INTEGER,
ADD COLUMN "billingInterval" "BillingInterval" NOT NULL DEFAULT 'ONCE',
ADD COLUMN "couponId" TEXT,
ADD COLUMN "affiliateCode" TEXT,
ADD COLUMN "coinsApplied" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "maxUsesPerUser" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minAmount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AffiliateEarning" (
    "id" TEXT NOT NULL,
    "affiliateUserId" TEXT NOT NULL,
    "referredUserId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountCoins" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateEarning_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecurringSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerSubscriptionId" TEXT NOT NULL,
    "providerPlanId" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "status" "RecurringStatus" NOT NULL DEFAULT 'CREATED',
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "couponId" TEXT,
    "affiliateCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE UNIQUE INDEX "CouponRedemption_paymentId_key" ON "CouponRedemption"("paymentId");
CREATE INDEX "CouponRedemption_couponId_userId_idx" ON "CouponRedemption"("couponId", "userId");
CREATE UNIQUE INDEX "AffiliateProfile_userId_key" ON "AffiliateProfile"("userId");
CREATE UNIQUE INDEX "AffiliateProfile_code_key" ON "AffiliateProfile"("code");
CREATE UNIQUE INDEX "AffiliateEarning_paymentId_key" ON "AffiliateEarning"("paymentId");
CREATE INDEX "AffiliateEarning_affiliateUserId_idx" ON "AffiliateEarning"("affiliateUserId");
CREATE UNIQUE INDEX "RecurringSubscription_providerSubscriptionId_key" ON "RecurringSubscription"("providerSubscriptionId");
CREATE INDEX "RecurringSubscription_userId_idx" ON "RecurringSubscription"("userId");
CREATE INDEX "RecurringSubscription_status_idx" ON "RecurringSubscription"("status");
CREATE INDEX "Payment_couponId_idx" ON "Payment"("couponId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateProfile" ADD CONSTRAINT "AffiliateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateEarning" ADD CONSTRAINT "AffiliateEarning_affiliateUserId_fkey" FOREIGN KEY ("affiliateUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateEarning" ADD CONSTRAINT "AffiliateEarning_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AffiliateEarning" ADD CONSTRAINT "AffiliateEarning_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringSubscription" ADD CONSTRAINT "RecurringSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
