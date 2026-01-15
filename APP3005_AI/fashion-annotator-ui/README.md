# Fashion Annotator UI

React + Vite UI for row-by-row fashion annotation from a Google Sheet.

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Netlify
Build command: `npm run build`
Publish directory: `dist`

## Google Sheet setup
- Share the sheet with anyone who has the link, or use "Publish to the web".
- The app uses a default sheet URL; set `VITE_SHEET_URL` to override it (Netlify env var or a local `.env`).

Example:
```
VITE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../edit#gid=0
```

The app accepts common column headers like Image, Occasion, Recommended Body Shape,
Recommended Size, Skin Tone, Clothing Type, Fit, Fabric, Color_family, Style,
Description, and Score.

Edits are kept in-browser for now. If you need to push updates back to Sheets or
export CSV/JSON, we can add that next.
