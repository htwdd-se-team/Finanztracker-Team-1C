import { ApiCategoryResponseDto, ApiCategorySortBy } from '@/__generated__/api'
import { apiClient } from '@/api/api-client'
import { CategoryColors } from '@/lib/color-map'
import { IconNames } from '@/lib/icon-map'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useContext } from 'react'

export type Category = ApiCategoryResponseDto & {
  icon: IconNames
  color: CategoryColors
}

interface CategoryContextType {
  categories: Category[]
  getCategoryFromId: (id: number) => Category
  addCategory: (newCategory: ApiCategoryResponseDto) => void
}

const CategoryProviderContext = createContext<CategoryContextType | undefined>(
  undefined
)

export const CategoryProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const queryClient = useQueryClient()

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.categories.categoryControllerList({
        take: 30,
        sortBy: ApiCategorySortBy.UsageDesc,
      })

      return data.map(category => ({
        ...category,
        icon: category.icon as IconNames,
        color: category.color as CategoryColors,
      }))
    },
  })

  const getCategoryFromId = (id: number) => {
    return (
      categories?.find(category => category.id === id) ?? {
        id: -1,
        name: 'Unbekannt',
        color: CategoryColors.GRAY,
        icon: IconNames.QUESTION_MARK,
        createdAt: new Date().toISOString(),
      }
    )
  }

  const addCategory = (newCategory: ApiCategoryResponseDto) => {
    queryClient.setQueryData(
      ['categories'],
      (oldCategories: Category[] | undefined) => {
        if (!oldCategories) return [newCategory]

        // Transform the new category to match the expected format
        const transformedCategory: Category = {
          ...newCategory,
          icon: newCategory.icon as IconNames,
          color: newCategory.color as CategoryColors,
        }

        // Add to the beginning of the array (most recent first)
        return [transformedCategory, ...oldCategories]
      }
    )
  }

  return (
    <CategoryProviderContext.Provider
      value={{ categories: categories ?? [], getCategoryFromId, addCategory }}
    >
      {children}
    </CategoryProviderContext.Provider>
  )
}

export const useCategory = () => {
  const context = useContext(CategoryProviderContext)
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider')
  }
  return context
}
