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

Validation de production du 29 septembre 2026 à 13:18 UTC : la demande réelle
retourne 200 grâce au secours Resend, dont le statut de livraison est
`delivered`. Le lien livré vise bien `www.mystay.city/auth/reset-password` avec
`token_hash`. Le formulaire et les boutons œil ont été vérifiés dans Chromium.
Le mot de passe de l'utilisateur n'a pas été modifié pendant ces contrôles.

Les clients Auth utilisent `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en priorité.
Si elle est absente ou vide, ils utilisent `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour
les anciens projets. Une clé publishable déjà configurée ne doit pas être
ignorée au profit d'une ancienne variable anon. La clé service-role reste
réservée aux opérations serveur d'administration.

Après cette correction, le service Auth a accepté la clé mais a répondu 500
« Error sending recovery email ». Pour cette panne d'envoi explicite, l'API
dispose d'un secours : lien `recovery` généré par Supabase Admin, envoyé par
Resend depuis `bonjour@mystay.city`. Il utilise `SUPABASE_SERVICE_ROLE_KEY` et
`RESEND_API_KEY` côté serveur. Un quota 429 ou un refus 401 du service Auth
n'est jamais contourné. L'API annonce le succès seulement après acceptation du
mail par Resend ; l'identifiant d'envoi permet de contrôler sa livraison.

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

L'application accepte `token_hash` et le vérifie seulement à la soumission du
nouveau mot de passe. Elle accepte aussi le lien `ConfirmationURL` standard
Supabase : son code PKCE est échangé à la soumission avec le vérificateur stocké
dans le navigateur qui a demandé le lien. Pour ce format standard, ouvrir
l'email dans ce même navigateur. Le lien personnalisé `token_hash` convient
aussi à une ouverture depuis un autre appareil.

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

## Inscription et confirmation de l'adresse

La même panne SMTP bloque aussi `signUp` avec « Error sending confirmation
email ». L'inscription utilise dans ce cas un lien Supabase `signup` envoyé
par Resend. Le compte reste non confirmé : le formulaire affiche l'attente et
le lien ouvre `/auth/confirm-registration?token_hash=…`. Un clic explicite
vérifie le jeton, crée la session et ouvre l'espace owner ou merchant. Les
prévisualisations d'email ne consomment pas le jeton.

Le domaine de l'email de bienvenue a été aligné sur `bonjour@mystay.city`, déjà
vérifié. Les quotas et refus Auth ne sont pas contournés. Le script SMTP ajoute
aussi `/auth/confirm-registration` aux URL autorisées et configure le modèle
de confirmation. Sans jeton de gestion Supabase, il ne modifie rien à distance.
