# Migration inventory — baseline 5c32ee0

The original dist was preserved during _site verification, then converted to generated output after the baseline browser/upgrade gates passed. Hashes identify the pre-migration files; controller and Svelte components replace old rendering. Legacy ui render functions remain only for regression evidence and are not mounted by the new app.

| Baseline file | Destination / disposition | SHA-256 |
| --- | --- | --- |
| dist/app.mjs | src/lib/services/controller.mjs (Svelte render bridge) | bf710b10bd3effab083c77448c960a1fa2d88f3350d375946f42272f053117b4 |
| dist/art-challenge.webp | public/art-challenge.webp | 7fd8576e88bbe2e8c926c773b303408b7097a83183de24c15a9acb4c87a912e3 |
| dist/art-cooperate.webp | public/art-cooperate.webp | f775b90a7840b0c65096f0fcca5a4c09d45e68654b1c93b962778bb30ea164b3 |
| dist/art-discover.webp | public/art-discover.webp | 56aea900f52c5acf4e9a538e646eddca91c5a2df6b532fc14ee48b4bc7240adb |
| dist/art-explore.webp | public/art-explore.webp | 9b905a836ca4c5e58839e77951c4433807758595ea5d4f956c6f392ad429987c |
| dist/art-photo.webp | public/art-photo.webp | 5cea2f236c8b07d6ec9225f06a00c17eadea521607c61e4d0887f0fda3baed5f |
| dist/art-shop.webp | public/art-shop.webp | 774fcda6a3fd6d68ecef5d9914e1956a17c175b8f497490e3c0460b6da26834a |
| dist/art-sound.webp | public/art-sound.webp | 83684314e7dc562aec1c87ff2ac32d3e59ffd9a0b6784d45af6539a65130af3b |
| dist/art-talk.webp | public/art-talk.webp | 1e4adbcb737aa293d7df092e4516e7943f44b69ccd5bc0a07e8ba5dd6b4c0dee |
| dist/art-track.webp | public/art-track.webp | f36b12d862cc4d61ac2f522efce435fe27dc53a22973dea204c3c01ff46bb847 |
| dist/art.mjs | src/lib/ui/art.mjs | ccea10dfdbe73293b3bea1c4c109c8365fbb770dce50bc1df2266d63284e8c9c |
| dist/card-back.webp | public/card-back.webp | edf60791fa240c1c7a372e7045332c28d157c3545e70c94dfb90b760c7e40432 |
| dist/card-object.css | TaskCard / Passport / JourneyProgress / RewardPreview / ScoreBreakdown / Home / Walk / App component styles and src/styles/accessibility.css | fc6ff244756c63d940bac2909bf491083173737073acf48c16d8258ba49311e5 |
| dist/cards.css | src/styles/motion.css | 3f7152e0612e35f213c875954c515afb911a3f38fee0f29b60096254df2f4976 |
| dist/cards.mjs | src/lib/domain/cards.mjs | 70a8e88410325d92a9a7cfc9e4c9f72d4c104bf2c1bf05073d67db74f677314d |
| dist/chest-closed.webp | public/chest-closed.webp | 7e22039bd011ba5ab2c6856e84674b8445597e1f130f9a5810ba6194c0241706 |
| dist/chest-open.webp | public/chest-open.webp | 40729bcbf6b394e2d610ec3a5d217cf6d52bddeaf484a92391663fd190035eb1 |
| dist/collection-view.mjs | src/lib/ui/collection-view.mjs | 7981153eec16b3ecd0d4bbfc80171777a8d43df4c7e06b0743197e5a52824af6 |
| dist/core.mjs | src/lib/domain/core.mjs | ca8fe4444b10c5e1922c6439ce9941c61b87a97aa6604c5e782f874c52465eb7 |
| dist/deck-pattern.svg | public/deck-pattern.svg | 1a0a580b0f0b6bacaac45693e76a7971e311deb1e45a063d3695c638d6cfe46c |
| dist/drafts.mjs | src/lib/services/drafts.mjs | bbb0b0b21e964553647ab92f8c7addbf92c45d738a1ff15d272646e6f58e1365 |
| dist/explorer-badge.webp | public/explorer-badge.webp | e04180aa416712c27f6de0f054dd9cafa392bb9734f48c61303c54b831fad472 |
| dist/icon-180.png | public/icon-180.png | 02117274da795c5fc4dfc44ab14d9c2e0fc0918bb89d0988486dd1cffe0db624 |
| dist/icon-192.png | public/icon-192.png | 75115351eb36261b3f5b94965d73294eba5362357c58119ff6f910ff75ebcd05 |
| dist/icon-512.png | public/icon-512.png | 350ce3402681e5e8b3c8d27e1c70ce93df57e8d0dc99f2681c7051fb955f40b9 |
| dist/icon-maskable.png | public/icon-maskable.png | 350ce3402681e5e8b3c8d27e1c70ce93df57e8d0dc99f2681c7051fb955f40b9 |
| dist/index.html | index.html / src/main.ts / src/App.svelte | 0109483bd3cfbd43a0efe5ee038b246f069d32628a89d3291e5c9e0fa3b3ac86 |
| dist/journey-departure.webp | public/journey-departure.webp | 31df561327b7e61371dda35cd6709618b284a6c45593e8ff1fe602840759ffd0 |
| dist/journey-keepsake.webp | public/journey-keepsake.webp | cf6fbad9400ae79384854be1874b17d58b3eb182ecd079760390f1637663c558 |
| dist/journey-view.mjs | src/lib/ui/journey-view.mjs | 1c2181bd5ef9cc09eb8df7aa7e2a0863e9b1de454ac77c230860c5749737c57e |
| dist/manifest.webmanifest | public/manifest.webmanifest | 5c0b59cde7574c46c5b871385c5227280cd11b1ae6e86e2ced97c520eabc8843 |
| dist/pixel.css | src/styles/theme.css | f9de819b5c327a88a48062e0989b40f634694e44ef7c8f54b0bd0b2b93715049 |
| dist/release.mjs | generated release.json and compatibility release.mjs | 7cfc5e79c75675bc6b9027986c5a9170bd1f12ee83e70e3fdc77ae8c365c60e4 |
| dist/rewards.mjs | src/lib/interactions/rewards.mjs | 4541729496706a8da4edaee4dc7659a6d127a81681d19d2f2fc078eb45aea13b |
| dist/storage.mjs | src/lib/services/storage.mjs | 01707cfeca1aca776cce44de5ee7711bf098bf90a5a6015585b9f2d141333c19 |
| dist/style.css | src/styles/base.css | 0120365a14e66464d771436904c56033b6e5f18260be2d3def89edd5b67384e7 |
| dist/sw.js | src/lib/services/sw-template.js | de350d7309a44b78fe2a85cd4bd6e25833b92c2a53b9eda95bc91e76520539f5 |
| dist/swipe.mjs | src/lib/interactions/swipe.mjs | f03f5d36ff239e76e3cdb9afd44bbc140b756199152f5f1ddc69d2db1c636cf3 |
| dist/task-view.mjs | src/lib/ui/task-view.mjs | 9e10d22bab2611227aa6e9a18e07a61bd16c4a88ca189054013b07e3ae36013b |
| dist/themes.mjs | src/lib/ui/themes.mjs | 3c41895a5918c5b65f553745a9a9825f389ad20081e26d9c0c1c0d83e93a4dcb |
| dist/updates.mjs | src/lib/services/updates.mjs | 5ebd3012237fa8a469e0b469140f23a08fa53c682b4cbbd76919f84440ff286e |
| dist/views.mjs | src/lib/ui/views.mjs | fd2a81899ebf952c376b107a4af4a427d186c186648318a14ab0b3f88e36bf43 |
