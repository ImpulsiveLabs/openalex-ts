import { AxiosInstance } from 'axios';
import { AuthorResponse } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Author from '../../src/entities/author';
import { or_ } from '../../src/utils/util';

describe('Author Entity', () => {
    let config: OpenAlexConfig;
    let openAlex: OpenAlex;
    let axiosInstance: AxiosInstance;

    beforeEach(() => {
        config = {
            openalexUrl: 'https://api.openalex.org',
            email: 'your-email@example.com',
            userAgent: 'openalex-ts/0.0.1',
            maxRetries: 3,
            retryBackoffFactor: 0.2,
            retryHttpCodes: [429, 500, 503],
        };
        openAlex = OpenAlex.getInstance(config);
        axiosInstance = {
            get: jest.fn(),
            defaults: { headers: { common: {} } },
        } as unknown as AxiosInstance;
        jest.spyOn(console, 'info').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'debug').mockImplementation();
    });

    afterEach(() => {
        openAlex.close();
        jest.clearAllMocks();
    });

    it('should initialize Author instance', () => {
        const author = new Author(config, axiosInstance);
        expect((author as any).endpoint).toBe('authors');
        expect((author as any).config).toBe(config);
        expect((author as any).axiosInstance).toBe(axiosInstance);
        expect((author as any).logger).toBe(console);
        expect((author as any).lastActivity).toBeGreaterThan(0);
        expect((author as any).isConnectionActive).toBe(true);
    });

    it('should fetch authors successfully', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch author with meta', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random author', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.random();
        expect('id' in result).toBe(true);
        expect('display_name' in result).toBe(true);
    });

    it('should fetch author by ID', async () => {
        const authors = openAlex.getAuthor();
        const authorId = 'A5062966246';
        const result = await authors.fetchById(authorId);
        expect('id' in result).toBe(true);
        expect((result as AuthorResponse).id).toBe(`https://openalex.org/${authorId}`);
    });

    it('should fetch multiple authors by IDs', async () => {
        const authors = openAlex.getAuthor();
        const ids = ['A5062966246', 'A5048491431'];
        const result = await authors.fetchById(ids) as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('id');
    });

    it('should paginate authors using cursor', async () => {
        const authors = openAlex.getAuthor();
        const pager = authors.paginate('cursor', 2, 4);
        const pages: AuthorResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate authors using page', async () => {
        const authors = openAlex.getAuthor();
        const pager = authors.paginate('page', 2, 4);
        const pages: AuthorResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter authors by works count', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.filter({ works_count: 100 }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(author => author.works_count >= 100)).toBe(true);
    });

    it('should filter authors with AND', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.filterAnd({ works_count: 100 }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(author => author.works_count >= 100)).toBe(true);
    });

    it('should filter authors with OR', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.filterOr({ works_count: or_([100, 200]) }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(author => [100, 200].includes(author.works_count))).toBe(true);
    });

    it('should filter authors with NOT', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.filterNot({ works_count: 100 }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(author => author.works_count !== 100)).toBe(true);
    });

    it('should filter authors with GT', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.filterGt({ cited_by_count: 100 }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(author => author.cited_by_count > 100)).toBe(true);
    });

    it('should filter authors with LT', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.filterLt({ cited_by_count: 100 }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(author => author.cited_by_count < 100)).toBe(true);
    });

    it('should search authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.search('john').get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.searchFilter('display_name.search', 'john').get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.sort('cited_by_count', 'desc').get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.select(['id', 'display_name']).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('works_count');
    });

    it('should sample authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.sample(5, 42).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group authors by field', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.groupBy('works_count').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group authors by field using get', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.groupBy('works_count').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.autocomplete('john');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize authors', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = authors.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = authors.deserialize(serialized) as AuthorResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment author entities', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const authors = invalidOpenAlex.getAuthor();
        const result = await authors.get() as AuthorResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const authors = retryOpenAlex.getAuthor();
        (authors as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await authors.get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((authors as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const authors = retryOpenAlex.getAuthor();
        (authors as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await authors.get() as AuthorResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const authors = new Author(config, axiosInstance);
        (authors as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await authors.get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const authors = new Author(config, axiosInstance);
        (authors as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await authors.get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for authors.`);
    });

    it('should handle session health check exception', async () => {
        const authors = new Author(config, axiosInstance);
        (authors as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await authors.get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const authors = new Author(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await authors.filterOr({
            orcid: or_(['0000-0001-5109-3700', '0000-0002-5109-3700']),
        }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/authors', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('orcid:0000-0001-5109-3700|0000-0002-5109-3700'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const authors = new Author(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await authors.filterOr({
            works_count: 100,
        }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/authors', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('works_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const authors = new Author(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await authors.filter({
            'last_known_institutions.id': ['I123456789', 'I987654321'],
        }).get() as AuthorResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/authors', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('last_known_institutions.id:I123456789|I987654321'),
            }),
        }));
    });

    it('should throw on unsupported nested filter objects', async () => {
        const authors = openAlex.getAuthor();
        await expect(
            authors.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});