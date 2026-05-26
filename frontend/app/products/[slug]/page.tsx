'use client';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api';
import { useCartStore, useWishlistStore } from '@/lib/store';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'care' | 'reviews'>('specs');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Initial fetch by slug
  const { data: initialProduct, isLoading: isProductLoading, isError: isProductError } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => productApi.getBySlug(params.slug).then(res => res.data.data),
  });

  // Fetch group if styleCode exists
  const styleCode = initialProduct?.styleCode;
  const { data: groupProducts = [] } = useQuery({
    queryKey: ['product-group', styleCode],
    queryFn: () => productApi.getGroup(styleCode!).then(res => res.data.data),
    enabled: !!styleCode,
  });

  useEffect(() => {
    if (initialProduct && !selectedVariant) {
      setSelectedVariant(initialProduct);
    }
  }, [initialProduct]);

  // Load full data for selected variant if needed
  useEffect(() => {
    if (selectedVariant && (!selectedVariant.images || selectedVariant.images.length === 0) && selectedVariant.slug) {
      productApi.getBySlug(selectedVariant.slug).then(res => {
        setSelectedVariant(res.data.data);
      }).catch(err => console.error('Failed to fetch variant data:', err));
    }
  }, [selectedVariant?.slug]);

  // Sync selected variant with URL using Next.js router
  useEffect(() => {
    if (selectedVariant && selectedVariant.slug !== params.slug) {
      router.replace(`/products/${selectedVariant.slug}`);
    }
    // reset active image on variant switch
    setActiveImg(0);
  }, [selectedVariant, params.slug, router]);

  const { addItem } = useCartStore();
  const { addItem: addWish, removeItem: removeWish, hasItem } = useWishlistStore();

  if (isProductLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"/></div>;
  if (isProductError || !initialProduct) return <div className="flex min-h-screen items-center justify-center text-center py-20"><div><p className="text-6xl">🧶</p><h2 className="mt-4 text-2xl font-bold">Product not found</h2><button onClick={() => router.back()} className="button-primary mt-6 px-8 py-3">Go Back</button></div></div>;

  const PRODUCT = selectedVariant || initialProduct;
  const images = PRODUCT.images ?? [];
  const isWishlisted = hasItem(PRODUCT.id);
  const price = PRODUCT.discountPrice || PRODUCT.basePrice;
  const discount = PRODUCT.discountPrice ? calculateDiscount(PRODUCT.basePrice, PRODUCT.discountPrice) : 0;
  const totalPrice = price * qty;
  const REVIEWS = PRODUCT.reviews || [];

  const handleAddToCart = () => {
    if (PRODUCT.totalStock <= 0) return;
    addItem({ id: `${PRODUCT.id}-${Date.now()}`, productId: PRODUCT.id, product: PRODUCT as any, quantity: qty });
    toast.success(`${PRODUCT.name} (${qty}m) added to cart!`);
  };

  const handleWishlist = () => {
    if (isWishlisted) { removeWish(PRODUCT.id); toast('Removed from wishlist'); }
    else { addWish({ id: `w-${PRODUCT.id}`, productId: PRODUCT.id, product: PRODUCT as any, createdAt: new Date().toISOString() }); toast.success('Added to wishlist!'); }
  };

  const specs = [
    { label: 'Best For', value: PRODUCT.bestFor?.join(', ') || 'N/A' },
    { label: 'Properties', value: PRODUCT.properties?.join(', ') || 'N/A' },
    { label: 'Width', value: PRODUCT.width ? `${PRODUCT.width} inches` : 'N/A' },
    { label: 'Pattern', value: PRODUCT.pattern || 'N/A' },
    { label: 'Color', value: PRODUCT.color || 'N/A' },
    { label: 'Stretchability', value: PRODUCT.stretchability || 'N/A' },
    { label: 'Min Order', value: `${PRODUCT.minOrderQty || 0.5} meter` },
    { label: 'Stock', value: `${PRODUCT.totalStock} meters` },
  ];

  // Colors available in the group
  const availableVariants = groupProducts.length > 0 ? groupProducts : [PRODUCT];

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 dark:border-dark-800">
        <div className="container-main py-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Home</span> <span className="mx-2">/</span>
          <span>Fabrics</span> <span className="mx-2">/</span>
          <span>{PRODUCT.category?.name}</span> <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{PRODUCT.name}</span>
        </div>
      </div>

      <div className="container-main py-10">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-gray-50 dark:bg-dark-800" style={{ aspectRatio: '1' }}
              onMouseEnter={() => setZoomed(true)} onMouseLeave={() => setZoomed(false)}>
              <Image src={images?.[activeImg]?.url || 'https://via.placeholder.com/800'} alt={PRODUCT.name}
                fill priority sizes="(max-width: 1024px) 100vw, 50vw" className={`object-cover transition-transform duration-500 ${zoomed ? 'scale-125' : 'scale-100'}`}/>
              {PRODUCT.discountPrice && (
                <div className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white">
                  -{discount}%
                </div>
              )}
              <div className={`absolute bottom-4 right-4 rounded-full border border-white/40 bg-black/30 px-3 py-1 text-xs text-white backdrop-blur-sm transition-opacity ${zoomed ? 'opacity-0' : 'opacity-100'}`}>
                Hover to zoom
              </div>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {images?.map((img: any, i: number) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === activeImg ? 'border-primary-500 shadow-md' : 'border-gray-200 dark:border-dark-700 hover:border-primary-300'}`}>
                  <Image src={img.url} alt={`View ${i + 1}`} fill sizes="80px" className="object-cover"/>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {PRODUCT.category?.name}
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold text-gray-900 dark:text-white">{PRODUCT.name}</h1>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex">{[...Array(5)].map((_, i) => (<svg key={i} className={`h-5 w-5 ${i < Math.round(PRODUCT.rating || 0) ? 'stars-filled' : 'stars-empty'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>))}</div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{PRODUCT.ratingCount || 0} reviews</span>
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
                  <p className="text-sm font-semibold text-green-600">Save {discount}%</p>
                </div>
              )}
            </div>

            <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">{PRODUCT.description}</p>

            {/* Color Swatches */}
            {availableVariants.length > 1 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Color: {PRODUCT.color}</p>
                <div className="flex flex-wrap gap-3">
                  {availableVariants.map((v: any) => {
                    // Extract hexCode from v.colors if it exists, otherwise provide a fallback logic
                    const hexCode = v.colors?.[0]?.hexCode || '#CCC';
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        title={v.color}
                        className={`h-10 w-10 rounded-full border-2 transition-all ${PRODUCT.id === v.id ? 'border-primary-600 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'} flex items-center justify-center overflow-hidden`}
                      >
                        {/* If we don't have hex codes correctly mapped, we might just display initials or rely on image thumbnails, but we requested hexCode in product family creation so it should be there */}
                        <div className="h-full w-full" style={{ backgroundColor: hexCode }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Meter Selector */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-dark-700 dark:bg-dark-800/50">
              {PRODUCT.totalStock <= 0 ? (
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">Out of Stock</p>
                  <p className="text-sm text-gray-500 mt-1">This variant is currently unavailable.</p>
                </div>
              ) : (
                <>
                  <label className="text-sm font-semibold text-gray-900 dark:text-white">Select Quantity (in meters)</label>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-dark-700">
                      <button onClick={() => setQty(Math.max(PRODUCT.minOrderQty || 0.5, qty - 0.5))}
                        className="flex h-11 w-11 items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">−</button>
                      <input type="number" value={qty} min={PRODUCT.minOrderQty || 0.5} step={0.5}
                        onChange={(e) => setQty(Math.max(PRODUCT.minOrderQty || 0.5, parseFloat(e.target.value) || PRODUCT.minOrderQty || 0.5))}
                        className="h-11 w-20 bg-white text-center text-base font-semibold dark:bg-dark-800 dark:text-white focus:outline-none"/>
                      <button onClick={() => setQty(Math.min(PRODUCT.totalStock, qty + 0.5))}
                        className="flex h-11 w-11 items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 transition-colors">+</button>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(totalPrice)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Minimum order: {PRODUCT.minOrderQty || 0.5}m · {PRODUCT.totalStock}m in stock</p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={handleAddToCart} 
                disabled={PRODUCT.totalStock <= 0}
                className="button-primary flex-1 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                Add {qty}m to Cart
              </button>
              <button onClick={handleWishlist}
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-4 font-semibold transition-all ${isWishlisted ? 'border-red-400 bg-red-50 text-red-500 dark:border-red-700 dark:bg-red-950/30' : 'border-gray-200 text-gray-700 hover:border-primary-400 dark:border-dark-700 dark:text-gray-300'}`}>
                <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
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
        <div className="mt-16">
          <div className="border-b border-gray-200 dark:border-dark-800">
            <div className="flex gap-8">
              {(['specs', 'care', 'reviews'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`border-b-2 pb-4 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                  {tab === 'specs' ? 'Fabric Specifications' : tab === 'care' ? 'Product Properties' : `Reviews (${REVIEWS.length})`}
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
              <div className="max-w-lg space-y-3">
                {PRODUCT.properties?.length ? (
                   <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 dark:bg-dark-800">
                    <svg className="h-4 w-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{PRODUCT.properties.join(', ')}</span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No product properties available.</p>
                )}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-4 max-w-2xl">
                {REVIEWS.length === 0 ? (
                  <p className="text-sm text-gray-500">No reviews yet for this fabric.</p>
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
                      <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
