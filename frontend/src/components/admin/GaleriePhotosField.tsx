'use client';
import { useRef, useState } from 'react';
import { GripVertical, Loader2, Upload, X } from 'lucide-react';
import { mediaGalerieAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export interface GaleriePhotoItem {
  id?: string;
  url: string;
  caption?: string | null;
}

interface Props {
  items: GaleriePhotoItem[];
  onChange: (items: GaleriePhotoItem[]) => void;
}

export function GaleriePhotosField({ items, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = await mediaGalerieAPI.uploadFiles(Array.from(files));
      onChange([...items, ...uploaded.map((f) => ({ url: f.url, caption: '' }))]);
      toast.success(`${uploaded.length} photo(s) ajoutée(s)`);
    } catch {
      toast.error("Erreur lors de l'upload des photos");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const updateCaption = (i: number, caption: string) => {
    const next = [...items];
    next[i] = { ...next[i], caption };
    onChange(next);
  };

  const removeItem = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
        Galerie photos (carousel)
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
        {uploading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 size={16} className="animate-spin" /> Envoi en cours…
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={16} /> Glissez des photos ici ou cliquez pour en choisir
          </span>
        )}
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
          {items.map((item, i) => (
            <div key={item.id || item.url}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(i)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', cursor: 'grab' }}>
              <GripVertical size={14} color="rgba(255,255,255,0.3)" />
              <img src={item.url} alt="" style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
              <input
                value={item.caption || ''}
                onChange={(e) => updateCaption(i, e.target.value)}
                placeholder="Légende (optionnel)"
                style={{ flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'white', fontSize: '13px', outline: 'none' }} />
              <button type="button" onClick={() => removeItem(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px', flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
