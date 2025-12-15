/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum ApiGranularity {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export enum ApiFilterSortOption {
  HIGHEST_AMOUNT = "HIGHEST_AMOUNT",
  LOWEST_AMOUNT = "LOWEST_AMOUNT",
  NEWEST_FIRST = "NEWEST_FIRST",
  OLDEST_FIRST = "OLDEST_FIRST",
}

export enum ApiEntrySortBy {
  CreatedAtAsc = "createdAt_asc",
  CreatedAtDesc = "createdAt_desc",
  AmountAsc = "amount_asc",
  AmountDesc = "amount_desc",
}

export enum ApiRecurringTransactionType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

/** ISO 4217 currency code */
export enum ApiCurrency {
  EUR = "EUR",
  USD = "USD",
  GBP = "GBP",
  JPY = "JPY",
  CHF = "CHF",
  CAD = "CAD",
  AUD = "AUD",
  CNY = "CNY",
}

export enum ApiTransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum ApiCategorySortBy {
  UsageDesc = "usage_desc",
  CreatedAtDesc = "createdAt_desc",
  CreatedAtAsc = "createdAt_asc",
  AlphaAsc = "alpha_asc",
  AlphaDesc = "alpha_desc",
}

export interface ApiLoginDto {
  /**
   * The email of the user
   * @format email
   * @example "test@test.com"
   */
  email: string;
  /**
   * The password of the user
   * @minLength 8
   * @maxLength 30
   * @example "password"
   */
  password: string;
}

export interface ApiLoginResponseDto {
  /**
   * The token of the user
   * @example "token"
   */
  token: string;
}

export interface ApiRegisterDto {
  /**
   * The email of the user
   * @format email
   * @example "test@test.com"
   */
  email: string;
  /**
   * The password of the user
   * @minLength 8
   * @maxLength 30
   * @example "password"
   */
  password: string;
  /**
   * The given name of the user
   * @example "John"
   */
  givenName: string;
  /**
   * The last name of the user
   * @example "Doe"
   */
  familyName?: string;
}

export interface ApiCreateCategoryDto {
  /**
   * Category name
   * @example "Lebensmittel"
   */
  name: string;
  /**
   * Category color string
   * @example "Blue"
   */
  color: string;
  /**
   * Category icon name
   * @example "shopping-cart"
   */
  icon: string;
}

export interface ApiCategoryResponseDto {
  /**
   * Category ID
   * @min 1
   * @example 1
   */
  id: number;
  /**
   * Category name
   * @example "Lebensmittel"
   */
  name: string;
  /**
   * Category color string
   * @example "Blue"
   */
  color: string;
  /**
   * Category icon name
   * @example "shopping-cart"
   */
  icon: string;
  /**
   * Creation timestamp
   * @format date-time
   * @example "2025-12-09T13:04:13.156Z"
   */
  createdAt: string;
  /**
   * Usage count of this category
   * @example 12
   */
  usageCount?: number;
}

export interface ApiUpdateCategoryDto {
  /**
   * Category name
   * @example "Lebensmittel"
   */
  name?: string;
  /**
   * Category color string
   * @example "Blue"
   */
  color?: string;
  /**
   * Category icon name
   * @example "shopping-cart"
   */
  icon?: string;
}

export interface ApiCreateEntryDto {
  /** @example "EXPENSE" */
  type: ApiTransactionType;
  /**
   * Amount in cents
   * @min 1
   * @example 1999
   */
  amount: number;
  /**
   * Transaction description
   * @example "Grocery shopping"
   */
  description?: string;
  /**
   * ISO 4217 currency code
   * @example "EUR"
   */
  currency: ApiCurrency;
  /**
   * Category ID
   * @example 3
   */
  categoryId?: number;
  /**
   * recurring entry properties
   * @example false
   */
  isRecurring?: boolean;
  /** @example "MONTHLY" */
  recurringType?: ApiRecurringTransactionType;
  /**
   * Base recurring interval (1x Monthly, 2x Monthly, etc.)
   * @example 1
   */
  recurringBaseInterval?: number;
  /**
   * Creation timestamp. If not provided, defaults to the current date and time.
   * For recurring entries, the creation date cannot be more than 30 days in the past.
   * @format date-time
   */
  createdAt?: string;
}

export interface ApiEntryResponseDto {
  /**
   * Transaction ID
   * @min 1
   * @example 1
   */
  id: number;
  /** @example "EXPENSE" */
  type: ApiTransactionType;
  /**
   * Amount in cents
   * @min 1
   * @example 1999
   */
  amount: number;
  /**
   * Transaction description
   * @example "Grocery shopping"
   */
  description?: string;
  /**
   * ISO 4217 currency code
   * @example "EUR"
   */
  currency: ApiCurrency;
  /**
   * Creation timestamp
   * @format date-time
   */
  createdAt: string;
  /**
   * Category ID
   * @example 3
   */
  categoryId?: number;
  /**
   * recurring entry properties
   * @example false
   */
  isRecurring?: boolean;
  /** @example "MONTHLY" */
  recurringType?: ApiRecurringTransactionType;
  /**
   * Base recurring interval (1x Monthly, 2x Monthly, etc.)
   * @example 1
   */
  recurringBaseInterval?: number;
  /**
   * Whether the recurring entry is disabled
   * @example false
   */
  recurringDisabled?: boolean;
  /**
   * Parent transaction ID (null if not a child)
   * @example null
   */
  transactionId?: number;
}

export interface ApiEntryPageDto {
  /** Entries */
  entries: ApiEntryResponseDto[];
  /**
   * Next cursor ID
   * @example 2
   */
  cursorId?: number;
  /**
   * Total count of entries
   * @example 100
   */
  count?: number;
}

export interface ApiUpdateEntryDto {
  /** @example "EXPENSE" */
  type?: ApiTransactionType;
  /**
   * Amount in cents
   * @min 1
   * @example 1999
   */
  amount?: number;
  /**
   * Transaction description
   * @example "Grocery shopping"
   */
  description?: string;
  /**
   * ISO 4217 currency code
   * @example "EUR"
   */
  currency?: ApiCurrency;
  /**
   * Category ID
   * @example 3
   */
  categoryId?: number;
  /** @example "MONTHLY" */
  recurringType?: ApiRecurringTransactionType;
  /**
   * Base recurring interval (1x Monthly, 2x Monthly, etc.)
   * @example 1
   */
  recurringBaseInterval?: number;
  /**
   * Creation timestamp. If not provided, defaults to the current date and time.
   * For recurring entries, the creation date cannot be more than 30 days in the past.
   * @format date-time
   */
  createdAt?: string;
}

export interface ApiScheduledEntriesResponseDto {
  /** Scheduled entries (parent recurring transactions) */
  entries: ApiEntryResponseDto[];
  /**
   * Next cursor ID for pagination
   * @example 5
   */
  cursorId?: number;
  /**
   * Number of entries returned
   * @example 10
   */
  count: number;
}

export interface ApiScheduledMonthlyTotalDto {
  /**
   * Month number (1-12)
   * @example 1
   */
  month: number;
  /**
   * Sum of incomes in cents
   * @example 10000
   */
  income: number;
  /**
   * Sum of expenses in cents
   * @example 5000
   */
  expense: number;
  /**
   * Net (income - expense) in cents
   * @example 5000
   */
  net: number;
}

export interface ApiScheduledMonthlyTotalsResponseDto {
  totals: ApiScheduledMonthlyTotalDto[];
}

export interface ApiCreateFilterDto {
  /** @example "Monthly groceries" */
  title: string;
  /** Optional icon name */
  icon?: string;
  /**
   * Minimum amount in cents
   * @min 0
   */
  minPrice?: number;
  /**
   * Maximum amount in cents
   * @min 0
   */
  maxPrice?: number;
  /**
   * Filter start date
   * @format date-time
   */
  dateFrom?: string;
  /**
   * Filter end date
   * @format date-time
   */
  dateTo?: string;
  /** Search text */
  searchText?: string;
  transactionType?: ApiTransactionType;
  /** @default "NEWEST_FIRST" */
  sortOption?: ApiFilterSortOption;
  /** Category IDs to include */
  categoryIds?: number[];
}

export interface ApiFilterResponseDto {
  /** @example "Monthly groceries" */
  title: string;
  /** Optional icon name */
  icon?: string;
  /**
   * Minimum amount in cents
   * @min 0
   */
  minPrice?: number;
  /**
   * Maximum amount in cents
   * @min 0
   */
  maxPrice?: number;
  /**
   * Filter start date
   * @format date-time
   */
  dateFrom?: string;
  /**
   * Filter end date
   * @format date-time
   */
  dateTo?: string;
  /** Search text */
  searchText?: string;
  transactionType?: ApiTransactionType;
  /** @default "NEWEST_FIRST" */
  sortOption?: ApiFilterSortOption;
  /** Category IDs to include */
  categoryIds?: number[];
  /** @example 1 */
  id: number;
  /** @format date-time */
  createdAt?: string;
  /** @format date-time */
  updatedAt?: string;
}

export interface ApiUpdateFilterDto {
  /** @example "Monthly groceries" */
  title?: string;
  /** Optional icon name */
  icon?: string;
  /**
   * Minimum amount in cents
   * @min 0
   */
  minPrice?: number;
  /**
   * Maximum amount in cents
   * @min 0
   */
  maxPrice?: number;
  /**
   * Filter start date
   * @format date-time
   */
  dateFrom?: string;
  /**
   * Filter end date
   * @format date-time
   */
  dateTo?: string;
  /** Search text */
  searchText?: string;
  transactionType?: ApiTransactionType;
  /** @default "NEWEST_FIRST" */
  sortOption?: ApiFilterSortOption;
  /** Category IDs to include */
  categoryIds?: number[];
}

export interface ApiUserResponseDto {
  /**
   * The given name of the user
   * @example "John"
   */
  givenName: string;
  /**
   * The family name of the user
   * @example "Doe"
   */
  familyName?: string;
  /**
   * The email of the user
   * @format email
   * @example "john.doe@example.com"
   */
  email: string;
  /**
   * User creation timestamp
   * @format date-time
   */
  createdAt: string;
}

export interface ApiUserBalanceResponseDto {
  /**
   * The balance of the user in cents
   * @example 100
   */
  balance: number;
  /**
   * The number of transactions the user has made
   * @example 10
   */
  transactionCount: number;
}

export interface ApiMaxValueDto {
  /**
   * Highest transaction value of user in cents
   * @example 1200
   */
  maxPrice: number;
}

export interface ApiTransactionBreakdownItemDto {
  /**
   * Date for this data point
   * @format date-time
   * @example "21-02-2025"
   */
  date: string;
  /**
   * Transaction amount in cents
   * @example "2122"
   */
  value: string;
  /**
   * Transaction type (INCOME or EXPENSE)
   * @example "EXPENSE"
   */
  type: ApiTransactionType;
  /**
   * Category ID (only included if withCategory is true)
   * @example 12
   */
  category?: number;
}

export interface ApiTransactionBreakdownResponseDto {
  /** Array of transaction breakdown data */
  data: ApiTransactionBreakdownItemDto[];
}

export interface ApiTransactionItemDto {
  /**
   * Date for this data point
   * @format date-time
   * @example "21-02-2025"
   */
  date: string;
  /**
   * Transaction amount in cents
   * @example "2122"
   */
  value: string;
}

export interface ApiAvailableCapitalItemDto {
  /**
   * Unique key for this item
   * @example "available_capital"
   */
  key: string;
  /**
   * Human readable label
   * @example "Verfügbares Kapital"
   */
  label: string;
  /**
   * Icon identifier for the UI
   * @example "account-balance"
   */
  icon: string;
  /**
   * Amount in cents
   * @example 20021
   */
  value: number;
  /**
   * Transaction type hint (INCOME/EXPENSE)
   * @example "INCOME"
   */
  type: ApiAvailableCapitalItemDtoTypeEnum;
}

/**
 * Transaction type hint (INCOME/EXPENSE)
 * @example "INCOME"
 */
export enum ApiAvailableCapitalItemDtoTypeEnum {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title FinApp backend
 * @version 1.0.0
 * @contact
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags App
   * @name AppControllerGetHello
   * @request GET:/
   */
  appControllerGetHello = (params: RequestParams = {}) =>
    this.request<string, any>({
      path: `/`,
      method: "GET",
      format: "json",
      ...params,
    });

  auth = {
    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerLogin
     * @request POST:/auth/login
     */
    authControllerLogin: (data: ApiLoginDto, params: RequestParams = {}) =>
      this.request<ApiLoginResponseDto, any>({
        path: `/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Auth
     * @name AuthControllerRegister
     * @request POST:/auth/register
     */
    authControllerRegister: (
      data: ApiRegisterDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiLoginResponseDto, any>({
        path: `/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  categories = {
    /**
     * No description
     *
     * @tags categories
     * @name CategoryControllerCreate
     * @summary Create a new category
     * @request POST:/categories
     * @secure
     */
    categoryControllerCreate: (
      data: ApiCreateCategoryDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiCategoryResponseDto, void>({
        path: `/categories`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags categories
     * @name CategoryControllerList
     * @summary List all categories with pagination
     * @request GET:/categories
     * @secure
     */
    categoryControllerList: (
      query: {
        /**
         * The number of items to return
         * @min 1
         * @max 30
         * @default 10
         */
        take: number;
        /** The ID of the last item in the previous page */
        cursorId?: number;
        sortBy?: ApiCategorySortBy;
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiCategoryResponseDto[], any>({
        path: `/categories`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags categories
     * @name CategoryControllerUpdate
     * @summary Update a category
     * @request PATCH:/categories/{id}
     * @secure
     */
    categoryControllerUpdate: (
      id: number,
      data: ApiUpdateCategoryDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiCategoryResponseDto, void>({
        path: `/categories/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags categories
     * @name CategoryControllerDelete
     * @summary Delete a category
     * @request DELETE:/categories/{id}
     * @secure
     */
    categoryControllerDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/categories/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),
  };
  entries = {
    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerCreate
     * @summary Create an entry
     * @request POST:/entries/create
     * @secure
     */
    entryControllerCreate: (
      data: ApiCreateEntryDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiEntryResponseDto, void>({
        path: `/entries/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerList
     * @summary Get all entries
     * @request GET:/entries/list
     * @secure
     */
    entryControllerList: (
      query: {
        /**
         * The number of items to return
         * @min 1
         * @max 30
         * @default 10
         */
        take: number;
        /** The ID of the last item in the previous page */
        cursorId?: number;
        /** Sort by */
        sortBy?: ApiEntrySortBy;
        /**
         * Filter by date range - from date (inclusive)
         * @example "2024-01-01"
         */
        dateFrom?: string;
        /**
         * Filter by date range - to date (inclusive)
         * @example "2024-12-31"
         */
        dateTo?: string;
        /** Filter by transaction type */
        transactionType?: ApiTransactionType;
        /**
         * Filter by categories (multi-select). Can be provided as comma-separated values or multiple query parameters.
         * @example [1,2,3]
         */
        categoryIds?: number[];
        /**
         * Filter by minimum amount (in cents)
         * @min 0
         */
        amountMin?: number;
        /**
         * Filter by maximum amount (in cents)
         * @min 0
         */
        amountMax?: number;
        /**
         * Search in transaction title/description
         * @example "grocery"
         */
        title?: string;
        /**
         * Filter ID
         * @example 1
         */
        filterId?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiEntryPageDto, void>({
        path: `/entries/list`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerDelete
     * @summary Delete an entry by id
     * @request DELETE:/entries/{id}
     * @secure
     */
    entryControllerDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/entries/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerUpdate
     * @summary Update an entry by id
     * @request PATCH:/entries/{id}
     * @secure
     */
    entryControllerUpdate: (
      id: number,
      data: ApiUpdateEntryDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiEntryResponseDto, void>({
        path: `/entries/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerGetScheduledEntries
     * @summary Get all scheduled entries
     * @request GET:/entries/scheduled-entries/list
     * @secure
     */
    entryControllerGetScheduledEntries: (
      query: {
        /**
         * The number of items to return
         * @min 1
         * @max 30
         * @default 10
         */
        take: number;
        /** The ID of the last item in the previous page */
        cursorId?: number;
        /**
         * Filter by disabled status. If not provided, returns all active entries.
         * @example false
         */
        disabled?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiScheduledEntriesResponseDto, void>({
        path: `/entries/scheduled-entries/list`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerGetScheduledMonthlyTotals
     * @request GET:/entries/scheduled-entries/monthly-totals
     * @secure
     */
    entryControllerGetScheduledMonthlyTotals: (
      query?: {
        /**
         * Year to aggregate monthly totals for (defaults to current year)
         * @min 1970
         * @example 2025
         */
        year?: number;
        /**
         * Optional month to filter (1-12). If provided, only that month's totals are returned
         * @min 1
         * @max 12
         * @example 1
         */
        month?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiScheduledMonthlyTotalsResponseDto, any>({
        path: `/entries/scheduled-entries/monthly-totals`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerDisableScheduledEntry
     * @request PATCH:/entries/scheduled-entries/{id}/disable
     * @secure
     */
    entryControllerDisableScheduledEntry: (
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/entries/scheduled-entries/${id}/disable`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerEnableScheduledEntry
     * @summary Enable a scheduled entry by id
     * @request PATCH:/entries/scheduled-entries/{id}/enable
     * @secure
     */
    entryControllerEnableScheduledEntry: (
      id: number,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/entries/scheduled-entries/${id}/enable`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Entry
     * @name EntryControllerImportEntries
     * @summary Import entries from file (CSV, TXT, or XLSX)
     * @request POST:/entries/import
     * @secure
     */
    entryControllerImportEntries: (
      data: {
        /** Files to import. Allowed formats: TXT, CSV, XLSX, and other text files. */
        files?: File[];
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiEntryResponseDto[], void>({
        path: `/entries/import`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  filters = {
    /**
     * No description
     *
     * @tags Filter
     * @name FilterControllerCreate
     * @request POST:/filters/create
     * @secure
     */
    filterControllerCreate: (
      data: ApiCreateFilterDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiFilterResponseDto, void>({
        path: `/filters/create`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filter
     * @name FilterControllerList
     * @request GET:/filters/list
     * @secure
     */
    filterControllerList: (params: RequestParams = {}) =>
      this.request<ApiFilterResponseDto[], any>({
        path: `/filters/list`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filter
     * @name FilterControllerDelete
     * @request DELETE:/filters/{id}
     * @secure
     */
    filterControllerDelete: (id: number, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/filters/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Filter
     * @name FilterControllerUpdate
     * @request PUT:/filters/{id}
     * @secure
     */
    filterControllerUpdate: (
      id: number,
      data: ApiUpdateFilterDto,
      params: RequestParams = {},
    ) =>
      this.request<ApiFilterResponseDto, void>({
        path: `/filters/${id}`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  user = {
    /**
     * No description
     *
     * @tags User
     * @name UserControllerGetCurrentUser
     * @request GET:/user/me
     * @secure
     */
    userControllerGetCurrentUser: (params: RequestParams = {}) =>
      this.request<ApiUserResponseDto, any>({
        path: `/user/me`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags User
     * @name UserControllerGetBalance
     * @request GET:/user/balance
     * @secure
     */
    userControllerGetBalance: (params: RequestParams = {}) =>
      this.request<ApiUserBalanceResponseDto, any>({
        path: `/user/balance`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
  analytics = {
    /**
     * No description
     *
     * @tags analytics
     * @name AnalyticsControllerFilterDetails
     * @request GET:/analytics/filter-details
     * @secure
     */
    analyticsControllerFilterDetails: (params: RequestParams = {}) =>
      this.request<ApiMaxValueDto, any>({
        path: `/analytics/filter-details`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags analytics
     * @name AnalyticsControllerGetTransactionBreakdown
     * @request GET:/analytics/transaction-breakdown
     * @secure
     */
    analyticsControllerGetTransactionBreakdown: (
      query: {
        /**
         * Start date for the analytics period (inclusive)
         * @example "2025-01-01"
         */
        startDate: string;
        /**
         * End date for the analytics period (inclusive)
         * @example "2025-02-28"
         */
        endDate: string;
        /** Granularity for grouping the data */
        granularity: ApiGranularity;
        /**
         * Whether to include category information in the response. If not provided, defaults to false.
         * @default false
         * @example true
         */
        withCategory?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiTransactionBreakdownResponseDto, any>({
        path: `/analytics/transaction-breakdown`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags analytics
     * @name AnalyticsControllerGetTransactionBalanceHistory
     * @request GET:/analytics/transaction-balance-history
     * @secure
     */
    analyticsControllerGetTransactionBalanceHistory: (
      query: {
        /**
         * Start date for the analytics period (inclusive)
         * @example "2025-01-01"
         */
        startDate: string;
        /**
         * End date for the analytics period (inclusive)
         * @example "2025-02-28"
         */
        endDate: string;
        /** Granularity for grouping the data */
        granularity: ApiGranularity;
      },
      params: RequestParams = {},
    ) =>
      this.request<ApiTransactionItemDto[], any>({
        path: `/analytics/transaction-balance-history`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags analytics
     * @name AnalyticsControllerGetAvailableCapital
     * @request GET:/analytics/available-capital
     * @secure
     */
    analyticsControllerGetAvailableCapital: (params: RequestParams = {}) =>
      this.request<ApiAvailableCapitalItemDto[], any>({
        path: `/analytics/available-capital`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
