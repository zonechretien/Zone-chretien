// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GlorySound database...');

  // ── Admin user ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'GlorySound2026!', 12);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@glorysound.ht' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@glorysound.ht',
      password: adminPassword,
      nom: 'Robert',
      prenom: 'Jean',
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // ── Categories ──────────────────────────────────────────────
  const categories = [
    { nom: 'Enseignement biblique', slug: 'enseignement-biblique', couleur: '#1E5FA8', icon: 'fa-bible' },
    { nom: 'Dévotion', slug: 'devotion', couleur: '#E8A020', icon: 'fa-pray' },
    { nom: 'Témoignage', slug: 'temoignage', couleur: '#22a05b', icon: 'fa-hands-praying' },
    { nom: 'Actualité', slug: 'actualite', couleur: '#D94F3B', icon: 'fa-newspaper' },
    { nom: 'Musique', slug: 'musique', couleur: '#7c3aed', icon: 'fa-music' },
    { nom: 'Événement', slug: 'evenement', couleur: '#0891b2', icon: 'fa-calendar' },
    { nom: 'Communiqué', slug: 'communique', couleur: '#0A1628', icon: 'fa-bullhorn' },
  ];

  for (const cat of categories) {
    await prisma.categorie.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log('✅ Catégories créées');

  // ── Artistes ────────────────────────────────────────────────
  const artistes = [
    { nom: 'Réveil Karimi', slug: 'reveil-karimi', genre: 'GOSPEL_CONTEMPORAIN', biographie: 'Groupe gospel contemporain haïtien fondé en 2015.', featured: true },
    { nom: 'Groupe Élohim', slug: 'groupe-elohim', genre: 'LOUANGE_ADORATION', biographie: 'Groupe de louange et adoration basé à Port-au-Prince.', featured: true },
    { nom: 'Chorale Gloire', slug: 'chorale-gloire', genre: 'GOSPEL_HAITIEN', biographie: 'Chorale de 40 voix spécialisée dans le gospel haïtien.', featured: false },
  ];

  const artistesMap = {};
  for (const artiste of artistes) {
    const a = await prisma.artiste.upsert({ where: { slug: artiste.slug }, update: {}, create: artiste });
    artistesMap[artiste.slug] = a;
  }
  console.log('✅ Artistes créés');

  // ── Musiques exemples ────────────────────────────────────────
  const musiquesExemples = [
    {
      titre: 'Gloire à Dieu dans les Cieux',
      slug: 'gloire-a-dieu-dans-les-cieux',
      fichierUrl: '',
      couvertureUrl: 'https://picsum.photos/seed/glory1/400/400',
      genre: 'GOSPEL_HAITIEN',
      status: 'PUBLIE',
      publishedAt: new Date(),
      ajouteParId: admin.id,
      artisteId: artistesMap['reveil-karimi'].id,
    },
    {
      titre: 'Tu es Saint Éternel',
      slug: 'tu-es-saint-eternel',
      fichierUrl: '',
      couvertureUrl: 'https://picsum.photos/seed/glory2/400/400',
      genre: 'LOUANGE_ADORATION',
      status: 'PUBLIE',
      publishedAt: new Date(),
      ajouteParId: admin.id,
      artisteId: artistesMap['groupe-elohim'].id,
    },
    {
      titre: 'Hosanna au Plus Haut',
      slug: 'hosanna-au-plus-haut',
      fichierUrl: '',
      couvertureUrl: 'https://picsum.photos/seed/glory3/400/400',
      genre: 'CHORALE',
      status: 'PUBLIE',
      publishedAt: new Date(),
      ajouteParId: admin.id,
      artisteId: artistesMap['chorale-gloire'].id,
    },
  ];

  for (const m of musiquesExemples) {
    await prisma.musique.upsert({ where: { slug: m.slug }, update: {}, create: m });
  }
  console.log('✅ Musiques exemples créées');

  // ── SEO settings ────────────────────────────────────────────
  const seoSettings = [
    { cle: 'site_titre', valeur: 'GlorySound — Plateforme Gospel & Musique Chrétienne' },
    { cle: 'site_description', valeur: 'Découvrez les meilleures chansons gospel, artistes chrétiens, concerts et actualités de la foi sur GlorySound.' },
    { cle: 'site_mots_cles', valeur: 'gospel, musique chrétienne, Haïti, louange, adoration' },
    { cle: 'site_url', valeur: 'https://glorysound.ht' },
    { cle: 'og_titre', valeur: 'GlorySound — Gospel & Musique Chrétienne 🎵' },
    { cle: 'twitter_card', valeur: 'summary_large_image' },
    { cle: 'google_analytics_id', valeur: 'G-XXXXXXXXXX' },
  ];

  for (const setting of seoSettings) {
    await prisma.siteSettings.upsert({ where: { cle: setting.cle }, update: { valeur: setting.valeur }, create: setting });
  }
  console.log('✅ Paramètres SEO créés');

  console.log('\n🎵 GlorySound database seeded successfully!');
  console.log(`👤 Admin: ${admin.email}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
