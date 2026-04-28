# Admin Cloth Upload

Use this folder for server-side admin cloth import.

## Default input folder

The API reads images from:

- `admin-cloth-upload/incoming`

Supported image formats:

- `.jpg`
- `.jpeg`
- `.webp`

## Required metadata file

Create one file inside `incoming` named `metadata.json`.
This file must contain image-wise metadata.

Example structure:

```json
{
  "default": {
    "inventory_count": 10,
    "auto_approve": true,
    "category": "Saree"
  },
  "items": {
    "red_saree.jpg": {
      "title": "Red Party Saree",
      "category": "Saree",
      "price_cents": 329900,
      "description": "Premium festive saree",
      "sizes": ["M", "L"],
      "age_ranges": ["25-34"],
      "body_shapes": ["Hourglass"],
      "skin_tones": ["Medium"],
      "metadata": {
        "occasion": "party",
        "style": "festive"
      }
    },
    "blue-kurti": {
      "title": "Blue Kurti",
      "category": "Kurti",
      "price_cents": 189900
    }
  }
}
```

Note:

- Keys under `items` can be full filename (`red_saree.jpg`) or basename (`blue-kurti`).
- `title` and `price_cents` are required per image metadata (after default merge).
- Duplicate prevention is based on SHA-256 hash of image content.
- Sync processes only up to 100 images per click.
- Product + image DB writes are wrapped in one transaction per sync batch.

## Cleanup API

Use cleanup to remove products imported by this flow from Cloudinary and the database.

Endpoint:

- `POST /admin-cloth-upload/cleanup`

Body options:

- `source_folder` (optional): absolute or relative source folder path. Default is `admin-cloth-upload/incoming`.
- `limit` (optional): max products to process in one run (`1-100`, default `100`).
- `dry_run` (optional): when `true`, previews matched products without deleting anything.
- `hard_delete` (optional): when `true` removes product rows, when `false` only archives (`is_deleted=true`, `status=ARCHIVED`).

Example dry run:

```json
{
  "dry_run": true,
  "limit": 20
}
```

Example actual cleanup:

```json
{
  "hard_delete": true,
  "limit": 50
}
```
