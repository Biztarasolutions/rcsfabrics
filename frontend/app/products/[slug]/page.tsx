'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { useCartStore, useWishlistStore, useAuthStore } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
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

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const addToCartRef = useRef<HTMLButtonElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [addToCartVisible, setAddToCartVisible] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'reviews'>('specs');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<ReturnType<typeof getRecentlyViewed>>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');

  const { isAuthenticated } = useAuthStore();

  const { data: initialProduct, isLoading: isProductLoading, isError: isProductError } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => productApi.getBySlug(params.slug).then(res => res.data.data),
  });

  const styleCode = initialProduct?.styleCode;
  const { data: groupProducts = [] } = useQuery({
    queryKey: ['product-group', styleCode],
    queryFn: () => productApi.getGroup(styleCode!).then(res => res.data.data),
    enabled: !!styleCode,
  });

  useEffect(() => {
    if (initialProduct && !selectedVariant) setSelectedVariant(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    if (selectedVariant && (!selectedVariant.images || selectedVariant.images.length === 0) && selectedVariant.slug) {
      productApi.getBySlug(selectedVariant.slug).then(res => setSelectedVariant(res.data.data))
        .catch(err => console.error('Failed to fetch variant data:', err));
    }
  }, [selectedVariant?.slug]);

  useEffect(() => {
    if (selectedVariant && selectedVariant.slug !== params.slug) {
      router.replace(`/products/${selectedVariant.slug}`);
    }
    setActiveImg(0);
  }, [selectedVariant, params.slug, router]);

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

  const { addItem } = useCartStore();
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore();

  const reviewMutation = useMutation({
    mutationFn: (data: { rating: number; title?: string; comment?: string }) =>
      productApi.submitReview(PRODUCT?.id, data),
    onSuccess: () => {
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewTitle('');
      setReviewComment('');
      queryClient.invalidateQueries({ queryKey: ['product', params.slug] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit review'),
  });

  if (isProductLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/></div>;
  if (isProductError || !initialProduct) return <div className="flex min-h-screen items-center justify-center text-center py-20"><div><p className="text-6xl">🧶</p><h2 className="mt-4 text-2xl font-bold">Product not found</h2><button onClick={() => router.back()} className="button-primary mt-6 px-8 py-3">Go Back</button></div></div>;

  const PRODUCT = selectedVariant || initialProduct;
  const images = PRODUCT.images ?? [];
  const isWishlisted = hasItem(PRODUCT.id);
  const price = PRODUCT.discountPrice ?? PRODUCT.basePrice;
  const minQty = PRODUCT.minOrderQty || 0.5;
  const stock = PRODUCT.totalStock ?? 0;
  const lowStock = stock > 0 && stock <= 10;

  let discountBadge: string | null = null;
  if (PRODUCT.discountPrice) {
    const discountType = PRODUCT.discountType?.toLowerCase();
    if (discountType === 'percentage') {
      discountBadge = `-${Math.round(((PRODUCT.basePrice - PRODUCT.discountPrice) / PRODUCT.basePrice) * 100)}%`;
    } else if (discountType === 'fixed') {
      discountBadge = `-₹${Math.round(PRODUCT.basePrice - PRODUCT.discountPrice)}`;
    }
  }

  const totalPrice = price * qty;
  const REVIEWS = PRODUCT.reviews || [];
  const availableVariants = groupProducts.length > 0 ? groupProducts : [PRODUCT];

  const specs = [
    { label: 'Best For', value: PRODUCT.bestFor?.join(', ') || 'N/A' },
    { label: 'Width', value: PRODUCT.width ? `${PRODUCT.width} inches` : 'N/A' },
    { label: 'Pattern', value: PRODUCT.pattern || 'N/A' },
    { label: 'Color', value: PRODUCT.color || 'N/A' },
    { label: 'Stretchability', value: PRODUCT.stretchability || 'N/A' },
    { label: 'Min Order', value: `${minQty} meter` },
    { label: 'Stock', value: `${stock} meters` },
  ];

  const handleAddToCart = () => {
    if (stock <= 0) return;
    addItem({ id: PRODUCT.id, productId: PRODUCT.id, product: PRODUCT as any, quantity: qty });
    toast.success(`${PRODUCT.name} (${qty}m) added to cart!`);
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

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 dark:border-dark-800">
        <div className="container-main py-4 text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-1">
          <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
          <span className="mx-1">/</span>
          <Link href="/products" className="hover:text-primary-600 transition-colors">Fabrics</Link>
          <span className="mx-1">/</span>
          <Link href={`/products?category=${PRODUCT.category?.slug}`} className="hover:text-primary-600 transition-colors">{PRODUCT.category?.name}</Link>
          <span className="mx-1">/</span>
          <span className="text-gray-900 dark:text-white">{PRODUCT.name}</span>
        </div>
      </div>

      <div className="container-main py-10">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-dark-800" style={{ aspectRatio: '1' }}
              onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)}>
              <Image src={supabaseImg(images?.[activeImg]?.url || '', 1000) || 'https://via.placeholder.com/800'} alt={PRODUCT.name}
                fill priority sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur" blurDataURL={BLUR_PLACEHOLDER}
                className={`object-cover transition-transform duration-500 ${zoomed ? 'scale-125' : 'scale-100'}`}/>
              {PRODUCT.discountPrice && discountBadge && (
                <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">{discountBadge}</div>
              )}
              <div className={`absolute bottom-4 right-4 rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs text-white backdrop-blur-sm transition-opacity ${zoomed ? 'opacity-0' : 'opacity-100'}`}>
                Hover to zoom
              </div>
              {/* Share button */}
              <button onClick={handleShare}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md text-gray-700 hover:bg-white transition-colors"
                aria-label="Share product">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
              </button>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images?.map((img: any, i: number) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === activeImg ? 'border-primary-500 shadow-md' : 'border-gray-200 dark:border-dark-700 hover:border-primary-300'}`}>
                  <Image src={supabaseImg(img.url, 160)} alt={`View ${i + 1}`} fill sizes="80px"
                    placeholder="blur" blurDataURL={BLUR_PLACEHOLDER} className="object-cover"/>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">{PRODUCT.category?.name}</p>
              <h1 className="mt-2 font-display text-4xl font-bold text-gray-900 dark:text-white">{PRODUCT.name}</h1>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex">{[...Array(5)].map((_, i) => (<svg key={i} className={`h-5 w-5 ${i < Math.round(PRODUCT.rating || 0) ? 'stars-filled' : 'stars-empty'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>))}</div>
                <button onClick={() => { setActiveTab('reviews'); setTimeout(() => tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} className="text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors">
                  {PRODUCT.ratingCount || 0} reviews
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Price per meter</p>
                <p className="font-display text-4xl font-bold text-primary-700 dark:text-primary-400">{formatPrice(price)}</p>
              </div>
              {PRODUCT.discountPrice && (
                <div>
                  <p className="text-lg text-gray-400 line-through">{formatPrice(PRODUCT.basePrice)}</p>
                  <p className="text-sm font-semibold text-green-600">Save {formatPrice(PRODUCT.basePrice - (PRODUCT.discountPrice ?? PRODUCT.basePrice))}</p>
                </div>
              )}
            </div>

            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{PRODUCT.description}</p>

            {/* Color Swatches */}
            {availableVariants.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Color: {PRODUCT.color}</p>
                <div className="flex flex-wrap gap-3">
                  {availableVariants.map((v: any) => {
                    const hexCode = v.colors?.[0]?.hexCode || '#CCC';
                    return (
                      <button key={v.id} onClick={() => setSelectedVariant(v)} title={v.color}
                        className={`h-10 w-10 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden ${PRODUCT.id === v.id ? 'border-primary-600 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}>
                        <div className="h-full w-full" style={{ backgroundColor: hexCode }}/>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meter Selector */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-700 dark:bg-dark-800/50">
              {stock <= 0 ? (
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">Out of Stock</p>
                  <p className="text-sm text-gray-500 mt-1">This variant is currently unavailable.</p>
                </div>
              ) : (
                <>
                  {lowStock && (
                    <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-orange-600 dark:text-orange-400">
                      <span>⚠️</span> Only {stock}m left — order soon!
                    </p>
                  )}
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">Select Quantity (in meters)</label>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-dark-700">
                      <button onClick={() => setQty(q => Math.max(minQty, parseFloat((q - 0.5).toFixed(1))))}
                        className="flex h-11 w-11 items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">−</button>
                      <input type="number" value={qty} min={minQty} max={stock} step={0.5}
                        onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setQty(v); }}
                        onBlur={(e) => { const v = parseFloat(e.target.value); setQty(isNaN(v) || v < minQty ? minQty : Math.min(stock, v)); }}
                        className="h-11 w-20 bg-white text-center text-base font-semibold dark:bg-dark-800 dark:text-white focus:outline-none"/>
                      <button onClick={() => setQty(q => Math.min(stock, parseFloat((q + 0.5).toFixed(1))))}
                        className="flex h-11 w-11 items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">+</button>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(totalPrice)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Minimum order: {minQty}m · {stock}m in stock</p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button ref={addToCartRef}
                onClick={handleAddToCart}
                disabled={stock <= 0}
                className="button-primary flex-1 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Add {qty}m to Cart
              </button>
              <button onClick={handleWishlist}
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-4 font-semibold transition-all ${isWishlisted ? 'border-red-400 bg-red-50 text-red-500 dark:border-red-700 dark:bg-red-950/30' : 'border-gray-200 text-gray-700 hover:border-primary-400 dark:border-dark-700 dark:text-gray-300'}`}>
                <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              </button>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-5 dark:border-dark-800">
              {['🚚 Free Shipping ₹2K+', '↩️ 30-Day Returns', '✅ 100% Authentic'].map((t) => (
                <span key={t} className="text-sm font-medium text-gray-600 dark:text-gray-400">{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div ref={tabsRef} className="mt-16">
          <div className="border-b border-gray-200 dark:border-dark-800">
            <div className="flex gap-8">
              {(['specs', 'care', 'reviews'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-4 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                  {tab === 'specs' ? 'Fabric Specifications' : tab === 'care' ? 'Properties' : `Reviews (${REVIEWS.length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {activeTab === 'specs' && (
              <div className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-700 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex gap-4 bg-white px-5 py-4 dark:bg-dark-800">
                    <span className="w-32 shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400">{spec.label}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'care' && (
              <div className="max-w-lg">
                {PRODUCT.properties?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT.properties.map((prop: string) => (
                      <span key={prop} className="flex items-center gap-1.5 rounded-full bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-300">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                        {prop}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No product properties available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-8 max-w-2xl">
                {/* Write review form */}
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-dark-700 dark:bg-dark-800">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Write a Review</h3>
                  {isAuthenticated ? (
                    <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Your Rating</label>
                        <StarRating value={reviewRating} onChange={setReviewRating}/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Title (optional)</label>
                        <input value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)}
                          placeholder="Summarise your experience" className="input-field"/>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Comment (optional)</label>
                        <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                          rows={3} placeholder="Tell us more about this fabric..."
                          className="input-field resize-none"/>
                      </div>
                      <button type="submit" disabled={reviewMutation.isPending}
                        className="button-primary px-6 py-2.5 text-sm disabled:opacity-50">
                        {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  ) : (
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <Link href="/auth" className="text-primary-600 hover:underline dark:text-primary-400">Login</Link> to write a review.
                    </p>
                  )}
                </div>

                {/* Existing reviews */}
                <div className="space-y-4">
                  {REVIEWS.length === 0 ? (
                    <p className="text-sm text-gray-500">No reviews yet — be the first!</p>
                  ) : (
                    REVIEWS.map((r: any) => (
                      <div key={r.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-dark-700 dark:bg-dark-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">{(r.user?.firstName || 'U')[0]}</div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.user?.firstName} {r.user?.lastName}</p>
                              <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex">{[...Array(5)].map((_, i) => (<svg key={i} className={`h-4 w-4 ${i < r.rating ? 'stars-filled' : 'stars-empty'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>))}</div>
                        </div>
                        {r.title && <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-white">{r.title}</p>}
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{r.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Recently Viewed</h2>
            <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {recentlyViewed.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`}
                  className="group rounded-2xl border border-gray-100 bg-white p-3 transition-shadow hover:shadow-md dark:border-dark-700 dark:bg-dark-800">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 dark:bg-dark-700">
                    {p.image ? (
                      <Image src={supabaseImg(p.image, 400)} alt={p.name} fill sizes="200px"
                        placeholder="blur" blurDataURL={BLUR_PLACEHOLDER}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"/>
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">🧵</div>
                    )}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-gray-900 line-clamp-2 dark:text-white">{p.name}</p>
                  <p className="text-xs text-primary-600 dark:text-primary-400">{formatPrice(p.price)}/m</p>
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
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{PRODUCT.name}</p>
              <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatPrice(price)}/m</p>
            </div>
            <button onClick={handleAddToCart} className="button-primary shrink-0 px-6 py-3 text-sm">
              Add {qty}m to Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
