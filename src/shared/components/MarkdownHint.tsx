/**
 * Bloc d'aide dépliable expliquant la syntaxe markdown aux owners/admins.
 * Présentationnel et réutilisable (form de personnalisation owner, édition POI admin…).
 */
export function MarkdownHint({ className = '' }: { className?: string }) {
  return (
    <details className={`group rounded-[18px] border border-gray-100 bg-[#F4F7FE]/40 ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#0B1437] outline-none [&::-webkit-details-marker]:hidden">
        Mise en forme (markdown)
        <span className="text-gray-400 transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="space-y-2 px-4 pb-4 text-[12px] leading-relaxed text-gray-600">
        <p>Mettez en forme vos textes avec une syntaxe simple :</p>
        <ul className="space-y-1">
          <li><code>**gras**</code> → <strong>gras</strong></li>
          <li><code>*italique*</code> → <em>italique</em></li>
          <li><code>## Sous-titre</code> → un titre <span className="text-gray-400">(un espace après les <code>#</code> est obligatoire)</span></li>
          <li><code>- élément</code> → une liste à puces (un élément par ligne)</li>
          <li><code>1. élément</code> → une liste numérotée</li>
          <li><code>[texte](https://…)</code> → un lien cliquable</li>
          <li><code>&gt; citation</code> → une citation · <code>---</code> → un séparateur</li>
          <li>Appuyez sur <strong>Entrée</strong> pour un retour à la ligne.</li>
        </ul>
      </div>
    </details>
  )
}
