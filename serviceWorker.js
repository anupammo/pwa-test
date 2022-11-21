const staticDevCoffee = "dev-coffee-site-v1"
const assets = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./images/coffee1.webp",
  "./images/coffee2.webp",
  "./images/coffee3.webp",
  "./images/coffee4.webp",
  "./images/coffee5.webp",
  "./images/coffee6.webp",
  "./images/coffee7.webp",
  "./images/coffee8.webp",
  "./images/coffee9.webp",
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticDevCoffee).then(cache => {
      cache.addAll(assets)
    })
  )
})