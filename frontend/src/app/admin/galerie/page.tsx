'use client';
// src/app/(admin)/galerie/page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galerieAPI, mediaAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface Photo {
  id: string;
  url: string;
  legende?: string;
  ordre: number;
}

interface Album {
  id: string;
  titre: string;
  slug: string;
  description?: string;
  couvertureUrl?: string;
  evenement?: string;
  date?: string;
  publie: boolean;
  _count: { photos: number };
  photos?: Photo[];
}

type ModalMode = 'album-create' | 'album-edit' | 'album-photos' | null;

export default function AdminGaleriePage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Album | null>(null);
  const [form, setForm] = useState({ titre: '', description: '', evenement: '', date: '', publie: true });
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-albums'],
    // backend returns array directly from findMany
    queryFn: () => galerieAPI.albums().then((r) => r.data),
  });

  const { data: albumPhotos, isLoading: photosLoading } = useQuery({
    queryKey: ['admin-album-photos', selected?.id],
    queryFn: () => selected ? galerieAPI.album(selected.slug).then((r) => r.data) : null,
    enabled: !!selected && modal === 'album-photos',
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => galerieAPI.createAlbum(payload),
    onSuccess: () => {
      toast.success('Album créé !');
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
      closeModal();
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: typeof form) => galerieAPI.updateAlbum(selected!.id, payload),
    onSuccess: () => {
      toast.success('Album mis à jour !');
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
      closeModal();
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => galerieAPI.deleteAlbum(id),
    onSuccess: () => {
      toast.success('Album supprimé');
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (photoId: string) => galerieAPI.deletePhoto(selected!.id, photoId),
    onSuccess: () => {
      toast.success('Photo supprimée');
      qc.invalidateQueries({ queryKey: ['admin-album-photos', selected?.id] });
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
    },
  });

  const openCreate = () => {
    setSelected(null);
    setForm({ titre: '', description: '', evenement: '', date: '', publie: true });
    setModal('album-create');
  };

  const openEdit = (album: Album) => {
    setSelected(album);
    setForm({
      titre: album.titre,
      description: album.description || '',
      evenement: album.evenement || '',
      date: album.date ? album.date.slice(0, 10) : '',
      publie: album.publie,
    });
    setModal('album-edit');
  };

  const openPhotos = (album: Album) => {
    setSelected(album);
    setModal('album-photos');
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };

  const handleSubmit = () => {
    if (!form.titre.trim()) { toast.error('Titre requis'); return; }
    if (modal === 'album-create') createMutation.mutate(form);
    else updateMutation.mutate(form);
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !e.target.files?.length) return;
    setUploading(true);
    const files = Array.from(e.target.files);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('photos', f));
      await galerieAPI.uploadPhotos(selected.id, formData as FormData);
      toast.success(`${files.length} photo(s) ajoutée(s) !`);
      qc.invalidateQueries({ queryKey: ['admin-album-photos', selected.id] });
      qc.invalidateQueries({ queryKey: ['admin-albums'] });
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const albums: Album[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            🖼 Galerie <span style={{ color: 'var(--gold)' }}>Photos</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--gray)' }}>
            {albums.length} album{albums.length !== 1 ? 's' : ''} · {albums.reduce((acc, a) => acc + a._count.photos, 0)} photos au total
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
          + Nouvel album
        </button>
      </div>

      {/* Albums Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-52"></div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--gray)' }}>
          <div className="text-5xl mb-4">🖼</div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--navy)' }}>Aucun album</p>
          <p className="text-sm">Créez votre premier album pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {albums.map((album) => (
            <div key={album.id} className="bg-white rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{ border: '1.5px solid var(--gray-light)', boxShadow: 'var(--shadow-sm)' }}>
              {/* Cover */}
              <div className="h-36 relative flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))' }}>
                {album.couvertureUrl ? (
                  <img src={album.couvertureUrl} alt={album.titre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl opacity-30">🖼</span>
                )}
                {/* Badge count */}
                <div className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: 'rgba(0,0,0,.65)', color: 'white' }}>
                  {album._count.photos} photo{album._count.photos !== 1 ? 's' : ''}
                </div>
                {/* Publié badge */}
                <div className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: album.publie ? '#e6f4ee' : 'rgba(217,79,59,.12)', color: album.publie ? '#16a34a' : 'var(--red)' }}>
                  {album.publie ? 'Publié' : 'Brouillon'}
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="text-sm font-bold truncate mb-0.5" style={{ color: 'var(--navy)' }}>{album.titre}</div>
                {album.evenement && (
                  <div className="text-xs mb-1 truncate" style={{ color: 'var(--gray)' }}>📍 {album.evenement}</div>
                )}
                {album.date && (
                  <div className="text-xs mb-2" style={{ color: 'var(--gray)' }}>
                    {new Date(album.date).toLocaleDateString('fr')}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => openPhotos(album)}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(30,95,168,.1)', color: 'var(--blue)' }}>
                    Photos
                  </button>
                  <button onClick={() => openEdit(album)}
                    className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(232,160,32,.12)', color: 'var(--gold)' }}>
                    Modifier
                  </button>
                  <button onClick={() => { if (confirm('Supprimer cet album et ses photos ?')) deleteMutation.mutate(album.id); }}
                    className="px-3 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                    style={{ background: 'rgba(217,79,59,.1)', color: 'var(--red)' }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL CREATE/EDIT ALBUM ── */}
      {(modal === 'album-create' || modal === 'album-edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,.7)' }}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>
                {modal === 'album-create' ? '+ Nouvel album' : `Modifier — ${selected?.titre}`}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full text-lg hover:bg-gray-100"
                style={{ color: 'var(--gray)' }}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Titre *</label>
                <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  placeholder="Titre de l'album"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Description de l'album..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Événement lié</label>
                  <input value={form.evenement} onChange={(e) => setForm({ ...form, evenement: e.target.value })}
                    placeholder="Nom de l'événement"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--navy)' }}>Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: '1.5px solid var(--gray-light)', color: 'var(--navy)' }} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="publie-album" checked={form.publie}
                  onChange={(e) => setForm({ ...form, publie: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <label htmlFor="publie-album" className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
                  Publier l'album
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)' }}>
                Annuler
              </button>
              <button onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: 'var(--gold)', color: 'var(--navy)' }}>
                {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PHOTOS ── */}
      {modal === 'album-photos' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,.7)' }}>
          <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh', boxShadow: 'var(--shadow-lg)' }}>
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--gray-light)' }}>
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--navy)' }}>
                  📷 {selected.titre}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--gray)' }}>
                  {albumPhotos?.album?._count?.photos ?? selected._count.photos} photo(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Upload button */}
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--blue)', color: 'white' }}>
                  {uploading ? '⏳ Upload...' : '+ Ajouter des photos'}
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleUploadPhotos} disabled={uploading} />
                </label>
                <button onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-lg hover:bg-gray-100"
                  style={{ color: 'var(--gray)' }}>✕</button>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              {photosLoading ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array(12).fill(0).map((_, i) => (
                    <div key={i} className="skeleton rounded-xl aspect-square"></div>
                  ))}
                </div>
              ) : albumPhotos?.album?.photos?.length === 0 ? (
                <div className="text-center py-16" style={{ color: 'var(--gray)' }}>
                  <div className="text-4xl mb-3">📷</div>
                  <p className="font-semibold" style={{ color: 'var(--navy)' }}>Aucune photo</p>
                  <p className="text-sm mt-1">Ajoutez des photos en cliquant sur le bouton ci-dessus.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(albumPhotos?.album?.photos as Photo[] || []).map((photo) => (
                    <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden"
                      style={{ border: '1.5px solid var(--gray-light)' }}>
                      <img src={photo.url} alt={photo.legende || 'Photo'} className="w-full h-full object-cover" />
                      {/* Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(10,22,40,.6)' }}>
                        <button onClick={() => { if (confirm('Supprimer cette photo ?')) deletePhotoMutation.mutate(photo.id); }}
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all hover:scale-110"
                          style={{ background: 'var(--red)', color: 'white' }}>✕</button>
                      </div>
                      {/* Légende tooltip */}
                      {photo.legende && (
                        <div className="absolute bottom-0 left-0 right-0 p-1 text-xs text-center truncate"
                          style={{ background: 'rgba(0,0,0,.55)', color: 'white' }}>
                          {photo.legende}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex justify-end" style={{ borderColor: 'var(--gray-light)' }}>
              <button onClick={closeModal}
                className="px-6 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--gray-light)', color: 'var(--gray-dark)' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
