import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin1 = await prisma.admin.create({
    data: {
      name: 'Admin One',
      email: 'admin12131331312312311@example.com',
      password: 'adminpassword1',
    },
  });

  const admin2 = await prisma.admin.create({
    data: {
      name: 'Admin Two',
      email: 'admin2231232131222@example.com',
      password: 'adminPassword2.',
    },
  });

  const admin3 = await prisma.admin.create({
    data: {
      name: 'Admin Three',
      email: 'admin3@example.com',
      password: 'adminPassword3.',
    },
  });

  const admin4 = await prisma.admin.create({
    data: {
      name: 'Admin Four',
      email: 'admin4@example.com',
      password: 'adminPassword4.',
    },
  });

  console.log({ admin1, admin2, admin3, admin4 });

  const user1 = await prisma.user.create({
    data: {
      name: "Carlos Souza",
      email: "carlos.souza@example.com",
      password: "StrongPass456!",
      cpf: "123.456.789-01",
      birthday: "1990-02-20",
      phoneNumber: "(11) 91234-5678",
      address: "456 Avenida Paulista, São Paulo, SP",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Mariana Lima",
      email: "mariana.lima@example.com",
      password: "SafePass789!",
      cpf: "987.654.321-00",
      birthday: "1995-09-10",
      phoneNumber: "(21) 99876-5432",
      address: "789 Rua das Flores, Rio de Janeiro, RJ",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Fernando Alves",
      email: "fernando.alves@example.com",
      password: "Pass1234Secure!",
      cpf: "159.357.486-22",
      birthday: "1988-07-25",
      phoneNumber: "(31) 98765-4321",
      address: "321 Rua Central, Belo Horizonte, MG",
    },
  });

  const user4 = await prisma.user.create({
    data: {
      name: "Juliana Castro",
      email: "juliana.castro@example.com",
      password: "MyPass987!",
      cpf: "258.369.147-55",
      birthday: "1993-11-30",
      phoneNumber: "(85) 97654-3210",
      address: "654 Avenida Beira-Mar, Fortaleza, CE",
    },
  });


  console.log({ user1, user2, user3, user4 });

}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
