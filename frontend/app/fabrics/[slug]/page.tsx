'use client';
import React, { useState, useEffect, useRef } from 'react';
import { customerImages, isCustomerPhoto, photoRank } from '@/lib/rawPhoto';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, adminApi } from '@/lib/api';
import { useCartStore, useWishlistStore, useAuthStore, useStoresHydrated } from '@/lib/store';
import { formatPrice, productDisplayName, productBaseName } from '@/lib/utils';
import { deliverByLabel } from '@/lib/delivery';
import { BUSINESS } from '@/lib/business';
import { SITE_URL } from '@/lib/seo';
import toast from 'react-hot-toast';
import { cartAddedToast } from '@/lib/cartToast';
import Image from 'next/image';
import Link from 'next/link';
import { BLUR_PLACEHOLDER, supabaseImg } from '@/lib/image';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';

const RECENTLY_VIEWED_KEY = 'rcsfabrics_recently_viewed';

function getRecentlyViewed(): { id: string; name: string; slug: string; price: number; image?: string }[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]'); } catch { return []; }
}

function saveRecentlyViewed(product: Product) {
  const prev = getRecentlyViewed().filter((p) => p.id !== product.id);
  const entry = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.discountPrice ?? product.basePrice,
    image: product.images?.find((i) => i.isMain)?.url || product.images?.[0]?.url,
  };
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify([entry, ...prev].slice(0, 6)));
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          className="text-2xl transition-colors">
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

// ── Small building blocks for the fabric page ──

/** Swipe/scroll a tape of lengths (0.5 m steps); the one in the centre is picked */
function MetrePicker({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const ITEM = 64;
  const steps = React.useMemo(() => {
    const out: number[] = [];
    const top = Math.min(max, 60);
    for (let v = min; v <= top + 1e-9; v += 0.5) out.push(Math.round(v * 10) / 10);
    return out.length ? out : [min];
  }, [min, max]);
  const ref = React.useRef<HTMLDivElement>(null);
  const settle = React.useRef<ReturnType<typeof setTimeout>>();
  const scrolling = React.useRef(false);

  const idxOf = (v: number) => Math.max(0, steps.findIndex((s) => s >= v - 1e-9));
  React.useEffect(() => {
    // Keep the tape centred on the chosen length when it changes from outside (arrows, colour switch)
    if (scrolling.current || !ref.current) return;
    ref.current.scrollTo({ left: idxOf(value) * ITEM, behavior: 'smooth' });
  }, [value, steps]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => { if (ref.current) ref.current.scrollLeft = idxOf(value) * ITEM; }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    scrolling.current = true;
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      scrolling.current = false;
      const el = ref.current; if (!el) return;
      const i = Math.min(steps.length - 1, Math.max(0, Math.round(el.scrollLeft / ITEM)));
      if (steps[i] !== value) onChange(steps[i]);
    }, 90);
  };
  const go = (d: number) => {
    const i = Math.min(steps.length - 1, Math.max(0, idxOf(value) + d));
    onChange(steps[i]);
  };

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => go(-1)} disabled={value <= steps[0]} aria-label="Less fabric"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-xl text-gray-700 disabled:opacity-30 dark:border-dark-600 dark:text-gray-200">−</button>
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-16 -translate-x-1/2 rounded-xl border-2 border-primary-700 dark:border-primary-400" aria-hidden="true"/>
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white dark:from-dark-950" aria-hidden="true"/>
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white dark:from-dark-950" aria-hidden="true"/>
        <div ref={ref} onScroll={onScroll} role="listbox" aria-label="Length in metres"
          className="flex snap-x snap-mandatory overflow-x-auto py-1 scrollbar-hide" style={{ scrollPaddingInline: `calc(50% - ${ITEM / 2}px)` }}>
          <span className="shrink-0" style={{ width: `calc(50% - ${ITEM / 2}px)` }} aria-hidden="true"/>
          {steps.map((v) => {
            const on = Math.abs(v - value) < 1e-9;
            return (
              <button key={v} type="button" role="option" aria-selected={on} onClick={() => onChange(v)}
                style={{ width: ITEM }}
                className={`flex h-14 shrink-0 snap-center flex-col items-center justify-center transition ${on ? 'text-primary-700 dark:text-primary-300' : 'text-gray-400 hover:text-gray-700 dark:text-gray-500'}`}>
                <span className={`font-display leading-none ${on ? 'text-2xl' : 'text-lg'}`}>{v}</span>
                <span className="mt-0.5 text-[10px] uppercase tracking-wider">metre</span>
              </button>
            );
          })}
          <span className="shrink-0" style={{ width: `calc(50% - ${ITEM / 2}px)` }} aria-hidden="true"/>
        </div>
      </div>
      <button type="button" onClick={() => go(1)} disabled={value >= steps[steps.length - 1]} aria-label="More fabric"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-xl text-gray-700 disabled:opacity-30 dark:border-dark-600 dark:text-gray-200">+</button>
    </div>
  );
}
const Stars = ({ n, size = 'h-4 w-4' }: { n: number; size?: string }) => (
  <div className="flex">{[...Array(5)].map((_, i) => (<svg key={i} className={`${size} ${i < Math.round(n) ? 'stars-filled' : 'stars-empty'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>))}</div>
);

// Thin line icons (no emoji) for the promise rows
const Icon = ({ d }: { d: string }) => (
  <svg className="h-5 w-5 shrink-0 text-[#a07c3b]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={d}/></svg>
);

const I_TRUCK = 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12';

const I_SCISSORS = 'M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664';

const I_SHIELD = 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z';

const I_GEM = 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z';
const I_TAG = 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z';
const I_HOME = 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25';


const Section = ({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) => (
  <details open={open} className="group border-b border-[#e6dccb] dark:border-dark-700">
    <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-base font-semibold text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
      {title}
      <svg className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
    </summary>
    <div className="pb-6 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
  </details>
);

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [addToCartVisible, setAddToCartVisible] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  // Coming back from the fabric estimator with ?qty=2.5 pre-selects that length
  useEffect(() => {
    const q = Number(new URLSearchParams(window.location.search).get('qty'));
    if (q > 0) setQty(Math.round(q * 2) / 2);
  }, []);
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);
  const [, setActiveTab] = useState<'specs' | 'care' | 'reviews'>('specs');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const { isAuthenticated } = useAuthStore();

  // ?preview=1 from Admin → Products: staff see the customer view with the latest
  // saved data, even for products that are switched off or have no photos yet.
  const [previewMode, setPreviewMode] = useState<boolean | null>(null);
  const storesHydrated = useStoresHydrated();
  useEffect(() => {
    setPreviewMode(new URLSearchParams(window.location.search).get('preview') === '1');
  }, []);

  const { data: initialProduct, isLoading: isProductLoading, isError: isProductError } = useQuery({
    queryKey: previewMode ? ['product-admin-preview', params.slug] : ['product', params.slug],
    queryFn: () =>
      (previewMode ? adminApi.previewProduct(params.slug) : productApi.getBySlug(params.slug)).then((res) => res.data.data),
    enabled: previewMode === false || (previewMode === true && storesHydrated), // preview needs the staff login
    staleTime: previewMode ? 0 : undefined,
    // Use what the product card already had, so the page appears instantly
    placeholderData: () => (previewMode ? undefined : queryClient.getQueryData<any>(['product-preview', params.slug])),
  });

  const styleCode = initialProduct?.styleCode;
  const { data: groupProducts = [] } = useQuery({
    queryKey: ['product-group', styleCode],
    queryFn: () => productApi.getGroup(styleCode!).then(res => res.data.data),
    enabled: !!styleCode,
  });

  // "You may also like": other fabrics of the same type
  const categorySlug = initialProduct?.category?.slug;
  const { data: sameType = [] } = useQuery({
    queryKey: ['also-like', categorySlug],
    queryFn: () => productApi.getAll({ category: categorySlug, limit: 12 }).then((res) => res.data?.data?.products || res.data?.data || []),
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    // First show (possibly the card's preview), then swap in the full details
    // when they arrive — unless the shopper has already picked another colour.
    if (initialProduct && (!selectedVariant || selectedVariant.id === initialProduct.id)) setSelectedVariant(initialProduct);
  }, [initialProduct]);

  // Preload the full details (images, specs) of every colour so switching is instant
  useEffect(() => {
    for (const v of groupProducts as any[]) {
      if (v?.slug && v.slug !== params.slug) {
        queryClient.prefetchQuery({
          queryKey: ['product', v.slug],
          queryFn: () => productApi.getBySlug(v.slug).then((res) => res.data.data),
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  }, [groupProducts, params.slug, queryClient]);

  // Switch colour in place: no page navigation, no spinner, no server round trip
  const selectVariant = (v: any) => {
    if (!v?.slug || v.id === selectedVariant?.id) return;
    const cached = queryClient.getQueryData<any>(['product', v.slug]);
    setSelectedVariant(cached || v);
    setActiveImg(0);
    // Update the address bar (shareable link) without reloading the page
    if (typeof window !== 'undefined') window.history.replaceState(window.history.state, '', `/fabrics/${v.slug}`);
    if (!cached || !cached.images?.length) {
      queryClient
        .fetchQuery({ queryKey: ['product', v.slug], queryFn: () => productApi.getBySlug(v.slug).then((res) => res.data.data) })
        .then((full) => setSelectedVariant((cur: any) => (cur?.id === full?.id ? full : cur)))
        .catch((err) => console.error('Failed to fetch variant data:', err));
    }
  };

  // Save to recently viewed
  useEffect(() => {
    if (initialProduct) {
      saveRecentlyViewed(initialProduct);
      setRecentlyViewed(getRecentlyViewed().filter((p) => p.id !== initialProduct.id));
    }
  }, [initialProduct?.id]);

  // Sticky add-to-cart: hide when button is in view
  useEffect(() => {
    const el = addToCartRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setAddToCartVisible(entry.isIntersecting), { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isProductLoading]);

  const { addItem, items: cartItems } = useCartStore();
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore();

  const reviewMutation = useMutation({
    mutationFn: (data: { rating: number; title?: string; comment?: string }) =>
      productApi.submitReview(PRODUCT?.id, data),
    onSuccess: () => {
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['product', selectedVariant?.slug || params.slug] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit review'),
  });

  if (isProductLoading || previewMode === null || (previewMode && !storesHydrated)) return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/></div>;
  if (isProductError || !initialProduct) return <div className="flex min-h-screen items-center justify-center text-center py-20"><div><p className="text-6xl">🧶</p><h2 className="mt-4 text-2xl font-bold">Fabric not found</h2>{previewMode && <p className="mt-2 text-sm text-gray-500">Preview is only available when signed in as staff.</p>}<button onClick={() => router.back()} className="button-primary mt-6 px-8 py-3">Go Back</button></div></div>;

  const PRODUCT = selectedVariant || initialProduct;
  // never the admin-only Raw photo; customer photos sit just before the design poster (Fabric-3)
  const images = [...customerImages(PRODUCT.images)].sort((a: any, b: any) => photoRank(a.url) - photoRank(b.url));
  const isWishlisted = hasItem(PRODUCT.id);
  const price = PRODUCT.discountPrice ?? PRODUCT.basePrice;
  const minQty = PRODUCT.minOrderQty || 0.5;
  const stock = PRODUCT.totalStock ?? 0;
  const lowStock = stock > 0 && stock <= 10;

  const totalPrice = price * qty;
  const REVIEWS = PRODUCT.reviews || [];
  const availableVariants = groupProducts.length > 0 ? groupProducts : [PRODUCT];


  // WhatsApp chat with Mayank. WhatsApp links can't attach files, so the product
  // link is included — WhatsApp shows it as a preview card with the product photo.
  const whatsappHref = (() => {
    const url = `${SITE_URL}/fabrics/${PRODUCT.slug}`;
    const text = `Hey! I am looking for this fabric. Is it available?\n\n${productDisplayName(PRODUCT)}\n${url}`;
    return `${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
  })();

  const inCart = storesHydrated && cartItems.some((i) => i.productId === PRODUCT.id);

  const handleAddToCart = () => {
    if (stock <= 0) return;
    addItem({ id: PRODUCT.id, productId: PRODUCT.id, product: PRODUCT as any, quantity: qty });
    cartAddedToast(`${productDisplayName(PRODUCT)} (${qty}m) added to cart`);
  };

  const handleWishlist = () => {
    if (isWishlisted) { removeWish(PRODUCT.id); toast('Removed from wishlist'); }
    else { addWish({ id: `w-${PRODUCT.id}`, productId: PRODUCT.id, product: PRODUCT as any, createdAt: new Date().toISOString() }); toast.success('Added to wishlist!'); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: PRODUCT.name, text: `Check out ${PRODUCT.name} on RCS Fabrics`, url }); }
      catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to submit a review'); return; }
    if (!reviewRating) { toast.error('Please select a rating'); return; }
    reviewMutation.mutate({ rating: reviewRating, title: reviewTitle, comment: reviewComment });
  };

  const hexOf = (v: any) => {
    const h = String(v?.colors?.[0]?.hexCode || '').replace('#', '').trim();
    return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h) ? `#${h}` : '#d6cfc4';
  };
  const discountPct = PRODUCT.discountPrice ? Math.round(((PRODUCT.basePrice - PRODUCT.discountPrice) / PRODUCT.basePrice) * 100) : 0;
  const designId = PRODUCT.productCode || PRODUCT.sku || '';
  const designCode = (designId.match(/P\d{4,}/i) || [])[0]?.toUpperCase() || '';
  const widthCm = PRODUCT.width ? Math.round(PRODUCT.width * 2.54) : 0;
  const otherColours = availableVariants.filter((v: any) => v.id !== PRODUCT.id);
  const alsoLike = (Array.isArray(sameType) ? sameType : [])
    .filter((v: any) => v.id !== PRODUCT.id && !availableVariants.some((g: any) => g.id === v.id))
    .slice(0, 5);

  const handleBuyNow = () => {
    if (stock <= 0) return;
    if (!inCart) addItem({ id: PRODUCT.id, productId: PRODUCT.id, product: PRODUCT as any, quantity: qty });
    router.push('/checkout');
  };

  const scrollToReviews = () => {
    setActiveTab('reviews');
    setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };




  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {previewMode && (
        <div className="sticky top-0 z-40 bg-[#2b2118] px-4 py-2 text-center text-xs font-medium text-[#efe2c6]">
          Admin preview — this is how customers see this fabric.
          {initialProduct?.previewOnly && <strong className="ml-1 text-amber-300">Currently hidden from customers (switched off or no photos).</strong>}
        </div>
      )}

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="container-main flex flex-wrap items-center gap-1 pt-5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
        <Link href="/" className="hover:text-primary-700">Home</Link><span className="mx-1 text-gray-300">/</span>
        <Link href="/fabrics" className="hover:text-primary-700">Fabrics</Link><span className="mx-1 text-gray-300">/</span>
        <Link href={`/fabrics?category=${PRODUCT.category?.slug}`} className="hover:text-primary-700">{PRODUCT.category?.name}</Link><span className="mx-1 text-gray-300">/</span>
        <span className="text-gray-800 dark:text-gray-200">{productBaseName(PRODUCT)}</span>
      </nav>

      <div className="container-main pb-16 pt-5 lg:pt-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-12 lg:gap-14">
          {/* ── Gallery ── */}
          <div className="min-w-0 lg:col-span-7">
            {/* Phones: swipe through full-width photos */}
            <div className="-mx-4 lg:hidden">
              <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                onScroll={(e) => { const el = e.currentTarget; const i = Math.round(el.scrollLeft / el.clientWidth); if (i !== activeImg) setActiveImg(i); }}>
                {(images.length ? images : [{ id: 'none', url: '' }]).map((img: any, i: number) => (
                  <button key={img.id} type="button" onClick={() => { setActiveImg(i); img.url && setLightbox(true); }}
                    className="relative w-full shrink-0 snap-center bg-[#f4efe7] dark:bg-dark-800" style={{ aspectRatio: '4 / 5' }} aria-label={`Photo ${i + 1} — tap to enlarge`}>
                    <Image src={supabaseImg(img.url || '', 900) || BLUR_PLACEHOLDER} alt={`${productDisplayName(PRODUCT)} — photo ${i + 1}`}
                      fill priority={i === 0} sizes="100vw" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover object-center"/>
                    {isCustomerPhoto(img.url) && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800">Made by a customer</span>}
                  </button>
                ))}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
                  {images.map((_: any, i: number) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === activeImg ? 'w-5 bg-primary-700' : 'w-1.5 bg-gray-300 dark:bg-dark-600'}`}/>
                  ))}
                </div>
              )}
            </div>

            {/* Tablets and computers: thumbnail rail + large photo */}
            <div className="hidden gap-4 lg:flex">
              {images.length > 1 && (
                <div className="flex w-20 shrink-0 flex-col gap-3">
                  {images.map((img: any, i: number) => (
                    <button key={img.id} type="button" onClick={() => setActiveImg(i)} aria-label={`Show photo ${i + 1}`}
                      style={{ aspectRatio: '4 / 5' }}
                      className={`relative w-full overflow-hidden rounded-lg transition ${i === activeImg ? 'ring-2 ring-primary-700 ring-offset-2 dark:ring-offset-dark-950' : 'opacity-70 hover:opacity-100'}`}>
                      <Image src={supabaseImg(img.url, 200)} alt="" fill sizes="80px" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover object-center"/>
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-[#f4efe7] dark:bg-dark-800" style={{ aspectRatio: '4 / 5' }}
                onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)}
                onClick={() => images?.[activeImg]?.url && setLightbox(true)}>
                <Image src={supabaseImg(images?.[activeImg]?.url || '', 1200) || BLUR_PLACEHOLDER} alt={productDisplayName(PRODUCT)}
                  fill priority sizes="(max-width: 1024px) 100vw, 55vw" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER}
                  className={`object-cover object-center transition-transform duration-700 ${zoomed ? 'scale-110' : 'scale-100'}`}/>
                {isCustomerPhoto(images?.[activeImg]?.url) && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800">Made by a customer</span>}
                <button onClick={(e) => { e.stopPropagation(); handleShare(); }} aria-label="Share this fabric"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm hover:bg-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg>
                </button>
                <span className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white transition-opacity ${zoomed ? 'opacity-0' : 'opacity-100'}`}>Click to enlarge</span>
              </div>
            </div>

            {lightbox && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-2" role="dialog" aria-modal="true" aria-label="Full size photo"
                onClick={() => setLightbox(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={supabaseImg(images?.[activeImg]?.url || '', 2000, 85)} alt={productDisplayName(PRODUCT)} className="max-h-full max-w-full object-contain" />
                <button type="button" onClick={() => setLightbox(false)} aria-label="Close"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25">×</button>
              </div>
            )}
          </div>

          {/* ── Buying panel ── */}
          <div className="min-w-0 lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                <span className="font-semibold uppercase tracking-[0.18em] text-[#a07c3b]">{PRODUCT.category?.name}{designCode ? ` · ${designCode}` : ''}</span>
                {stock > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"/>{lowStock ? `Only ${stock} m left` : 'In stock'}
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600 dark:bg-dark-800 dark:text-gray-300">Out of stock</span>
                )}
              </div>

              <h1 className="mt-3 font-display text-[2.1rem] leading-tight text-gray-900 dark:text-white sm:text-5xl">{productBaseName(PRODUCT)}</h1>
              <p className="mt-1 text-base text-gray-600 dark:text-gray-300">{PRODUCT.category?.name} fabric in {PRODUCT.color?.toLowerCase()}</p>

              {(PRODUCT.ratingCount || 0) > 0 && (
                <button type="button" onClick={scrollToReviews} className="mt-3 flex items-center gap-2 text-sm text-gray-600 hover:text-primary-700 dark:text-gray-400">
                  <Stars n={PRODUCT.rating || 0}/>
                  {PRODUCT.ratingCount} {PRODUCT.ratingCount === 1 ? 'review' : 'reviews'}
                </button>
              )}

              {/* Price */}
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[#e6dccb] pt-6 dark:border-dark-700">
                <span className="font-display text-4xl text-gray-900 dark:text-white">{formatPrice(price)}</span>
                <span className="text-base text-gray-500">per metre</span>
                {PRODUCT.discountPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through">{formatPrice(PRODUCT.basePrice)}</span>
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">{discountPct}% off</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Inclusive of all taxes</p>

              {/* Colour */}
              {availableVariants.length > 0 && (
                <div className="mt-7">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Colour: <span className="font-semibold text-gray-900 dark:text-white">{PRODUCT.color}</span></p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availableVariants.map((v: any) => {
                      const on = PRODUCT.id === v.id;
                      return (
                        <button key={v.id} type="button" onClick={() => selectVariant(v)} aria-pressed={on} aria-label={`Colour: ${v.color}`}
                          className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-4 text-sm transition ${on ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-dark-600 dark:text-gray-300'}`}>
                          <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: hexOf(v) }}/>
                          {v.color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Length */}
              {stock > 0 && (
                <div className="mt-7">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Length <span className="text-xs text-gray-400">· swipe or tap</span></p>
                    <p className="text-xs text-gray-500">{stock} m available</p>
                  </div>
                  <div className="mt-3"><MetrePicker value={qty} onChange={setQty} min={minQty} max={stock}/></div>
                  <p className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
                    {qty} m × {formatPrice(price)} = <span className="font-semibold text-gray-900 dark:text-white">{formatPrice(totalPrice)}</span>
                  </p>
                  <Link href={`/fabric-estimator?fabric=${encodeURIComponent(PRODUCT.slug)}&name=${encodeURIComponent(productBaseName(PRODUCT))}&width=${PRODUCT.width || ''}`}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9cdb8] bg-[#fffdf9] px-4 py-3 text-sm text-gray-700 transition hover:border-[#a07c3b] dark:border-dark-600 dark:bg-dark-900 dark:text-gray-300">
                    <svg className="h-5 w-5 shrink-0 text-[#a07c3b]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25V6.75A.75.75 0 013.75 6h16.5a.75.75 0 01.75.75v10.5a.75.75 0 01-.75.75H3.75A.75.75 0 013 17.25zM7 6v4m4-4v6m4-6v4m4-4v6"/></svg>
                    <span>Not sure how much to buy? <span className="font-semibold text-primary-700 underline underline-offset-4 dark:text-primary-400">Use the fabric estimator</span></span>
                  </Link>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                {inCart ? (
                  <Link href="/cart" className="button-primary flex-1 justify-center py-4 text-base">Go to bag &amp; checkout →</Link>
                ) : (
                  <button ref={addToCartRef} onClick={handleAddToCart} disabled={stock <= 0}
                    className="button-primary flex-1 justify-center py-4 text-base disabled:cursor-not-allowed disabled:opacity-50">
                    Add {qty} m to bag
                  </button>
                )}
                <button onClick={handleWishlist} aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`flex w-14 shrink-0 items-center justify-center rounded-xl border transition ${isWishlisted ? 'border-primary-700 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-400 dark:border-dark-600 dark:text-gray-300'}`}>
                  <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
                </button>
              </div>
              {stock > 0 && !inCart && (
                <button type="button" onClick={handleBuyNow}
                  className="mt-3 w-full rounded-xl border border-gray-900 py-3.5 text-base font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900">
                  Buy now
                </button>
              )}
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#128C4B] dark:text-gray-300">
                <span className="text-[#25D366]"><svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span>
                Not sure about the colour or feel? <span className="font-semibold underline underline-offset-4">Ask Mayank on WhatsApp</span>
              </a>

              {/* Promise */}
              <ul className="mt-7 divide-y divide-[#e6dccb] rounded-2xl border border-[#e6dccb] bg-[#faf6ee] text-sm dark:divide-dark-700 dark:border-dark-700 dark:bg-dark-900">
                <li className="flex items-center gap-3 px-4 py-3.5"><Icon d={I_TRUCK}/><span className="text-gray-700 dark:text-gray-300">Delivered by <strong className="text-gray-900 dark:text-white">{deliverByLabel(new Date())}</strong> if ordered today</span></li>
                <li className="flex items-center gap-3 px-4 py-3.5"><Icon d={I_SCISSORS}/><span className="text-gray-700 dark:text-gray-300">Cut fresh to your length</span></li>
                <li className="flex items-center gap-3 px-4 py-3.5"><Icon d={I_SHIELD}/><span className="text-gray-700 dark:text-gray-300">Wrong or damaged? Tell us within 48 h — <Link href="/returns" className="underline underline-offset-4">we&apos;ll put it right</Link></span></li>
              </ul>
              <p className="mt-3 text-center text-xs text-gray-500">Free shipping on orders above ₹2,000</p>

              {/* Three promises */}
              <div className="mt-8 grid grid-cols-3 divide-x divide-[#e6dccb] dark:divide-dark-700">
                {[
                  { d: I_GEM, t: 'Hand-picked', s: 'quality' },
                  { d: I_TAG, t: 'Honest price', s: 'per metre' },
                  { d: I_HOME, t: 'Family-run', s: 'since 1958' },
                ].map((x) => (
                  <div key={x.t} className="flex flex-col items-center gap-2 px-2 text-center sm:flex-row sm:text-left">
                    <svg className="h-9 w-9 shrink-0 text-[#a07c3b]" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={x.d}/></svg>
                    <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">{x.t}<br/><span className="font-normal text-gray-600 dark:text-gray-400">{x.s}</span></p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="mt-8 border-t border-[#e6dccb] dark:border-dark-700">
                <Section title="Description" open>
                  <p>{PRODUCT.description || PRODUCT.category?.description || (() => {
                    const base = productBaseName(PRODUCT);
                    const cat = PRODUCT.category?.name || '';
                    const named = base.toLowerCase().includes(cat.toLowerCase());
                    return `${base}${named ? '' : ` ${cat.toLowerCase()}`} in ${PRODUCT.color?.toLowerCase()}. Sold by the metre and cut fresh to the length you order.`;
                  })()}</p>
                  {(PRODUCT.bestFor?.length || 0) > 0 && (
                    <p className="mt-3"><span className="font-semibold text-gray-900 dark:text-white">Best for:</span> {PRODUCT.bestFor!.join(', ')}</p>
                  )}
                  {(PRODUCT.properties?.length || 0) > 0 && (
                    <p className="mt-1"><span className="font-semibold text-gray-900 dark:text-white">Feel:</span> {PRODUCT.properties!.join(', ')}</p>
                  )}
                </Section>
                <Section title="Fabric details">
                  <dl className="grid grid-cols-[8rem_1fr] gap-y-2.5 text-sm">
                    <dt className="text-gray-500">Fabric</dt><dd>{PRODUCT.category?.name}</dd>
                    {PRODUCT.width ? (<><dt className="text-gray-500">Width</dt><dd>{PRODUCT.width} inches | {widthCm} cm</dd></>) : null}
                    <dt className="text-gray-500">Pattern</dt><dd>{PRODUCT.pattern}</dd>
                    <dt className="text-gray-500">Stretch</dt><dd>{PRODUCT.stretchability}</dd>
                    <dt className="text-gray-500">Colour</dt><dd>{PRODUCT.color}</dd>
                    <dt className="text-gray-500">Sold by</dt><dd>From {minQty} m, in 0.5 m steps</dd>
                    {designId && (<><dt className="text-gray-500">Design ID</dt><dd className="break-all">{designId}</dd></>)}
                  </dl>
                  <p className="mt-4 text-xs text-gray-500">Colours can look slightly different on screen. Message us on WhatsApp for a quick video of the fabric.</p>
                </Section>
                <Section title="Shipping">
                  <p>Dispatched within 1–2 business days and delivered within 10 days of your order, anywhere in India. Free shipping on orders above ₹2,000. <Link href="/shipping" className="font-medium text-primary-700 underline underline-offset-4 dark:text-primary-400">Shipping policy</Link></p>
                  <p className="mt-2">Cut fabric can&apos;t be returned, but if anything arrives wrong or damaged, tell us within 48 hours and we&apos;ll replace it or refund you. <Link href="/returns" className="font-medium text-primary-700 underline underline-offset-4 dark:text-primary-400">Returns policy</Link></p>
                </Section>
                <Section title="Wash care">
                  <ul className="list-disc space-y-1.5 pl-5">
                    <li>Wash separately the first time, in cold water.</li>
                    <li>Gentle hand wash or dry clean; do not bleach.</li>
                    <li>Dry in the shade and iron on low to medium heat.</li>
                  </ul>
                </Section>
              </div>
            </div>
          </div>
        </div>

        {/* ── Other colours ── */}
        {otherColours.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl text-gray-900 dark:text-white sm:text-3xl">Also in this design</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {otherColours.map((v: any) => (
                <button key={v.id} type="button" onClick={() => { selectVariant(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group text-left">
                  <div className="relative overflow-hidden rounded-xl bg-[#f4efe7] dark:bg-dark-800" style={{ aspectRatio: '4 / 5' }}>
                    {customerImages(v.images)?.[0]?.url && (
                      <Image src={supabaseImg(customerImages(v.images)[0].url || '', 400)} alt={productDisplayName(v)} fill sizes="200px"
                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover object-center transition-transform duration-500 group-hover:scale-105"/>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{productBaseName(v)}</p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400"><span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: hexOf(v) }}/>{v.color}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── You may also like ── */}
        {alsoLike.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl text-gray-900 dark:text-white sm:text-3xl">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {alsoLike.map((v: any) => (
                <Link key={v.id} href={`/fabrics/${v.slug}`} className="group">
                  <div className="relative overflow-hidden rounded-xl bg-[#f4efe7] dark:bg-dark-800" style={{ aspectRatio: '4 / 5' }}>
                    {customerImages(v.images)?.[0]?.url && (
                      <Image src={supabaseImg(customerImages(v.images)[0].url || '', 400)} alt={productDisplayName(v)} fill sizes="200px"
                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover object-center transition-transform duration-500 group-hover:scale-105"/>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{productBaseName(v)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{v.color} · {formatPrice(v.discountPrice ?? v.basePrice)}/m</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        <div ref={tabsRef} className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-gray-900 dark:text-white sm:text-3xl">Reviews</h2>
            {REVIEWS.length > 0 && <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"><Stars n={PRODUCT.rating || 0}/>{(PRODUCT.rating || 0).toFixed(1)} · {REVIEWS.length} {REVIEWS.length === 1 ? 'review' : 'reviews'}</div>}
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {REVIEWS.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#e6dccb] p-6 text-sm text-gray-500 dark:border-dark-700">No reviews yet. Bought this fabric? Tell others what you made with it.</p>
              ) : REVIEWS.map((r: any) => (
                <div key={r.id} className="border-b border-[#e6dccb] pb-5 dark:border-dark-700">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.user?.firstName} {r.user?.lastName?.[0] ? `${r.user.lastName[0]}.` : ''}</p>
                    <Stars n={r.rating}/>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {r.title && <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white">{r.title}</p>}
                  {r.comment && <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{r.comment}</p>}
                </div>
              ))}
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#e6dccb] p-6 dark:border-dark-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Write a review</h3>
                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm text-gray-600 dark:text-gray-300">Your rating</label>
                      <StarRating value={reviewRating} onChange={setReviewRating}/>
                    </div>
                    <input value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} placeholder="Title (optional)" aria-label="Title" className="input-field"/>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} aria-label="Comment"
                      placeholder="How did it feel? What did you make with it?" className="input-field resize-none"/>
                    <button type="submit" disabled={reviewMutation.isPending} className="button-primary px-6 py-2.5 text-sm disabled:opacity-50">
                      {reviewMutation.isPending ? 'Submitting…' : 'Submit review'}
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400"><Link href="/auth" className="font-medium text-primary-700 underline underline-offset-4 dark:text-primary-400">Sign in</Link> to write a review.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recently viewed ── */}
        {recentlyViewed.filter((p) => p.id !== PRODUCT.id).length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl text-gray-900 dark:text-white sm:text-3xl">Recently viewed</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {recentlyViewed.filter((p) => p.id !== PRODUCT.id).slice(0, 5).map((p) => (
                <Link key={p.id} href={`/fabrics/${p.slug}`} className="group">
                  <div className="relative overflow-hidden rounded-xl bg-[#f4efe7] dark:bg-dark-800" style={{ aspectRatio: '4 / 5' }}>
                    {p.image && <Image src={supabaseImg(p.image, 400)} alt={p.name} fill sizes="200px" placeholder="blur" blurDataURL={BLUR_PLACEHOLDER}
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-105"/>}
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm font-medium text-gray-900 dark:text-white">{productBaseName({ name: p.name, color: null })}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(p.price)}/m</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile Add to Cart */}
      {!addToCartVisible && stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-4 py-3 shadow-2xl dark:border-dark-700 dark:bg-dark-900 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{productBaseName(PRODUCT)}</p>
              <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatPrice(price)}/m</p>
            </div>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Ask on WhatsApp"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            {inCart ? (
              <Link href="/cart" className="button-primary shrink-0 px-5 py-3 text-sm">
                Go to bag →
              </Link>
            ) : (
              <button onClick={handleAddToCart} className="button-primary shrink-0 px-5 py-3 text-sm">
                Add {qty} m to bag
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
