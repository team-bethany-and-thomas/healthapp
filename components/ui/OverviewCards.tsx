import React from 'react';
import Image from 'next/image';

interface OverviewCardsProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  image?: string;
  actionText?: string;
  onAction?: () => void;
  status?: 'default' | 'success' | 'warning' | 'error' | 'primary';
  isRecommendedDoctor?: boolean;
}

const OverviewCards: React.FC<OverviewCardsProps> = ({ 
  title, 
  value, 
  description, 
  icon,
  image,
  actionText,
  onAction,
  status = 'default',
  isRecommendedDoctor = false
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'primary':
        return 'border-primary bg-primary-content';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getIconBgColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'error':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className={`rounded-lg shadow-md border hover:shadow-lg transition-shadow duration-200 h-full flex flex-col ${getStatusStyles()}`}>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 leading-tight mt-6">
              {value}
            </p>
          </div>
          {image ? (
            <div className="flex-shrink-0 ml-4 mt-8 mr-4">
              <div className={`w-16 h-16 rounded-full overflow-hidden ${isRecommendedDoctor ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : 'border-2 border-gray-200'}`}>
                <Image
                  src={image}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : icon && (
            <div className="flex-shrink-0 ml-4">
              <div className={`w-12 h-12 ${getIconBgColor()} rounded-lg flex items-center justify-center`}>
                {icon}
              </div>
            </div>
          )}
        </div>
        
        {description && (
          <div className="text-sm flex-1 mb-4">
            {isRecommendedDoctor ? (
              // Special formatting for recommended doctor
              <div className="whitespace-pre-line">
                {description.split('\n').map((line, index) => {
                  if (index === 0) {
                    // Specialty line
                    return <div key={index} className="text-gray-600 mb-3">{line}</div>;
                  } else if (index === 1) {
                    // Practice name line - primary color
                    return <div key={index} className="text-primary font-medium mb-4">{line}</div>;
                  } else if (line.trim()) {
                    // Bio lines
                    return <div key={index} className="text-gray-600">{line}</div>;
                  }
                  return <div key={index}></div>;
                })}
              </div>
            ) : (
              // Regular description formatting
              <p className="text-gray-600 whitespace-pre-line">{description}</p>
            )}
          </div>
        )}
      </div>
      
      {actionText && onAction && (
        <div className="px-6 pb-6">
          {isRecommendedDoctor ? (
            // ProviderSearch style button for recommended doctor
            <button
              onClick={onAction}
              className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white border-none rounded-lg py-3 px-4 font-semibold cursor-pointer transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
            >
              {actionText}
            </button>
          ) : (
            // Regular button style for other cards
            <button
              onClick={onAction}
              className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 text-left"
            >
              {actionText} →
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OverviewCards;
