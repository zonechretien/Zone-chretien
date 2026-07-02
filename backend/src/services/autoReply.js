// Réponse automatique aux témoignages/contacts via Claude AI + nodemailer
import nodemailer from 'nodemailer';
import { generateText, isAgentEnabled, logAction } from './aiAgent.js';
import { logger } from '../utils/logger.js';

function createTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const SYS_REPLY = `Tu es l'assistant chaleureux de Zone-Chrétien, la plateforme gospel haïtienne.
Tu rédiges des réponses personnalisées, bienveillantes et spirituellement encourageantes, en français.
La réponse doit :
- Commencer par remercier chaleureusement la personne par son prénom/nom
- Référencer brièvement le sujet de leur message
- Offrir des mots d'encouragement spirituels courts
- Se terminer par une bénédiction sincère et la signature "L'équipe Zone-Chrétien"
Longueur : 3-4 paragraphes maximum. Ne mentionne jamais que tu es une IA.`;

export async function sendAutoReply({ auteurNom, auteurEmail, contenu, titre }) {
  if (!auteurEmail) return;

  const enabled = await isAgentEnabled();
  if (!enabled) return;

  const transport = createTransport();
  if (!transport) {
    logger.warn('[Agent IA] SMTP non configuré — réponse auto ignorée pour ' + auteurEmail);
    return;
  }

  try {
    const ctx = titre
      ? `Sujet du message : "${titre}"\nContenu : ${(contenu || '').slice(0, 300)}`
      : `Message reçu : ${(contenu || '').slice(0, 300)}`;

    const reponseTexte = await generateText(
      SYS_REPLY,
      `Rédige une réponse chaleureuse pour ${auteurNom} qui nous a contacté via Zone-Chrétien.\n${ctx}`
    );

    const paragraphes = reponseTexte
      .split('\n')
      .filter((l) => l.trim())
      .map((p) => `<p style="line-height:1.8;color:#374151;margin:0 0 16px">${p}</p>`)
      .join('');

    await transport.sendMail({
      from: process.env.EMAIL_FROM || '"Zone-Chrétien" <contact.zonechretien@gmail.com>',
      to: auteurEmail,
      subject: `Merci pour votre message — Zone-Chrétien`,
      text: reponseTexte,
      html: `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f9fafb">
<div style="max-width:600px;margin:32px auto;font-family:Georgia,serif">
  <div style="background:linear-gradient(135deg,#0A1628,#1E5FA8);padding:28px 32px;border-radius:12px 12px 0 0">
    <h1 style="margin:0;color:#E8A020;font-size:22px;letter-spacing:1px">ZONE-CHRÉTIEN</h1>
    <p style="margin:4px 0 0;color:rgba(255,255,255,.6);font-size:13px">Gospel & Musique Chrétienne</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
    ${paragraphes}
    <hr style="border:none;border-top:2px solid #E8A020;margin:24px 0">
    <p style="color:#9ca3af;font-size:12px;margin:0">
      Zone-Chrétien · <a href="https://glorysound.ht" style="color:#E8A020">glorysound.ht</a> ·
      <a href="mailto:contact.zonechretien@gmail.com" style="color:#E8A020">contact.zonechretien@gmail.com</a>
    </p>
  </div>
</div>
</body></html>`,
    });

    logAction('reponse', `Email envoyé à ${auteurEmail} (${auteurNom})`);
  } catch (err) {
    logAction('reponse', `Erreur email ${auteurEmail} : ${err.message}`, false);
  }
}
