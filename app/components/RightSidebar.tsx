"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  Video, 
  Send, 
  ExternalLink,
  User,
  Users,
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

// Reusable 4-Corner Floral Leaves matching the.invisimple.id/s01 exactly
const SectionFloralCorners = () => (
  <>
    {/* Top-Left: natural orientation */}
    <img 
      src="/template/assets/asset-01-01.png" 
      alt="" 
      aria-hidden="true"
      className="absolute top-0 left-0 w-20 sm:w-24 md:w-28 pointer-events-none z-10 select-none" 
    />
    {/* Top-Right: flipped horizontally */}
    <img 
      src="/template/assets/asset-01-01.png" 
      alt="" 
      aria-hidden="true"
      className="absolute top-0 right-0 w-20 sm:w-24 md:w-28 scale-x-[-1] pointer-events-none z-10 select-none" 
    />
    {/* Bottom-Left: flipped vertically */}
    <img 
      src="/template/assets/asset-01-01.png" 
      alt="" 
      aria-hidden="true"
      className="absolute bottom-0 left-0 w-20 sm:w-24 md:w-28 scale-y-[-1] pointer-events-none z-10 select-none" 
    />
    {/* Bottom-Right: flipped horizontally and vertically */}
    <img 
      src="/template/assets/asset-01-01.png" 
      alt="" 
      aria-hidden="true"
      className="absolute bottom-0 right-0 w-20 sm:w-24 md:w-28 scale-x-[-1] scale-y-[-1] pointer-events-none z-10 select-none" 
    />
  </>
);

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

  // Use the exact portrait photo Savethedate-2.jpg from invisimple s01 as default cover photo
  const coverPhoto = project?.cover_photo_url || project?.opening_photo_url || "/template/assets/Savethedate-2.jpg";
  const bridePhoto = project?.bride_photo_url || "/template/assets/Bride.jpg";
  const groomPhoto = project?.groom_photo_url || "/template/assets/Groom.jpg";
  const musicSrc = project?.music_url || "/template/assets/Komang-Raim-Laode.mp3";

  // Target Wedding Date Countdown (28 Desember 2027)
  const targetDate = new Date("2027-12-28T08:00:00").getTime();
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

  // Attach IntersectionObserver for scroll entrance animations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("sr-animate-active");
          }
        });
      },
      {
        root: container,
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px"
      }
    );

    const elements = container.querySelectorAll(".sr-fade-up, .sr-zoom-in, .sr-fade-down");
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [isOpened]);

  // Open invitation handler with smooth slide-up matching s01 closeCover()
  const handleOpenInvitation = () => {
    setIsOpened(true);
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

  // Gallery photos
  const galleryPhotos = [
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
      className="relative w-full md:w-[40%] lg:w-[35%] xl:w-[32%] min-h-[100dvh] md:h-[100dvh] md:overflow-y-auto no-scrollbar bg-[#F4ECE3] text-[#3C2A21] select-none"
      style={{
        backgroundImage: "url('/template/assets/eks-01-bg-01.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={musicSrc} loop preload="auto" />

      {/* ========================================================
          COVER OVERLAY SCREEN (Slides up smoothly on "Buka Undangan")
         ======================================================== */}
      <div 
        id="cover"
        className={`absolute inset-0 z-50 min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#F4ECE3] transition-all duration-[2200ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
          isOpened ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
        style={{
          backgroundImage: "url('/template/assets/eks-01-bg-01.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {/* Top Half Couple Photo with Seamless Gradient Mask */}
        <div className="relative w-full h-[50vh] sm:h-[52vh] overflow-hidden shrink-0">
          <img 
            src={coverPhoto} 
            alt="The Wedding" 
            className="w-full h-full object-cover object-top" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F4ECE3] via-[#F4ECE3]/35 to-transparent" />
        </div>

        {/* Bottom Corner Leaves on Cover (Matching the.invisimple.id/s01 cover screenshot) */}
        <img 
          src="/template/assets/asset-01-01.png" 
          alt="Floral" 
          className="absolute bottom-0 left-0 w-28 sm:w-32 scale-y-[-1] pointer-events-none z-10 select-none" 
        />
        <img 
          src="/template/assets/asset-01-01.png" 
          alt="Floral" 
          className="absolute bottom-0 right-0 w-28 sm:w-32 scale-x-[-1] scale-y-[-1] pointer-events-none z-10 select-none" 
        />

        {/* Bottom Half Invitation Details & Buka Undangan Button */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 pb-12 pt-2 space-y-3.5">
          <p className="text-[11px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-[#7A6A5E]">
            THE WEDDING OF
          </p>

          <h1 className="font-sr-script text-5xl sm:text-6xl text-[#5C4E43] leading-none my-1 font-normal">
            {brideNickname} &amp; {groomNickname}
          </h1>

          <div className="space-y-1 pt-2">
            <p className="text-xs text-[#7A6A5E]">Kepada Yth.</p>
            <p className="text-xs text-[#7A6A5E]">Bapak/Ibu/Saudara/i</p>
            <div className="px-6 py-2 rounded-2xl bg-white/75 backdrop-blur-xs border border-[#5C4E43]/15 shadow-xs mt-1.5 inline-block">
              <span className="text-base sm:text-lg font-bold text-[#3C2A21] tracking-wide block">
                {guestName}
              </span>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] italic text-[#99887C] max-w-xs pt-1 leading-snug">
            *Mohon maaf jika ada kesalahan dalam penulisan nama / gelar.
          </p>

          <button 
            type="button"
            onClick={handleOpenInvitation}
            className="mt-4 px-8 py-3 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 group hover:shadow-xl"
          >
            <BookOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Buka Undangan</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          MAIN INVITATION CONTENT (Revealed underneath smoothly)
         ======================================================== */}
      <div className="relative z-10 space-y-12 pb-32 pt-2">

        {/* 1. HERO / SAVE THE DATE SECTION */}
        <section id="hero" className="relative min-h-[100dvh] flex flex-col items-center justify-between px-6 pt-12 pb-16 text-center overflow-hidden">
          <SectionFloralCorners />

          <div className="space-y-2 mt-4 sr-fade-down">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[#7A6A5E]">
              THE WEDDING OF
            </p>
          </div>

          {/* Circular Framed Photo */}
          <div className="relative my-4 sr-zoom-in">
            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full overflow-hidden p-1.5 bg-gradient-to-tr from-[#5C4E43]/30 via-white to-[#5C4E43]/40 shadow-xl border-4 border-white/90">
              <img 
                src="/template/assets/Savethedate-2.jpg" 
                alt="Couple" 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
          </div>

          {/* Names & Date */}
          <div className="space-y-2 sr-fade-up">
            <h2 className="font-sr-script text-4xl sm:text-5xl text-[#5C4E43] leading-tight">
              {brideNickname} &amp; {groomNickname}
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#7A6A5E] tracking-wider">
              Minggu, 28 Desember 2027
            </p>
          </div>

          {/* Countdown Boxes */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-xs my-2 sr-fade-up">
            <div className="bg-[#5C4E43] text-white rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono">{timeLeft.days}</span>
              <span className="text-[10px] sm:text-xs text-[#E8DFD8] uppercase tracking-wider font-medium">Hari</span>
            </div>
            <div className="bg-[#5C4E43] text-white rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono">{timeLeft.hours}</span>
              <span className="text-[10px] sm:text-xs text-[#E8DFD8] uppercase tracking-wider font-medium">Jam</span>
            </div>
            <div className="bg-[#5C4E43] text-white rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono">{timeLeft.minutes}</span>
              <span className="text-[10px] sm:text-xs text-[#E8DFD8] uppercase tracking-wider font-medium">Menit</span>
            </div>
            <div className="bg-[#5C4E43] text-white rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold font-mono">{timeLeft.seconds}</span>
              <span className="text-[10px] sm:text-xs text-[#E8DFD8] uppercase tracking-wider font-medium">Detik</span>
            </div>
          </div>

          {/* Save The Date Button */}
          <div className="sr-fade-up">
            <a 
              href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=The+Wedding+of+Putri+%26+Putra&dates=20271228T010000Z/20271228T080000Z&details=Undangan+Pernikahan+Putri+%26+Putra&location=Menara+165+Jakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Simpan Tanggal</span>
            </a>
          </div>

          <div className="pt-2 animate-bounce">
            <ChevronDown className="w-5 h-5 text-[#5C4E43]/60 mx-auto" />
          </div>
        </section>

        {/* 2. QUOTE / AYAT SUCI SECTION */}
        <section className="px-4 sr-fade-up">
          <div className="bg-[#5C4E43] text-white p-7 sm:p-9 rounded-3xl shadow-xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            
            <p className="text-xs sm:text-sm leading-relaxed font-light italic text-[#F4ECE3] max-w-sm mx-auto">
              &ldquo;Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.&rdquo;
            </p>

            <p className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
              Q.S Ar-Rum : 21
            </p>
          </div>
        </section>

        {/* 3. MEMPELAI (COUPLE PROFILE) SECTION */}
        <section id="mempelai" className="relative px-6 py-10 text-center space-y-8 bg-white/40 backdrop-blur-xs rounded-3xl mx-3 border border-white/60 shadow-xs overflow-hidden sr-fade-up">
          <SectionFloralCorners />
          
          <div className="space-y-3 pt-2 sr-fade-down">
            <h3 className="text-xs sm:text-sm font-bold text-[#5C4E43] tracking-wide">
              Assalamu’alaikum Warahmatullahi Wabarakatuh
            </h3>
            <p className="text-xs text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
              Maha Suci Allah yang telah menciptakan makhluk-Nya berpasang-pasangan. Ya Allah semoga ridho-Mu tercurah mengiringi pernikahan kami.
            </p>
          </div>

          {/* Mempelai Wanita */}
          <div className="space-y-3 flex flex-col items-center">
            <div className="w-36 h-36 rounded-full overflow-hidden p-1 bg-white shadow-lg border-2 border-[#5C4E43]/20 sr-zoom-in">
              <img 
                src={bridePhoto} 
                alt={brideFull} 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <h4 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43] leading-none pt-1 sr-fade-up">
              {brideFull}
            </h4>
            <p className="text-xs text-[#7A6A5E] max-w-xs leading-relaxed sr-fade-up">
              {brideParents}
            </p>
            {brideIg && (
              <a 
                href={`https://instagram.com/${brideIg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5C4E43] text-white rounded-full text-[11px] font-medium shadow-xs hover:bg-[#4a3e35] transition-all sr-fade-up"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>@{brideIg}</span>
              </a>
            )}
          </div>

          {/* Ampersand Divider */}
          <div className="font-sr-script text-4xl text-[#5C4E43]/80 my-2">
            &amp;
          </div>

          {/* Mempelai Pria */}
          <div className="space-y-3 flex flex-col items-center">
            <div className="w-36 h-36 rounded-full overflow-hidden p-1 bg-white shadow-lg border-2 border-[#5C4E43]/20 sr-zoom-in">
              <img 
                src={groomPhoto} 
                alt={groomFull} 
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
            <h4 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43] leading-none pt-1 sr-fade-up">
              {groomFull}
            </h4>
            <p className="text-xs text-[#7A6A5E] max-w-xs leading-relaxed sr-fade-up">
              {groomParents}
            </p>
            {groomIg && (
              <a 
                href={`https://instagram.com/${groomIg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#5C4E43] text-white rounded-full text-[11px] font-medium shadow-xs hover:bg-[#4a3e35] transition-all sr-fade-up"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
                <span>@{groomIg}</span>
              </a>
            )}
          </div>
        </section>

        {/* 4. ACARA (EVENTS: AKAD & RESEPSI) SECTION */}
        <section id="acara" className="space-y-6 px-4">
          {/* Akad Nikah Card */}
          <div className="relative p-7 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xs border border-white shadow-md text-center space-y-5 overflow-hidden sr-fade-up">
            <SectionFloralCorners />

            <h3 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43]">
              Akad Nikah
            </h3>

            {/* 3-Column Calendar Box */}
            <div className="flex items-center justify-center gap-4 py-2 border-y border-[#5C4E43]/15">
              <span className="text-sm font-semibold text-[#7A6A5E] uppercase tracking-wider">
                Minggu
              </span>
              <div className="px-4 border-x border-[#5C4E43]/20 text-center">
                <span className="text-3xl sm:text-4xl font-bold text-[#5C4E43] font-mono leading-none block">
                  28
                </span>
                <span className="text-[10px] text-[#7A6A5E] font-medium">2027</span>
              </div>
              <span className="text-sm font-semibold text-[#7A6A5E] uppercase tracking-wider">
                Desember
              </span>
            </div>

            {/* Time & Location */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#5C4E43] flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5C4E43]" />
                <span>08:00 WIB</span>
              </p>
              <div className="pt-2 space-y-1">
                <p className="text-xs font-bold text-[#3C2A21]">Lokasi Acara</p>
                <p className="text-xs font-medium text-[#5C4E43]">Menara 165</p>
                <p className="text-[11px] text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
                  Jl. TB Simatupang No.Kav. 1, Cilandak Tim., Ps. Minggu, Kota Jakarta Selatan
                </p>
              </div>
            </div>

            <a 
              href="https://maps.google.com/?q=Menara+165+Jakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
          </div>

          {/* Resepsi Card */}
          <div className="relative p-7 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xs border border-white shadow-md text-center space-y-5 overflow-hidden sr-fade-up">
            <SectionFloralCorners />

            <h3 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43]">
              Resepsi
            </h3>

            {/* 3-Column Calendar Box */}
            <div className="flex items-center justify-center gap-4 py-2 border-y border-[#5C4E43]/15">
              <span className="text-sm font-semibold text-[#7A6A5E] uppercase tracking-wider">
                Minggu
              </span>
              <div className="px-4 border-x border-[#5C4E43]/20 text-center">
                <span className="text-3xl sm:text-4xl font-bold text-[#5C4E43] font-mono leading-none block">
                  28
                </span>
                <span className="text-[10px] text-[#7A6A5E] font-medium">2027</span>
              </div>
              <span className="text-sm font-semibold text-[#7A6A5E] uppercase tracking-wider">
                Desember
              </span>
            </div>

            {/* Time & Location */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#5C4E43] flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#5C4E43]" />
                <span>11:00 - Selesai WIB</span>
              </p>
              <div className="pt-2 space-y-1">
                <p className="text-xs font-bold text-[#3C2A21]">Lokasi Acara</p>
                <p className="text-xs font-medium text-[#5C4E43]">Menara 165</p>
                <p className="text-[11px] text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
                  Jl. TB Simatupang No.Kav. 1, Cilandak Tim., Ps. Minggu, Kota Jakarta Selatan
                </p>
              </div>
            </div>

            <a 
              href="https://maps.google.com/?q=Menara+165+Jakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
          </div>
        </section>

        {/* 5. LIVE STREAMING SECTION */}
        <section className="px-4 sr-fade-up">
          <div className="relative p-7 sm:p-8 rounded-3xl bg-white/70 backdrop-blur-xs border border-white shadow-md text-center space-y-4 overflow-hidden">
            <SectionFloralCorners />

            <h3 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43]">
              Live Streaming
            </h3>
            <p className="text-xs text-[#7A6A5E] leading-relaxed max-w-xs mx-auto">
              Temui kami secara virtual untuk menyaksikan acara pernikahan kami yang insyaaAllah akan disiarkan langsung melalui tautan di bawah ini.
            </p>
            <a 
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-semibold shadow-md transition-all active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Lihat Live Streaming</span>
            </a>
          </div>
        </section>

        {/* 6. LOVE STORY SECTION */}
        <section className="px-4 space-y-6 sr-fade-up">
          <div className="text-center space-y-1">
            <h3 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43]">
              Love Story
            </h3>
            <p className="text-[11px] text-[#7A6A5E] tracking-wider uppercase font-medium">
              Kisah Perjalanan Cinta Kami
            </p>
          </div>

          <div className="relative pl-6 space-y-6 border-l-2 border-[#5C4E43]/20 ml-4">
            {/* Story 1 */}
            <div className="relative space-y-3 bg-white/75 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white shadow-xs sr-fade-up">
              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-[#5C4E43] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-xs">
                <img src="/template/assets/1-3.jpeg" alt="Story 1" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-[#5C4E43] tracking-wider uppercase">
                25 AGUSTUS 2023
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Berawal dari tempat pekerjaan Cianjur-2023, kami mengenal satu sama lain dan belum ada benih cinta kala itu, hanya sebatas rekan kerja yang saling bertukar sapa.
              </p>
            </div>

            {/* Story 2 */}
            <div className="relative space-y-3 bg-white/75 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white shadow-xs sr-fade-up">
              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-[#5C4E43] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-xs">
                <img src="/template/assets/3.jpeg" alt="Story 2" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-[#5C4E43] tracking-wider uppercase">
                03 JUNI 2024
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Setelah cukup mengenal satu sama lain, selama satu tahun kurang lebih kami menjalin hubungan dan menemukan kecocokan dalam visi serta komitmen hidup.
              </p>
            </div>

            {/* Story 3 */}
            <div className="relative space-y-3 bg-white/75 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-white shadow-xs sr-fade-up">
              <div className="absolute -left-[35px] top-4 w-6 h-6 rounded-full bg-[#5C4E43] text-white flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 fill-current" />
              </div>
              <div className="w-full h-44 rounded-xl overflow-hidden shadow-xs">
                <img src="/template/assets/4.jpeg" alt="Story 3" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-bold text-[#5C4E43] tracking-wider uppercase">
                MENUJU PELAMINAN
              </p>
              <p className="text-xs text-[#7A6A5E] leading-relaxed">
                Dengan ridho kedua orang tua dan sanak keluarga, kami memantapkan langkah menuju ikatan pernikahan yang suci untuk saling menyempurnakan seumur hidup.
              </p>
            </div>
          </div>
        </section>

        {/* 7. OUR MOMENTS (GALLERY & VIDEO) SECTION */}
        <section id="galeri" className="px-4 space-y-6 sr-fade-up">
          <div className="text-center space-y-1">
            <h3 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43]">
              Our Moments
            </h3>
            <p className="text-[11px] text-[#7A6A5E] tracking-wider uppercase font-medium">
              Momen Indah &amp; Kenangan Manis
            </p>
          </div>

          {/* YouTube Embed Player */}
          <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-lg border-2 border-white sr-zoom-in">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=1&rel=0"
              title="Wedding Moments Video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* 2-Column Photo Grid */}
          <div className="grid grid-cols-2 gap-3 sr-fade-up">
            {galleryPhotos.map((src, i) => (
              <div 
                key={i} 
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
              </div>
            ))}
          </div>
        </section>

        {/* 8. WEDDING GIFT / AMPLOP DIGITAL SECTION */}
        <section id="gift" className="px-4 sr-fade-up">
          <div className="bg-[#5C4E43] text-white p-7 sm:p-9 rounded-3xl shadow-xl text-center space-y-5 relative overflow-hidden">
            <div className="space-y-2">
              <h3 className="font-sr-script text-3xl sm:text-4xl text-white">
                Wedding Gift
              </h3>
              <p className="text-xs text-[#E8DFD8] leading-relaxed max-w-sm mx-auto">
                Doa Restu Anda merupakan karunia yang sangat berarti bagi kami. Dan jika memberi adalah ungkapan tanda kasih, Anda dapat memberi melalui informasi di bawah ini.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => setShowGiftDetails(!showGiftDetails)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#5C4E43] hover:bg-[#F4ECE3] rounded-full text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{showGiftDetails ? "Tutup Rekening" : "Klik di Sini"}</span>
            </button>

            {/* Bank Cards Accordion */}
            {showGiftDetails && (
              <div className="space-y-4 pt-4 text-left animate-fadeIn">
                {/* BCA Card */}
                <div className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <img src="/template/assets/bca-150x50.png" alt="BCA" className="h-6 w-auto object-contain" />
                    <img src="/template/assets/chip-ilustration.png" alt="Chip" className="h-6 w-auto object-contain opacity-80" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#7A6A5E] uppercase font-bold tracking-wider">No. Rekening</span>
                    <p className="font-mono text-base font-bold text-[#3C2A21] tracking-wider">123123123</p>
                  </div>
                  <p className="text-xs font-medium text-[#5C4E43]">a.n. Putri Cantika Sara</p>
                  <button 
                    type="button"
                    onClick={() => handleCopy("123123123", "bca")}
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
                  </button>
                </div>

                {/* BRI Card */}
                <div className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 relative space-y-3">
                  <div className="flex items-center justify-between">
                    <img src="/template/assets/bri-150x50.png" alt="BRI" className="h-6 w-auto object-contain" />
                    <img src="/template/assets/chip-ilustration.png" alt="Chip" className="h-6 w-auto object-contain opacity-80" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-[#7A6A5E] uppercase font-bold tracking-wider">No. Rekening</span>
                    <p className="font-mono text-base font-bold text-[#3C2A21] tracking-wider">321321321</p>
                  </div>
                  <p className="text-xs font-medium text-[#5C4E43]">a.n. Putra Andika Pratama</p>
                  <button 
                    type="button"
                    onClick={() => handleCopy("321321321", "bri")}
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
                  </button>
                </div>

                {/* Physical Gift Address */}
                <div className="bg-white text-[#3C2A21] p-5 rounded-2xl shadow-lg border border-slate-100 space-y-2">
                  <p className="text-xs font-bold text-[#5C4E43] flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> Kirim Kado Fisik
                  </p>
                  <div className="text-xs space-y-1 text-[#7A6A5E]">
                    <p><strong className="text-[#3C2A21]">Penerima:</strong> Putri / Putra (+6285150000715)</p>
                    <p><strong className="text-[#3C2A21]">Alamat:</strong> Jl. Raya Cilandak KKO No.27, Jakarta Selatan</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCopy("Jl. Raya Cilandak KKO No.27, Jakarta Selatan (Penerima: Putri / Putra, +6285150000715)", "addr")}
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
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 9. UCAPAN & RSVP SECTION */}
        <section id="ucapan" className="px-4 space-y-6 sr-fade-up">
          <div className="relative p-7 sm:p-8 rounded-3xl bg-white/75 backdrop-blur-xs border border-white shadow-md space-y-6 overflow-hidden">
            <SectionFloralCorners />

            <div className="text-center space-y-1 sr-fade-down">
              <h3 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43]">
                Ucapan &amp; RSVP
              </h3>
              <p className="text-xs text-[#7A6A5E]">
                Berikan doa dan ucapan terbaik untuk kami.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitWish} className="space-y-4 text-left">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5C4E43]/20 bg-white/90 text-xs text-[#3C2A21] focus:ring-2 focus:ring-[#5C4E43] focus:outline-none"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-[#5C4E43]/20 bg-white/90 text-xs text-[#3C2A21] focus:ring-2 focus:ring-[#5C4E43] focus:outline-none resize-none"
                />
              </div>

              {/* Konfirmasi Kehadiran */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#5C4E43] uppercase tracking-wider block">
                  Konfirmasi Kehadiran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAttendance("attending")}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formAttendance === "attending"
                        ? "bg-[#5C4E43] text-white border-[#5C4E43] shadow-xs"
                        : "bg-white/80 text-[#7A6A5E] border-[#5C4E43]/20 hover:bg-white"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Hadir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAttendance("declined")}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      formAttendance === "declined"
                        ? "bg-[#5C4E43] text-white border-[#5C4E43] shadow-xs"
                        : "bg-white/80 text-[#7A6A5E] border-[#5C4E43]/20 hover:bg-white"
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Tidak Hadir</span>
                  </button>
                </div>
              </div>

              {/* Jumlah Tamu */}
              {formAttendance === "attending" && (
                <div className="space-y-1">
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
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl text-center font-medium">
                  ✨ Terima kasih atas ucapan dan konfirmasi kehadiran Anda!
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#5C4E43] hover:bg-[#4a3e35] text-white rounded-full text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Mengirim..." : "Kirim Ucapan"}</span>
              </button>
            </form>

            {/* Wishes List */}
            <div className="pt-4 border-t border-[#5C4E43]/15 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#5C4E43]">
                <span>{wishesList.length} Ucapan Tersimpan</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto no-scrollbar pr-1">
                {wishesList.map((w) => (
                  <div 
                    key={w.id} 
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
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* 10. CLOSING & FOOTER SECTION */}
        <section className="px-6 py-8 text-center space-y-6 sr-fade-up">
          <div className="w-36 h-36 rounded-full overflow-hidden mx-auto p-1 bg-white shadow-lg border-2 border-[#5C4E43]/20 sr-zoom-in">
            <img src="/template/assets/IMG_7981.jpg" alt="Couple" className="w-full h-full object-cover rounded-full" />
          </div>

          <div className="space-y-2 max-w-xs mx-auto">
            <p className="text-xs text-[#7A6A5E] leading-relaxed">
              Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kami.
            </p>
            <p className="text-xs font-bold text-[#5C4E43] pt-2">
              Wassalamu’alaikum Warahmatullahi Wabarakatuh
            </p>
            <p className="text-xs text-[#7A6A5E]">Kami yang berbahagia,</p>
            <h4 className="font-sr-script text-3xl sm:text-4xl text-[#5C4E43] pt-1">
              {brideNickname} &amp; {groomNickname}
            </h4>
          </div>

          <div className="pt-8 border-t border-[#5C4E43]/15 text-center space-y-1">
            <p className="text-[10px] tracking-widest text-[#7A6A5E] uppercase font-bold">
              SERA STORY DIGITAL INVITATION
            </p>
            <p className="text-[9px] text-[#99887C]">
              Created with love for special moments
            </p>
          </div>
        </section>

      </div>

      {/* Floating Vinyl Disc Music Button */}
      {isOpened && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label="Toggle Music"
          className="fixed bottom-20 right-4 md:right-8 z-40 w-11 h-11 rounded-full bg-[#3C2A21] text-white flex items-center justify-center shadow-xl border-2 border-[#F4ECE3] hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        >
          <div className={`w-full h-full rounded-full flex items-center justify-center ${isPlayingMusic ? "animate-sr-spin" : ""}`}>
            {/* Vinyl record rings design */}
            <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center bg-[#5C4E43]">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
            {isPlayingMusic ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
          </div>
        </button>
      )}

      {/* Sticky Bottom Navigation Bar */}
      {isOpened && (
        <nav className="fixed bottom-4 left-0 right-0 md:left-auto md:w-[40%] lg:w-[35%] xl:w-[32%] z-40 px-4 pointer-events-none flex justify-center">
          <div className="pointer-events-auto bg-[#3C2A21]/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-1 sm:gap-2">
            <button 
              type="button"
              onClick={() => scrollToSection("hero")}
              className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === "hero" ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
              title="Home"
            >
              <Home className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("mempelai")}
              className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === "mempelai" ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
              title="Mempelai"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("acara")}
              className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === "acara" ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
              title="Acara"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("galeri")}
              className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === "galeri" ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
              title="Galeri"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("gift")}
              className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === "gift" ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
              title="Gift"
            >
              <Gift className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => scrollToSection("ucapan")}
              className={`p-2 rounded-full transition-all cursor-pointer ${activeNav === "ucapan" ? "bg-[#5C4E43] text-white shadow-xs" : "text-[#D3C7BD] hover:text-white"}`}
              title="Ucapan"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </nav>
      )}

      {/* Lightbox Modal for Gallery Photos */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Gallery view" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}

    </div>
  );
}
