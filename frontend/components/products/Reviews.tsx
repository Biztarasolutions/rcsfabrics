'use client';

import React from 'react';

export default function Reviews({ productId }: { productId: string }) {
  const sampleReviews = [
    {
      author: 'Customer 1',
      rating: 5,
      title: 'Excellent Quality',
      text: 'Absolutely loved the fabric. Premium quality as described.',
      verified: true,
    },
    {
      author: 'Customer 2',
      rating: 4,
      title: 'Great Product',
      text: 'Good quality but took longer to deliver than expected.',
      verified: true,
    },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Customer Reviews</h2>

      {/* Write Review */}
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-dark-700 dark:bg-dark-800">
        <h3 className="font-semibold">Write a Review</h3>
        <button className="button-primary mt-4">Write Review</button>
      </div>

      {/* Reviews List */}
      <div className="mt-8 space-y-6">
        {sampleReviews.map((review, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 p-4 dark:border-dark-700"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{review.author}</h4>
                <div className="mt-1 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < review.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {review.verified && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-100">
                  Verified
                </span>
              )}
            </div>
            <h5 className="mt-2 font-semibold">{review.title}</h5>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {review.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
