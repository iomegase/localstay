# ADR-004 — Soft delete systématique

## Statut

`accepted`

---

## Contexte

Les POI, logements, commerçants et réservations doivent pouvoir être désactivés sans perte de données. Les statistiques et l'audit trail doivent rester cohérents même après suppression.

---

## Décision

Par défaut, **aucune suppression physique** n'est effectuée dans ce projet. Tout enregistrement supprimé reçoit un `deleted_at` timestamp. Les queries filtrent systématiquement `WHERE deleted_at IS NULL`.

Exceptions validées par le Product Owner le 2026-06-04 :

- Les QR codes sont remplacés physiquement lors d'une régénération. Les anciens QR codes ne sont pas conservés en base.
- Les candidats d'acquisition POI non approuvés peuvent être purgés physiquement par les tâches de nettoyage dédiées. Cette exception ne s'applique pas aux POI publiés.

---

## Justification

Préserve l'intégrité référentielle, permet la restauration, et maintient l'audit trail pour la facturation et les statistiques.

---

## Conséquences

- Chaque modèle Prisma persistant et restaurable inclut `deleted_at DateTime?`
- Les Server Actions de suppression ne font qu'un `UPDATE SET deleted_at = now()`
- Les queries Prisma incluent systématiquement `where: { deleted_at: null }`
- Un middleware Prisma peut automatiser ce filtre (à évaluer)
- Les modèles explicitement listés comme exceptions dans cette ADR n'ont pas vocation à être restaurés.

---

## Date

2026-05-20

## Auteur

Product Owner
