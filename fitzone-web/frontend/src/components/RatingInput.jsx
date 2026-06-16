import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const activeValue = hovered || value;

  return (
    <div className="rating-input" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          type="button"
          className={rating <= activeValue ? 'active' : ''}
          key={rating}
          onClick={() => onChange(rating)}
          onMouseEnter={() => setHovered(rating)}
          aria-label={`Rate ${rating} star${rating === 1 ? '' : 's'}`}
          aria-pressed={value === rating}
        >
          <Star />
        </button>
      ))}
    </div>
  );
}
