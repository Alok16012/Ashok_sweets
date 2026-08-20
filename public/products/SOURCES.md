# Product image sources

These are **category** photographs, not photographs of Nakhye's Ashok Sweets'
own products. Every item in a category shares one picture. They are locally
optimized derivatives of images made available through Wikimedia Commons and
Wikipedia, kept only where the picture actually shows the food it is filed
under. Replace them with the shop's own photography before launch.

| File | Shows | Used for |
| --- | --- | --- |
| `bakarwadi.jpg` | Bakarwadi rolls | Bakarwadi |
| `chiwada.jpg` | Chivda / farsan mix | Chiwada, Khara |
| `halwa.jpg` | Coconut halwa | Halwa |
| `kaju.jpg` | Kaju katli | Kaju |
| `khaja-balushai.jpg` | Balushahi | Khaja / Balushai |
| `ladu.jpg` | Motichoor ladoo | Ladu |
| `other-sweets.jpg` | Gulab jamun | Other Sweets |
| `pedha.jpg` | Kesar peda | Pedha |
| `shrikhand.jpg` | Shrikhand | Shrikhand |
| `_placeholder.svg` | — graphic stand-in | Bangali, Burfi, Vadi, Chat |

Links: [Bakarwadi](https://commons.wikimedia.org/wiki/File:Bakarwadi-pune-maharashtra-001.jpg)
· [Chivda](https://en.wikipedia.org/wiki/Chivda)
· [Barfi / halwa](https://en.wikipedia.org/wiki/Barfi)
· [Kaju katli](https://en.wikipedia.org/wiki/Kaju_katli)
· [Balushahi](https://en.wikipedia.org/wiki/Balushahi)
· [Laddu](https://en.wikipedia.org/wiki/Laddu)
· [Gulab jamun](https://en.wikipedia.org/wiki/Gulab_jamun)
· [Peda](https://en.wikipedia.org/wiki/Peda)
· [Shrikhand](https://en.wikipedia.org/wiki/Shrikhand)

## Why four categories have no photograph

The stand-ins that were filed against these categories showed the wrong food,
so they were removed rather than corrected in place:

- **Bangali** carried a non-vegetarian Bengali thali — chicken curry and rice —
  on all 25 Bengali sweet products, in a shop whose own copy says it makes
  vegetarian sweets.
- **Burfi** carried a bowl of coconut halwa, on all 28 barfi products.
- **Vadi** carried a byte-identical copy of that same halwa photograph.
- **Chat** carried a plate of dhokla, which is not chaat.

Until real photographs exist, these render `_placeholder.svg`. Dropping a
correctly-named JPEG into this directory and repointing `src/catalogue.json`
is all that is needed to bring a category back.
