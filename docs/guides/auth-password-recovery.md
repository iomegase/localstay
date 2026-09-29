# Réinitialisation du mot de passe — exploitation

Spec approuvée : 009-auth-owner, US-04 / AC-04-01 et AC-04-02.

## Diagnostic du 29 septembre 2026

Pour le compte admin existant, Supabase a répondu `429` avec
`over_email_send_rate_limit`. L'API et le formulaire ignoraient cette erreur et
affichaient un succès. Ils la signalent désormais sans exposer l'existence d'un
compte ni les détails du fournisseur. Les changements applicatifs doivent être
déployés pour être visibles sur le site public.

L'email de dépannage envoyé séparément par Resend a le statut `delivered`.
Cela confirme l'acceptation par le serveur destinataire, pas la lecture par
l'utilisateur ni la présence dans l'onglet principal de Gmail.

## Configuration à appliquer dans Supabase

Les clients Auth utilisent `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en priorité.
Si elle est absente ou vide, ils utilisent `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour
les anciens projets. Une clé publishable déjà configurée ne doit pas être
ignorée au profit d'une ancienne variable anon. La clé service-role reste
réservée aux opérations serveur d'administration.

Dans Authentication → Email → SMTP Settings, activer Custom SMTP :

| Champ | Valeur |
|---|---|
| Sender email | `bonjour@mystay.city` |
| Sender name | `MyStay` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Valeur de `RESEND_API_KEY` déjà configurée côté serveur |

Dans Email Templates → Reset password, utiliser ce lien :

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}">Définir mon nouveau mot de passe</a>
```

L'application attend `token_hash` et le vérifie seulement à la soumission du
nouveau mot de passe. Le lien `ConfirmationURL` par défaut vérifie le jeton
avant la redirection et ne correspond pas à ce contrat applicatif.

Dans URL Configuration, autoriser exactement
`https://www.mystay.city/auth/reset-password`. En production, vérifier que
`NEXT_PUBLIC_BASE_URL=https://www.mystay.city`. Pour les tests locaux, autoriser
explicitement l'adresse locale correspondante. Désactiver le suivi des liens
dans Resend pour les emails d'authentification.

La même configuration peut être appliquée par le script :

```sh
npx tsx scripts/configure-auth-email.ts
npx tsx scripts/configure-auth-email.ts --apply
```

La première commande affiche uniquement les paramètres sans secrets et ne
modifie rien. La seconde nécessite `SUPABASE_ACCESS_TOKEN` (jeton de gestion du
projet, distinct de `SUPABASE_SERVICE_ROLE_KEY`) et `RESEND_API_KEY` dans
l'environnement local. Ne pas coller ces valeurs dans un message ni les
committer. Le script conserve les autres URL autorisées et ne modifie ni les
comptes ni les mots de passe. Il ne modifie pas les quotas de sécurité.

Après application, vérifier une demande réelle, le statut de livraison Resend,
l'ouverture du formulaire, puis laisser l'utilisateur définir son mot de passe.
Ne pas ouvrir le lien de confirmation à sa place ni changer son mot de passe
pour effectuer un test.

Sources officielles : [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp),
[Resend SMTP pour Supabase](https://resend.com/docs/send-with-supabase-smtp),
[modèles et jetons Supabase](https://supabase.com/docs/guides/auth/auth-email-templates).
