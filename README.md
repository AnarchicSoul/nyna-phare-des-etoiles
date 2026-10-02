# Nyna et le Phare des Étoiles

Un jeu web en français pour s'entraîner aux tables de multiplication en aidant Nyna à rallumer le phare des îles du ciel.

![Nyna explore les îles du ciel](assets/nyna-aventure.webp)

## Jouer

Ouvrez `index.html` dans un navigateur récent sur PC. Sur téléphone, le plus simple est d'utiliser une version hébergée sur Netlify. Aucun compte de jeu ni installation n'est nécessaire.

- Choisissez une ou plusieurs tables de 1 à 10, puis partez pour 10 calculs.
- Les calculs manqués reviennent en révision. Une erreur ne retire jamais d'éclats.
- Chaque bonne réponse du premier coup rapporte **4 éclats**. Une réponse trouvée en 10 secondes ou moins donne **2 éclats bonus**. Une bonne réponse en révision rapporte **2 éclats**. Aucun décompte ne bloque la partie.
- Les bonnes réponses ramènent la lumière au phare et débloquent les cinq étapes de l'histoire.
- Trois défis du jour rapportent des éclats supplémentaires, une seule fois par jour. Ils reviennent à zéro à la date locale suivante.
- La boutique permet d'acheter directement des objets de collection avec les éclats du jeu. Il n'y a ni paiement réel ni tirage aléatoire.

La progression est conservée dans le stockage local du navigateur utilisé. Elle n'est pas synchronisée entre appareils ni entre navigateurs. Le son est désactivé par défaut.

## Mettre en ligne sur Netlify

Le site est statique et ne demande aucun build. Téléchargez [l'archive Netlify](https://github.com/AnarchicSoul/nyna-phare-des-etoiles/releases/latest/download/nyna-netlify.zip), ouvrez [Netlify Drop](https://app.netlify.com/drop), puis glissez-déposez l'archive. Netlify fournira une adresse `netlify.app` à partager. Se connecter à son compte Netlify est conseillé pour pouvoir conserver et modifier le site facilement.

Après une première visite en ligne, les fichiers sont gardés en cache pour jouer hors connexion sur le même appareil. L'ouverture locale de `index.html` fonctionne également sans connexion.

## Version Android

Téléchargez [l'APK Android](https://github.com/AnarchicSoul/nyna-phare-des-etoiles/releases/latest/download/Nyna-et-le-Phare-Android.apk). Copiez-le sur le téléphone Android, ouvrez-le depuis l'application Fichiers, puis autorisez l'installation depuis cette source si Android le demande. L'application fonctionne sans connexion et ne demande aucun compte ni paiement. Elle prend en charge Android 7.0 et versions ultérieures.

Cet APK est signé avec la clé de développement de ce PC pour une installation familiale directe. Il n'est pas préparé pour une publication sur Google Play.

Le dossier `android/` contient le projet Android qui embarque le jeu.

Pour la compiler à nouveau : ouvrez le dossier `android/` dans Android Studio, installez le SDK Android 36 si demandé, puis lancez la tâche Gradle `assembleDebug`. Le fichier généré se trouve dans `android/app/build/outputs/apk/debug/app-debug.apk`. Le projet copie automatiquement les fichiers du jeu depuis ce dossier avant chaque compilation.

La sauvegarde de l'application Android est distincte de celle du navigateur ou du site Netlify. Les gains déjà obtenus sont conservés après fermeture de l'application ; une partie interrompue recommence au début. Une désinstallation peut effacer la progression. Pour conserver la progression lors d'une mise à jour, installez la nouvelle version avec la même signature Android.

## Fichiers

`index.html`, `style.css` et `game.js` contiennent le jeu. `assets/nyna-aventure.webp` est son illustration, et `favicon.svg` son icône. `sw.js` ajoute le mode hors connexion lorsque le jeu est hébergé. L'archive Netlify contient uniquement ces fichiers. `android/` contient le projet de l'application Android.
