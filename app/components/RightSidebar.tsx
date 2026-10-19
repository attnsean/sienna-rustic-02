"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Heart, 
  Camera, 
  Gift, 
  MessageCircle, 
  Home, 
  Copy, 
  Check, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Send, 
  X
} from "lucide-react";
import { DbGuest, DbProject, DbEvent, DbWish } from "../../lib/resolveProject";
import { supabase } from "../../lib/supabase";

const InstagramIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

// Reusable 4-Corner Floral Leaves with gentle anchored breathing pulse
const SectionFloralCorners = ({ 
  size = "w-24 sm:w-28 md:w-32" 
}: { 
  size?: string;
}) => (
  <>
    <div className="absolute -top-1 -left-1 pointer-events-none z-10 select-none animate-floral-tl">
      <img 
        src="/template/assets/asset-01-01.png" 
        alt="" 
        aria-hidden="true"
        className={`${size} pointer-events-none select-none`} 
      />
    </div>
    <div className="absolute -top-1 -right-1 pointer-events-none z-10 select-none animate-floral-tr">
      <img 
        src="/template/assets/asset-01-01.png" 
        alt="" 
        aria-hidden="true"
        className={`${size} scale-x-[-1] pointer-events-none select-none`} 
      />
    </div>
    <div className="absolute -bottom-1 -left-1 pointer-events-none z-10 select-none animate-floral-bl">
      <img 
        src="/template/assets/asset-01-01.png" 
        alt="" 
        aria-hidden="true"
        className={`${size} scale-y-[-1] pointer-events-none select-none`} 
      />
    </div>
    <div className="absolute -bottom-1 -right-1 pointer-events-none z-10 select-none animate-floral-br">
      <img 
        src="/template/assets/asset-01-01.png" 
        alt="" 
        aria-hidden="true"
        className={`${size} scale-x-[-1] scale-y-[-1] pointer-events-none select-none`} 
      />
    </div>
  </>
);

// ==========================================
// SCROLL-TRIGGERED TEXT ANIMATION HELPER
// ==========================================
interface AnimatedLine {
  text: string;
  className?: string;
  accentChar?: string;
  accentClassName?: string;
}

interface ScrollAnimatedTitleProps {
  lines: (string | AnimatedLine)[];
  className?: string;
}

const scrollTitleContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
};

const scrollCharVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.85,
    rotate: -3,
    transition: { duration: 0.25, ease: "easeIn" as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      damping: 14,
      stiffness: 140,
    },
  },
};

function ScrollAnimatedTitle({ lines, className = "" }: ScrollAnimatedTitleProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.3 }}
      variants={scrollTitleContainerVariants}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className={`flex flex-col items-center justify-center select-none py-1 cursor-default ${className}`}
    >
      {lines.map((lineItem, lIdx) => {
        const item: AnimatedLine = typeof lineItem === "string" ? { text: lineItem } : lineItem;
        const chars = Array.from(item.text);
        return (
          <div key={lIdx} className={`flex items-center justify-center leading-none ${item.className || ""}`}>
            {chars.map((char, cIdx) => {
              const isAccent = item.accentChar && char === item.accentChar;
              return (
                <motion.span
                  key={cIdx}
                  variants={scrollCharVariants}
                  className={`inline-block ${isAccent ? (item.accentClassName || "text-[#7A6A5E]") : ""}`}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              );
            })}
          </div>
        );
      })}
    </motion.div>
  );
}

interface Props {
  guestName: string;
  guest?: DbGuest | null;
  project?: DbProject | null;
  events?: DbEvent[] | null;
  wishes?: DbWish[] | null;
  stats?: {
    attending: number;
    wishes: number;
  };
}

