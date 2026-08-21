import React, {
  memo,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Search,
  MapPin,
  ArrowUpRight,
  Bookmark,
  Plus,
  Minus,
  ChevronRight,
  Bell,
  MessageCircle,
  Package,
  LayoutGrid,
  User,
  SlidersHorizontal,
  X,
  Check,
  Clock,
  ShieldCheck,
  TrendingUp,
  Box,
  HeartHandshake,
  Zap,
  ShoppingCart,
  CreditCard,
  TicketPercent,
  Settings,
  Trash2,
  Send,
  Sparkles,
  Store,
  Recycle,
  Leaf,
  Star,
  Truck,
  ChevronDown,
  ArrowDownUp,
} from "lucide-react";
import SweetGuide from "./components/SweetGuide";
import catalogue from "./catalogue.json";
import "./styles.css";

type Item = {
  id: number;
  kind: "supply" | "demand";
  title: string;
  category: string;
  available: number;
  requested: number;
  unit: string;
  price: number;
  place: string;
  distance: string;
  seller: string;
  rating: string;
  image: string;
  note: string;
  expiry: string;
  stockKnown?: boolean;
  match?: string;
};
type CartLine = { item: Item; qty: number };
type SortKey = "relevance" | "price-low" | "price-high" | "availability";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
  { key: "availability", label: "Most available" },
];

/** Craving chips on the home rail map to a search term, not a category. */
const CRAVINGS = [
  "Ladu",
  "Kaju katli",
  "Burfi",
  "Halwa",
  "Peda",
  "Gift boxes",
];
type SiteView =
  | "discover"
  | "market"
  | "detail"
  | "create"
  | "dashboard"
  | "cart"
  | "checkout"
  | "adminLogin"
  | "admin"
  | "legal";
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}
/* The generated placeholder catalogue that used to live here (featuredItems,
   sweetNames, sweetImages and the legacyItems it built) went unused once
   `items` began reading the real catalogue, but still shipped in the bundle. */

/* Shown wherever the shop has no photograph it can stand behind. Several
   categories used to carry a stand-in that showed the wrong food outright —
   a non-vegetarian thali on the Bengali sweets, a bowl of halwa on every
   barfi — which is worse than showing no photograph at all. */
const PHOTO_PLACEHOLDER = "/products/_placeholder.svg";

/* A returning browser hydrates the catalogue from its own copy, so a shipped
   correction to the catalogue is invisible until this key changes. Bump it
   whenever src/catalogue.json changes in a way customers must see — v4 moves
   the catalogue from one photograph per category to one per kind of sweet. */
const PRODUCTS_KEY = "ashok-products-v4";
const STALE_PRODUCT_KEYS = [
  "ashok-products",
  "ashok-products-v2",
  "ashok-products-v3",
];

const items: Item[] = catalogue.map((product) => ({
  id: product.id,
  kind: "supply" as const,
  title: product.title,
  category: product.category,
  available: 99,
  requested: 0,
  unit: product.unit,
  price: product.mrp,
  place: "Dombivli East & West",
  distance: "Both stores",
  seller: "Nakhye’s Ashok Sweets",
  rating: "Catalogue price · 14 Aug 2026",
  image: product.image,
  note: `MRP ₹${product.mrp}/${product.unit} · confirm availability with store`,
  expiry: "Freshness details on pack",
  stockKnown: false,
}));

function Balance({
  item,
  large = false,
  preview,
}: {
  item: Item;
  large?: boolean;
  preview?: number;
}) {
  if (item.stockKnown === false) {
    return (
      <div className={"balance " + (large ? "large" : "")} aria-label="Availability confirmed by the store">
        <div className="balance-labels">
          <span><b>Store availability</b></span>
          <span>Confirm at checkout</span>
        </div>
        <div className="track"><i style={{ width: "100%" }} /></div>
      </div>
    );
  }
  const value = preview ?? item.requested,
    total = item.available + item.requested,
    supply = Math.max(
      0,
      item.available - (preview ? preview - item.requested : 0),
    );
  const pct = Math.max(4, Math.round((supply / total) * 100));
  return (
    <div
      className={"balance " + (large ? "large" : "")}
      aria-label={`${supply} ${item.unit} available, ${value} requested`}
    >
      <div className="balance-labels">
        <span>
          <b>{supply}</b> available
        </span>
        <span>
          <b>{value}</b> requested
        </span>
      </div>
      <div className="track">
        <i style={{ width: `${pct}%` }} />
        <em />
      </div>
    </div>
  );
}

const Card = memo(function Card({
  item,
  onOpen,
  saved,
  onSave,
  onAdd,
}: {
  item: Item;
  onOpen: () => void;
  saved: boolean;
  onSave: () => void;
  onAdd: () => void;
}) {
  const low =
    item.stockKnown !== false && item.kind === "supply" &&
    item.available / (item.available + item.requested) < 0.3;
  return (
    <article
      className={"listing " + item.kind}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <div className="photo">
        <img
          src={item.image}
          alt=""
          loading="lazy"
          decoding="async"
          width={420}
          height={300}
          style={{ viewTransitionName: `sweet-${item.id}` }}
        />
        <span className="kind">
          {item.kind === "supply" ? "Available" : "Wanted"}
        </span>
        <button
          className={"save " + (saved ? "on" : "")}
          aria-label={saved ? "Remove saved item" : "Save item"}
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="cardbody">
        <p className="eyebrow">
          {item.category} · {item.distance}
        </p>
        <h3>{item.title}</h3>
        <Balance item={item} />
        <div className="cardfoot">
          <span>
            {item.kind === "supply"
              ? `₹${item.price}/${item.unit}`
              : `Budget ₹${item.price}/${item.unit}`}
          </span>
          <span className={low ? "hot" : ""}>
            {low ? "Almost gone" : item.expiry}
          </span>
        </div>
        {item.kind === "supply" && (
          <button
            className="card-add quantum-btn"
            onClick={(event) => {
              event.stopPropagation();
              onAdd();
            }}
          >
            <ShoppingCart size={16} /> Add to cart
          </button>
        )}
      </div>
    </article>
  );
});

