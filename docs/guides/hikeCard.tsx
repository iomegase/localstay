import { useState, MouseEvent, TouchEvent, Key } from 'react';
import { Heart, TrendingUp, Timer, Mountain, MapPin, ChevronLeft, ChevronRight, X, RotateCcw, Map, Sun, Cloud, CloudRain, Share2, Star } from 'lucide-react';
import { Hike } from '../types';

interface Props {
  hike: Hike;
  key?: Key;
}

const getDifficultyColors = (difficulty: string) => {
  const diff = difficulty.toLowerCase();
  if (diff === 'facile') {
    return {
      bg: 'bg-emerald-50/50',
      border: 'border-emerald-100/50',
      hoverBg: 'group-hover:bg-emerald-50',
      icon: 'text-emerald-600',
      text: 'text-emerald-900',
      pill: 'bg-emerald-500/90 text-white',
    };
  } else if (diff === 'modéré' || diff === 'moyen') {
    return {
      bg: 'bg-orange-50/50',
      border: 'border-orange-100/50',
      hoverBg: 'group-hover:bg-orange-50',
      icon: 'text-orange-600',
      text: 'text-orange-900',
      pill: 'bg-orange-500/90 text-white',
    };
  } else {
    return {
      bg: 'bg-rose-50/50',
      border: 'border-rose-100/50',
      hoverBg: 'group-hover:bg-rose-50',
      icon: 'text-rose-600',
      text: 'text-rose-900',
      pill: 'bg-rose-500/90 text-white',
    };
  }
};

function useHikeLogic(hike: Hike) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = hike.images && hike.images.length > 0 ? hike.images : [hike.image];
  const diffColors = getDifficultyColors(hike.difficulty);
  const isLongDescription = hike.description.length > 200;

  const nextImage = (e?: MouseEvent | TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: MouseEvent | TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleShare = async (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: hike.title,
          text: `Découvrez la randonnée : ${hike.title} au départ de ${hike.start}`,
          url: window.location.href, // This would ideally link to the specific hike
        });
      } catch (error) {
        console.error('Erreur lors du partage :', error);
      }
    } else {
        alert("Le partage natif n'est pas supporté sur ce navigateur.");
    }
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  const toggleFavorite = (e?: MouseEvent | TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsFavorite(!isFavorite);
  };

  const swipeHandlers = images.length > 1 ? {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  } : {};

  return { images, currentImageIndex, diffColors, isLongDescription, nextImage, prevImage, swipeHandlers, handleShare, isFavorite, toggleFavorite };
}

export function HikeCard({ hike }: Props) {
  return (
    <>
      <div className="block md:hidden h-full">
        <MobileCard hike={hike} />
      </div>
      <div className="hidden md:block h-full">
        <DesktopCard hike={hike} />
      </div>
    </>
  );
}

