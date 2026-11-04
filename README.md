# Perechi! — joc mobil PWA

Un joc de memorie în limba română, realizat în HTML, CSS și JavaScript simplu. Funcționează pe Android, iPhone, tabletă și calculator; după prima încărcare și instalarea workerului, funcționează și fără internet.

## Funcții
- 3 dificultăți: 6, 8 sau 10 perechi
- Cronometru, număr de mutări, progres
- Record local separat pentru fiecare dificultate (cel mai mic număr de mutări; departajare după timp)
- Buton Joc nou, sunet opțional, animații
- Instalabil ca PWA, iconuri incluse, fără server/backend, fără biblioteci externe

## Publicare pe GitHub Pages
1. Creează un repository GitHub nou, de exemplu `perechi` (public pentru Pages pe planul gratuit).
2. Deschide arhiva ZIP și **încarcă fișierele și folderul `icons` direct la rădăcina repository-ului**, nu folderul `perechi_pwa` întreg.
3. Intră în **Settings → Pages**.
4. La **Build and deployment → Source**, alege **Deploy from a branch**.
5. Selectează **main**, folder **/(root)**, apoi **Save**.
6. URL-ul va fi de forma `https://UTILIZATOR.github.io/perechi/`.
7. Deschide jocul pe telefon o dată cu internet. Ulterior, fișierele jocului sunt disponibile și offline.

## Instalare
- Android / Chrome: meniul browserului → **Instalează aplicația** (sau „Adaugă pe ecranul principal”).
- iPhone / Safari: butonul Partajare → **Adaugă pe ecranul principal**.

## Testare locală
Din folderul proiectului: `python -m http.server 8000`, apoi deschide `http://localhost:8000`.
**Nu folosi `file://`** pentru a testa service worker-ul: necesită HTTPS sau localhost.

## Actualizări
Pentru o versiune nouă, schimbă numele `CACHE` în `service-worker.js` (de exemplu `perechi-offline-v2`) după ce ai modificat fișierele. Vizitează pagina online ca să se încarce versiunea nouă; uneori trebuie închisă și redeschisă aplicația.

## Confidențialitate
Nu există conturi sau colectare de date; recordurile și preferința pentru sunet sunt stocate doar în browser, prin localStorage.
