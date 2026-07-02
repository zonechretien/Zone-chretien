'use client';
import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { evenementsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Props {
  eventId: string;
  isFull: boolean;
  inscriptionUrl?: string | null;
}

export function InscriptionButton({ eventId, isFull, inscriptionUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (isFull) {
    return (
      <div className="w-full py-3 rounded-xl text-center text-sm font-semibold"
        style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,.2)' }}>
        Complet
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full py-3 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2"
        style={{ background: 'rgba(34,197,94,.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,.2)' }}>
        <CheckCircle className="w-4 h-4" /> Inscription confirmée !
      </div>
    );
  }

  async function handleInscription() {
    if (inscriptionUrl) {
      window.open(inscriptionUrl, '_blank');
      return;
    }
    setLoading(true);
    try {
      await evenementsAPI.inscrire(eventId);
      setDone(true);
      toast.success('Inscription enregistrée ! À bientôt.');
    } catch {
      toast.error("Erreur lors de l'inscription. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleInscription}
      disabled={loading}
      className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg, #E8A020, #c8880e)', color: '#0A1628' }}>
      <CheckCircle className="w-4 h-4" />
      {loading ? 'Inscription…' : "S'inscrire à l'événement"}
    </button>
  );
}
