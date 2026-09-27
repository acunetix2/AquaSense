import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost'
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg'
  /** Whether button is in a loading state */
  isLoading?: boolean
  /** Show loading spinner alongside text */
  showSpinner?: boolean
  /** Custom icon element to display */
  icon?: React.ReactNode
  /** Position of icon relative to text */
  iconPosition?: 'left' | 'right'
}

/**
 * Reusable Button component with multiple variants and sizes
 * Ensures consistent styling and behavior across the application
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      showSpinner = false,
      icon,
      iconPosition = 'left',
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles applied to all buttons
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 cursor-pointer active:scale-95 focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2'

    // Variant styles
    const variantStyles = {
      primary: 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm hover:shadow-md',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200',
      destructive: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow-md',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent hover:border-slate-200',
    }

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-3 text-base gap-2',
    }

    // Disabled styles
    const disabledStyles = disabled || isLoading ? 'opacity-50 cursor-not-allowed hover:shadow-none' : ''

    const buttonClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={buttonClassName}
        {...props}
      >
        {/* Left icon */}
        {icon && iconPosition === 'left' && !showSpinner && <span className="shrink-0">{icon}</span>}

        {/* Loading spinner */}
        {showSpinner && (
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* Text content */}
        {children}

        {/* Right icon */}
        {icon && iconPosition === 'right' && !showSpinner && <span className="shrink-0">{icon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
