# Howto build this Tutorial Page

## Prerequisites

Have Node.js installed and run

```
npm install
```

## Building the images

Images will be copied from `/_images/` to `/build/images/` and optimized in size. Run:

```
npm run build:img
```

  * :bangbang: GitHub Actions runs this before *build:prod*
  * Locally you don't need to run it since the images from `_images` will be proxied through to `http://localhost:port/kitchen-duty-plugin-for-atlassian-jira/images/` when running `npm run watch`
  * Only when you want locally start prod env you need to to run it.

## Building the page

Pages will be processed from `/_page/` to `/build/`

### a) for Production

Build for production

```
npm run build:img
npm run build:prod
```

Start the server

```
npm run start:prod
```


### b) for Development

Builds with unminified js a.s.o

```
npm run build
```

Building and live-reload for the page
 
```
npm run watch
```

Now the Browserpage reloads on changes made to `_page/*`
