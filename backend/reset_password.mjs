import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, nom: true, prenom: true }
  });
  
  console.log('\n=== Utilisateurs en base ===');
  users.forEach(u => console.log(`  - ${u.email} [${u.role}]`));
  
  if (users.length === 0) {
    console.log('  Aucun utilisateur !');
    return;
  }

  const newPassword = 'Admin2026!';
  const hashed = await bcrypt.hash(newPassword, 12);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });
    console.log(`✅ Mot de passe mis à jour : ${user.email}`);
  }

  console.log('\n================================');
  console.log('Email    : admin@glorysound.ht');
  console.log('Password : Admin2026!');
  console.log('================================\n');
}

main()
  .catch(e => console.error('ERREUR:', e.message))
  .finally(() => prisma.$disconnect());
