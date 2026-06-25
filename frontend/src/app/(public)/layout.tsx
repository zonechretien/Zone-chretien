// src/app/(public)/layout.tsx
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { AudioPlayerBar } from '@/components/public/AudioPlayerBar';
import { SocketProvider } from '@/components/public/SocketProvider';
import { ArtistSpotlight } from '@/components/public/ArtistSpotlight';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <div className="public-layout min-h-screen flex flex-col" style={{ paddingBottom: '70px' }}>
        <PublicHeader />
        <div className="flex-1">{children}</div>
        <PublicFooter />
        <AudioPlayerBar />
        <ArtistSpotlight />
      </div>
    </SocketProvider>
  );
}
