# Howto build this Tutorial Page

## Prerequisites

Have Node.js installed and run

```
npm install
```

!!! DO ONLY EDIT FILES IN `_images` and `_page` ALL OTHER FILES MIGHT GET OVERWRITTEN !!!

## Building the images

Images will be processed manually from `/_images/` to `/images/`. Run:

```
npm run build:img
```


## Building the page

Pages will be processed from `/_page/` to `/`

### a) for Production

Build for production

```
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
