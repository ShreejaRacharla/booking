import React from 'react';

type LoaderVariant =
  | 'spinner'
  | 'dots'
  | 'pulse'
  | 'bars'
  | 'grid'
  | 'ring'
  | 'rotary';

type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

type RotaryColor =
  | 'rotary-royal'
  | 'rotary-gold'
  | 'rotary-azure'
  | 'rotary-sky'
  | 'rotary-cranberry'
  | 'rotary-violet'
  | 'rotary-turquoise'
  | 'rotary-black'
  | 'rotary-darkgray'
  | 'rotary-midgray'
  | 'rotary-lightgray'
  | 'rotary-white';

interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  color?: RotaryColor;
  fullScreen?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'w-6 h-6',
    dot: 'w-1.5 h-1.5',
    bar: 'w-1 h-4',
    text: 'text-xs',
    ring: 'border-2',
  },
  md: {
    container: 'w-10 h-10',
    dot: 'w-2 h-2',
    bar: 'w-1.5 h-6',
    text: 'text-sm',
    ring: 'border-[3px]',
  },
  lg: {
    container: 'w-16 h-16',
    dot: 'w-3 h-3',
    bar: 'w-2 h-8',
    text: 'text-base',
    ring: 'border-4',
  },
  xl: {
    container: 'w-24 h-24',
    dot: 'w-4 h-4',
    bar: 'w-3 h-12',
    text: 'text-lg',
    ring: 'border-4',
  },
};

const getColorClasses = (
  color: RotaryColor,
  type: 'bg' | 'border-t' | 'border-r' | 'text'
) => {
  return `${type}-${color}`;
};

const Loader: React.FC<LoaderProps> = ({
  variant = 'rotary',
  size = 'md',
  color = 'rotary-royal',
  fullScreen = false,
  className = '',
}) => {
  const sizes = sizeMap[size];

  const renderLoader = () => {
    const baseColorClass = getColorClasses(color, 'bg');
    const borderTopColorClass = getColorClasses(color, 'border-t');
    const borderRightColorClass = getColorClasses(color, 'border-r');

    switch (variant) {
      case 'spinner':
        return (
          <div
            className={`${sizes.container} rounded-full border-4 border-rotary-lightgray ${borderTopColorClass} animate-spin`}
          />
        );

      case 'dots':
        return (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`${sizes.dot} rounded-full ${baseColorClass} animate-bounce`}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="relative flex items-center justify-center">
            <div
              className={`${sizes.container} rounded-full ${baseColorClass} opacity-60 animate-ping absolute`}
            />
            <div className={`${sizes.container} rounded-full ${baseColorClass}`} />
          </div>
        );

      case 'bars':
        return (
          <div className="flex items-end gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${sizes.bar} ${baseColorClass} rounded-full animate-pulse`}
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1s',
                }}
              />
            ))}
          </div>
        );

      case 'grid':
        return (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`${sizes.dot} rounded ${baseColorClass} animate-pulse`}
                style={{
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        );

      case 'ring':
        return (
          <div className="relative">
            <div
              className={`${sizes.container} rounded-full border-4 border-rotary-lightgray ${sizes.ring}`}
            />
            <div
              className={`${sizes.container} rounded-full border-4 border-transparent ${borderTopColorClass} ${borderRightColorClass} animate-spin absolute top-0 left-0`}
            />
          </div>
        );

      case 'rotary':
        return (
          <div className={`relative ${sizes.container}`}>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-rotary-royal animate-spin" />

            <div
              className="absolute inset-1 rounded-full border-4 border-transparent border-t-rotary-gold animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
            />

            <div
              className="absolute inset-2 rounded-full border-4 border-transparent border-t-rotary-sky animate-spin"
              style={{ animationDuration: '1.5s' }}
            />

            <div
              className="absolute inset-3 rounded-full border-4 border-transparent border-t-rotary-cranberry animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.8s' }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-rotary-royal animate-pulse shadow-glow" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {renderLoader()}
      <p className={`${sizes.text} font-medium text-rotary-royal animate-pulse`}>
        Loading
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed top-0 left-0 w-screen h-screen z-[999999]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default Loader;