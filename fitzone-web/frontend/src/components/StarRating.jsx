import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, count, size = 14, showValue = true }) {
  const rating = Math.min(5, Math.max(0, Number(value) || 0));

  return (
    <div className="star-rating" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <span className="star-icons" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - star + 1));
          return (
            <span className="star-icon" key={star} style={{ width: size, height: size }}>
              <Star size={size} />
              <span className="star-fill" style={{ width: `${fill * 100}%` }}><Star size={size} /></span>
            </span>
          );
        })}
      </span>
      {showValue && <strong>{rating.toFixed(1)}</strong>}
      {count !== undefined && <small>({Number(count || 0).toLocaleString()} reviews)</small>}
    </div>
  );
}