function MobileCard({ hike }: { hike: Hike }) {
  const { images, currentImageIndex, diffColors, nextImage, prevImage, swipeHandlers, handleShare, isFavorite, toggleFavorite } = useHikeLogic(hike);
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="group w-full h-[450px]" style={{ perspective: '1500px' }}>
      <div 
        className="relative w-full h-full transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 rounded-[1.25rem] overflow-hidden shadow-sm shadow-stone-200/50 bg-stone-900"
          style={{ backfaceVisibility: 'hidden' }}
          {...swipeHandlers}
        >
          {/* Image */}
          <img src={images[currentImageIndex]} alt={hike.title} className="absolute inset-0 w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Pill & Actions */}
          <div className={`absolute top-4 left-4 inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm ${diffColors.pill}`}>
            {hike.level}
          </div>
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button onClick={toggleFavorite} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm hover:scale-105 transition-transform group/fav" aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm hover:scale-105 transition-transform" aria-label="Partager">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Carousel */}
          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center text-white/90 hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                <ChevronLeft className="w-6 h-6 drop-shadow-md" />
              </button>
              <button onClick={nextImage} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center text-white/90 hover:text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                <ChevronRight className="w-6 h-6 drop-shadow-md" />
              </button>
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
          
          {/* Bottom Title & Voir Plus */}
          <div className="absolute flex flex-col items-center text-center bottom-6 left-5 right-5 text-white">
             <h3 className="text-2xl font-serif font-medium tracking-tight mb-1 drop-shadow-md">{hike.title}</h3>
             <StarRating rating={hike.rating} reviews={hike.reviews} className="text-white drop-shadow-md mb-4" justify="justify-center" />
             <button onClick={(e) => { e.preventDefault(); setIsFlipped(true); }} className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white rounded-xl py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] transition duration-300">
               Voir plus
             </button>
          </div>
        </div>

        {/* Back Face */}
        <div 
          className="absolute inset-0 rounded-[1.25rem] bg-white border border-stone-200 shadow-xl overflow-hidden flex flex-col p-5"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
           <div className="flex items-start justify-between mb-2">
             <div className="flex-1 pr-2">
               <div className="flex items-center gap-1.5 text-stone-500 mb-1.5">
                 <MapPin className="w-3.5 h-3.5 shrink-0" />
                 <p className="text-[10px] uppercase tracking-[0.2em] font-medium truncate">Départ : {hike.start}</p>
               </div>
               <h3 className="text-[19px] font-serif font-medium text-stone-900 leading-tight">{hike.title}</h3>
               <StarRating rating={hike.rating} reviews={hike.reviews} />
             </div>
             <button onClick={(e) => { e.preventDefault(); setIsFlipped(false); }} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors shrink-0">
                <X className="w-4 h-4" />
             </button>
           </div>
           
           <div className="flex-1 overflow-y-auto min-h-0 my-3 pr-1">
             <p className="text-[13px] leading-relaxed text-stone-700 text-justify">
               {hike.description}
             </p>
           </div>

           {/* Stats */}
           <div className={`grid gap-1.5 mb-4 shrink-0 ${hike.weather ? 'grid-cols-4' : 'grid-cols-3'}`}>
             <div className="bg-stone-50 rounded-xl p-2 flex flex-col items-center justify-center text-center">
               <TrendingUp className="w-3.5 h-3.5 text-stone-400 mb-1" />
               <span className="text-[11px] font-semibold text-stone-900 whitespace-nowrap">{hike.elevation}</span>
             </div>
             <div className="bg-stone-50 rounded-xl p-2 flex flex-col items-center justify-center text-center">
               <Timer className="w-3.5 h-3.5 text-stone-400 mb-1" />
               <span className="text-[11px] font-semibold text-stone-900 whitespace-nowrap">{hike.duration}</span>
             </div>
             <div className={`border rounded-xl p-2 flex flex-col items-center justify-center text-center ${diffColors.bg} ${diffColors.border}`}>
               <Mountain className={`w-3.5 h-3.5 mb-1 ${diffColors.icon}`} />
               <span className={`text-[10px] font-semibold truncate w-full ${diffColors.text}`}>{hike.difficulty}</span>
             </div>
             {hike.weather && (
               <div className="bg-stone-50 rounded-xl p-2 flex flex-col items-center justify-center text-center">
                 {hike.weather === 'sun' && <Sun className="w-3.5 h-3.5 text-amber-500 mb-1" />}
                 {hike.weather === 'cloud' && <Cloud className="w-3.5 h-3.5 text-stone-400 mb-1" />}
                 {hike.weather === 'rain' && <CloudRain className="w-3.5 h-3.5 text-blue-400 mb-1" />}
                 <span className="text-[10px] font-semibold text-stone-900 capitalize truncate w-full">{hike.weather === 'sun' ? 'Soleil' : hike.weather === 'cloud' ? 'Nuages' : 'Pluie'}</span>
               </div>
             )}
           </div>

           {/* Itineraire */}
           <div className="flex items-center gap-2 mt-auto">
             <div className="w-11 h-11 rounded-xl bg-stone-50 flex items-center justify-center shrink-0 border border-stone-200 relative overflow-hidden group/map cursor-pointer transition-colors hover:bg-stone-100/50">
               <div className="absolute inset-0 opacity-10">
                 <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                   <defs>
                     <pattern id="gridPatternMobile" width="6" height="6" patternUnits="userSpaceOnUse">
                       <path d="M 6 0 L 0 0 0 6" fill="none" stroke="currentColor" strokeWidth="1"/>
                     </pattern>
                   </defs>
                   <rect width="100%" height="100%" fill="url(#gridPatternMobile)" />
                 </svg>
               </div>
               <Map className="w-4 h-4 text-stone-500 relative z-10 transition-transform duration-300 group-hover/map:scale-110 group-hover/map:text-stone-700" />
             </div>
             <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white text-stone-900 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition duration-300 active:scale-[0.98] shrink-0">
               Itinéraire
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function DesktopCard({ hike }: { hike: Hike }) {
  const { images, currentImageIndex, diffColors, isLongDescription, nextImage, prevImage, swipeHandlers, handleShare, isFavorite, toggleFavorite } = useHikeLogic(hike);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <article className="group relative bg-white overflow-hidden rounded-[1.25rem] border border-stone-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-row lg:flex-col h-full">
      {/* --- Visual Header --- */}
      <div 
        className="relative w-[42%] sm:w-[250px] md:w-[35%] lg:w-full lg:h-[200px] xl:h-[220px] shrink-0 overflow-hidden min-h-[180px]"
        {...swipeHandlers}
      >
        <img
          src={images[currentImageIndex]}
          alt={hike.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        <div className={`absolute top-2 left-2 lg:top-4 lg:left-4 inline-flex items-center rounded-full px-2 py-1 lg:px-3 lg:py-1.5 text-[8px] lg:text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm ${diffColors.pill}`}>
          {hike.level}
        </div>

        <div className="absolute top-2 right-2 lg:top-4 lg:right-4 flex flex-col gap-1.5 lg:gap-2 z-10">
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white transition-all hover:bg-white hover:text-rose-500 border border-white/20 shadow-sm hover:scale-105 group/fav"
          >
            <Heart className={`w-3 h-3 lg:w-4 lg:h-4 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Partager"
            className="w-7 h-7 lg:w-10 lg:h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white transition-all hover:bg-white hover:text-stone-900 border border-white/20 shadow-sm hover:scale-105"
          >
            <Share2 className="w-3 h-3 lg:w-4 lg:h-4" />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-0 lg:left-1 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5 lg:w-7 lg:h-7 drop-shadow-md" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-0 lg:right-1 top-1/2 -translate-y-1/2 p-2 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 opacity-0 group-hover:opacity-100"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5 lg:w-7 lg:h-7 drop-shadow-md" />
            </button>
            <div className="absolute bottom-2 lg:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- Body Content --- */}
      <div className="p-3.5 sm:p-5 lg:p-6 flex flex-col flex-1 min-w-0">
        <div className="mb-2 lg:mb-4">
          <div className="flex items-center gap-1.5 text-stone-500 mb-1 lg:mb-2">
            <MapPin className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
            <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.15em] lg:tracking-[0.2em] font-medium truncate">
               Départ : {hike.start}
            </p>
          </div>
          <h3 className="text-[17px] sm:text-lg lg:text-xl xl:text-lg 2xl:text-xl font-serif font-medium tracking-tight text-stone-900 leading-tight">
            {hike.title}
          </h3>
          <StarRating rating={hike.rating} reviews={hike.reviews} />
        </div>

        <p className="text-[11px] sm:text-xs lg:text-sm leading-relaxed text-stone-600">
          {isLongDescription ? `${hike.description.substring(0, 195)}...` : hike.description}
          {isLongDescription && (
            <button
              onClick={(e) => { e.preventDefault(); setIsExpanded(true); }}
              className="ml-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-900 hover:text-stone-500 transition-colors inline"
            >
              Afficher plus
            </button>
          )}
        </p>

        <div className={`grid gap-1.5 sm:gap-2 mt-4 lg:mt-5 mb-4 lg:mb-5 ${hike.weather ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3'}`}>
          <div className="bg-stone-50 rounded-lg lg:rounded-xl p-1.5 lg:p-2.5 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-stone-100/50 border border-transparent group-hover:border-stone-200/50">
            <TrendingUp className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-stone-400 mb-0.5 lg:mb-1" />
            <span className="text-[10px] lg:text-xs font-semibold text-stone-900">{hike.elevation}</span>
          </div>
          <div className="bg-stone-50 rounded-lg lg:rounded-xl p-1.5 lg:p-2.5 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-stone-100/50 border border-transparent group-hover:border-stone-200/50">
            <Timer className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-stone-400 mb-0.5 lg:mb-1" />
            <span className="text-[10px] lg:text-xs font-semibold text-stone-900">{hike.duration}</span>
          </div>
          <div className={`${hike.weather ? 'col-span-1' : 'col-span-2 lg:col-span-1'} border rounded-lg lg:rounded-xl p-1.5 lg:p-2.5 flex flex-col items-center justify-center text-center transition-colors ${diffColors.bg} ${diffColors.border} ${diffColors.hoverBg}`}>
            <Mountain className={`w-3 h-3 lg:w-3.5 lg:h-3.5 mb-0.5 lg:mb-1 ${diffColors.icon}`} />
            <span className={`text-[10px] lg:text-xs font-semibold truncate mx-auto w-full max-w-[80%] ${diffColors.text}`}>{hike.difficulty}</span>
          </div>
          {hike.weather && (
            <div className="bg-stone-50 rounded-lg lg:rounded-xl p-1.5 lg:p-2.5 flex flex-col items-center justify-center text-center transition-colors group-hover:bg-stone-100/50 border border-transparent group-hover:border-stone-200/50">
              {hike.weather === 'sun' && <Sun className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-amber-500 mb-0.5 lg:mb-1" />}
              {hike.weather === 'cloud' && <Cloud className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-stone-400 mb-0.5 lg:mb-1" />}
              {hike.weather === 'rain' && <CloudRain className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-blue-400 mb-0.5 lg:mb-1" />}
              <span className="text-[10px] lg:text-xs font-semibold text-stone-900 capitalize truncate w-full">{hike.weather === 'sun' ? 'Soleil' : hike.weather === 'cloud' ? 'Nuages' : 'Pluie'}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-1 lg:pt-2 z-10 relative flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-[46px] lg:h-[46px] rounded-lg lg:rounded-xl bg-stone-50 flex items-center justify-center shrink-0 border border-stone-200 relative overflow-hidden group/map cursor-pointer transition-colors hover:bg-stone-100/50">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="gridPatternDesktop" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridPatternDesktop)" />
              </svg>
            </div>
            <Map className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-[18px] lg:h-[18px] text-stone-400 relative z-10 transition-all duration-300 group-hover/map:scale-110 group-hover/map:text-stone-700" />
          </div>
          <button
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-1.5 lg:gap-2 rounded-lg lg:rounded-xl border border-stone-200 bg-white text-stone-900 py-2 sm:py-3 lg:py-3.5 text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em] transition duration-300 hover:bg-stone-900 hover:text-white hover:border-stone-900 active:scale-[0.98]"
          >
            Itinéraire
          </button>
        </div>
      </div>

      {/* D
      escription Overlay Slider */}
      <div
        className={`absolute inset-0 z-50 bg-white/60 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 shadow-2xl flex flex-col transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isExpanded ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-stone-300/30 shrink-0">
          <div>
            <h4 className="font-serif text-[17px] sm:text-lg lg:text-xl font-medium text-stone-900 pr-4 drop-shadow-sm">{hike.title}</h4>
            <StarRating rating={hike.rating} reviews={hike.reviews} />
          </div>
          <button
            onClick={(e) => { e.preventDefault(); setIsExpanded(false); }}
            className="w-8 h-8 lg:w-10 lg:h-10 flex shrink-0 items-center justify-center rounded-full bg-white/40 border border-white/60 shadow-sm text-stone-700 hover:bg-white/70 hover:text-stone-900 transition-all"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 lg:p-6 overflow-y-auto flex-1">
          <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-stone-800 font-medium text-justify">
            {hike.description}
          </p>
        </div>
      </div>
    </article>
  );
}

function StarRating({ rating = 0, reviews = 0, className = "text-stone-500", justify = "justify-start" }: { rating?: number, reviews?: number, className?: string, justify?: string }) {
  if (!rating) return null;
  return (
    <div className={`flex items-center gap-1.5 mt-1 lg:mt-1.5 ${className} ${justify}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${
              i < Math.floor(rating)
                ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                : 'fill-current opacity-20 text-current'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] lg:text-[11px] font-medium opacity-80 mt-0.5 tracking-wide">
        {rating.toFixed(1)} ({reviews} avis)
      </span>
    </div>
  );
}


