import React from "react";
import Image from "next/image";
import RightSidebar from "../components/RightSidebar";
import LeftScrollIndicator from "../components/LeftScrollIndicator";
import { headers } from "next/headers";
import { resolveProjectData } from "../../lib/resolveProject";
import type { Metadata } from "next";

export const revalidate = 0;

type Props = {
  params: Promise<{ name?: string[] }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

const formatFallbackGuestName = (raw: string): string => {
  let name = raw;
  try {
    name = decodeURIComponent(raw);
  } catch {}
  name = name
    .replace(/%20/g, " ")
    .replace(/%25/g, " ")
    .replace(/%/g, " ")
    .replace(/\+/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return name
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const requestedProject = typeof resolvedSearch.project === 'string' 
    ? resolvedSearch.project 
    : (typeof resolvedSearch.project_id === 'string' ? resolvedSearch.project_id : undefined);

  let guestName = "Tamu Undangan";
  const lastParam = resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[resolvedParams.name.length - 1] : undefined;
  const slug = lastParam || (resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[0] : undefined);

  const headersList = await headers();
  const host = headersList.get("host") || undefined;

  const dbData = await resolveProjectData(slug, host, requestedProject);

  if (dbData.guest) {
    guestName = dbData.guest.name;
  } else if (lastParam) {
    guestName = formatFallbackGuestName(lastParam);
  }

  const brideName = dbData.project?.bride_nickname || "Putri";
  const groomName = dbData.project?.groom_nickname || "Putra";
  const brideFull = dbData.project?.bride_name || "Putri Cantika Sara";
  const groomFull = dbData.project?.groom_name || "Putra Andika Pratama";

  const title = `The Wedding of ${brideName} & ${groomName} | Undangan Pernikahan`;
  const description = `Kepada Yth. ${guestName}, kami mengundang Anda untuk hadir di acara pernikahan ${brideFull} & ${groomFull}.`;
  const imageUrl = dbData.project?.cover_photo_url || dbData.project?.opening_photo_url || "https://sienna-rustic-02.serastory.com/template/assets/Savethedate-2.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: `Pernikahan ${brideName} & ${groomName}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Undangan Pernikahan ${brideName} & ${groomName}`,
        },
      ],
      locale: "id_ID",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Home({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const requestedProject = typeof resolvedSearch.project === 'string' 
    ? resolvedSearch.project 
    : (typeof resolvedSearch.project_id === 'string' ? resolvedSearch.project_id : undefined);

  let guestName = "Tamu Undangan";
  const lastParam = resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[resolvedParams.name.length - 1] : undefined;
  const slug = lastParam || (resolvedParams?.name && resolvedParams.name.length > 0 ? resolvedParams.name[0] : undefined);

  const headersList = await headers();
  const host = headersList.get("host") || undefined;

  const dbData = await resolveProjectData(slug, host, requestedProject);

  // Check project status
  const isLive = dbData.project ? dbData.project.status === "live" : true;
  const subscription = dbData.project?.subscriptions;
  const isExpired = subscription && (
    subscription.status === "expired" || 
    (subscription.expires_at && new Date(subscription.expires_at) < new Date())
  );

  if (dbData.project && (!isLive || isExpired)) {
    return (
      <main className="min-h-[100dvh] w-full flex items-center justify-center bg-[#2B231D] px-4 text-[#F5EEE6]">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-3xl bg-[#3C2A21] border border-[#5C4E43]/40 shadow-2xl">
          <h2 className="text-2xl font-serif text-[#F5EEE6]">Undangan Nonaktif</h2>
          <p className="text-sm text-[#D3C7BD]">
            Masa aktif undangan pernikahan digital ini telah selesai.
          </p>
        </div>
      </main>
    );
  }

  if (dbData.guest) {
    guestName = dbData.guest.name;
  } else if (lastParam) {
    guestName = formatFallbackGuestName(lastParam);
  }

  const brideNickname = dbData.project?.bride_nickname || "Putri";
  const groomNickname = dbData.project?.groom_nickname || "Putra";
  const weddingDateRaw = dbData.events?.[0]?.event_date || dbData.project?.wedding_date || "2027-12-28";

  const formatDateDisplay = (dateStr?: string | null) => {
    try {
      if (!dateStr) return "Minggu, 28 Desember 2027";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Minggu, 28 Desember 2027";
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return "Minggu, 28 Desember 2027";
    }
  };

  const formattedDate = dbData.project?.wedding_date ? formatDateDisplay(weddingDateRaw) : "Minggu, 28 Desember 2027";

  return (
    <main className="min-h-[100dvh] md:h-[100dvh] w-full flex flex-col md:flex-row bg-[#F4ECE3] text-[#3C2A21] md:overflow-hidden relative font-sans">
      
      {/* Left side Desktop 2-Column Cover (Hidden on mobile, Fixed on Desktop) */}
      <aside className="hidden md:flex relative md:w-[60%] lg:w-[65%] xl:w-[68%] md:h-[100dvh] shrink-0 items-center justify-center overflow-hidden bg-[#F4ECE3] border-r border-[#5C4E43]/20 select-none">
        {/* Layer 1: Watercolor texture background (Seamless, No repeat) */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 select-none bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/template/assets/eks-01-bg-01.jpg')" }}
        />

        {/* 4 Precise Floral Leaf Corners (100% matched to the.invisimple.id/s01) */}
        {/* Top-Left: natural orientation */}
        <div className="absolute top-0 left-0 pointer-events-none z-10 select-none animate-floral-tl">
          <img 
            src="/template/assets/asset-01-01.png" 
            alt="Floral" 
            className="w-48 md:w-56 lg:w-64 xl:w-72 h-auto object-contain select-none" 
          />
        </div>

        {/* Top-Right: flipped horizontally */}
        <div className="absolute top-0 right-0 pointer-events-none z-10 select-none animate-floral-tr">
          <img 
            src="/template/assets/asset-01-01.png" 
            alt="Floral" 
            className="w-48 md:w-56 lg:w-64 xl:w-72 h-auto object-contain select-none scale-x-[-1]" 
          />
        </div>

        {/* Bottom-Left: flipped vertically */}
        <div className="absolute bottom-0 left-0 pointer-events-none z-10 select-none animate-floral-bl">
          <img 
            src="/template/assets/asset-01-01.png" 
            alt="Floral" 
            className="w-48 md:w-56 lg:w-64 xl:w-72 h-auto object-contain select-none scale-y-[-1]" 
          />
        </div>

        {/* Bottom-Right: flipped horizontally and vertically */}
        <div className="absolute bottom-0 right-0 pointer-events-none z-10 select-none animate-floral-br">
          <img 
            src="/template/assets/asset-01-01.png" 
            alt="Floral" 
            className="w-48 md:w-56 lg:w-64 xl:w-72 h-auto object-contain select-none scale-x-[-1] scale-y-[-1]" 
          />
        </div>

        {/* Vertical Scroll Indicator on Right Border (Matches s01: scroll then arrow down) */}
        <LeftScrollIndicator />

        {/* Center Typography (Clean layout matching s01) */}
        <div className="relative z-20 text-center select-none px-6 space-y-3">
          <p className="text-xs lg:text-sm font-semibold tracking-[0.35em] uppercase text-[#7A6A5E]">
            THE WEDDING OF
          </p>

          <h1 className="font-sr-script text-6xl md:text-7xl lg:text-8xl text-[#5C4E43] leading-tight font-normal drop-shadow-xs my-2">
            {brideNickname} &amp; {groomNickname}
          </h1>

          <p className="text-sm lg:text-base font-medium text-[#7A6A5E] tracking-wider">
            {formattedDate}
          </p>
        </div>
      </aside>

      {/* Right side: Mobile-style Invitation Scrollable Container */}
      <RightSidebar 
        guestName={guestName} 
        guest={dbData.guest}
        project={dbData.project}
        events={dbData.events}
        wishes={dbData.wishes}
        stats={dbData.stats}
      />
      
    </main>
  );
}
