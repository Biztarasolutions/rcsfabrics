export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const parsePagination = (
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
) => {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10) || 1);
  const parsedLimit = Math.min(
    Math.max(1, parseInt(String(limit || 10), 10) || 10),
    maxLimit
  );

  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};

export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
) => {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
};