function App() {
  const [view, setView] = useState<SiteView>("discover");
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem("ashok-admin-session") === "active",
  );
  const [products, setProducts] = useState<Item[]>(items);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selected, setSelected] = useState(items[0]);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState<number[]>([4]);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "heritage" | "gifting">("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [sortOpen, setSortOpen] = useState(false);
  const [visible, setVisible] = useState(24);
  const [palette, setPalette] = useState(false);
  const [requested, setRequested] = useState(false);
  const [processing, setProcessing] = useState(false);
  // A catalogue entry pointing at a file nobody added would render a broken
  // image on every card using it. `error` does not bubble, but it does
  // capture, so one listener at the document covers every <img> in the app.
  useEffect(() => {
    const swapInPlaceholder = (event: Event) => {
      const img = event.target as HTMLImageElement;
      if (img.tagName !== "IMG") return;
      const src = img.getAttribute("src") ?? "";
      if (!src.startsWith("/products/") || src === PHOTO_PLACEHOLDER) return;
      img.src = PHOTO_PLACEHOLDER;
    };
    document.addEventListener("error", swapInPlaceholder, true);
    return () => document.removeEventListener("error", swapInPlaceholder, true);
  }, []);
  useEffect(() => {
    const savedCart = localStorage.getItem("ashok-cart");
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    for (const stale of STALE_PRODUCT_KEYS) localStorage.removeItem(stale);
  }, []);
  useEffect(
    () => localStorage.setItem("ashok-cart", JSON.stringify(cart)),
    [cart],
  );
  // The catalogue is ~110 records; serialising it synchronously on every
  // change blocks the main thread during admin edits. Defer it to an idle
  // slot and collapse bursts into one write.
  useEffect(() => {
    const write = () =>
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    const idle = window.requestIdleCallback;
    if (idle) {
      const handle = idle(write, { timeout: 1000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timeout = window.setTimeout(write, 400);
    return () => window.clearTimeout(timeout);
  }, [products]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPalette(true);
      }
      if (e.key === "Escape") {
        setPalette(false);
        if (view === "detail") setView("discover");
      }
    };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [view]);
  // Magnetic button effect. Purely decorative, so it is skipped entirely on
  // touch devices and for reduced-motion users, and the remaining work is
  // batched into one rAF per frame instead of running on every pointer event.
  useEffect(() => {
    const decorative =
      matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!decorative) return;

    let frame = 0;
    let pending: { target: HTMLElement; x: number; y: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      const { target, x, y } = pending;
      pending = null;
      const rect = target.getBoundingClientRect();
      const px = ((x - rect.left) / rect.width) * 100;
      const py = ((y - rect.top) / rect.height) * 100;
      target.style.setProperty("--mouse-x", `${px}%`);
      target.style.setProperty("--mouse-y", `${py}%`);
      target.style.setProperty("--pull-x", `${(px - 50) * 0.025}px`);
      target.style.setProperty("--pull-y", `${(py - 50) * 0.025}px`);
    };

    const move = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        ".quantum-btn",
      );
      if (!target) return;
      pending = { target, x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const leave = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(
        ".quantum-btn",
      );
      if (
        target &&
        !(event.relatedTarget as HTMLElement | null)?.closest?.(".quantum-btn")
      ) {
        target.style.removeProperty("--pull-x");
        target.style.removeProperty("--pull-y");
      }
    };

    addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerout", leave, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      removeEventListener("pointermove", move);
      removeEventListener("pointerout", leave);
    };
  }, []);
  // Category chips are built from the catalogue itself, so adding a product in
  // the admin panel surfaces its category without touching this list.
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  // Keep typing responsive: React renders the keystroke first and re-filters
  // the 110-item catalogue at a lower priority.
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    const result = products.filter((i) => {
      const inTab =
        tab === "all" ||
        (tab === "heritage" && /bangali|ladu|pedha|khaja/i.test(i.category)) ||
        (tab === "gifting" && /kaju|burfi|other sweets/i.test(i.category));
      const inCategory = category === "all" || i.category === category;
      const matches =
        !term ||
        i.title.toLowerCase().includes(term) ||
        i.category.toLowerCase().includes(term);
      return inTab && inCategory && matches;
    });

    switch (sort) {
      case "price-low":
        return result.sort((a, b) => a.price - b.price);
      case "price-high":
        return result.sort((a, b) => b.price - a.price);
      case "availability":
        return result.sort((a, b) => b.available - a.available);
      default:
        return result;
    }
  }, [tab, category, sort, deferredQuery, products]);

  // Render the grid in pages so a cold load paints 24 cards, not 110.
  useEffect(() => setVisible(24), [tab, category, sort, deferredQuery]);
  const shown = useMemo(
    () => filtered.slice(0, visible),
    [filtered, visible],
  );

  /** Jump to the catalogue with a search term already applied. */
  const searchFor = (term: string) => {
    setQuery(term);
    setCategory("all");
    setTab("all");
    nav("market");
  };
  const addCart = (item: Item, amount = 1) => {
    setCart((current) => {
      const existing = current.find((line) => line.item.id === item.id);
      return existing
        ? current.map((line) =>
            line.item.id === item.id
              ? { ...line, qty: Math.min(item.available, line.qty + amount) }
              : line,
          )
        : [...current, { item, qty: amount }];
    });
    setToast(`${item.title} added to cart`);
  };
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const transition = (update: () => void) => {
    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        finished: Promise<void>;
      };
    };
    // A transition started while the document is hidden — or superseded by
    // a second navigation — rejects `finished`. That is expected, so it is
    // swallowed rather than left as an unhandled rejection. Skipping the
    // transition entirely when hidden also avoids the wasted snapshot.
    if (!doc.startViewTransition || document.visibilityState === "hidden") {
      update();
      return;
    }
    doc.startViewTransition(update).finished.catch(() => {});
  };
  const open = (i: Item) => {
    transition(() => {
      setSelected(i);
      setQty(1);
      setRequested(false);
      setProcessing(false);
      setView("detail");
    });
    scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggle = (id: number) => {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setToast(
      saved.includes(id) ? "Removed from saved" : "Saved to your watchlist",
    );
  };
  const nav = (v: SiteView) => {
    if ((v === "admin" || v === "create") && !isAdmin) {
      setView("adminLogin");
      scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    transition(() => setView(v));
    scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="app">
      <header>
        <button
          className="brand brand-logo"
          onClick={() => nav("discover")}
          aria-label="Nakhye’s Ashok Sweets home"
        >
          <img
            src="/brand/ashok-sweets-mark.jpg"
            alt="Nakhye’s Ashok Sweets"
            width={205}
            height={76}
            fetchPriority="high"
            decoding="async"
          />
        </button>
        <nav aria-label="Primary">
          <button
            className={view === "discover" ? "active" : ""}
            onClick={() => nav("discover")}
          >
            Discover
          </button>
          <button
            className={view === "market" ? "active" : ""}
            onClick={() => nav("market")}
          >
            Marketplace
          </button>
          <button onClick={() => nav("dashboard")}>Activity</button>
          {isAdmin && (
            <button
              className={view === "admin" ? "active" : ""}
              onClick={() => nav("admin")}
            >
              Store admin
            </button>
          )}
        </nav>
        <div className="tools">
          <button className="searchbtn" onClick={() => setPalette(true)}>
            <Search size={17} /> Search <kbd>⌘ K</kbd>
          </button>
          <button className="iconbtn" aria-label="Notifications">
            <Bell size={19} />
            <i />
          </button>
          <button className="avatar" onClick={() => nav("dashboard")}>
            AK
          </button>
          <button className="cart-trigger" onClick={() => nav("cart")}>
            <ShoppingCart size={19} />
            <span>{cartCount}</span>
          </button>
          {isAdmin && (
            <button className="listbtn quantum-btn" onClick={() => nav("admin")}>
              <Settings size={18} /> Manage store
            </button>
          )}
        </div>
      </header>
      {(view === "discover" || view === "market") && (
        <section className="mobileOrderBar" aria-label="Delivery and search">
          <div className="mobileLocation">
            <MapPin size={18} />
            <span>
              <b>Delivery in Dombivli</b>
              <small>West &amp; East stores · 30–45 min</small>
            </span>
            <Truck size={17} />
          </div>
          <button className="mobileSearch" onClick={() => setPalette(true)}>
            <Search size={18} />{" "}
            <span>Search for laddoo, kaju katli, gift boxes…</span>
          </button>
          <div className="mobileCravings">
            {CRAVINGS.map((craving) => (
              <button key={craving} onClick={() => searchFor(craving)}>
                {craving}
              </button>
            ))}
          </div>
        </section>
      )}
      {view === "discover" && (
        <main>
          <section
            className="marketRibbon"
            aria-label="Live marketplace summary"
          >
            <div>
              <span>FRESH IN DOMBIVLI</span>
              <b>{items.length} catalogue products</b>
              <i>✦</i>
              <b>{new Set(items.map((item) => item.category)).size} sweet &amp; snack categories</b>
              <i>✦</i>
              <b>Dombivli East &amp; West</b>
              <i>✦</i>
              <b>Prices updated 14 Aug 2026</b>
            </div>
          </section>
          <section className="intro">
            <div className="heroCopy">
              <p className="kicker">
                NAKHYE’S ASHOK SWEETS · SINCE GENERATIONS
              </p>
              <span className="devanagari">मिठाई, made to move</span>
              <h1>
                Share the
                <br />
                <em>sweetness.</em>
              </h1>
              <p className="heroSub">
                Discover fresh mithai from neighbourhood makers—or post exactly
                what your celebration needs.
              </p>
              <div className="heroActions">
                <button className="quantum-btn" onClick={() => nav("market")}>
                  Shop fresh mithai <ArrowUpRight />
                </button>
                <button className="quantum-btn" onClick={() => nav("market")}>
                  Explore gift boxes
                </button>
              </div>
            </div>
            <div className="heroMarket">
              <div className="orbitLabel">
                <Zap /> FRESH THIS MORNING
              </div>
              <img
                src={items[0].image}
                alt="Premium Indian mithai box available nearby"
                width={720}
                height={900}
                fetchPriority="high"
                decoding="async"
              />
              <div className="heroTicket">
                <span>{items[0].category.toUpperCase()} · BOTH STORES</span>
                <h2>
                  ₹{items[0].price}<small>/{items[0].unit}</small>
                </h2>
                <p>{items[0].title}</p>
                <Balance item={items[0]} />
                <button className="quantum-btn" onClick={() => open(items[0])}>
                  View product <ArrowUpRight />
                </button>
              </div>
              <div className="demandStamp">
                <b>{items.length}</b>
                <span>
                  real catalogue items
                  <br />
                  ready to explore
                </span>
              </div>
            </div>
          </section>
          <section className="categoryRail">
            <span>Shop by craving</span>
            {CRAVINGS.map((craving, index) => (
              <React.Fragment key={craving}>
                {index > 0 && <i>✦</i>}
                <button onClick={() => searchFor(craving)}>
                  {craving.toUpperCase()}
                </button>
              </React.Fragment>
            ))}
          </section>
          <section className="sweetAtlas">
            <div className="atlasIntro">
              <p className="kicker">THE BIHAR SWEET ATLAS</p>
              <h2>
                One hundred ways
                <br />
                to say <em>meetha.</em>
              </h2>
              <p>
                From Silao’s flaky khaja and Gaya’s winter tilkut to the
                rasgullas, barfis and celebration boxes found in sweet shops
                across Bihar.
              </p>
              <button className="quantum-btn" onClick={() => nav("market")}>
                Explore all {items.length} sweets <ArrowUpRight />
              </button>
            </div>
            <div className="atlasRail">
              {items.slice(5, 13).map((sweet, index) => (
                <button
                  key={sweet.id}
                  onClick={() => open(sweet)}
                  className={`atlasSweet atlas-${index}`}
                >
                  <img
                    src={sweet.image}
                    alt={sweet.title}
                    style={{ viewTransitionName: `sweet-${sweet.id}` }} loading="lazy" decoding="async" />
                  <span>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    {sweet.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="now">
            <div className="sectionhead">
              <div>
                <p className="kicker">FRESHLY MADE TODAY</p>
                <h2>Mithai worth gathering around.</h2>
              </div>
              <button onClick={() => nav("market")}>
                Shop all sweets <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="editorial">
              <div className="feature" onClick={() => open(items[0])}>
                <img
                  src={items[0].image}
                  alt="Premium kesar pista mithai box" loading="lazy" decoding="async" />
                <div className="featurecopy">
                  <span className="kind">Today’s selection</span>
                  <h2>{items[0].title}</h2>
                  <p>{items[0].note}</p>
                  <Balance item={items[0]} large />
                  <div className="featurebottom">
                    <div>
                      <b>₹{items[0].price}</b> / {items[0].unit}
                    </div>
                    <button className="quantum-btn">
                      Choose quantity <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="sidegrid">
                {items.slice(2, 4).map((i) => (
                  <Card
                    key={i.id}
                    item={i}
                    onOpen={() => open(i)}
                    saved={saved.includes(i.id)}
                    onSave={() => toggle(i.id)}
                    onAdd={() => addCart(i)}
                  />
                ))}
              </div>
            </div>
          </section>
          <section className="hot-selling" aria-labelledby="hot-selling-title">
            <div className="hot-copy">
              <p className="kicker">HOT SELLING · MADE IN SMALL BATCHES</p>
              <h2 id="hot-selling-title">The sweets Dombivli keeps coming back for.</h2>
              <p>
                Scroll through today’s fastest-moving trays. Each image opens
                the product with live quantity, price and delivery information.
              </p>
            </div>
            <div className="hot-scroll" role="list">
              {items.slice(13, 21).map((sweet, index) => (
                <button role="listitem" key={sweet.id} onClick={() => open(sweet)}>
                  <img
                    src={sweet.image}
                    alt={sweet.title}
                    style={{ viewTransitionName: `sweet-${sweet.id}` }} loading="lazy" decoding="async" />
                  <span><i>0{index + 1}</i><b>{sweet.title}</b><small>₹{sweet.price} / {sweet.unit}</small></span>
                </button>
              ))}
            </div>
          </section>
          <section className="demandstrip">
            <div className="sectionhead">
              <div>
                <p className="kicker coral">CELEBRATIONS NEED SWEETS</p>
                <h2>Boxes made for every occasion.</h2>
              </div>
              <button
                className="quantum-btn"
                onClick={() => {
                  setTab("gifting");
                  nav("market");
                }}
              >
                Explore gifting <ArrowUpRight size={17} />
              </button>
            </div>
            <div className="demandrows">
              {items
                .filter((i) => /kaju|burfi/i.test(i.category))
                .slice(0, 4)
                .map((i) => (
                  <button key={i.id} onClick={() => open(i)}>
                    <span className="dnumber">
                      ₹{i.price}
                      <small>/{i.unit}</small>
                    </span>
                    <span>
                      <b>{i.title}</b>
                      <small>
                        {i.place} · {i.expiry}
                      </small>
                    </span>
                    <span className="match">Order now</span>
                    <ChevronRight />
                  </button>
                ))}
            </div>
          </section>
          <section className="changes">
            <div>
              <p className="kicker">SINCE YOUR LAST VISIT</p>
              <h2>
                Something sweet
                <br />
                is always moving.
              </h2>
              <span className="scribble">freshly updated ↗</span>
            </div>
            <ol>
              <li>
                <b>{items.length} products</b> imported from the current catalogue{" "}
                <time>14 Aug 2026</time>
              </li>
              <li>
                <b>{new Set(items.map((item) => item.category)).size} categories</b> cover sweets, snacks and chaat{" "}
                <time>current range</time>
              </li>
              <li>
                <b>MRP pricing</b> is shown directly on every product{" "}
                <time>availability confirmed by store</time>
              </li>
            </ol>
          </section>
          <section className="about-home" id="about">
            <div className="about-seal">Since<br /><b>generations</b></div>
            <div>
              <p className="kicker">ABOUT NAKHYE’S ASHOK SWEETS</p>
              <h2>Rooted in tradition.<br />Made for the way we celebrate now.</h2>
            </div>
            <div className="about-copy">
              <p>
                Nakhye’s Ashok Sweets is a Dombivli sweet house operated by
                M/S Nakhye Foods LLP. We make and pack vegetarian Indian sweets
                for everyday cravings, family occasions, weddings and corporate gifting.
              </p>
              <p>
                Our online store is designed to show what is available, how much
                remains and what happens after you order—so every purchase feels
                as clear and personal as buying across the counter.
              </p>
              <button className="quantum-btn" onClick={() => nav("legal")}>
                Read our policies <ArrowUpRight />
              </button>
            </div>
          </section>
        </main>
      )}
      {view === "market" && (
        <main className="market">
          <div className="markettitle">
            <p className="kicker">THE MITHAI MARKET</p>
            <h1>
              Freshly made.
              <br />
              Exactly <em>how much.</em>
            </h1>
          </div>
          <div className="searchbar">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search laddoo, kaju katli, gift boxes…"
              aria-label="Search sweets"
            />
            {query && (
              <button
                className="searchclear"
                aria-label="Clear search"
                onClick={() => setQuery("")}
              >
                <X size={16} />
              </button>
            )}
            <button className="searchcity">
              <MapPin size={17} /> Dombivli
            </button>
          </div>

          <div className="filterbar">
            <div className="chiprail" role="group" aria-label="Filter by category">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "on" : ""}
                  aria-pressed={category === c}
                  onClick={() => {
                    setCategory(c);
                    setTab("all");
                  }}
                >
                  {c === "all" ? "All sweets" : c}
                </button>
              ))}
            </div>
            <div className="sortwrap">
              <button
                className={"sortbtn" + (sort !== "relevance" ? " on" : "")}
                aria-expanded={sortOpen}
                onClick={() => setSortOpen((v) => !v)}
              >
                <ArrowDownUp size={15} />
                {SORTS.find((s) => s.key === sort)!.label}
                <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <>
                  <div
                    className="sortscrim"
                    onClick={() => setSortOpen(false)}
                  />
                  <ul className="sortmenu">
                    {SORTS.map((s) => (
                      <li key={s.key}>
                        <button
                          className={sort === s.key ? "on" : ""}
                          onClick={() => {
                            setSort(s.key);
                            setSortOpen(false);
                          }}
                        >
                          {s.label}
                          {sort === s.key && <Check size={15} />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="resultshead">
            <b>
              {filtered.length} {filtered.length === 1 ? "sweet" : "sweets"}
              {category !== "all" && ` in ${category}`}
            </b>
            {(query || category !== "all") && (
              <button
                className="clearall"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setTab("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {filtered.length ? (
            <>
              <div className="marketgrid">
                {shown.map((i) => (
                  <Card
                    key={i.id}
                    item={i}
                    onOpen={() => open(i)}
                    saved={saved.includes(i.id)}
                    onSave={() => toggle(i.id)}
                    onAdd={() => addCart(i)}
                  />
                ))}
              </div>
              {visible < filtered.length && (
                <button
                  className="loadmore quantum-btn"
                  onClick={() => setVisible((v) => v + 24)}
                >
                  Show {Math.min(24, filtered.length - visible)} more sweets
                </button>
              )}
            </>
          ) : (
            <div className="empty">
              <Search />
              <h2>No sweets match “{query}”.</h2>
              <p>Try a different name, or browse the full collection.</p>
              <button
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setTab("all");
                }}
              >
                View all sweets
              </button>
            </div>
          )}
        </main>
      )}
      {view === "detail" && (
        <Detail
          item={selected}
          qty={qty}
          setQty={setQty}
          saved={saved.includes(selected.id)}
          save={() => toggle(selected.id)}
          back={() => nav("discover")}
          requested={requested}
          processing={processing}
          addToCart={() => addCart(selected, qty)}
          buyNow={() => {
            addCart(selected, qty);
            nav("checkout");
          }}
          request={() => {
            setProcessing(true);
            window.setTimeout(() => {
              setProcessing(false);
              setRequested(true);
              setToast(
                `${qty} ${selected.unit} requested — ${selected.seller} has been notified`,
              );
            }, 900);
          }}
        />
      )}
      {view === "create" && (
        <Create
          close={() => nav("discover")}
          done={() => {
            setToast("Draft saved — your listing preview is ready");
            nav("discover");
          }}
        />
      )}
      {view === "dashboard" && <Dashboard open={() => open(items[2])} />}
      {view === "cart" && (
        <CartPage
          cart={cart}
          setCart={setCart}
          checkout={() => nav("checkout")}
          shop={() => nav("market")}
        />
      )}
      {view === "checkout" && (
        <Checkout
          cart={cart}
          done={() => {
            setCart([]);
            nav("dashboard");
          }}
        />
      )}
      {view === "admin" && (
        isAdmin ? (
          <AdminPanel
            products={products}
            setProducts={setProducts}
            logout={() => {
              sessionStorage.removeItem("ashok-admin-session");
              setIsAdmin(false);
              nav("discover");
            }}
          />
        ) : <AdminLogin onSuccess={() => {
          sessionStorage.setItem("ashok-admin-session", "active");
          setIsAdmin(true);
          setView("admin");
        }} />
      )}
      {view === "adminLogin" && (
        <AdminLogin onSuccess={() => {
          sessionStorage.setItem("ashok-admin-session", "active");
          setIsAdmin(true);
          setView("admin");
        }} />
      )}
      {view === "legal" && <LegalPage />}
      <ComplianceFooter onNavigate={nav} isAdmin={isAdmin} />
      <SweetGuide />
      <nav className="mobileNav">
        <button className={view === "discover" ? "active" : ""} onClick={() => nav("discover")} aria-label="Discover">
          <LayoutGrid />
          <span>Home</span>
        </button>
        <button className={view === "market" ? "active" : ""} onClick={() => nav("market")} aria-label="Search sweets">
          <Search />
          <span>Search</span>
        </button>
        <button onClick={() => nav("cart")} className={`mobileplus ${view === "cart" || view === "checkout" ? "active" : ""}`} aria-label={`Cart with ${cartCount} items`}>
          <ShoppingCart />
          {cartCount > 0 && <b className="dockBadge">{cartCount}</b>}
        </button>
        <button
          className={view === "market" && tab === "gifting" ? "active" : ""}
          onClick={() => {
            setTab("gifting");
            nav("market");
          }}
          aria-label="Gifting and celebration boxes"
        >
          <HeartHandshake />
          <span>Gifting</span>
        </button>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => nav("dashboard")} aria-label="Your account">
          <User />
          <span>You</span>
        </button>
      </nav>
      {palette && (
        <div className="modalback" onClick={() => setPalette(false)}>
          <div className="palette" onClick={(e) => e.stopPropagation()}>
            <div>
              <Search />
              <input
                autoFocus
                placeholder="Search Ashok Sweets or type a command…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    setPalette(false);
                    nav("market");
                  }
                }}
              />
              <button aria-label="Close search" onClick={() => setPalette(false)}>
                <X />
              </button>
            </div>
            <p>QUICK ACTIONS</p>
            {isAdmin && (
              <button onClick={() => { setPalette(false); nav("admin"); }}>
                <Settings /> Manage products <kbd>A</kbd>
              </button>
            )}
            <button
              onClick={() => {
                setPalette(false);
                setTab("gifting");
                nav("market");
              }}
            >
              <HeartHandshake /> Browse gifting <kbd>G</kbd>
            </button>
            <button
              onClick={() => {
                setPalette(false);
                nav("dashboard");
              }}
            >
              <Package /> View your requests <kbd>R</kbd>
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={18} />
          {toast}
          <button onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({
  item,
  qty,
  setQty,
  saved,
  save,
  back,
  requested,
  processing,
  addToCart,
  buyNow,
  request,
}: {
  item: Item;
  qty: number;
  setQty: (n: number) => void;
  saved: boolean;
  save: () => void;
  back: () => void;
  requested: boolean;
  processing: boolean;
  addToCart: () => void;
  buyNow: () => void;
  request: () => void;
}) {
  const total = qty * item.price;
  return (
    <main className="detail">
      <button className="back" onClick={back}>
        ← Back to discover
      </button>
      <div className="detailgrid">
        <div className="gallery">
          <img
            src={item.image}
            alt={item.title}
            width={860}
            height={640}
            fetchPriority="high"
            decoding="async"
            style={{ viewTransitionName: `sweet-${item.id}` }}
          />
          <div>
            <img src={item.image} alt="" loading="lazy" decoding="async" />
            <button>+ 3 photos</button>
          </div>
        </div>
        <aside className="transaction">
          <p className="eyebrow">
            {item.category} · {item.place}
          </p>
          <h1>{item.title}</h1>
          <p className="desc">
            {item.note}. Handcrafted in small batches and ready for local pickup
            or delivery.
          </p>
          <div className="seller">
            <div>MW</div>
            <span>
              <b>{item.seller}</b>
              <small>
                <ShieldCheck /> Identity verified · {item.rating}
              </small>
            </span>
            <ChevronRight />
          </div>
          <div className="quantity">
            <div className="qhead">
              <span>{item.stockKnown === false ? "CATALOGUE PRICE" : "AVAILABLE TO REQUEST"}</span>
              <b>
                {item.stockKnown === false ? `₹${item.price}` : item.available}
                <small>{item.stockKnown === false ? `/${item.unit}` : item.unit}</small>
              </b>
            </div>
            <Balance item={item} large preview={item.requested + qty} />
            <label>How much do you need?</label>
            <div className="stepper">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
              >
                <Minus />
              </button>
              <div>
                <input
                  aria-label="Request quantity"
                  type="number"
                  value={qty}
                  min="1"
                  max={item.available}
                  onChange={(e) =>
                    setQty(
                      Math.min(item.available, Math.max(1, +e.target.value)),
                    )
                  }
                />
                <span>{item.unit}</span>
              </div>
              <button
                onClick={() => setQty(Math.min(item.available, qty + 1))}
                disabled={qty >= item.available}
              >
                <Plus />
              </button>
            </div>
            <div className="total">
              <span>
                <small>PRICE</small>₹{item.price.toLocaleString()} / {item.unit}
              </span>
              <span>
                <small>TOTAL</small>
                <b>₹{total.toLocaleString()}</b>
              </span>
            </div>
            <p className="after">
              <i /> {item.stockKnown === false
                ? "Final availability is confirmed by the store."
                : `${item.available - qty} ${item.unit} will remain after your request`}
            </p>
            <div className="commerce-actions">
              <button className="add-cart quantum-btn" onClick={addToCart}>
                <ShoppingCart /> Add to cart
              </button>
              <button className="request quantum-btn" onClick={buyNow}>
                Buy now <ArrowUpRight />
              </button>
            </div>
            <button
              className={
                "bulk-request quantum-btn " +
                (requested ? "success " : "") +
                (processing ? "is-processing" : "")
              }
              onClick={request}
              disabled={processing || requested}
            >
              {processing ? (
                <>
                  <span className="quantum-spinner" /> Sending enquiry…
                </>
              ) : requested ? (
                <>
                  <Check /> Bulk enquiry sent
                </>
              ) : (
                "Need a bulk quote?"
              )}
            </button>
            <p className="safe">
              <ShieldCheck /> Secure billing. Razorpay checkout is used for
              online payments.
            </p>
          </div>
          <div className="detailactions">
            <button onClick={save}>
              <Bookmark fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save"}
            </button>
            <button>
              <MessageCircle />
              Ask a question
            </button>
            <button>•••</button>
          </div>
        </aside>
      </div>
      <section className="detailinfo">
        <div>
          <p className="kicker">THE DETAILS</p>
          <h2>
            Crafted for sharing,
            <br />
            packed with care.
          </h2>
        </div>
        <dl>
          <div>
            <dt>Collection</dt>
            <dd>
              Pickup in Dombivli East or West
              <br />
              Delivery within 5 km
            </dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>
              Today – 15 August
              <br />
              Minimum 2 {item.unit}
            </dd>
          </div>
          <div>
            <dt>Condition</dt>
            <dd>
              Freshly packed
              <br />
              Food-safe sealed bags
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

function Create({ close, done }: { close: () => void; done: () => void }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(20);
  return (
    <main className="composer">
      <header className="composehead">
        <button className="brand brand-logo">
          <img src="/brand/ashok-sweets-mark.jpg" alt="Nakhye’s Ashok Sweets" loading="lazy" decoding="async" />
        </button>
        <span>New supply listing · Draft saved</span>
        <button onClick={close}>
          <X />
        </button>
      </header>
      <div className="progress">
        <i style={{ width: `${(step / 4) * 100}%` }} />
      </div>
      <div className="composegrid">
        <section>
          <p className="kicker">STEP {String(step).padStart(2, "0")} OF 04</p>
          {step === 1 && (
            <>
              <h1>
                What are you
                <br />
                <em>offering?</em>
              </h1>
              <p>Use the name people would search for. Add specifics later.</p>
              <label>
                ITEM OR RESOURCE
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kesar pista mithai box"
                />
              </label>
              <label>
                CATEGORY
                <select>
                  <option>Premium mithai</option>
                  <option>Traditional favourites</option>
                  <option>Gift boxes</option>
                  <option>Wedding & bulk orders</option>
                </select>
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <h1>
                How much is
                <br />
                <em>available?</em>
              </h1>
              <p>Clear quantity helps people request exactly what they need.</p>
              <label>
                AVAILABLE QUANTITY
                <div className="biginput">
                  <button onClick={() => setAmount(Math.max(1, amount - 1))}>
                    <Minus />
                  </button>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(+e.target.value)}
                  />
                  <button onClick={() => setAmount(amount + 1)}>
                    <Plus />
                  </button>
                </div>
              </label>
              <label>
                UNIT
                <select>
                  <option>kg</option>
                  <option>pieces</option>
                  <option>boxes</option>
                  <option>litres</option>
                </select>
              </label>
            </>
          )}
          {step === 3 && (
            <>
              <h1>Set the terms.</h1>
              <p>Keep the exchange clear before someone requests.</p>
              <label>
                PRICE PER UNIT
                <input placeholder="₹ 0" />
              </label>
              <label>
                FULFILMENT
                <select>
                  <option>Pickup or local delivery</option>
                  <option>Pickup only</option>
                  <option>Shipping available</option>
                </select>
              </label>
            </>
          )}
          {step === 4 && (
            <>
              <h1>
                Ready to
                <br />
                <em>put it in motion?</em>
              </h1>
              <p>
                Review how the listing will appear. You can change anything
                later.
              </p>
              <div className="checklist">
                <p>
                  <Check /> Quantity and unit are clear
                </p>
                <p>
                  <Check /> Collection terms added
                </p>
                <p>
                  <Check /> Listing expires in 7 days
                </p>
              </div>
            </>
          )}
          <footer>
            <button onClick={() => (step > 1 ? setStep(step - 1) : close())}>
              Back
            </button>
            <button
              className="primary quantum-btn"
              disabled={step === 1 && !title}
              onClick={() => (step < 4 ? setStep(step + 1) : done())}
            >
              {step < 4
                ? "Next: " + ["", "quantity", "terms", "preview"][step]
                : "Publish listing"}{" "}
              <ArrowUpRight />
            </button>
          </footer>
        </section>
        <aside className="preview">
          <p>LIVE PREVIEW</p>
          <div className="mockphoto">
            <Box />
          </div>
          <p className="eyebrow">Premium mithai · Dombivli</p>
          <h2>{title || "Your listing title"}</h2>
          <div className="fakebalance">
            <span style={{ width: "78%" }} />
          </div>
          <div className="mocknums">
            <b>{amount} available</b>
            <span>0 requested</span>
          </div>
          <small>This preview updates as you compose.</small>
        </aside>
      </div>
    </main>
  );
}

function Dashboard({ open }: { open: () => void }) {
  return (
    <main className="dashboard">
      <div className="markettitle">
        <p className="kicker">YOUR ACTIVITY</p>
        <h1>
          Good morning,
          <br />
          <em>Amar.</em>
        </h1>
      </div>
      <section className="attention">
        <div>
          <p className="kicker coral">NEEDS YOUR ATTENTION</p>
          <h2>Three things are waiting.</h2>
        </div>
        <div>
          <button onClick={open}>
            <span>
              <strong>3</strong>
              <small>requests awaiting reply</small>
            </span>
            <ChevronRight />
          </button>
          <button>
            <span>
              <strong>1</strong>
              <small>listing expires tomorrow</small>
            </span>
            <ChevronRight />
          </button>
          <button>
            <span>
              <strong>2</strong>
              <small>new messages</small>
            </span>
            <ChevronRight />
          </button>
        </div>
      </section>
      <section className="metrics">
        <div>
          <Package />
          <span>
            <strong>4</strong> active listings
          </span>
        </div>
        <div>
          <TrendingUp />
          <span>
            <strong>112</strong> units available
          </span>
        </div>
        <div>
          <Clock />
          <span>
            <strong>18m</strong> response time
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            <strong>98%</strong> fulfilment
          </span>
        </div>
      </section>
      <section className="timeline">
        <p className="kicker">RECENT EXCHANGES</p>
        <h2>Activity</h2>
        <div>
          <i />
          <p>
            <b>Request accepted</b>
            <br />8 kesar pista boxes reserved for Aarav
          </p>
          <time>12 min</time>
        </div>
        <div>
          <i />
          <p>
            <b>Quantity changed</b>
            <br />
            Gaya tilkut now has 43 boxes remaining
          </p>
          <time>1 hr</time>
        </div>
        <div>
          <i />
          <p>
            <b>Exchange completed</b>
            <br />
            Rose kaju katli collection · order #SW-1842
          </p>
          <time>Yesterday</time>
        </div>
      </section>
    </main>
  );
}

function CartPage({
  cart,
  setCart,
  checkout,
  shop,
}: {
  cart: CartLine[];
  setCart: React.Dispatch<React.SetStateAction<CartLine[]>>;
  checkout: () => void;
  shop: () => void;
}) {
  const subtotal = cart.reduce(
    (sum, line) => sum + line.item.price * line.qty,
    0,
  );
  const update = (id: number, qty: number) =>
    setCart((lines) =>
      lines.map((line) =>
        line.item.id === id
          ? { ...line, qty: Math.max(1, Math.min(line.item.available, qty)) }
          : line,
      ),
    );
  return (
    <main className="cart-page commerce-page">
      <div className="commerce-heading">
        <p className="kicker">YOUR SWEET BOX</p>
        <h1>
          Cart <em>{cart.reduce((s, l) => s + l.qty, 0)}</em>
        </h1>
      </div>
      {!cart.length ? (
        <div className="empty-cart">
          <ShoppingCart />
          <h2>Your cart is waiting for something sweet.</h2>
          <button className="quantum-btn" onClick={shop}>
            Browse sweets <ArrowUpRight />
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-lines">
            {cart.map((line) => (
              <article key={line.item.id}>
                <img src={line.item.image} alt={line.item.title} loading="lazy" decoding="async" />
                <div>
                  <p className="eyebrow">{line.item.category}</p>
                  <h2>{line.item.title}</h2>
                  <span>
                    ₹{line.item.price.toLocaleString()} / {line.item.unit}
                  </span>
                </div>
                <div className="cart-stepper">
                  <button onClick={() => update(line.item.id, line.qty - 1)}>
                    <Minus />
                  </button>
                  <b>{line.qty}</b>
                  <button onClick={() => update(line.item.id, line.qty + 1)}>
                    <Plus />
                  </button>
                </div>
                <strong>
                  ₹{(line.qty * line.item.price).toLocaleString()}
                </strong>
                <button
                  className="remove-line"
                  aria-label={`Remove ${line.item.title}`}
                  onClick={() =>
                    setCart((lines) =>
                      lines.filter((x) => x.item.id !== line.item.id),
                    )
                  }
                >
                  <Trash2 />
                </button>
              </article>
            ))}
          </section>
          <aside className="order-summary">
            <img src="/brand/ashok-sweets-mark.jpg" alt="Ashok Sweets" loading="lazy" decoding="async" />
            <p>ORDER SUMMARY</p>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>₹{subtotal.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{subtotal >= 1499 ? "Free" : "₹99"}</dd>
              </div>
              <div>
                <dt>Estimated GST</dt>
                <dd>Calculated at billing</dd>
              </div>
            </dl>
            <div className="summary-total">
              <span>Estimated total</span>
              <b>
                ₹{(subtotal + (subtotal >= 1499 ? 0 : 99)).toLocaleString()}
              </b>
            </div>
            <button className="request quantum-btn" onClick={checkout}>
              Proceed to billing <ArrowUpRight />
            </button>
            <small>
              <ShieldCheck /> Secure payment through Razorpay
            </small>
          </aside>

          {/* Phones get the total and the next step pinned to the bottom
              instead of buried under the line items. Hidden on desktop,
              where the summary column is already in view. */}
          <div className="cart-sticky">
            <span>
              <small>
                {subtotal >= 1499
                  ? "Delivery free"
                  : `₹${(1499 - subtotal).toLocaleString()} more for free delivery`}
              </small>
              <b>
                ₹{(subtotal + (subtotal >= 1499 ? 0 : 99)).toLocaleString()}
              </b>
            </span>
            <button onClick={checkout}>
              Proceed to billing <ArrowUpRight />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

/**
 * Razorpay's checkout script is ~90KB and only ever needed once someone
 * actually pays, so it is fetched on demand rather than in <head>.
 */
let razorpayLoader: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayLoader) return razorpayLoader;
  razorpayLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayLoader = null;
      reject(new Error("Razorpay checkout could not be loaded"));
    };
    document.head.appendChild(script);
  });
  return razorpayLoader;
}

function Checkout({ cart, done }: { cart: CartLine[]; done: () => void }) {
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState(0);
  const [status, setStatus] = useState("");
  const subtotal = cart.reduce((s, l) => s + l.item.price * l.qty, 0);
  const delivery = subtotal >= 1499 ? 0 : 99;
  const total = Math.max(
    0,
    subtotal + delivery - Math.round((subtotal * applied) / 100),
  );
  const applyCoupon = () => {
    const saved = JSON.parse(localStorage.getItem("ashok-coupons") || "[]") as {
      code: string;
      discount: number;
      active: boolean;
    }[];
    const known = [
      { code: "ASHOK10", discount: 10, active: true },
      { code: "FESTIVE15", discount: 15, active: true },
      ...saved,
    ];
    const found = known.find(
      (x) => x.code === coupon.trim().toUpperCase() && x.active,
    );
    if (found) {
      setApplied(found.discount);
      setStatus(`${found.code} applied — ${found.discount}% off`);
    } else setStatus("This coupon is invalid or inactive.");
  };
  const pay = async () => {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
      setStatus(
        "Razorpay test mode is ready. Add the merchant Key ID and server Orders API to activate payment collection.",
      );
      return;
    }
    setStatus("Creating a secure Razorpay order…");
    try {
      await loadRazorpay();
      const response = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: total * 100,
          currency: "INR",
          receipt: `ashok-${Date.now()}`,
        }),
      });
      if (!response.ok) throw new Error("Order service unavailable");
      const order = await response.json();
      new window.Razorpay!({
        key,
        amount: total * 100,
        currency: "INR",
        name: "Nakhye’s Ashok Sweets",
        description: "Sweet order",
        image: `${location.origin}/brand/ashok-sweets-mark.jpg`,
        order_id: order.id,
        theme: { color: "#b80819" },
        handler: async (payment: Record<string, string>) => {
          setStatus("Payment received. Verifying your order…");
          const verification = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payment),
          });
          if (!verification.ok) {
            setStatus("Payment verification failed. Please do not retry until support checks the transaction.");
            return;
          }
          done();
        },
      }).open();
    } catch {
      setStatus(
        "Payment could not start. Please retry or order through WhatsApp.",
      );
    }
  };
  return (
    <main className="checkout-page commerce-page">
      <div className="commerce-heading">
        <p className="kicker">SECURE CHECKOUT</p>
        <h1>
          Billing & <em>payment.</em>
        </h1>
      </div>
      <div className="checkout-grid">
        <section className="billing-form">
          <h2>Delivery details</h2>
          <div className="form-grid">
            <label>
              Full name
              <input placeholder="Your name" />
            </label>
            <label>
              Mobile number
              <input inputMode="tel" placeholder="+91" />
            </label>
            <label className="wide">
              Email
              <input type="email" placeholder="you@example.com" />
            </label>
            <label className="wide">
              Delivery address
              <textarea placeholder="House, street, landmark" />
            </label>
            <label>
              City
              <input defaultValue="Dombivli" />
            </label>
            <label>
              PIN code
              <input inputMode="numeric" placeholder="421202" />
            </label>
          </div>
          <h2>Payment</h2>
          <div className="razorpay-box">
            <div className="razor-mark">R</div>
            <span>
              <b>Razorpay Secure</b>
              <small>UPI · Cards · Netbanking · Wallets</small>
            </span>
            <ShieldCheck />
          </div>
        </section>
        <aside className="checkout-summary">
          <h2>Your order</h2>
          {cart.map((line) => (
            <div className="checkout-line" key={line.item.id}>
              <img src={line.item.image} alt="" loading="lazy" decoding="async" />
              <span>
                {line.item.title}
                <small>
                  {line.qty} × ₹{line.item.price}
                </small>
              </span>
              <b>₹{(line.qty * line.item.price).toLocaleString()}</b>
            </div>
          ))}
          <div className="coupon-entry">
            <TicketPercent />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Coupon code"
            />
            <button onClick={applyCoupon}>Apply</button>
          </div>
          {status && (
            <p
              className={
                status.includes("invalid")
                  ? "checkout-error"
                  : "checkout-status"
              }
            >
              {status}
            </p>
          )}
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>₹{subtotal.toLocaleString()}</dd>
            </div>
            {applied > 0 && (
              <div className="discount">
                <dt>Coupon ({applied}%)</dt>
                <dd>
                  −₹{Math.round((subtotal * applied) / 100).toLocaleString()}
                </dd>
              </div>
            )}
            <div>
              <dt>Delivery</dt>
              <dd>{delivery ? `₹${delivery}` : "Free"}</dd>
            </div>
          </dl>
          <div className="summary-total">
            <span>Payable</span>
            <b>₹{total.toLocaleString()}</b>
          </div>
          <button
            disabled={!cart.length}
            className="request quantum-btn"
            onClick={pay}
          >
            <CreditCard /> Pay securely ₹{total.toLocaleString()}
          </button>
          <small>
            Test-mode payment preview. Live collection requires server-side
            Razorpay order creation and credentials.
          </small>
        </aside>
      </div>
    </main>
  );
}

