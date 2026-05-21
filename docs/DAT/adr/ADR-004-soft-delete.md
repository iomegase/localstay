# ADR-004 — Soft delete systématique

## Statut

`accepted`

---

## Contexte

Les POI, logements, commerçants et réservations doivent pouvoir être désactivés sans perte de données. Les statistiques et l'audit trail doivent rester cohérents même après suppression.

---

## Décision

**Aucune suppression physique** n'est effectuée dans ce projet. Tout enregistrement supprimé reçoit un `deleted_at` timestamp. Les queries filtrent systématiquement `WHERE deleted_at IS NULL`.

---

## Justification

Préserve l'intégrité référentielle, permet la restauration, et maintient l'audit trail pour la facturation et les statistiques.

---

## Conséquences

- Chaque modèle Prisma inclut `deleted_at DateTime?`
- Les Server Actions de suppression ne font qu'un `UPDATE SET deleted_at = now()`
- Les queries Prisma incluent systématiquement `where: { deleted_at: null }`
- Un middleware Prisma peut automatiser ce filtre (à évaluer)

---

## Date

2026-05-20

## Auteur

Product Owner
