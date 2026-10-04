import { MapPin } from "lucide-react";
import type { GuideBlogDetail } from "../types";
import { GuideBlogMarkdown } from "./GuideBlogMarkdown";

/** Spec 054 AC-07-02 — article du Journal dans le guide privé. */
export function GuideBlogArticle({ detail }: { detail: GuideBlogDetail }) {
  return (
    <article className="mx-auto mt-5 max-w-[680px]">
      {detail.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- couverture distante du guide
        <img
          src={detail.coverUrl}
          alt=""
          className="aspect-[4/3] w-full rounded-[1.6rem] object-cover"
        />
      )}
      <header className="pb-7 pt-6">
        {detail.categoryLabel && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-pink-600">
            {detail.categoryLabel}
          </p>
        )}
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.15] tracking-[-0.035em] text-slate-900">
          {detail.title}
        </h1>
        {detail.cityName && (
          <p className="mt-6 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
            {detail.cityName}
          </p>
        )}
      </header>
      <div className="border-t border-slate-200 pt-7">
        <GuideBlogMarkdown source={detail.contentMarkdown} />
      </div>
    </article>
  );
}
