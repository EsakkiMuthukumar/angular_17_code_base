import { ApiResultPagination } from './ApiResultPagination';
export interface ApiResponseType<T> {
  // user?: UserData;
  status?: string;
  data: T;
  message?: string;
  pagination?: ApiResultPagination;
}

export type ApiResponse = ApiResponseType<any>;
