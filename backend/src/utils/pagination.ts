import { Request } from "express";

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(req: Request): PaginationQuery {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResponse<T>(data: T[], total: number, pagination: PaginationQuery) {
  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      pages: Math.ceil(total / pagination.limit),
    },
  };
}
