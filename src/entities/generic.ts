import { AxiosHeaders, AxiosInstance, AxiosResponse } from 'axios';
import { OpenAlexConfig } from '../types/config';
import { QueryParams, Meta } from '../types/types';
import { gt_, LogicalExpression, lt_, not_, or_ } from '../utils/util';

export abstract class Entity<T> {
  protected config: OpenAlexConfig;
  protected axiosInstance: AxiosInstance;
  protected endpoint: string;
  protected lastActivity: number;
  protected isConnectionActive: boolean;
  protected sessionTimeout = 1800 * 1000;
  protected logger: Console;
  protected query: QueryParams;

  constructor(config: OpenAlexConfig, endpoint: string, axiosInstance: AxiosInstance) {
    this.config = config;
    this.endpoint = endpoint;
    this.axiosInstance = axiosInstance;
    this.logger = console;
    this.lastActivity = Date.now();
    this.isConnectionActive = true;
    this.query = {};

    this.logger.info(`Connection initialized for ${this.endpoint}.`);
  }

  private buildHeaders(): AxiosHeaders {
    const headers = new AxiosHeaders({
      'User-Agent': this.config.userAgent,
      'Connection': 'keep-alive',
    });
    if (this.config.email) headers.set('mailto', this.config.email);
    return headers;
  }

