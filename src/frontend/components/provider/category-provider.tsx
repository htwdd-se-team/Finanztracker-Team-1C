import { ApiCategoryResponseDto, ApiCategorySortBy } from 'api-client'
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
  updateCategory: (id: number, updatedCategory: ApiCategoryResponseDto) => void
  removeCategory: (id: number) => void
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
        const transformedCategory: Category = {
          ...newCategory,
          icon: newCategory.icon as IconNames,
          color: newCategory.color as CategoryColors,
        }
        // If no categories exist, return the new category
        if (!oldCategories) return [transformedCategory]

        // Otherwise, add the new category to the beginning of the array
        return [transformedCategory, ...oldCategories]
      }
    )
  }

  const updateCategory = (
    id: number,
    updatedCategory: ApiCategoryResponseDto
  ) => {
    queryClient.setQueryData(
      ['categories'],
      (oldCategories: Category[] | undefined) => {
        if (!oldCategories) return []

        return oldCategories.map(category => {
          if (category.id === id) {
            return {
              ...updatedCategory,
              icon: updatedCategory.icon as IconNames,
              color: updatedCategory.color as CategoryColors,
            }
          }
          return category
        })
      }
    )
  }

  const removeCategory = (id: number) => {
    queryClient.setQueryData(
      ['categories'],
      (oldCategories: Category[] | undefined) => {
        if (!oldCategories) return []
        return oldCategories.filter(category => category.id !== id)
      }
    )
  }

  return (
    <CategoryProviderContext.Provider
      value={{
        categories: categories ?? [],
        getCategoryFromId,
        addCategory,
        updateCategory,
        removeCategory,
      }}
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