export default function RightSidebar({ 
  guestName, 
  guest, 
  project, 
  events, 
  wishes: initialWishes,
  stats
}: Props) {
  const [isOpened, setIsOpened] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [activeNav, setActiveNav] = useState("hero");
  const [showGiftDetails, setShowGiftDetails] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form states for RSVP & Wishes
  const [formName, setFormName] = useState(guestName !== "Tamu Undangan" ? guestName : "");
  const [formMessage, setFormMessage] = useState("");
  const [formAttendance, setFormAttendance] = useState<"attending" | "declined">("attending");
  const [formGuestCount, setFormGuestCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [wishesList, setWishesList] = useState<Array<{ id: string; name: string; message: string; created_at: string; is_attending?: boolean }>>([
    {
      id: "w-1",
      name: "Dyana Sartika R",
      message: "Selamat untuk Putri & Putra! Semoga menjadi keluarga yang sakinah, mawaddah, warahmah.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      is_attending: true
    },
    {
      id: "w-2",
      name: "soul angel",
      message: "Bismillah wishlist, bagus banget Masya Allah, semoga lancar acaranya sampai hari H! Doain ya teman-teman aku dan calon ku lancar luas rezeki agar kami bisa menikah, Aamiin",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      is_attending: true
    },
    {
      id: "w-3",
      name: "Fazaaa",
      message: "Bagusss banget undangannya, selamat menempuh hidup baru kalian berdua ❤️🥰",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      is_attending: true
    },
    {
      id: "w-4",
      name: "DINDA",
      message: "BINGUNG PILIH NYA, BAGUS SEMUA 😭 Lancar ya acaranya!",
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      is_attending: false
    }
  ]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dynamic names & photos
  const brideNickname = project?.bride_nickname || "Putri";
  const groomNickname = project?.groom_nickname || "Putra";
  const brideFull = project?.bride_name || "Putri Cantika Sari";
  const groomFull = project?.groom_name || "Putra Andika Pratama";
  const brideParents = project?.bride_father && project?.bride_mother 
    ? `Putri Pertama Dari Bapak ${project.bride_father} Dan Ibu ${project.bride_mother}`
    : "Putri Pertama Dari Bapak Herman Dan Ibu Afriva";
  const groomParents = project?.groom_father && project?.groom_mother
    ? `Putra Pertama Dari Bapak ${project.groom_father} Dan Ibu ${project.groom_mother}`
    : "Putra Pertama Dari Bapak Herman Dan Ibu Afriva";
  const brideIg = project?.bride_instagram || "putricantika";
  const groomIg = project?.groom_instagram || "putrandika";

  const coverPhoto = project?.cover_photo_url || project?.opening_photo_url || "/template/assets/Savethedate-2.jpg";
  const bridePhoto = project?.bride_photo_url || "/template/assets/Bride.jpg";
  const groomPhoto = project?.groom_photo_url || "/template/assets/Groom.jpg";
  const musicSrc = project?.music_url || "/template/assets/Komang-Raim-Laode.mp3";

  // Events (Akad & Resepsi)
  const akadEvent = events?.find(e => e.event_type?.toLowerCase().includes("akad") || e.custom_label?.toLowerCase().includes("akad")) || events?.[0] || null;
  const resepsiEvent = events?.find(e => e.event_type?.toLowerCase().includes("resepsi") || e.custom_label?.toLowerCase().includes("resepsi")) || (events && events.length > 1 ? events[1] : null) || null;

  const parseEventDate = (dateStr?: string | null) => {
    const d = dateStr ? new Date(dateStr) : new Date("2027-12-28");
    const valid = !isNaN(d.getTime());
    const finalDate = valid ? d : new Date("2027-12-28");
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return {
      day: days[finalDate.getDay()],
      date: String(finalDate.getDate()),
      year: String(finalDate.getFullYear()),
      month: months[finalDate.getMonth()]
    };
  };

  const akadCal = parseEventDate(akadEvent?.event_date);
  const resepsiCal = parseEventDate(resepsiEvent?.event_date || akadEvent?.event_date);

  const akadTime = akadEvent?.event_time ? `${akadEvent.event_time}${akadEvent.end_time ? ` - ${akadEvent.end_time}` : ""} WIB` : "08:00 WIB";
  const akadVenue = akadEvent?.venue_name || "Menara 165";
  const akadAddress = akadEvent?.venue_address || "Jl. TB Simatupang No.Kav. 1, Cilandak Tim., Ps. Minggu, Kota Jakarta Selatan";
  const akadMaps = akadEvent?.venue_maps_url || "https://maps.google.com/?q=Menara+165+Jakarta";

  const resepsiTime = resepsiEvent?.event_time ? `${resepsiEvent.event_time}${resepsiEvent.end_time ? ` - ${resepsiEvent.end_time}` : ""} WIB` : "11:00 - Selesai WIB";
  const resepsiVenue = resepsiEvent?.venue_name || "Menara 165";
  const resepsiAddress = resepsiEvent?.venue_address || "Jl. TB Simatupang No.Kav. 1, Cilandak Tim., Ps. Minggu, Kota Jakarta Selatan";
  const resepsiMaps = resepsiEvent?.venue_maps_url || "https://maps.google.com/?q=Menara+165+Jakarta";

  // Target Wedding Date Countdown
  const countdownDateRaw = project?.countdown_target || project?.wedding_date || akadEvent?.event_date || "2027-12-28T08:00:00";
  const targetDate = new Date(countdownDateRaw.includes("T") ? countdownDateRaw : `${countdownDateRaw}T08:00:00`).getTime();
  const [timeLeft, setTimeLeft] = useState({
    days: "436",
    hours: "02",
    minutes: "01",
    seconds: "05"
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({
          days: String(days).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0")
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Supabase wishes
  useEffect(() => {
    if (initialWishes && initialWishes.length > 0) {
      setWishesList(
        initialWishes.map((w: any) => ({
          id: w.id || String(Math.random()),
          name: w.name || "Tamu Undangan",
          message: w.message || "",
          created_at: w.created_at || new Date().toISOString(),
          is_attending: w.is_attending ?? true
        }))
      );
    }
  }, [initialWishes]);

  // Lock scroll completely on body & window while invitation is not yet opened
  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpened]);

  // Open invitation handler
  const handleOpenInvitation = () => {
    setIsOpened(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sr:open"));
    }
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch((e) => {
        console.warn("Audio autoplay blocked by browser policy:", e);
      });
    }
  };

  // Toggle music
  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play();
      setIsPlayingMusic(true);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Submit wish
  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formMessage.trim()) return;

    setIsSubmitting(true);
    const newWish = {
      id: "w-" + Date.now(),
      name: formName.trim(),
      message: formMessage.trim(),
      created_at: new Date().toISOString(),
      is_attending: formAttendance === "attending"
    };

    try {
      if (project?.id) {
        await supabase.from("guestbook_entries").insert({
          project_id: project.id,
          name: formName.trim(),
          message: formMessage.trim(),
          is_approved: true
        });

        await supabase.from("rsvp").upsert({
          project_id: project.id,
          guest_id: guest?.id || null,
          guest_name: formName.trim(),
          is_attending: formAttendance === "attending",
          pax_count: formGuestCount
        });
      }
    } catch (err) {
      console.warn("Supabase wish insert fallback to local:", err);
    }

    setWishesList((prev) => [newWish, ...prev]);
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setFormMessage("");
    setTimeout(() => setSubmitSuccess(false), 4000);
  };

  // Gallery photos (R2 storage sync with fallback to default demo images)
  const defaultGallery = [
    "/template/assets/5.jpeg",
    "/template/assets/6.jpeg",
    "/template/assets/7.jpeg",
    "/template/assets/8.jpg",
    "/template/assets/IMG_7981.jpg",
    "/template/assets/Savethedate-2.jpg",
    "/template/assets/1-3.jpeg",
    "/template/assets/3.jpeg",
    "/template/assets/4.jpeg",
    "/template/assets/Resepsi-1-1.jpg"
  ];
  const dbGallery = (project?.gallery_photos && Array.isArray(project.gallery_photos) && project.gallery_photos.length > 0)
    ? project.gallery_photos.map(p => typeof p === "string" ? p : p?.url || p?.public_url || "").filter(Boolean)
    : [];
  const galleryPhotos = dbGallery.length > 0 ? dbGallery : defaultGallery;

  const scrollToSection = (id: string) => {
    setActiveNav(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full md:w-[40%] lg:w-[35%] xl:w-[32%] h-[100dvh] ${
        isOpened ? "overflow-y-auto" : "overflow-hidden"
      } no-scrollbar bg-[#F4ECE3] text-[#3C2A21] select-none`}
      style={{
        backgroundImage: "url('/template/assets/eks-01-bg-01.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Background Audio */}
      <audio ref={audioRef} src={musicSrc} loop preload="auto" />

      {/* ========================================================
          COVER SECTION (Visible on load before opening)
         ======================================================== */}
      <AnimatePresence>
        {!isOpened && (
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1] }}
            className="absolute inset-0 z-50 h-[100dvh] max-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#F4ECE3]"
            style={{
              backgroundImage: "url('/template/assets/eks-01-bg-01.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "top center",
              backgroundRepeat: "no-repeat"
            }}
          >
            {/* Top Floral Leaves */}
            <div className="absolute -top-1 -left-1 pointer-events-none z-10 select-none animate-floral-tl">
              <img 
                src="/template/assets/asset-01-01.png" 
                alt="Floral" 
                className="w-28 sm:w-32 md:w-36 pointer-events-none select-none" 
              />
            </div>
            <div className="absolute -top-1 -right-1 pointer-events-none z-10 select-none animate-floral-tr">
              <img 
                src="/template/assets/asset-01-01.png" 
                alt="Floral" 
                className="w-28 sm:w-32 md:w-36 scale-x-[-1] pointer-events-none select-none" 
              />
            </div>

            {/* Top Half Arch Photo Frame */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-full flex justify-center pt-8 sm:pt-10 px-6 shrink-0"
            >
              <div className="relative w-48 sm:w-56 aspect-[3/4] max-h-[42vh] rounded-t-full overflow-hidden shadow-2xl border-4 border-white/90 bg-white/40">
                <img 
                  src={coverPhoto} 
                  alt="Wedding Couple" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>

            {/* Bottom Floral Leaves */}
            <div className="absolute -bottom-1 -left-1 pointer-events-none z-10 select-none animate-floral-bl">
              <img 
                src="/template/assets/asset-01-01.png" 
                alt="Floral" 
                className="w-28 sm:w-32 md:w-36 scale-y-[-1] pointer-events-none select-none" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 pointer-events-none z-10 select-none animate-floral-br">
              <img 
                src="/template/assets/asset-01-01.png" 
                alt="Floral" 
                className="w-28 sm:w-32 md:w-36 scale-x-[-1] scale-y-[-1] pointer-events-none select-none" 
              />
            </div>

            {/* Bottom Half Invitation Details & Buka Undangan Button */}
            <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 pb-12 pt-2 space-y-3.5">
              <motion.p 
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[11px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-[#7A6A5E]"
              >
                THE WEDDING OF
              </motion.p>

              <motion.h1 
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.35, type: "spring", damping: 14 }}
                className="font-sr-script text-5xl sm:text-6xl text-[#5C4E43] leading-none my-1 font-normal"
              >
                {brideNickname} &amp; {groomNickname}
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="space-y-1 pt-2"
              >
                <p className="text-xs text-[#7A6A5E]">Kepada Yth.</p>
                <p className="text-xs text-[#7A6A5E]">Bapak/Ibu/Saudara/i</p>
                <motion.div 
                  whileHover={{ scale: 1.04 }}
                  className="px-6 py-2 rounded-2xl bg-white/75 backdrop-blur-xs border border-[#5C4E43]/15 shadow-xs mt-1.5 inline-block"
                >
                  <span className="text-base sm:text-lg font-bold text-[#3C2A21] tracking-wide block">
                    {guestName}
                  </span>
                </motion.div>
              </motion.div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="text-[10px] sm:text-[11px] italic text-[#99887C] max-w-xs pt-1 leading-snug"
              >
                *Mohon maaf jika ada kesalahan dalam penulisan nama / gelar.
              </motion.p>

              <motion.button 
                type="button"
                onClick={handleOpenInvitation}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring", damping: 15 }}
                className="mt-4 px-8 py-3 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all group hover:shadow-xl"
              >
                <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Buka Undangan</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MAIN INVITATION CONTENT (Revealed underneath smoothly)
         ======================================================== */}
      <div className={`relative z-10 space-y-12 pb-32 pt-2 transition-opacity duration-1000 ${
        isOpened ? "opacity-100" : "hidden pointer-events-none"
      }`}>

        {/* 1. HERO / SAVE THE DATE SECTION */}
        <section id="hero" className="relative min-h-[100dvh] flex flex-col items-center justify-between px-6 pt-12 pb-16 text-center overflow-hidden">
          <SectionFloralCorners size="w-28 sm:w-32 md:w-36" />

          {/* Subtitle */}
          <div className="space-y-2 mt-4">
            <ScrollAnimatedTitle 
              lines={[{ text: "THE WEDDING OF", className: "text-xs font-semibold tracking-[0.3em] uppercase text-[#7A6A5E]" }]} 
            />
          </div>

          {/* Circular Framed Photo with Smooth Floating Pulse */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 25 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, type: "spring", damping: 15 }}
            className="relative my-4"
          >
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              whileHover={{ scale: 1.05 }}
              className="w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden p-1.5 bg-gradient-to-tr from-[#5C4E43]/30 via-white to-[#5C4E43]/40 shadow-xl border-4 border-white/90"
            >
              <img 
                src="/template/assets/Savethedate-2.jpg" 
                alt="Couple" 
                className="w-full h-full object-cover rounded-full" 
              />
            </motion.div>
          </motion.div>

          {/* Names & Date */}
          <div className="space-y-2">
            <ScrollAnimatedTitle 
              lines={[{ text: `${brideNickname} & ${groomNickname}`, className: "font-sr-script text-4xl sm:text-5xl text-[#5C4E43] leading-tight" }]} 
            />
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xs sm:text-sm font-medium text-[#7A6A5E] tracking-wider"
            >
              Minggu, 28 Desember 2027
            </motion.p>
          </div>

          {/* Countdown Boxes with Staggered Spring Pop */}
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-xs my-2"
          >
            {[
              { val: timeLeft.days, label: "Hari" },
              { val: timeLeft.hours, label: "Jam" },
              { val: timeLeft.minutes, label: "Menit" },
              { val: timeLeft.seconds, label: "Detik" }
            ].map((box, bIdx) => (
              <motion.div 
                key={box.label}
                initial={{ scale: 0.7, opacity: 0, y: 18 }}
                whileInView={{ scale: 1, opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                transition={{ 
                  delay: bIdx * 0.08,
                  type: "spring",
                  damping: 14,
                  stiffness: 140
                }}
                whileHover={{ scale: 1.08, y: -3 }}
                className="bg-[#5C4E43] text-white rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center cursor-default"
              >
                <span className="text-xl sm:text-2xl font-bold font-mono">{box.val}</span>
                <span className="text-[10px] sm:text-xs text-[#E8DFD8] uppercase tracking-wider font-medium">{box.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Save The Date Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.a 
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=The+Wedding+of+Putri+%26+Putra&dates=20271228T010000Z/20271228T080000Z&details=Undangan+Pernikahan+Putri+%26+Putra&location=Menara+165+Jakarta"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Simpan Tanggal</span>
            </motion.a>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="pt-2"
          >
            <ChevronDown className="w-5 h-5 text-[#5C4E43]/60 mx-auto" />
          </motion.div>
        </section>

        {/* 2. QUOTE / AYAT SUCI SECTION */}
        <section className="px-4">
          <motion.div 
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.25 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="bg-[#5C4E43] text-white p-7 sm:p-9 rounded-3xl shadow-xl text-center space-y-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-xs sm:text-sm leading-relaxed font-light italic text-[#F4ECE3] max-w-sm mx-auto"
            >
              &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.&rdquo;
            </motion.p>

            <motion.p 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase"
            >
              Q.S Ar-Rum : 21
            </motion.p>
          </motion.div>
        </section>

        {/* 3. MEMPELAI (COUPLE PROFILE) SECTION */}
        <motion.section 
          id="mempelai" 
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.8 }}
          className="relative px-6 py-10 text-center space-y-8 bg-white/40 backdrop-blur-xs rounded-3xl mx-3 border border-white/60 shadow-xs overflow-hidden"
        >
          <SectionFloralCorners />
          
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 pt-2"
          >
            <h3 className="text-xs sm:text-sm font-bold text-[#5C4E43] tracking-wide">
              Assalamu’alaikum Warahmatullahi Wabarakatuh
            </h3>
            <p className="text-xs text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
              Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu tercurah mengiringi pernikahan kami.
            </p>
          </motion.div>

          {/* Mempelai Wanita */}
          <motion.div 
            initial={{ opacity: 0, x: -30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, type: "spring", damping: 16 }}
            className="space-y-3 flex flex-col items-center"
          >
            <motion.div 
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-36 h-36 rounded-full overflow-hidden p-1 bg-white shadow-lg border-2 border-[#5C4E43]/20"
            >
              <img 
                src={bridePhoto} 
                alt={brideFull} 
                className="w-full h-full object-cover rounded-full transition-transform duration-500" 
              />
            </motion.div>
            <ScrollAnimatedTitle 
              lines={[{ text: brideFull, className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43] leading-none pt-1" }]} 
            />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-xs text-[#7A6A5E] max-w-xs leading-relaxed"
            >
              {brideParents}
            </motion.p>
            {brideIg && (
              <motion.a 
                href={`https://instagram.com/${brideIg}`} 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5C4E43] text-white rounded-full text-[11px] font-medium shadow-xs hover:bg-[#4a3e35] transition-all"
              >
                <InstagramIcon className="w-3 h-3" />
                <span>@{brideIg}</span>
              </motion.a>
            )}
          </motion.div>

          {/* Romantic Ampersand Separator */}
          <motion.div 
            initial={{ scale: 0.6, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ type: "spring", damping: 12, stiffness: 150 }}
            className="font-sr-script text-4xl text-[#5C4E43]/80 my-2"
          >
            &amp;
          </motion.div>

          {/* Mempelai Pria */}
          <motion.div 
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, type: "spring", damping: 16 }}
            className="space-y-3 flex flex-col items-center"
          >
            <motion.div 
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="w-36 h-36 rounded-full overflow-hidden p-1 bg-white shadow-lg border-2 border-[#5C4E43]/20"
            >
              <img 
                src={groomPhoto} 
                alt={groomFull} 
                className="w-full h-full object-cover rounded-full transition-transform duration-500" 
              />
            </motion.div>
            <ScrollAnimatedTitle 
              lines={[{ text: groomFull, className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43] leading-none pt-1" }]} 
            />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-xs text-[#7A6A5E] max-w-xs leading-relaxed"
            >
              {groomParents}
            </motion.p>
            {groomIg && (
              <motion.a 
                href={`https://instagram.com/${groomIg}`} 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5C4E43] text-white rounded-full text-[11px] font-medium shadow-xs hover:bg-[#4a3e35] transition-all"
              >
                <InstagramIcon className="w-3 h-3" />
                <span>@{groomIg}</span>
              </motion.a>
            )}
          </motion.div>
        </motion.section>

        {/* 4. ACARA (EVENTS: AKAD & RESEPSI) SECTION */}
        <section id="acara" className="space-y-6 px-4">
          
          {/* Akad Card (Slide from left) */}
          <motion.div 
            initial={{ opacity: 0, x: -35, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.7, type: "spring", damping: 16 }}
            className="relative p-7 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xs border border-white shadow-md text-center space-y-5 overflow-hidden"
          >
            <SectionFloralCorners size="w-20 sm:w-24" />

            <ScrollAnimatedTitle 
              lines={[{ text: "Akad Nikah", className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43]" }]} 
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-center gap-4 py-2 border-y border-[#5C4E43]/15"
            >
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider text-[#7A6A5E] block font-medium">{akadCal.day}</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#5C4E43] font-mono leading-none block">{akadCal.date}</span>
              </div>
              <div className="w-[1px] h-8 bg-[#5C4E43]/20" />
              <div className="text-left">
                <span className="text-xs uppercase tracking-wider text-[#7A6A5E] block font-medium">{akadCal.month}</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#5C4E43] font-mono leading-none block">{akadCal.year}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-1.5"
            >
              <p className="text-xs font-semibold text-[#5C4E43] flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5C4E43]" />
                <span>Pukul {akadTime}</span>
              </p>
              <p className="text-xs font-bold text-[#5C4E43] uppercase tracking-wide pt-1">
                {akadVenue}
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
                {akadAddress}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-2 pt-1"
            >
              <motion.a 
                href={akadMaps} 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-xs transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </motion.a>
              <motion.a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Akad+Nikah+Putri+%26+Putra&dates=20271228T010000Z/20271228T030000Z&details=Akad+Nikah&location=${encodeURIComponent(akadVenue)}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F4ECE3] hover:bg-[#e8ded3] text-[#5C4E43] rounded-full text-xs font-semibold shadow-xs transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Kalender</span>
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Resepsi Card (Slide from right) */}
          <motion.div 
            initial={{ opacity: 0, x: 35, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.7, type: "spring", damping: 16, delay: 0.1 }}
            className="relative p-7 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xs border border-white shadow-md text-center space-y-5 overflow-hidden"
          >
            <SectionFloralCorners size="w-20 sm:w-24" />

            <ScrollAnimatedTitle 
              lines={[{ text: "Resepsi Pernikahan", className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43]" }]} 
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-center gap-4 py-2 border-y border-[#5C4E43]/15"
            >
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider text-[#7A6A5E] block font-medium">{resepsiCal.day}</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#5C4E43] font-mono leading-none block">{resepsiCal.date}</span>
              </div>
              <div className="w-[1px] h-8 bg-[#5C4E43]/20" />
              <div className="text-left">
                <span className="text-xs uppercase tracking-wider text-[#7A6A5E] block font-medium">{resepsiCal.month}</span>
                <span className="text-2xl sm:text-3xl font-bold text-[#5C4E43] font-mono leading-none block">{resepsiCal.year}</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-1.5"
            >
              <p className="text-xs font-semibold text-[#5C4E43] flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5C4E43]" />
                <span>Pukul {resepsiTime}</span>
              </p>
              <p className="text-xs font-bold text-[#5C4E43] uppercase tracking-wide pt-1">
                {resepsiVenue}
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
                {resepsiAddress}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-2 pt-1"
            >
              <motion.a 
                href={resepsiMaps} 
                target="_blank" 
                rel="noopener noreferrer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-xs transition-all"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </motion.a>
              <motion.a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Resepsi+Putri+%26+Putra&dates=20271228T040000Z/20271228T070000Z&details=Resepsi+Pernikahan&location=${encodeURIComponent(resepsiVenue)}`}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F4ECE3] hover:bg-[#e8ded3] text-[#5C4E43] rounded-full text-xs font-semibold shadow-xs transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Kalender</span>
              </motion.a>
            </motion.div>
          </motion.div>

        </section>

        {/* 5. COUNTDOWN BANNER SECTION */}
        <section className="px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="relative p-7 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xs border border-white shadow-md text-center space-y-4 overflow-hidden"
          >
            <SectionFloralCorners size="w-20 sm:w-24" />

            <ScrollAnimatedTitle 
              lines={[{ text: "Hitung Mundur Acara", className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43]" }]} 
            />
            <p className="text-xs text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
              Menghitung hari menuju ikatan suci pernikahan kami.
            </p>

            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-xs mx-auto pt-2">
              {[
                { val: timeLeft.days, label: "Hari" },
                { val: timeLeft.hours, label: "Jam" },
                { val: timeLeft.minutes, label: "Menit" },
                { val: timeLeft.seconds, label: "Detik" }
              ].map((box, bIdx) => (
                <motion.div 
                  key={box.label}
                  initial={{ scale: 0.75, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: false, amount: 0.2 }}
                  transition={{ delay: bIdx * 0.08, type: "spring", damping: 14 }}
                  whileHover={{ scale: 1.08 }}
                  className="bg-[#5C4E43] text-white rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center"
                >
                  <span className="text-xl sm:text-2xl font-bold font-mono">{box.val}</span>
                  <span className="text-[10px] sm:text-xs text-[#E8DFD8] uppercase tracking-wider font-medium">{box.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* 6. LOVE STORY SECTION */}
        <section className="relative px-4 py-8 space-y-6 overflow-hidden">
          <SectionFloralCorners />
          
          <div className="text-center space-y-1">
            <ScrollAnimatedTitle 
              lines={[{ text: "Love Story", className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43]" }]} 
            />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              className="text-[11px] text-[#7A6A5E] tracking-wider uppercase font-medium"
            >
              Kisah Perjalanan Cinta Kami
            </motion.p>
          </div>

          <div className="relative pl-6 space-y-6 border-l-2 border-[#5C4E43]/20 ml-4">
            
            {/* Story 1 (Slide from left) */}
            <motion.div 
              initial={{ opacity: 0, x: -35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, type: "spring", damping: 16 }}
              whileHover={{ scale: 1.02 }}
              className="relative space-y-3 bg-white/75 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white shadow-xs"
            >
              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-[#5C4E43] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-xs">
                <img src="/template/assets/1-3.jpeg" alt="Story 1" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="text-xs font-bold text-[#5C4E43] tracking-wider uppercase">
                25 AGUSTUS 2023
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Berawal dari tempat pekerjaan Cianjur-2023, kami mengenal satu sama lain dan belum ada benih cinta kala itu, hanya sebatas rekan kerja yang saling bertukar sapa.
              </p>
            </motion.div>

            {/* Story 2 (Slide from right) */}
            <motion.div 
              initial={{ opacity: 0, x: 35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, type: "spring", damping: 16 }}
              whileHover={{ scale: 1.02 }}
              className="relative space-y-3 bg-white/75 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white shadow-xs"
            >
              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-[#5C4E43] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-xs">
                <img src="/template/assets/3.jpeg" alt="Story 2" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="text-xs font-bold text-[#5C4E43] tracking-wider uppercase">
                03 JUNI 2024
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Setelah cukup mengenal satu sama lain, selama satu tahun kurang lebih kami menjalin hubungan dan menemukan kecocokan dalam visi serta komitmen hidup.
              </p>
            </motion.div>

            {/* Story 3 (Slide from left) */}
            <motion.div 
              initial={{ opacity: 0, x: -35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.7, type: "spring", damping: 16 }}
              whileHover={{ scale: 1.02 }}
              className="relative space-y-3 bg-white/75 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white shadow-xs"
            >
              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-[#5C4E43] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-xs">
                <img src="/template/assets/4.jpeg" alt="Story 3" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <p className="text-xs font-bold text-[#5C4E43] tracking-wider uppercase">
                MENUJU PELAMINAN
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Dengan ridho kedua orang tua dan sanak keluarga, kami memantapkan langkah menuju ikatan pernikahan yang suci untuk saling menyempurnakan seumur hidup.
              </p>
            </motion.div>

          </div>
        </section>

        {/* 7. OUR MOMENTS (GALLERY & VIDEO) SECTION */}
        <section id="galeri" className="relative px-4 py-8 space-y-6 overflow-hidden">
          <SectionFloralCorners />
          
          <div className="text-center space-y-1">
            <ScrollAnimatedTitle 
              lines={[{ text: "Our Moments", className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43]" }]} 
            />
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              className="text-[11px] text-[#7A6A5E] tracking-wider uppercase font-medium"
            >
              Momen Indah &amp; Kenangan Manis
            </motion.p>
          </div>

          {/* YouTube Embed Player */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, type: "spring", damping: 16 }}
            className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg border-2 border-white"
          >
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&rel=0"
              title="Wedding Moments Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>

          {/* 2-Column Photo Grid with Staggered Spring Pop */}
          <div className="grid grid-cols-2 gap-3">
            {galleryPhotos.map((src, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ 
                  delay: (i % 4) * 0.08,
                  type: "spring",
                  damping: 15,
                  stiffness: 130
                }}
                whileHover={{ scale: 1.04 }}
                onClick={() => setSelectedImage(src)}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xs border border-white cursor-pointer group bg-slate-100"
              >
                <img 
                  src={src} 
                  alt={`Moment ${i + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white drop-shadow-md" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 8. WEDDING GIFT / AMPLOP DIGITAL SECTION */}
        <section id="gift" className="px-4">
          <motion.div 
            initial={{ opacity: 0, y: 35, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="bg-[#5C4E43] text-white p-7 sm:p-9 rounded-3xl shadow-xl text-center space-y-5 relative overflow-hidden"
          >
            <div className="space-y-2">
              <ScrollAnimatedTitle 
                lines={[{ text: "Wedding Gift", className: "font-sr-script text-3xl sm:text-4xl text-white" }]} 
              />
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                className="text-xs text-[#E8DFD8] leading-relaxed max-w-sm mx-auto"
              >
                Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, Anda dapat memberi melalui informasi di bawah ini.
              </motion.p>
            </div>

            <div>
              <motion.button 
                type="button"
                onClick={() => setShowGiftDetails(!showGiftDetails)}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#5C4E43] hover:bg-[#F4ECE3] rounded-full text-xs font-bold shadow-md cursor-pointer transition-all hover:shadow-lg"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{showGiftDetails ? "Tutup Rekening" : "Klik di Sini"}</span>
              </motion.button>
            </div>

            {/* Bank Cards Accordion */}
            <AnimatePresence>
              {showGiftDetails && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4 pt-4 text-left overflow-hidden"
                >
                  {project?.payment_accounts && Array.isArray(project.payment_accounts) && project.payment_accounts.length > 0 ? (
                    project.payment_accounts.map((acc: any, idx: number) => {
                      const bankName = (acc.bank_name || acc.bank || "Bank").toUpperCase();
                      const accNumber = acc.account_number || acc.number || acc.rekening || "";
                      const accHolder = acc.account_holder || acc.name || acc.holder || "";
                      const key = `acc-${idx}`;
                      return (
                        <motion.div 
                          key={key} 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ y: -2 }}
                          className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 relative space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-[#5C4E43] tracking-wide">{bankName}</span>
                            <img src="/template/assets/chip-ilustration.png" alt="Chip" className="h-6 w-auto object-contain opacity-80" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-[#7A6A5E] uppercase font-bold tracking-wider">No. Rekening</span>
                            <p className="font-mono text-base font-bold text-[#3C2A21] tracking-wider">{accNumber}</p>
                          </div>
                          <p className="text-xs font-medium text-[#5C4E43]">a.n. {accHolder}</p>
                          <motion.button 
                            type="button"
                            onClick={() => handleCopy(accNumber, key)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="w-full py-2 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          >
                            {copiedKey === key ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Berhasil Disalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin No. Rekening</span>
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      );
                    })
                  ) : (
                    <>
                      {/* BCA Card Default */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -2 }}
                        className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 relative space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <img src="/template/assets/bca-150x50.png" alt="BCA" className="h-6 w-auto object-contain" />
                          <img src="/template/assets/chip-ilustration.png" alt="Chip" className="h-6 w-auto object-contain opacity-80" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#7A6A5E] uppercase font-bold tracking-wider">No. Rekening</span>
                          <p className="font-mono text-base font-bold text-[#3C2A21] tracking-wider">123123123</p>
                        </div>
                        <p className="text-xs font-medium text-[#5C4E43]">a.n. Putri Cantika Sara</p>
                        <motion.button 
                          type="button"
                          onClick={() => handleCopy("123123123", "bca")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-2 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          {copiedKey === "bca" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Berhasil Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin No. Rekening</span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>

                      {/* BRI Card Default */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -2 }}
                        className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 relative space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <img src="/template/assets/bri-150x50.png" alt="BRI" className="h-6 w-auto object-contain" />
                          <img src="/template/assets/chip-ilustration.png" alt="Chip" className="h-6 w-auto object-contain opacity-80" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-[#7A6A5E] uppercase font-bold tracking-wider">No. Rekening</span>
                          <p className="font-mono text-base font-bold text-[#3C2A21] tracking-wider">321321321</p>
                        </div>
                        <p className="text-xs font-medium text-[#5C4E43]">a.n. Putra Andika Pratama</p>
                        <motion.button 
                          type="button"
                          onClick={() => handleCopy("321321321", "bri")}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-2 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          {copiedKey === "bri" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Berhasil Disalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin No. Rekening</span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    </>
                  )}

                  {/* Physical Gift Address */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 space-y-2"
                  >
                    <p className="text-xs font-bold text-[#5C4E43] flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5" /> Kirim Kado Fisik
                    </p>
                    <div className="text-xs space-y-1 text-[#7A6A5E]">
                      <p><strong className="text-[#3C2A21]">Penerima:</strong> Putri / Putra (+6285150000715)</p>
                      <p><strong className="text-[#3C2A21]">Alamat:</strong> Jl. Raya Cilandak KKO No.27, Jakarta Selatan</p>
                    </div>
                    <motion.button 
                      type="button"
                      onClick={() => handleCopy("Jl. Raya Cilandak KKO No.27, Jakarta Selatan (Penerima: Putri / Putra, +6285150000715)", "addr")}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-2 bg-[#F4ECE3] hover:bg-[#e8ded3] text-[#5C4E43] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedKey === "addr" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Alamat Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Alamat</span>
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* 9. UCAPAN & RSVP SECTION */}
        <section id="ucapan" className="px-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.75 }}
            className="relative p-7 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-xs border border-white shadow-md space-y-6 overflow-hidden"
          >
            <SectionFloralCorners />

            <div className="text-center space-y-1">
              <ScrollAnimatedTitle 
                lines={[{ text: "Ucapan & RSVP", className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43]" }]} 
              />
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.2 }}
                className="text-xs text-[#7A6A5E]"
              >
                Berikan doa dan ucapan terbaik untuk kami.
              </motion.p>
            </div>

            {/* Form */}
            <motion.form 
              onSubmit={handleSubmitWish} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.6 }}
              className="space-y-4 text-left"
            >
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#5C4E43] uppercase tracking-wider block">
                  Nama Anda *
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Bambang & Keluarga"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5C4E43]/20 bg-white/90 text-xs text-[#3C2A21] focus:ring-2 focus:ring-[#5C4E43] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#5C4E43] uppercase tracking-wider block">
                  Ucapan &amp; Doa *
                </label>
                <textarea 
                  rows={3}
                  required
                  placeholder="Tuliskan ucapan dan doa restu Anda..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5C4E43]/20 bg-white/90 text-xs text-[#3C2A21] focus:ring-2 focus:ring-[#5C4E43] focus:outline-none transition-all"
                />
              </div>

              {/* Attendance confirmation */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#5C4E43] uppercase tracking-wider block">
                  Konfirmasi Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAttendance("attending")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formAttendance === "attending"
                        ? "bg-[#5C4E43] text-white shadow-xs"
                        : "bg-white/80 text-[#7A6A5E] border border-[#5C4E43]/20"
                    }`}
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAttendance("declined")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formAttendance === "declined"
                        ? "bg-[#5C4E43] text-white shadow-xs"
                        : "bg-white/80 text-[#7A6A5E] border border-[#5C4E43]/20"
                    }`}
                  >
                    Tidak Hadir
                  </button>
                </div>
              </div>

              {formAttendance === "attending" && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-1"
                >
                  <label className="text-[11px] font-bold text-[#5C4E43] uppercase tracking-wider block">
                    Jumlah Tamu
                  </label>
                  <select
                    value={formGuestCount}
                    onChange={(e) => setFormGuestCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#5C4E43]/20 bg-white/90 text-xs text-[#3C2A21] focus:ring-2 focus:ring-[#5C4E43] focus:outline-none"
                  >
                    <option value={1}>1 Orang</option>
                    <option value={2}>2 Orang</option>
                  </select>
                </motion.div>
              )}

              {submitSuccess && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-medium"
                >
                  ✨ Terima kasih atas ucapan dan konfirmasi kehadiran Anda!
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Mengirim..." : "Kirim Ucapan"}</span>
              </motion.button>
            </motion.form>

            {/* Wishes List */}
            <div className="pt-4 border-t border-[#5C4E43]/15 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#5C4E43]">
                <span>{wishesList.length} Ucapan Tersimpan</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto no-scrollbar pr-1">
                {wishesList.map((w, wIdx) => (
                  <motion.div 
                    key={w.id} 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ delay: Math.min(wIdx * 0.05, 0.3), duration: 0.5 }}
                    className="p-3.5 rounded-2xl bg-white border border-[#5C4E43]/10 shadow-2xs space-y-1.5 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#5C4E43] text-white flex items-center justify-center text-[10px] font-bold">
                          {w.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#3C2A21] leading-none">{w.name}</p>
                          <span className="text-[9px] text-[#99887C] mt-0.5 block">
                            {new Date(w.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      {w.is_attending !== undefined && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          w.is_attending ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-500"
                        }`}>
                          {w.is_attending ? "Hadir" : "Tidak Hadir"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#7A6A5E] leading-relaxed pt-0.5">
                      {w.message}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        </section>

        {/* 10. CLOSING & FOOTER SECTION */}
        <section className="relative px-6 py-10 text-center space-y-6 overflow-hidden">
          <SectionFloralCorners />
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7, type: "spring", damping: 15 }}
            whileHover={{ scale: 1.06 }}
            className="w-36 h-36 rounded-full overflow-hidden mx-auto p-1 bg-white shadow-lg border-2 border-[#5C4E43]/20"
          >
            <img 
              src="/template/assets/IMG_7981.jpg" 
              alt="Couple" 
              className="w-full h-full object-cover rounded-full transition-transform duration-500" 
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="space-y-2 max-w-xs mx-auto"
          >
            <p className="text-xs text-[#7A6A5E] leading-relaxed">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.
            </p>
            <p className="text-xs font-bold text-[#5C4E43] pt-2">
              Wassalamu’alaikum Warahmatullahi Wabarakatuh
            </p>
            <p className="text-xs text-[#7A6A5E]">Kami yang berbahagia,</p>
            
            <ScrollAnimatedTitle 
              lines={[{ text: `${brideNickname} & ${groomNickname}`, className: "font-sr-script text-3xl sm:text-4xl text-[#5C4E43] pt-1" }]} 
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="pt-8 border-t border-[#5C4E43]/15 text-center space-y-1"
          >
            <p className="text-[10px] tracking-widest text-[#7A6A5E] uppercase font-bold">
              SERA STORY DIGITAL INVITATION
            </p>
            <p className="text-[9px] text-[#99887C]">
              Created with love for special moments
            </p>
          </motion.div>
        </section>

      </div>

      {/* Floating Vinyl Disc Music Button */}
      {isOpened && (
        <motion.button
          type="button"
          onClick={toggleMusic}
          aria-label="Toggle Music"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="fixed bottom-20 right-4 md:right-8 z-40 w-11 h-11 rounded-full bg-[#3C2A21] text-white flex items-center justify-center shadow-xl border-2 border-[#F4ECE3] cursor-pointer group"
        >
          <div className={`w-full h-full rounded-full flex items-center justify-center ${isPlayingMusic ? "animate-sr-spin" : ""}`}>
            <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center bg-[#5C4E43]">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
            {isPlayingMusic ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
          </div>
        </motion.button>
      )}

      {/* Sticky Bottom Navigation Bar */}
      {isOpened && (
        <motion.nav 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="fixed bottom-4 left-0 right-0 md:left-auto md:w-[40%] lg:w-[35%] xl:w-[32%] z-40 px-4 pointer-events-none flex justify-center"
        >
          <div className="pointer-events-auto bg-[#3C2A21]/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-1 sm:gap-2">
            {[
              { id: "hero", icon: Home, label: "Home" },
              { id: "mempelai", icon: Heart, label: "Mempelai" },
              { id: "acara", icon: Calendar, label: "Acara" },
              { id: "galeri", icon: Camera, label: "Galeri" },
              { id: "gift", icon: Gift, label: "Gift" },
              { id: "ucapan", icon: MessageCircle, label: "Ucapan" },
            ].map((navItem) => (
              <motion.button 
                key={navItem.id}
                type="button"
                onClick={() => scrollToSection(navItem.id)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === navItem.id ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
                title={navItem.label}
              >
                <navItem.icon className="w-4 h-4" />
              </motion.button>
            ))}
          </div>
        </motion.nav>
      )}

      {/* Lightbox Modal for Gallery Photos */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setSelectedImage(null)}
          >
            <motion.button 
              type="button"
              onClick={() => setSelectedImage(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 18 }}
              src={selectedImage} 
              alt="Gallery view" 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