function AdminPanel({
  products,
  setProducts,
  logout,
}: {
  products: Item[];
  setProducts: React.Dispatch<React.SetStateAction<Item[]>>;
  logout: () => void;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("10");
  const [generated, setGenerated] = useState("");
  const add = () => {
    if (!title || !price) return;
    const newItem: Item = {
      ...products[0],
      id: Date.now(),
      title,
      price: +price,
      category: "New product",
      available: 25,
      requested: 0,
      image: PHOTO_PLACEHOLDER,
      seller: "Nakhye’s Ashok Sweets",
      place: "Dombivli",
      distance: "In store",
      rating: "FSSAI licensed",
      note: "Freshly added from admin",
      expiry: "made today",
    };
    setProducts((p) => [newItem, ...p]);
    setTitle("");
    setPrice("");
  };
  const generate = () => {
    const code = `ASHOK${new Date().getFullYear().toString().slice(-2)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const discount = Math.min(80, Math.max(1, +couponDiscount));
    const saved = JSON.parse(localStorage.getItem("ashok-coupons") || "[]");
    localStorage.setItem(
      "ashok-coupons",
      JSON.stringify([{ code, discount, active: true }, ...saved]),
    );
    setGenerated(code);
  };
  return (
    <main className="admin-page commerce-page">
      <div className="commerce-heading">
        <p className="kicker">STORE CONTROL · AUTHORISED ACCESS</p>
        <h1>
          Ashok Sweets <em>admin.</em>
        </h1>
        <button className="admin-logout" onClick={logout}>Sign out of admin</button>
      </div>
      <section className="admin-metrics">
        <div>
          <Store />
          <b>{products.length}</b>
          <span>products</span>
        </div>
        <div>
          <Package />
          <b>{products.filter((x) => x.kind === "supply").length}</b>
          <span>active listings</span>
        </div>
        <div>
          <TicketPercent />
          <b>2</b>
          <span>campaign coupons</span>
        </div>
      </section>
      <div className="admin-grid">
        <section className="admin-card">
          <h2>Add product</h2>
          <label>
            Product name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Gaya Tilkut Gift Box"
            />
          </label>
          <label>
            Price
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="₹"
            />
          </label>
          <button className="quantum-btn" onClick={add}>
            <Plus /> Add product
          </button>
        </section>
        <section className="admin-card">
          <h2>Generate event coupon</h2>
          <label>
            Discount percentage
            <input
              value={couponDiscount}
              onChange={(e) => setCouponDiscount(e.target.value)}
              type="number"
              min="1"
              max="80"
            />
          </label>
          <button className="quantum-btn" onClick={generate}>
            <Sparkles /> Generate coupon
          </button>
          {generated && (
            <div className="generated-code">
              <span>ACTIVE COUPON</span>
              <b>{generated}</b>
              <small>{couponDiscount}% off · stored for checkout</small>
            </div>
          )}
        </section>
      </div>
      <section className="product-manager">
        <div>
          <h2>Products</h2>
          <span>
            Changes update the storefront immediately in this session.
          </span>
        </div>
        {products.slice(0, 24).map((product) => (
          <article key={product.id}>
            <img src={product.image} alt="" loading="lazy" decoding="async" />
            <span>
              <b>{product.title}</b>
              <small>{product.category}</small>
            </span>
            <strong>₹{product.price}</strong>
            <button
              aria-label={`Delete ${product.title}`}
              onClick={() =>
                setProducts((p) => p.filter((x) => x.id !== product.id))
              }
            >
              <Trash2 />
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const expectedEmail = import.meta.env.VITE_ADMIN_EMAIL || "admin@ashoksweets.com";
    const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || "Ashok@2026";
    if (email.trim().toLowerCase() === expectedEmail.toLowerCase() && password === expectedPassword) {
      setError("");
      onSuccess();
    } else {
      setError("The email or password is incorrect. Customer accounts cannot access store controls.");
    }
  };
  return (
    <main className="admin-login commerce-page">
      <section className="login-intro">
        <p className="kicker">PRIVATE STORE ACCESS</p>
        <h1>Customer shop outside.<br /><em>Store controls inside.</em></h1>
        <p>Product publishing, inventory changes and coupon creation are restricted to an authenticated administrator session.</p>
      </section>
      <form className="login-panel" onSubmit={submit}>
        <img src="/brand/ashok-sweets-mark.jpg" alt="Nakhye’s Ashok Sweets" loading="lazy" decoding="async" />
        <h2>Administrator sign in</h2>
        <label>Email address<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="request quantum-btn" type="submit"><ShieldCheck /> Sign in securely</button>
        <small>This frontend gate is for preview. Production access must use Supabase Auth, role-based policies and server-side authorization.</small>
      </form>
    </main>
  );
}

function LegalPage() {
  return (
    <main className="legal-page">
      <header className="legal-hero">
        <p className="kicker">CUSTOMER TERMS & DATA PRACTICES</p>
        <h1>Clear policies.<br /><em>No fine-print surprises.</em></h1>
        <p>Last updated: 12 August 2026 · Applies to the Ashok Sweets website and online ordering service operated by M/S Nakhye Foods LLP.</p>
      </header>
      <nav className="legal-index" aria-label="Policy contents">
        <a href="#terms">Terms of sale</a><a href="#privacy">Privacy</a><a href="#delivery">Delivery</a><a href="#returns">Cancellation & refunds</a><a href="#grievance">Grievance redressal</a>
      </nav>
      <div className="legal-content">
        <aside><b>Important</b><p>These launch-ready drafts are based on the proposed customer journey. Company identity, GST details, grievance officer and final operational timelines must be verified by Nakhye Foods LLP and reviewed by its advocate before accepting live orders.</p></aside>
        <article>
          <section id="terms">
            <p className="kicker">01 · TERMS OF USE AND SALE</p>
            <h2>Ordering from Ashok Sweets</h2>
            <p>By browsing this website, creating an account or placing an order, you agree to these terms. “Ashok Sweets”, “we”, “us” and “our” refer to M/S Nakhye Foods LLP. “Customer”, “you” and “your” refer to the person using the service or purchasing products.</p>
            <h3>Products and availability</h3><p>We sell vegetarian sweets, gift packs and related food products. Product photographs are representative; handmade sweets may differ slightly in colour, shape, garnish and arrangement. Availability, batch size and delivery estimates may change. An order is accepted only when we confirm it and, for prepaid orders, receive successful payment confirmation.</p>
            <h3>Pricing, taxes and coupons</h3><p>Prices are displayed in Indian Rupees and will show applicable taxes, delivery charges and discounts before payment. Coupons are non-transferable, subject to stated validity, minimum-order and product restrictions, and may be withdrawn where issued in error, misused or prohibited by law. Unless expressly stated, offers cannot be combined.</p>
            <h3>Food information and allergies</h3><p>Customers must review product descriptions, ingredient and allergen information on the pack and contact us before ordering if they have an allergy or intolerance. Products may be prepared in facilities that handle milk, nuts, gluten, sesame and other allergens. Never rely only on product imagery or a search filter for medical or allergen decisions.</p>
            <h3>Acceptable use</h3><p>You must provide accurate billing and delivery information, use only a payment method you are authorised to use, and not interfere with the website, attempt unauthorised administration access, scrape content, introduce malware, misuse coupons or place fraudulent orders.</p>
            <h3>Intellectual property and liability</h3><p>The Ashok Sweets name, submitted logo, packaging artwork, website design, copy and original content belong to or are licensed to M/S Nakhye Foods LLP. To the extent permitted by law, we are not liable for indirect or consequential loss, but nothing in these terms excludes liability or consumer remedies that cannot lawfully be excluded.</p>
          </section>
          <section id="privacy">
            <p className="kicker">02 · PRIVACY POLICY</p>
            <h2>How we use your information</h2>
            <p>We may collect identity and contact details, delivery address, order history, customer-support messages, coupon use, device and usage data, and payment status. Card, UPI or net-banking credentials are entered into the payment provider’s secure interface; we should not store full card or UPI authentication credentials.</p>
            <h3>Purposes</h3><p>We use information to create and fulfil orders, collect or reconcile payment, deliver products, issue invoices, prevent fraud, answer requests, manage recalls or food-safety matters, maintain the service, comply with law and—with separate consent where required—send offers. We limit collection to information reasonably necessary for these purposes.</p>
            <h3>Sharing and processors</h3><p>Information may be shared on a need-to-know basis with Razorpay or another configured payment provider, delivery partners, hosting/database providers such as Vercel and Supabase, messaging providers, professional advisers and public authorities where legally required. Each production provider must be contracted and configured with appropriate security and access controls.</p>
            <h3>Retention, security and choices</h3><p>We retain data only for the order, legal, accounting, fraud-prevention and dispute periods applicable to it, then delete or anonymise it where feasible. We use role-based access, encryption in transit, restricted production credentials, logging and backups appropriate to the risk. No internet service is completely secure. You may request access, correction, erasure or withdrawal of optional consent, subject to legal retention and transaction requirements, through the contact below.</p>
            <h3>Cookies</h3><p>Essential storage may keep cart contents, security state and preferences. Analytics or advertising cookies should remain disabled until a consent mechanism and the relevant vendor disclosures are implemented.</p>
          </section>
          <section id="delivery">
            <p className="kicker">03 · SHIPPING AND DELIVERY</p>
            <h2>Freshness sets the boundary.</h2>
            <p>Available fulfilment methods, serviceable PIN codes, delivery fee and estimated window are shown at checkout. Someone capable of receiving food should be present at the address. Risk passes on delivery or pickup. Please inspect the package promptly and refrigerate or store products according to the label. Delays caused by incorrect addresses, unavailable recipients, traffic, weather, force majeure or carrier disruption will be handled reasonably, but a displayed estimate is not a guaranteed delivery time unless expressly confirmed.</p>
          </section>
          <section id="returns">
            <p className="kicker">04 · CANCELLATION, RETURNS AND REFUNDS</p>
            <h2>A fair policy for perishable food.</h2>
            <p>Because sweets are perishable and food-safety integrity cannot be restored after delivery, correctly supplied products generally cannot be returned for change of mind. You may request cancellation before preparation or dispatch; custom, personalised, bulk or made-to-order items may become non-cancellable once production begins.</p>
            <p>If an item is wrong, materially damaged, missing, unsafe or appears spoiled at delivery, contact us as soon as reasonably possible—preferably within four hours—with the order number, description and clear photographs of the product, label and packaging. Keep the product available for assessment and do not consume a suspected unsafe item. After verification, we may replace the affected item, issue store credit or refund the appropriate amount to the original payment method. Bank processing time is outside our control. Statutory consumer rights remain unaffected.</p>
          </section>
          <section id="grievance">
            <p className="kicker">05 · GRIEVANCE AND GOVERNING LAW</p>
            <h2>Talk to a person.</h2>
            <p>Customer support: <a href="tel:+919702655000">+91 97026 55000</a> or <a href="mailto:info@ashoksweets.com">info@ashoksweets.com</a>. Registered business: M/S Nakhye Foods LLP. Before launch, publish the name, designation and dedicated contact details of the grievance officer and the legally required acknowledgement/redressal timelines.</p>
            <p>These terms are governed by Indian law. Courts and consumer commissions having lawful territorial and pecuniary jurisdiction may hear disputes; nothing here restricts a customer from approaching a competent consumer authority. If a provision is invalid, the remaining provisions continue to apply.</p>
          </section>
        </article>
      </div>
    </main>
  );
}

function ComplianceFooter({ onNavigate, isAdmin }: { onNavigate: (view: SiteView) => void; isAdmin: boolean }) {
  return (
    <footer className="compliance-footer">
      <div className="footer-brand">
        <img src="/brand/ashok-sweets-mark.jpg" alt="Nakhye’s Ashok Sweets" loading="lazy" decoding="async" />
        <p>
          M/S. Nakhye Foods LLP
          <br />
          <a href="mailto:info@ashoksweets.com">info@ashoksweets.com</a> ·{" "}
          <a href="https://ashoksweets.com">ashoksweets.com</a>
        </p>
      </div>
      <div className="licence-grid">
        <div className="fssai-mark">
          <b>fssai</b>
          <span>
            Licence
            <br />
            11518021000077
          </span>
        </div>
        <div className="fssai-mark">
          <b>fssai</b>
          <span>
            Licence
            <br />
            11522021000582
          </span>
        </div>
        <div>
          <Leaf />
          <span>
            Vegetarian
            <br />
            products
          </span>
        </div>
        <div>
          <Recycle />
          <span>
            Recyclable
            <br />
            packaging
          </span>
        </div>
        <div>
          <ShieldCheck />
          <span>
            Food-grade paperboard
            <br />
            conforming to US FDA standards
          </span>
        </div>
      </div>
      <div className="footer-address">
        <p>
          <b>West:</b> 1 Everest, Pandit Dindayal Road, Dombivli (W) 421202 ·
          9702655000
        </p>
        <p>
          <b>East:</b> Everest Pride, Kelkar Road, Dombivli (E) 421201 ·
          8691899000
        </p>
        <small>
          Compliance information reproduced from the submitted Ashok Sweets
          packaging artwork.
        </small>
      </div>
      <div className="footer-links">
        <button onClick={() => onNavigate("discover")}>Shop</button>
        <button onClick={() => onNavigate("market")}>All sweets</button>
        <button onClick={() => onNavigate("legal")}>Terms · Privacy · Refunds</button>
        <button onClick={() => onNavigate(isAdmin ? "admin" : "adminLogin")}>
          {isAdmin ? "Store administration" : "Administrator login"}
        </button>
        <span>© 2026 M/S Nakhye Foods LLP</span>
      </div>
    </footer>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