  private async isSessionHealthy(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastActivity > this.sessionTimeout || !this.isConnectionActive) {
      this.logger.warn(`Session stale for ${this.endpoint}.`);
      try {
        const response = await this.axiosInstance.get('/', { headers: this.buildHeaders() });
        if (response.status === 200) {
          this.lastActivity = now;
          this.isConnectionActive = true;
          return true;
        }
        this.logger.warn(`Health check failed: ${response.status}`);
        return false;
      } catch (error) {
        this.logger.error(`Health check exception: ${error}`);
        return false;
      }
    }
    return true;
  }

  protected async ensureActiveConnection(): Promise<void> {
    if (!(await this.isSessionHealthy())) {
      this.logger.info(`Reinitializing headers for ${this.endpoint}.`);
      this.axiosInstance.defaults.headers.common = this.buildHeaders();
      this.lastActivity = Date.now();
      this.isConnectionActive = true;
    }
  }

  private formatFilterValue(value: unknown): string {
    if (value instanceof LogicalExpression) {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.map(v => this.formatFilterValue(v)).join('|');
    }
    if (typeof value === 'object' && value !== null && !(value instanceof LogicalExpression)) {
      return JSON.stringify(value).replace(/"/g, '');
    }
    return String(value);
  }

  private async fetch<R>(path = '', query: QueryParams = this.query): Promise<{ data: R | null; error: { message: string; status?: number; details?: any } | null }> {
    await this.ensureActiveConnection();

    const url = `/${this.endpoint}${path ? `/${path}` : ''}`;
    const params: Record<string, unknown> = {
      ...this.config.apiKey ? { api_key: this.config.apiKey } : {},
    };
    if (query.filter) {
      params.filter = Object.entries(query.filter)
        .map(([k, v]) => {
          if (typeof v === 'object' && !(v instanceof LogicalExpression) && !Array.isArray(v)) {
            return Object.entries(v)
              .map(([nk, nv]) => {
                if (nv instanceof LogicalExpression) {
                  return `${k}.${nk}:${nv.toString()}`;
                }
                if (Array.isArray(nv)) {
                  return `${k}.${nk}:${nv.map(val => this.formatFilterValue(val)).join('|')}`;
                }
                if (typeof nv === 'object' && nv !== null) {
                  throw new Error(`Unsupported nested object in filter: ${k}.${nk}`);
                }
                return `${k}.${nk}:${String(nv)}`;
              })
              .join(',');
          }
          return `${k}:${this.formatFilterValue(v)}`;
        })
        .join(',');
      this.logger.debug(`Constructed filter: ${params.filter}`);
    }
    if (query.search) params.search = query.search;
    if (query.searchField) params[query.searchField] = query.search;
    if (query.sort) params.sort = query.sort;
    if (query.select) params.select = query.select.join(',');
    if (query.sample) {
      params.sample = query.sample.count;
      if (query.sample.seed) params.seed = query.sample.seed;
    }
    if (query.groupBy) params.group_by = query.groupBy;
    if (query.page) params.page = query.page;
    if (query.perPage) params.per_page = query.perPage;
    if (query.cursor) params.cursor = query.cursor;

    let attempts = 0;
    while (attempts < this.config.maxRetries) {
      try {
        this.logger.debug(`Fetch params: ${JSON.stringify(params, null, 2)}`);
        const response: AxiosResponse<R> = await this.axiosInstance.get(url, { params });
        this.logger.debug(`Fetch response: ${JSON.stringify(response.data, null, 2)}`);
        this.lastActivity = Date.now();
        return { data: response.data, error: null };
      } catch (error: unknown) {
        const status = (error as any).response?.status || 0;
        const errorData: { message: string; status?: number; details?: any } = {
          message: (error as any).message || 'Unknown error occurred',
          status,
        };
        if ((error as any).response?.data) {
          errorData.details = (error as any).response.data;
        }
        this.logger.error(`Fetch error (attempt ${attempts}): ${status}`, errorData);

        if (this.config.retryHttpCodes.includes(status) && attempts < this.config.maxRetries) {
          const backoff = this.config.retryBackoffFactor * Math.pow(2, attempts);
          this.logger.warn(`Retry ${attempts + 1} after ${backoff}ms due to status ${status}`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          attempts++;
        } else {
          return { data: null, error: errorData };
        }
      }
    }
    return { data: null, error: { message: 'Max retries reached.', status: 0 } };
  }

  private augmentWork(item: any): T {
    if (this.endpoint !== 'works') return item as T;
    return {
      ...item,
      abstract: item.abstract_inverted_index
        ? Object.entries(item.abstract_inverted_index)
          .flatMap(([word, positions]) => (positions as number[]).map((pos: number) => [word, pos]))
          .sort((a, b) => (a[1] as number) - (b[1] as number))
          .map(([word]) => word)
          .join(' ')
        : null,
      ngrams: async () => {
        const response = await this.axiosInstance.get(`/works/${item.id.split('/').pop()}/ngrams`);
        return response.data;
      },
    } as T;
  }

  public filter(filter: Record<string, unknown>): this {
    this.query = { ...this.query, filter: { ...this.query.filter, ...filter } };
    return this;
  }

  public filterAnd(filter: Record<string, unknown>): this {
    return this.filter(filter);
  }

  public filterOr(filter: Record<string, unknown>): this {
    const orFilter = Object.fromEntries(
      Object.entries(filter).map(([k, v]) => {
        if (v instanceof LogicalExpression) {
          return [k, v];
        }
        if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
          return [k, Object.fromEntries(
            Object.entries(v).map(([nk, nv]) => [nk, nv instanceof LogicalExpression ? nv : or_(nv)])
          )];
        }
        return [k, or_(v as Record<string, unknown>)];
      })
    );
    return this.filter(orFilter);
  }

  public filterNot(filter: Record<string, unknown>): this {
    const notFilter = Object.fromEntries(
      Object.entries(filter).map(([k, v]) => {
        if (v instanceof LogicalExpression) {
          return [k, v];
        }
        if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
          return [k, Object.fromEntries(
            Object.entries(v).map(([nk, nv]) => [nk, nv instanceof LogicalExpression ? nv : not_(nv)])
          )];
        }
        return [k, not_(v as Record<string, unknown>)];
      })
    );
    return this.filter(notFilter);
  }

  public filterGt(filter: Record<string, unknown>): this {
    const gtFilter = Object.fromEntries(
      Object.entries(filter).map(([k, v]) => {
        if (v instanceof LogicalExpression) {
          return [k, v];
        }
        if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
          return [k, Object.fromEntries(
            Object.entries(v).map(([nk, nv]) => [nk, nv instanceof LogicalExpression ? nv : gt_(nv)])
          )];
        }
        return [k, gt_(v as Record<string, unknown>)];
      })
    );
    return this.filter(gtFilter);
  }

  public filterLt(filter: Record<string, unknown>): this {
    const ltFilter = Object.fromEntries(
      Object.entries(filter).map(([k, v]) => {
        if (v instanceof LogicalExpression) {
          return [k, v];
        }
        if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
          return [k, Object.fromEntries(
            Object.entries(v).map(([nk, nv]) => [nk, nv instanceof LogicalExpression ? nv : lt_(nv)])
          )];
        }
        return [k, lt_(v as Record<string, unknown>)];
      })
    );
    return this.filter(ltFilter);
  }

  public search(term: string): this {
    this.query = { ...this.query, search: term };
    return this;
  }

  public searchFilter(field: string, term: string): this {
    this.query = { ...this.query, filter: { ...this.query.filter, [`${field}.search`]: term } };
    return this;
  }

  public sort(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    this.query = { ...this.query, sort: `${field}:${direction}` };
    return this;
  }

  public select(fields: string[]): this {
    this.query = { ...this.query, select: fields };
    return this;
  }

  public sample(count: number, seed?: number): this {
    this.query = { ...this.query, sample: { count, seed } };
    return this;
  }

  public groupBy(field: string): this {
    this.query = { ...this.query, groupBy: field };
    return this;
  }

  public async get(): Promise<T[] | [{ message: string; status?: number; details?: any }]> {
    const { data, error } = await this.fetch<{ results: any[]; meta: Meta; group_by?: any[] }>();
    if (error) return [error];
    if (data?.group_by?.length) {
      return data.group_by;
    }
    return (data?.results || []).map(item => this.augmentWork(item));
  }

  public async getWithMeta(): Promise<{ results?: T[]; meta: Meta; group_by?: any[] } | { message: string; status?: number; details?: any }> {
    const { data, error } = await this.fetch<{ results: any[]; meta: Meta; group_by?: any[] }>();
    if (error) return error;
    if (data?.group_by?.length) {
      return {
        group_by: data.group_by,
        meta: data!.meta,
      };
    }
    return {
      results: (data?.results || []).map(item => this.augmentWork(item)),
      meta: data!.meta,
    };
  }

  public async count(): Promise<number | [{ message: string; status?: number; details?: any }]> {
    const { data, error } = await this.fetch<{ meta: Meta }>();
    if (error) return [error];
    return data!.meta.count;
  }

  public async random(): Promise<T | [{ message: string; status?: number; details?: any }]> {
    const { data, error } = await this.fetch<unknown>('random');
    if (error) return [error];
    return this.augmentWork(data!);
  }

  public async fetchById(id: string | string[]): Promise<T | T[] | [{ message: string; status?: number; details?: any }]> {
    if (Array.isArray(id)) {
      if (id.length > 100) throw new Error('OpenAlex does not support more than 100 IDs');
      this.filterOr({ openalex_id: id });
      return this.get();
    }
    const { data, error } = await this.fetch<unknown>(id);
    if (error) return [error];
    return this.augmentWork(data!);
  }

  public paginate(method: 'cursor' | 'page' = 'cursor', perPage = 25, nMax: number | null = 10000, maxPages: number = 100): AsyncIterableIterator<T[]> {
    let page = 1;
    let cursor = '*';
    let totalFetched = 0;
    let pageCount = 0;
    const entity = this;

    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      async next(): Promise<IteratorResult<T[], unknown>> {
        if ((nMax !== null && totalFetched >= nMax) || pageCount >= maxPages) {
          entity.logger.debug(`Pagination stopped: totalFetched=${totalFetched}, pageCount=${pageCount}`);
          return { done: true, value: undefined };
        }

        const query = { ...entity.query, perPage };
        if (method === 'page') {
          query.page = page;
        } else {
          query.cursor = cursor;
        }

        const { data, error } = await entity.fetch<{ results: unknown[]; meta: Meta }>(undefined, query);
        if (error) {
          entity.logger.error(`Pagination error: ${error.message}`, error);
          throw new Error(`Pagination failed: ${error.message}`);
        }

        const results = data?.results || [];
        const meta = data?.meta || { count: 0, next_cursor: null };

        // Terminate if no results or meta.count is 0
        if (!results.length || meta.count === 0) {
          entity.logger.debug(`No results or meta.count=0, stopping pagination: results.length=${results.length}, meta.count=${meta.count}`);
          return { done: true, value: undefined };
        }

        totalFetched += results.length;
        pageCount++;

        if (method === 'cursor') {
          cursor = meta.next_cursor ?? '';
          entity.logger.debug(`Page ${pageCount}, cursor: ${cursor}, results: ${results.length}, meta.count: ${meta.count}`);
          if (!cursor || results.length < perPage || pageCount >= maxPages || meta.count === 0) {
            entity.logger.debug(`Stopping: cursor=${cursor}, results.length=${results.length}, pageCount=${pageCount}, meta.count=${meta.count}`);
            return { done: true, value: results.map(item => entity.augmentWork(item)) };
          }
        } else {
          page++;
          if (results.length < perPage || pageCount >= maxPages) {
            entity.logger.debug(`Stopping: results.length=${results.length}, pageCount=${pageCount}`);
            return { done: true, value: results.map(item => entity.augmentWork(item)) };
          }
        }

        return { done: false, value: results.map(item => entity.augmentWork(item)) };
      },
    };
  }

  public async autocomplete(query: string): Promise<{ results: { id: string; display_name: string }[] }> {
    const response = await this.axiosInstance.get(`/autocomplete/${this.endpoint}`, {
      params: { q: query },
    });
    return response.data;
  }

  public serialize(data: T | T[]): string {
    return JSON.stringify(data);
  }

  public deserialize(json: string): T | T[] {
    return JSON.parse(json);
  }

  public resetQuery(): this {
    this.query = {};
    this.logger.debug(`Query state reset for ${this.endpoint}`);
    return this;
  }

  public close(): void {
    this.logger.info(`Closing connection for ${this.endpoint}.`);
    this.query = {};
    this.lastActivity = 0;
    this.isConnectionActive = false;
  }
}