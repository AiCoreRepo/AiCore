import { PrismaClient, OrderStatus } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.orderItem.aggregate({
    _sum: { selling_price: true },
    where: {
      order: {
        current_status: { in: [OrderStatus.BOOKED, OrderStatus.DELIVERED] }
      }
    }
  });
  console.log(res);
}
main().catch(console.error).finally(() => prisma.$disconnect());
