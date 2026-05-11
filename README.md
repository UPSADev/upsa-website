# UPSA Website

Official website for the United Pakistani Students & Alumni Association.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## CMS

The site uses Decap CMS with Netlify Identity and Git Gateway.

Local CMS testing:

```bash
npx decap-server
```

Then open:

```text
http://localhost:3000/admin
```

Production CMS:

```text
https://your-site.netlify.app/admin
```

## Content

Editable content lives in:

```text
content/
```

CMS configuration lives in:

```text
public/admin/config.yml
```

## Deployment

The site is configured for Netlify. Build command:

```bash
npm run build
```

Publish directory:

```text
.next
```
