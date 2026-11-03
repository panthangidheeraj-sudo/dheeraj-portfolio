# Dheeraj Panthangi — Portfolio

React · TypeScript · Vite · Tailwind · GSAP/ScrollTrigger · Three.js · OGL

Pages: Home · My Work (+ case studies) · Achievements (3D museum) · What I Offer · Contact · local Admin.

---

## 1. Run it on your computer

You need **Node.js 18 or newer** (get the LTS from https://nodejs.org).

1. Open a terminal in this folder (in VS Code: *Terminal → New Terminal*).
2. Install the packages (only needed once):
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the address it prints, usually http://localhost:5173.

Stop it with `Ctrl + C`.

To check a production build locally:
```bash
npm run build
npm run preview
```

---

## 2. Put it online with Render

The project includes a `render.yaml`, so Render can configure itself from it.

1. Push this folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. On https://render.com, sign in with GitHub and choose **New → Blueprint**.
3. Pick the repository. Render reads `render.yaml` and creates a **Static Site**:
   - Build command: `npm ci && npm run build`
   - Publish directory: `dist`
   - Rewrite `/*` → `/index.html`, so links like `/work/orion` work when opened directly.
4. Click **Apply**. Each later `git push` redeploys automatically.

(Setting it up by hand with **New → Static Site** works too. Use the same build command and publish directory, and add the rewrite rule under *Redirects/Rewrites*.)

---

## 3. Contact and enquiry forms

The site has no backend yet, so the forms work in one of two ways:

- **No key set (default):** pressing *Send* opens the visitor's email app with the message already written to `panthangidheeraj@gmail.com`. The page says this plainly. The "Delivered with care" envelope **never** plays in this mode.
- **With a Web3Forms key:** messages go straight to your inbox, and the envelope plays only after Web3Forms confirms delivery.

To turn on direct delivery:

1. Go to https://web3forms.com and enter `panthangidheeraj@gmail.com` to get a free access key.
2. Locally: copy `.env.example` to `.env` and set `VITE_WEB3FORMS_KEY=your-key`.
3. On Render: go to *Site → Environment*, add `VITE_WEB3FORMS_KEY`, then redeploy.

The Web3Forms access key is meant to be public, so it is safe in frontend code. No private keys or passwords live anywhere in this project.

Both forms include a hidden honeypot field to filter bots and block duplicate submissions. If sending fails, everything the visitor typed is kept.

---

## 4. The admin dashboard

- `/admin` runs **only under `npm run dev` on your own computer**. On the live site, `/admin` just shows "available once the secure backend is connected". There is nothing to log into and nothing to attack.
- Editors:
  - **Projects:** order, publish, featured, card, case study, media.
  - **Achievements:** details, media, stand type, and a drag-to-place floor plan.
  - **What I Offer:** services, packages and pricing.
  - **Contact page:** channels, intro and closing text.
- **Save** stores changes in that browser, and the site at localhost shows them immediately.

### Publishing admin changes

1. In the admin sidebar, click **Export content JSON**. This downloads `portfolio-content.json`.
2. Copy the edited values into the matching file in `src/content/`:
   - `projects.ts`
   - `achievements.ts`
   - `services.ts`
   - `site.ts`
3. Commit and push. Render redeploys.

When the Supabase backend is added (see below), the admin will save straight to the database instead.

---

## 5. Replacing images and placeholders

All media lives in `public/media/` and is referenced as `/media/...`:

| Folder | What's there |
|---|---|
| `home/` | `hero.jpg` (pole photo), `subject.webp` (cut-out), `portrait.jpg` (About selfie) |
| `work/` | Project covers. These are **generated placeholder title cards**; replace them with real screenshots. |
| `museum/` | Certificates. These are **watermarked placeholders**; replace them with your real certificates. |
| `offer/`, `contact/` | The office scenes for the heroes (background and foreground layers, desktop and mobile). |

To replace an image, keep the file name, or change the path in admin or `src/content`. Any text shown in `[square brackets]` is a placeholder; fill it with real details or leave it.

**Still placeholder:**
- Achievement dates and organisations marked `[…]`.
- Two certifications, one technical recognition and one academic achievement.
- NetCoop AI details.
- Two empty project slots.
- Tech lists marked `[Add tools]`.
- Case-study sections.

Nothing on the site invents awards, clients, testimonials, metrics or prices. The only price shown is **Small scale web: starting at ₹4,000**.

---

## 6. Animations

- Everything is driven by GSAP (ScrollTrigger + SplitText) and Lenis smooth scrolling. After pulling this update, run `npm install` once.
- Add motion to any element with an attribute. The full list is at the top of `src/lib/motion.ts`. Examples: `data-m="rise"` (heading lines slide up), `data-m="curtain"` (image uncovers), `data-m="words"` (closing lines light up as you scroll).
- The hero name writes itself (`src/components/Cursive.tsx`). Changing the words needs new data; see `tools/handwriting/README.md`.
- Every full page load (including refresh) shows a short DP loader, starts at the top and replays the entrance animations. Page changes show an ink curtain with the page name. Doors and project covers expand into the next page.
- Phones get shorter, calmer motion with no parallax. With "reduce motion" switched on in the device settings, everything simply fades in.

## 7. Project structure

```
src/
  pages/        Home, Work, CaseStudy, Achievements, Offer, Contact, NotFound
  admin/        Local admin (dev only)
  components/   Nav/Footer, EnquiryForm, Modal, reactbits/ (FlexCarousel, InfiniteSpiral, Cubes)
  museum/       Three.js museum engine (loaded only on /achievements)
  content/      All site content and types (edit here)
  lib/          Content store, form delivery, GSAP motion helpers
  styles/       Global + per-page CSS (scoped per page)
public/media/   Images
render.yaml     Render static-site blueprint
```

**About the 3D museum:** it uses Three.js directly, not React Three Fiber. The scene is a self-contained engine with its own camera choreography, quality tiers and teardown, so wrapping it in R3F would add weight without adding anything. It loads only when someone opens Achievements. It drops to a lighter quality on weaker devices and falls back to a 2D gallery when WebGL isn't available.

---

## 8. Next step: backend (Supabase)

Planned:

- Tables for projects, achievements, services, contact channels, enquiries and messages.
- Storage buckets for media.
- Supabase Auth for a single admin account, with Row Level Security so only that account can write.
- An edge function for the forms (validation, rate limit, email notification).

Only the public **anon** key goes in the frontend. The service-role key stays on the server.
