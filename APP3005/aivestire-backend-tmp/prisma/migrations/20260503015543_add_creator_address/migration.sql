-- CreateTable
CREATE TABLE "creator_addresses" (
    "address_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creator_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_addresses_pkey" PRIMARY KEY ("address_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_addresses_creator_id_key" ON "creator_addresses"("creator_id");

-- AddForeignKey
ALTER TABLE "creator_addresses" ADD CONSTRAINT "creator_addresses_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Creator"("creator_id") ON DELETE CASCADE ON UPDATE CASCADE;
