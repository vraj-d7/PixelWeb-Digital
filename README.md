# PixelWeb Digital

Website for PixelWeb Digital, a web design and development studio. Built with [Astro](https://astro.build).

## Pages

- `/`: home (hero, who we are, services, call to action)
- `/services/`: the five services in detail
- `/about/`: how we work and what to expect
- `/contact/`: Instagram DM, email, WhatsApp and a contact form

## Editing content

Contact details, services and the process steps all live in `src/data/site.ts`. Before launch:

- **email**: set the real address
- **whatsapp**: add the number (digits only, with country code). The WhatsApp link appears once this is set.
- **formEndpoint**: create a free form at [formspree.io](https://formspree.io) and paste its URL. Until then the contact form opens the visitor's email app with the message filled in.
- **site** in `astro.config.mjs`: set the real domain

Brand colours and fonts are in `src/styles/global.css`.

## Commands

```bash
npm install
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
```
