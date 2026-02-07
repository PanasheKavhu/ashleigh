# Valentine's micro-site

Quick scaffold to ask Ashleigh to be your Valentine. Replace the placeholder images in `assets/images/` with real photos.

How to test locally:

1. Open `index.html` in a browser (double-click) or run a static server:

```bash
# from this folder
python -m http.server 8000
# then open http://localhost:8000
```

Deployment (recommended: Vercel):

```bash
git init
git add .
git commit -m "Valentine site"
# create a GitHub repo and push OR use vercel CLI
npm i -g vercel
vercel login
vercel --prod
```

Replace `assets/images/*` with personal photos; the site uses a generated melody by default.

To use your own music:

- Put an MP3 at `assets/audio/song.mp3`. The site will attempt to load and play that file when the carousel scrolls into view. If the browser blocks autoplay, a tap anywhere will allow playback.

To tune the reveal timing on the asking page, set the `data-reveal-delay` attribute (milliseconds) on the `main` element in `ask.html`, e.g. `<main class="page ask-page" data-reveal-delay="900">`.
