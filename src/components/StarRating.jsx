import { Star } from 'lucide-react'

const StarRating = ({ rating, maxStars = 5, size = 'w-4 h-4', showValue = true }) => {
  const numRating = parseFloat(rating) || 0
  
  // Don't render anything if rating is 0 or invalid
  if (numRating <= 0) {
    return null
  }
  
  const fullStars = Math.floor(numRating)
  const hasHalfStar = numRating % 1 >= 0.5
  const emptyStars = Math.max(0, maxStars - fullStars - (hasHalfStar ? 1 : 0))

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {/* Full stars */}
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${size} text-yellow-400 fill-current`} />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star className={`${size} text-gray-300 fill-current`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className={`${size} text-yellow-400 fill-current`} />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${size} text-gray-300 fill-current`} />
        ))}
      </div>
      
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
          {numRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating