import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('⚠️  Tài khoản admin đã tồn tại, bỏ qua seed.');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123', SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      fullName: 'Super Admin',
      email: 'admin@mindx.edu.vn',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Đã tạo tài khoản SUPER_ADMIN:', admin.username);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khi seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });