import { ColorTheme, ThemeConfig } from '@/components/provider/theme-provider'
import { cn } from '@/lib/utils'

export function ThemeCard({
  theme,
  isActive,
  setColorTheme,
}: {
  theme: (typeof ThemeConfig)[0]
  isActive: boolean
  setColorTheme: (theme: ColorTheme) => void
}) {
  return (
    <div
      onClick={() => setColorTheme(theme.key)}
      className={cn(
        'border-[1px] relative cursor-pointer group transition-all duration-300',
        'rounded-lg p-3 min-w-0 flex-1 border-primary-foreground',
        'hover:shadow-md hover:scale-[1.01]',
        isActive
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border bg-card hover:border-primary/30'
      )}
    >
      <div className="space-y-2">
        <div className="flex gap-1">
          {theme.colors.map((color, index) => (
            <div
              key={index}
              className="shadow-inner border border-black/10 rounded-full w-3 h-3"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="space-y-0.5">
          <div
            className={cn(
              'font-medium text-xs transition-colors',
              isActive ? 'text-primary' : 'text-foreground'
            )}
          >
            {theme.label}
          </div>
          <div className="text-muted-foreground text-xs leading-tight">
            {theme.description}
          </div>
        </div>

        {isActive && (
          <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none" />
        )}
      </div>
    </div>
  )
}
