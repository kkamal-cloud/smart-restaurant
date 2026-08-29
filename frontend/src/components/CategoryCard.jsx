import React from 'react';
import { getImageUrl } from '../api';
import './CategoryCard.css';

function CategoryCard({ category }) {
  return (
    <div className="category-card">
      <div className="category-img-container">
        {/* Fallback to a colored div if image is missing */}
        <div className="category-fallback">{category.name ? category.name[0] : 'C'}</div>
        <img src={getImageUrl(category.image)} alt={category.name || 'Category'} className="category-image" onError={(e) => e.target.style.display = 'none'} />
      </div>
      <h3 className="category-title">{category.name || 'Category'}</h3>
    </div>
  );
}

export default CategoryCard;
