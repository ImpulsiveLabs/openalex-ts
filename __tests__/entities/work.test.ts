import { AxiosInstance } from 'axios';
import { WorkResponse } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Work from '../../src/entities/work';
import { or_ } from '../../src/utils/util';

describe('Work', () => {
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

    it('should fetch works successfully', async () => {
        const works = openAlex.getWork();
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('title');
    });

    it('should fetch work with meta', async () => {
        const works = openAlex.getWork();
        const result = await works.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count works', async () => {
        const works = openAlex.getWork();
        const result = await works.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random work', async () => {
        const works = openAlex.getWork();
        const result = await works.random();
        expect('id' in result).toBe(true);
        expect('title' in result).toBe(true);
    });

    it('should fetch work by ID', async () => {
        const works = openAlex.getWork();
        const workId = 'W2741809807';
        const result = await works.fetchById(workId);
        expect('id' in result).toBe(true);
        expect((result as WorkResponse).id).toBe(`https://openalex.org/${workId}`);
    });

    it('should fetch multiple works by IDs', async () => {
        const works = openAlex.getWork();
        const ids = ['W2741809807', 'W1775749144'];
        const result = await works.fetchById(ids) as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('id');
    });

    it('should paginate works using cursor', async () => {
        const works = openAlex.getWork();
        const pager = works.paginate('cursor', 2, 4);
        const pages: WorkResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate works using page', async () => {
        const works = openAlex.getWork();
        const pager = works.paginate('page', 2, 4);
        const pages: WorkResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter works by publication year', async () => {
        const works = openAlex.getWork();
        const result = await works.filter({ publication_year: 2020 }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(work => work.publication_year === 2020)).toBe(true);
    });

    it('should filter works with AND (same as filter)', async () => {
        const works = openAlex.getWork();
        const result = await works.filterAnd({ publication_year: 2020 }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(work => work.publication_year === 2020)).toBe(true);
    });

    it('should filter works with OR', async () => {
        const works = openAlex.getWork();
        const result = await works.filterOr({ publication_year: or_([2020, 2021]) }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(work => [2020, 2021].includes(work.publication_year))).toBe(true);
    });

    it('should filter works with NOT', async () => {
        const works = openAlex.getWork();
        const result = await works.filterNot({ publication_year: 2020 }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(work => work.publication_year !== 2020)).toBe(true);
    });

    it('should handle non-object filter in filterOr', async () => {
        const works = new Work(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await works.filterOr({
            publication_year: 2020,
        }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/works', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('publication_year:2020'),
            }),
        }));
    });

    it('should group works by field using get', async () => {
        const works = openAlex.getWork();
        const result = await works.groupBy('type').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should filter works with GT', async () => {
        const works = openAlex.getWork();
        const result = await works.filterGt({ cited_by_count: 100 }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(work => work.cited_by_count > 100)).toBe(true);
    });

    it('should filter works with LT', async () => {
        const works = openAlex.getWork();
        const result = await works.filterLt({ cited_by_count: 10 }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(work => work.cited_by_count < 10)).toBe(true);
    });

    it('should search works', async () => {
        const works = openAlex.getWork();
        const result = await works.search('machine learning').get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter works', async () => {
        const works = openAlex.getWork();
        const result = await works.searchFilter('title.search', 'machine learning').get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort works', async () => {
        const works = openAlex.getWork();
        const result = await works.sort('cited_by_count', 'desc').get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for works', async () => {
        const works = openAlex.getWork();
        const result = await works.select(['id', 'title']).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('title');
        expect(result[0]).not.toHaveProperty('publication_year');
    });

    it('should sample works', async () => {
        const works = openAlex.getWork();
        const result = await works.sample(5, 42).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group works by field', async () => {
        const works = openAlex.getWork();
        const result = await works.groupBy('type').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should autocomplete works', async () => {
        const works = openAlex.getWork();
        const result = await works.autocomplete('machine');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize works', async () => {
        const works = openAlex.getWork();
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = works.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = works.deserialize(serialized) as WorkResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should augment works with abstract', async () => {
        const works = openAlex.getWork();
        const result = await works.fetchById('W2741809807');
        expect('abstract' in result).toBe(true);
    });

    it('should not augment non-works entities', async () => {
        const authors = openAlex.getAuthor();
        const result = await authors.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });
    it('should handle session health check failure with reinitialization', async () => {
        const works = new Work(config, axiosInstance);
        (works as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for works.`);
    });
    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const works = invalidOpenAlex.getWork();
        const result = await works.get() as WorkResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const works = retryOpenAlex.getWork();
        (works as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((works as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const works = retryOpenAlex.getWork();
        (works as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await works.get() as WorkResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const works = new Work(config, axiosInstance);
        (works as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure', async () => {
        const works = new Work(config, axiosInstance);
        (works as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
    });

    it('should handle non-200 health check', async () => {
        const works = new Work(config, axiosInstance);
        (works as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await works.get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
    });

    it('should update config without email', () => {
        const noEmailConfig = { ...config, email: undefined };
        openAlex.updateConfig(noEmailConfig);
        expect(openAlex.getConfig().email).toBeUndefined();
        expect((openAlex.getWork() as any).config.email).toBeUndefined();
    });

    it('should handle complex filter with logical expressions', async () => {
        const works = new Work(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await works.filterOr({
            'authorships.author.orcid': or_(['0000-0001-5109-3700', '0000-0002-5109-3700']),
        }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/works', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('authorships.author.orcid:0000-0001-5109-3700|0000-0002-5109-3700'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const works = new Work(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await works.filter({
            'authorships.institutions.id': ['I123456789', 'I987654321'],
        }).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/works', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('authorships.institutions.id:I123456789|I987654321'),
            }),
        }));
    });

    it('should handle sample with seed', async () => {
        const works = new Work(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await works.sample(5, 42).get() as WorkResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/works', expect.objectContaining({
            params: expect.objectContaining({
                sample: 5,
                seed: 42,
            }),
        }));
    });

    it('should handle cursor pagination with meta', async () => {
        const works = new Work(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [{ id: 'W1' }, { id: 'W2' }], meta: { count: 2, next_cursor: 'next' } },
        });
        const pager = works.paginate('cursor', 2, 4);
        const firstPage = await pager.next();
        expect(firstPage.done).toBe(false);
        expect(firstPage.value).toBeInstanceOf(Array);
        expect(firstPage.value.length).toBe(2);
    });

    it('should throw on unsupported nested filter objects', async () => {
        const works = openAlex.getWork();
        await expect(
            works.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});