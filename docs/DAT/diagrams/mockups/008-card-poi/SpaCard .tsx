import { Heart, MapPin, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const galleryImages = [
  "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519823551278-64ac92734fb4?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=300&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=300&auto=format&fit=crop",
  "https://plus.unsplash.com/premium_photo-1661777203632-475306d1dd53?q=80&w=300&auto=format&fit=crop"
];

export const SpaCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={false}
      animate={{ height: isExpanded ? "auto" : 480 }}
      className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 w-[480px] transition-transform duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
    >
      {/* Image Header */}
      <div className="relative h-[270px] shrink-0 overflow-hidden group">
        <img 
          src="https://plus.unsplash.com/premium_photo-1663937576267-b178ecd95bfa?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
          alt="Spa landscape" 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 right-4">
          <button className=" backdrop-blur-sm p-3 text-gray-700 rounded-full shadow-lg hover:bg-white transition-colors group/heart">
            <Heart className="h-5 w-5 " />
          </button>
        </div>
        <div className="absolute top-4 left-4">
          <span className="border-green-500/90 border backdrop-blur-sm text-green-900 text-[10px] font-thin px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-white"></div>
            Ouvert
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div 
          className="flex justify-between items-center group/card cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-thin text-gray-800 text-[11px]">Bien-être</span>
              <span className="text-gray-400 text-[11px] font-thin">à 2.5 km</span>
            </div>
            
            <h2 className="text-[18px] font-thin tracking-tight text-gray-900 leading-tight mb-2">
              SPA le Saint Gervais
            </h2>
            
            <div className="flex items-start gap-2 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-xl transition-colors">
              <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-gray-500 font-thin text-[11px] leading-relaxed">
                124 Ave des Thermes, <br/>
                74170 Saint-Gervais-les-Bains
              </p>
            </div>
          </div>
          <motion.div 
            className="ml-4 shrink-0 flex items-center justify-center"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <ChevronRight className="h-16 w-16 text-gray-200 group-hover/card:translate-x-1 group-hover/card:text-gray-800 transition-all duration-300" strokeWidth={0.5} />
          </motion.div>
        </div>

        {/* Footer combined details */}
        <div className="flex flex-col mt-2">
          <div className="flex items-end justify-between">
          <div>
            {/* Preserved Pills */}
            <div className="flex flex-row items-center gap-3">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-lg text-[10px] font-thin tracking-wide">Massage</span>
                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-lg text-[10px] font-thin tracking-wide">Spa</span>
              </div>
            
              <p className="text-[9px] uppercase tracking-wide font-light text-[#86898f] pl-2">
                Ferme à <span className="  font-thin text-gray-900">20h</span>
              </p>
            </div>
          </div>
          <button className="bg-white hover:bg-black border hover:text-white border-black text-black px-5 py-2 rounded-none font-thin text-[11px] tracking-wide transition-all shadow-sm active:scale-95 mb-0.5" onClick={(e) => e.stopPropagation()}>
          APPELER
          </button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-gray-50 flex flex-col shrink-0"
              >
                <div className="pt-5">
                   <h3 className="text-[14px] font-medium text-gray-800 mb-1">Installations & Parcours</h3>
                   <p className="text-[10px] font-thin text-[#86898f] mb-5 leading-5">
                      Découvrez plus de 400m² dédiés à la relaxation : bassins thermaux à débordement, sauna panoramique aux cristaux de sel, hammam à l'eucalyptus et zones de repos immersives. Un voyage sensoriel inoubliable au cœur des montagnes.
                   </p>
                   <div className="relative w-full overflow-hidden rounded-xl h-[100px]">
                     <motion.div
                       className="flex gap-2 absolute top-0 left-0 h-full w-max"
                       animate={{ x: ["0%", "-50%"] }}
                       transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
                     >
                       {[...galleryImages, ...galleryImages].map((img, i) => (
                         <img key={i} src={img} className="h-full w-36 object-cover rounded-[10px] shrink-0 border border-gray-50/50" alt={`gallery-${i}`} />
                       ))}
                     </motion.div>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

