import { universalApi } from "@/lib/universal-api";
import { responseApi } from "use-hook-api";

/**
 * Fetch all categories
 * Endpoint: GET /categories
 */
export const fetchCategoriesApi = () => {
  return universalApi(`/taxonomy/categories`, "get");
};

/**
 * Classify Category
 * Endpoint: POST /classify-category
 */
export const classifyCategoryApi = (payload: FormData) => {
  return responseApi("/inference/classify", "post", payload);
};

