// prisma/seed_musiques.js — adds sample playable musiques for testing /musiques
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const artistes = await prisma.artiste.findMany();
  if (artistes.length === 0) throw new Error('Aucun artiste trouvé — lancez le seed principal d\'abord.');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) throw new Error('Aucun admin trouvé.');

  const samples = [
    { titre: 'Grace Infinie', genre: 'GOSPEL_CONTEMPORAIN', fichierUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', couvertureUrl: 'https://picsum.photos/seed/glorysound-1/400/400', duree: 290 },
    { titre: 'Lwanj pou Bondye', genre: 'GOSPEL_HAITIEN', fichierUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', couvertureUrl: 'https://picsum.photos/seed/glorysound-2/400/400', duree: 230 },
    { titre: 'Adoration Sans Fin', genre: 'LOUANGE_ADORATION', fichierUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', couvertureUrl: 'https://picsum.photos/seed/glorysound-3/400/400', duree: 248 },
    { titre: 'Chant de Victoire', genre: 'CHORALE', fichierUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', couvertureUrl: 'https://picsum.photos/seed/glorysound-4/400/400', duree: 263 },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const artiste = artistes[i % artistes.length];
    const slug = s.titre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    await prisma.musique.upsert({
      where: { slug },
      update: { couvertureUrl: s.couvertureUrl },
      create: {
        titre: s.titre,
        slug,
        fichierUrl: s.fichierUrl,
        couvertureUrl: s.couvertureUrl,
        duree: s.duree,
        genre: s.genre,
        status: 'PUBLIE',
        publishedAt: new Date(),
        artisteId: artiste.id,
        ajouteParId: admin.id,
      },
    });
  }
  console.log(`✅ ${samples.length} musiques de test créées.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
