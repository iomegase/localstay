"use client";

import {
  BedDouble,
  BookOpen,
  Eye,
  LogIn,
  LogOut,
  UsersRound,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GuideLodgingVideoButton } from "@/features/guide-app/components/GuideLodgingVideoButton";
import { departureTasks } from "@/features/guide-app/lib/fixed-lodging-content";
import type {
  GuideLodging,
  GuidePoi,
  GuideView,
} from "@/features/guide-app/types";
import { haversineMeters } from "@/features/transport/lib/geo";
import {
  GuideFavoriteBentoCard,
  type BentoPoi,
} from "../GuideFavoriteBentoCard";
import {
  formatDistanceMeters,
  primaryTravel,
  STAY_HOME_EXCLUDED_CATEGORIES,
  type TravelTimeValues,
} from "./poi-search";
import { formatFrenchPlaceReference } from "@/shared/lib/french-place";
import { formatGuideHour } from "./stay-styles";

/** « Le 305 » → { lead: « Bienvenue au », name: « 305 » } (spec 054 AC-01-02). */
export function splitWelcome(name: string): { lead: string; name: string } {
  const reference = formatFrenchPlaceReference(name);
  const match = reference.match(/^(au|aux|à la|à l['’"]|à)\s*(.*)$/);
  if (!match) return { lead: "Bienvenue", name };
  const elided = /['’"]$/.test(match[1]);
  return {
    lead: `Bienvenue ${elided ? match[1].slice(0, -2) : match[1]}`.trim(),
    name: elided ? `${match[1].slice(-2)}${match[2]}` : match[2],
  };
}

/** Champs d'un lieu utiles au carrousel (lieux privés ou de démonstration). */
export type StayPoiCard = BentoPoi &
  Pick<GuidePoi, "latitude" | "longitude"> & { travel?: TravelTimeValues };

export function GuideStayHome<P extends StayPoiCard>({
  lodging,
  pois,
  departureDone,
  onNavigate,
  onOpenWifi,
  onOpenPoi,
  onShowPoiOnMap,
  travelTimes,
  transportEntry,
}: {
  lodging: GuideLodging;
  pois: P[];
  departureDone: number;
  onNavigate: (
    view: Extract<GuideView, "arrival" | "rules" | "departure" | "favorites">,
  ) => void;
  onOpenWifi: () => void;
  onOpenPoi: (poi: P) => void;
  onShowPoiOnMap?: (poi: P) => void;
  /** Temps MapBox depuis le logement (spec 057) ; sinon `poi.travel` (démo). */
  travelTimes?: Record<string, TravelTimeValues> | null;
  /** Spec 055 : ligne « Se déplacer » vers les transports du guide. */
  transportEntry?: React.ReactNode;
}) {
  const welcome = splitWelcome(lodging.name);
  // Carrousel : sans urgences ni mobilité, avec un temps réel ou à défaut une
  // distance à vol d'oiseau depuis un logement localisé (specs 054 / 057).
  const featured = pois
    .filter((poi) => !STAY_HOME_EXCLUDED_CATEGORIES.has(poi.category.slug))
    .map((poi) => {
      const travel = primaryTravel(travelTimes?.[poi.id] ?? poi.travel);
      if (travel)
        return {
          poi,
          display: {
            ...poi,
            distanceLabel: travel.label,
            distanceMode: travel.mode,
          },
        };
      if (lodging.locationPrecise) {
        const meters = haversineMeters(
          lodging.latitude,
          lodging.longitude,
          poi.latitude,
          poi.longitude,
        );
        return {
          poi,
          display: {
            ...poi,
            distanceLabel: formatDistanceMeters(meters),
            distanceMode: "crow" as const,
          },
        };
      }
      return { poi, display: poi };
    });
  const departureTotal = departureTasks(lodging.departureInstructions).length;
  const stats = [
    lodging.stats.guests !== null
      ? {
          value: String(lodging.stats.guests),
          label: "Voyageurs",
          icon: UsersRound,
        }
      : null,
    lodging.stats.bedrooms !== null
      ? {
          value: String(lodging.stats.bedrooms),
          label: "Chambres",
          icon: BedDouble,
        }
      : null,
    lodging.stats.surfaceM2 !== null
      ? { value: `${lodging.stats.surfaceM2} m²`, label: "Surface", icon: null }
      : null,
  ].filter(
    (stat): stat is { value: string; label: string; icon: LucideIcon | null } =>
      stat !== null,
  );

  return (
    <div className="min-h-full bg-white pb-[120px]">
      <section className="relative mx-5 mt-4 h-[300px] overflow-hidden rounded-[28px] bg-white text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lodging.coverImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.1),rgba(17,17,17,0.88)_72%)]" /> */}
        {/* <span className="absolute left-5 top-6 rounded-full bg-[#DB2777] px-3 py-[7px] text-[11px] font-semibold uppercase tracking-[0.12em]">
          Votre guide de séjour
        </span> */}
        <div
          className={`absolute inset-x-5 ${stats.length > 0 ? "bottom-[96px]" : "bottom-6"}`}
        >
          <h1>
            <span className="block text-[13px] font-normal">
              {welcome.lead}
            </span>{" "}
            <span className="mt-1 block  text-[52px] font-medium  leading-[0.95] tracking-[-0.04em]">
              {welcome.name}
            </span>
          </h1>
          <p className="mt-2 text-[13px] text-white/80">{lodging.city}</p>
        </div>
        {stats.length > 0 && (
          <dl
            data-testid="guide-stay-stats"
            className="absolute inset-x-[14px] bottom-[14px] grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-row-reverse items-center justify-center gap-2 rounded-2xl bg-[rgba(17,17,17,0.6)] p-3 text-center"
              >
                <dt className="text-[11px] text-white/70">
                  <span className="sr-only">{stat.label}</span>
                  {stat.icon && (
                    <stat.icon
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  )}
                </dt>
                <dd className="text-[18px] font-semibold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Vidéo de présentation saisie par l'Owner (spec 044), conservée sous les tuiles. */}
      {lodging.presentationVideoUrl ? (
        <div className="mx-5 mt-2.5">
          <GuideLodgingVideoButton url={lodging.presentationVideoUrl} />
        </div>
      ) : null}

      <section
        className="mx-5 mt-3.5 grid grid-cols-2 gap-2.5"
        aria-label="Informations sur votre séjour"
      >
        <StayTile
          icon={LogIn}
          title="Arrivée"
          subtitle={`Dès ${formatGuideHour(lodging.checkIn)}`}
          dark
          onClick={() => onNavigate("arrival")}
        />
        <StayTile
          icon={Wifi}
          title="Wi-Fi"
          subtitle="Mot de passe"
          onClick={onOpenWifi}
        />
        <StayTile
          icon={BookOpen}
          title="Guide "
          subtitle="Équipements et règles"
          onClick={() => onNavigate("rules")}
        />
        <StayTile
          icon={LogOut}
          title="Départ"
          subtitle={`${departureDone} sur ${departureTotal} faits`}
          onClick={() => onNavigate("departure")}
        />
      </section>

      {transportEntry ? (
        <div className="mx-5 mt-2.5">{transportEntry}</div>
      ) : null}

      {featured.length > 0 && (
        <section aria-labelledby="stay-featured-title" className="mx-5 mt-[26px] p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="stay-featured-title" className="inline-flex w-fit rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-900">
              Nos coups de cœur
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("favorites")}
              aria-label="Voir tous les coups de cœur"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
            >
              <Eye className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="no-scrollbar -mr-4 mt-2 flex snap-x gap-3 overflow-x-auto pr-4 pb-1">
            {featured.map(({ poi, display }) => (
              <div key={poi.id} className="w-[160px] shrink-0 snap-start">
                <GuideFavoriteBentoCard
                  poi={display}
                  variant="compact"
                  onSelectPoi={() => onOpenPoi(poi)}
                  onShowOnMap={() =>
                    onShowPoiOnMap ? onShowPoiOnMap(poi) : onOpenPoi(poi)
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StayTile({
  icon: Icon,
  title,
  subtitle,
  dark = false,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  dark?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title} — ${subtitle}`}
      className={`flex min-h-[112px] w-full items-center gap-2.5 rounded-[22px] p-3 text-left shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777] active:scale-[0.98] ${
        dark
          ? "bg-[linear-gradient(135deg,#202d3d,#263546)] text-white"
          : "bg-white text-[#202b3a]"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] ${
          dark ? "bg-white/15" : "bg-[#EEF1F4]"
        }`}
      >
        <Icon
          className={`h-7 w-7 ${dark ? "text-[#EC3186]" : "text-[#202b3a]"}`}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </span>

      <span className="flex min-w-0 flex-col items-start gap-1">
        <span className="text-[15px] font-bold leading-tight tracking-[-0.025em]">
          {title}
        </span>
        <span
          className={`text-[11px] leading-[1.3] ${
            dark ? "text-[#B6C0CE]" : "text-[#747F92]"
          }`}
        >
          {subtitle}
        </span>
      </span>
    </button>
  );
}
