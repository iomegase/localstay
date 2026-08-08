# Design — Normalisation de l’orientation EXIF des photos importées

## Contexte

Certaines photos prises en portrait avec un iPhone enregistrent les pixels dans
une orientation brute et décrivent la rotation attendue dans les métadonnées
EXIF. La conversion JPEG vers WebP actuelle supprime ces métadonnées sans
appliquer la rotation, ce qui peut produire une image paysage ou inclinée après
l’import.

## Décision

L’orientation est normalisée côté serveur, dans le service partagé
`uploadGuideImage`, avant toute conversion vers WebP. Sharp applique la
transformation EXIF aux pixels, puis génère le fichier stocké sans dépendre des
métadonnées d’orientation.

Cette correction s’applique aux formats convertis par le service partagé. Les
WebP et AVIF déjà normalisés et conservés sans conversion gardent leur
traitement actuel.

## Flux

1. Le navigateur transmet le fichier original sans transformation.
2. Le serveur valide son type et sa taille selon les règles existantes.
3. Pour un PNG ou JPEG à convertir, Sharp applique l’orientation EXIF.
4. Sharp encode le résultat en WebP avec la qualité existante.
5. Le WebP normalisé est téléversé dans Supabase Storage.

## Compatibilité et données existantes

- Aucun changement de schéma ou d’API.
- Tous les écrans utilisant `uploadGuideImage` bénéficient du correctif.
- Les images déjà stockées ne sont pas retraitées automatiquement.
- Le cadrage CSS public et l’ordre des photos ne changent pas.

## Gestion des erreurs

Les réponses et codes d’erreur existants restent inchangés. Une erreur de
décodage ou de conversion continue de faire échouer l’import selon le
comportement actuel du service.

## Vérification

- Ajouter un test serveur avec un JPEG synthétique muni d’une orientation EXIF.
- Vérifier que le WebP envoyé à Supabase possède les dimensions physiques
  correspondant à l’orientation affichée attendue et ne dépend plus de la balise
  EXIF.
- Vérifier qu’un JPEG sans orientation continue d’être converti normalement.
- Exécuter les tests existants des routes consommatrices du service partagé.

## Hors périmètre

- Retraitement automatique des fichiers déjà présents dans Supabase Storage.
- Rotation manuelle ou outil de recadrage dans l’interface.
- Modification de l’ordre ou de la mise en page des photos.
