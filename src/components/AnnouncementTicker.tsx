import React from "react";
import { Radio, Phone, Smartphone, QrCode, Music, Info, Volume2 } from "lucide-react";

export default function AnnouncementTicker() {
  const tickerItems = [
    {
      icon: <Phone className="w-4 h-4 text-orange-400" />,
      text: "AUDIONOW : 1-518-801-1331",
      badge: "LIVE DIAL-IN",
      badgeColor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    {
      icon: <Smartphone className="w-4 h-4 text-emerald-400" />,
      text: "Téléchargez notre application sur Google Play",
      badge: "MOBILE APP",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      link: "https://play.google.com/store/apps/details?id=radio.televisionsismique6",
    },
    {
      icon: <QrCode className="w-4 h-4 text-blue-400" />,
      text: "Scannez le QR Code pour écouter en direct",
      badge: "EASY LISTEN",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    {
      icon: <Radio className="w-4 h-4 text-purple-400" />,
      text: "Écoutez notre radio partout dans le monde",
      badge: "WORLDWIDE",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    {
      icon: <Music className="w-4 h-4 text-pink-400" />,
      text: "Musique, Informations et Émissions en direct",
      badge: "VIBRATION",
      badgeColor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    },
  ];

  // Repeat items to allow smooth, gapless infinite animation loop
  const repeatedItems = [...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div 
      className="w-full bg-slate-900 border-y border-slate-800 dark:bg-slate-900 dark:border-slate-800 light:bg-orange-50/80 light:border-orange-100 flex items-center relative overflow-hidden h-14 select-none group shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]" 
      id="announcement_marquee_container"
    >
      <style>{`
        @keyframes marquee-scroll {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-33.333%, 0, 0);
          }
        }
        .marquee-track-scroll {
          display: flex;
          align-items: center;
          width: max-content;
          animation: marquee-scroll 32s linear infinite;
        }
        .marquee-track-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Broadcast Info Badge fixed to the left side */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center z-20 pl-4 pr-3 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/10 light:from-white light:via-white light:to-white/10 shrink-0 select-none">
        <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black px-3 py-1 text-xs uppercase tracking-wider rounded-md flex items-center gap-1.5 shadow-[0_2px_10px_rgba(249,115,22,0.35)] group-hover:scale-105 transition-transform">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
          </span>
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>INFO LIVE</span>
          </span>
        </div>
      </div>

      {/* Marquee Body */}
      <div className="flex-1 overflow-hidden h-full flex items-center pl-32">
        <div className="marquee-track-scroll">
          {repeatedItems.map((item, index) => {
            const contentBlock = (
              <div 
                key={index} 
                className="flex items-center space-x-3.5 mx-8 shrink-0 hover:text-orange-400 transition-colors cursor-pointer group/item"
              >
                {/* Visual Icon with subtle pulse glow */}
                <div className="p-1.5 bg-slate-950/40 border border-slate-800 rounded-lg group-hover/item:border-orange-500/40 transition-colors shadow-sm">
                  {item.icon}
                </div>

                {/* Sub-Badge */}
                <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-md tracking-wider uppercase ${item.badgeColor}`}>
                  {item.badge}
                </span>

                {/* Ticker Text */}
                <span className="text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 tracking-wide font-sans">
                  {item.text}
                </span>

                {/* Divider node */}
                <div className="flex items-center pl-4 opacity-50 select-none">
                  <Volume2 className="w-3 h-3 text-slate-600 group-hover/item:text-orange-500 transition-colors animate-pulse" />
                </div>
              </div>
            );

            if (item.link) {
              return (
                <a 
                  key={index} 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="focus:outline-none"
                >
                  {contentBlock}
                </a>
              );
            }

            return contentBlock;
          })}
        </div>
      </div>

      {/* Ambient gradient layer to blur right-hand side text exit smoothly */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent dark:from-slate-900 light:from-white pointer-events-none z-10" />
    </div>
  );
}
