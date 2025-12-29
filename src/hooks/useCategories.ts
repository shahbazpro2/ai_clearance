import { useEffect, useState } from "react";
import { useApi } from "use-hook-api";
import { fetchCategoriesApi } from "../../api/categories";

/**
 * Custom hook to fetch categories and provide both raw categories array and mapped category names
 * @param enabled - Whether to fetch categories (default: true). Set to false to skip fetching.
 * @returns Object containing categories array, categoryNames map, and loading state
 */
export const useCategories = (enabled: boolean = true) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>(
    {}
  );
  const [callFetchCategories, { data, loading }] = useApi({
    errMsg: false,
    cache: "categories",
  });

  useEffect(() => {
    if (data) {
      const categoriesList = data?.categories || data || [];
      setCategories(categoriesList);

      const categoryMap: Record<string, string> = {};
      categoriesList.forEach((cat: any) => {
        const catId = String(cat.id || cat.category || "");
        const catName =
          cat.category || cat.name || cat.label || cat.title || catId;
        if (catId) {
          categoryMap[catId] = catName;
        }
      });

      setCategoryNames(categoryMap);
    }
  }, [data]);

  useEffect(() => {
    if (enabled) {
      callFetchCategories(fetchCategoriesApi());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { categories, categoryNames, loading };
};
