import { AxiosInstance } from 'axios';
import { SourceResponse, Iso3166Alpha2CountryCode } from '../../src/types/types';
import { OpenAlexConfig } from '../../src/types/config';
import OpenAlex from '../../src/openAlex';
import Source from '../../src/entities/source';
import { or_ } from '../../src/utils/util';

describe('Source', () => {
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

    it('should fetch sources successfully', async () => {
        const sources = openAlex.getSource();
        const result = await sources.get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
    });

    it('should fetch source with meta', async () => {
        const sources = openAlex.getSource();
        const result = await sources.getWithMeta();
        expect('results' in result).toBe(true);
        expect('meta' in result).toBe(true);
        expect((result as any).results.length).toBeGreaterThan(0);
        expect((result as any).meta).toHaveProperty('count');
    });

    it('should count sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.count();
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('should fetch random source', async () => {
        const sources = openAlex.getSource();
        const result = await sources.random();
        expect('id' in result).toBe(true);
        expect('display_name' in result).toBe(true);
    });

    it('should fetch source by ID', async () => {
        const sources = openAlex.getSource();
        const sourceId = 'S2764455111';
        const result = await sources.fetchById(sourceId);
        expect('id' in result).toBe(true);
        expect((result as SourceResponse).id).toBe(`https://openalex.org/${sourceId}`);
    });

    it('should fetch multiple sources by IDs', async () => {
        const sources = openAlex.getSource();
        const ids = ['S4306400806', 'S2764455111'];
        const result = await sources.fetchById(ids) as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(2);
        expect(result[0]).toHaveProperty('id');
    });

    it('should paginate sources using cursor', async () => {
        const sources = openAlex.getSource();
        const pager = sources.paginate('cursor', 2, 4);
        const pages: SourceResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
        expect(pages[0][0]).toHaveProperty('id');
    });

    it('should paginate sources using page', async () => {
        const sources = openAlex.getSource();
        const pager = sources.paginate('page', 2, 4);
        const pages: SourceResponse[][] = [];
        for await (const page of pager) {
            pages.push(page);
        }
        expect(pages.length).toBeGreaterThan(0);
        expect(pages[0].length).toBe(2);
    });

    it('should filter sources by works count', async () => {
        const sources = openAlex.getSource();
        const result = await sources.filter({ works_count: 100 }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(source => source.works_count >= 100)).toBe(true);
    });

    it('should filter sources with AND', async () => {
        const sources = openAlex.getSource();
        const result = await sources.filterAnd({ works_count: 100 }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(source => source.works_count >= 100)).toBe(true);
    });

    it('should filter sources with OR', async () => {
        const sources = openAlex.getSource();
        const result = await sources.filterOr({ works_count: or_([100, 200]) }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(source => [100, 200].includes(source.works_count))).toBe(true);
    });

    it('should filter sources with NOT', async () => {
        const sources = openAlex.getSource();
        const result = await sources.filterNot({ works_count: 100 }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(source => source.works_count !== 100)).toBe(true);
    });

    it('should filter sources with GT', async () => {
        const sources = openAlex.getSource();
        const result = await sources.filterGt({ cited_by_count: 100 }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(source => source.cited_by_count > 100)).toBe(true);
    });

    it('should filter sources with LT', async () => {
        const sources = openAlex.getSource();
        const result = await sources.filterLt({ cited_by_count: 100 }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.every(source => source.cited_by_count < 100)).toBe(true);
    });

    it('should search sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.search('journal').get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should search filter sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.searchFilter('display_name.search', 'journal').get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('should sort sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.sort('cited_by_count', 'desc').get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(1);
        expect(result[0].cited_by_count).toBeGreaterThanOrEqual(result[1].cited_by_count);
    });

    it('should select fields for sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.select(['id', 'display_name']).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('display_name');
        expect(result[0]).not.toHaveProperty('works_count');
    });

    it('should sample sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.sample(5, 42).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should group sources by field', async () => {
        const sources = openAlex.getSource();
        const result = await sources.groupBy('type').getWithMeta();
        expect('group_by' in result).toBe(true);
        expect(Array.isArray((result as any).group_by)).toBe(true);
        expect((result as any).group_by[0]).toHaveProperty('key');
        expect((result as any).group_by[0]).toHaveProperty('count');
    });

    it('should group sources by field using get', async () => {
        const sources = openAlex.getSource();
        const result = await sources.groupBy('type').get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('key');
        expect(result[0]).toHaveProperty('count');
    });

    it('should autocomplete sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.autocomplete('journal');
        expect(result.results).toBeInstanceOf(Array);
        expect(result.results[0]).toHaveProperty('id');
        expect(result.results[0]).toHaveProperty('display_name');
    });

    it('should serialize and deserialize sources', async () => {
        const sources = openAlex.getSource();
        const result = await sources.get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        const serialized = sources.serialize(result);
        expect(typeof serialized).toBe('string');
        const deserialized = sources.deserialize(serialized) as SourceResponse[];
        expect(Array.isArray(deserialized)).toBe(true);
        expect(deserialized[0].id).toBe(result[0].id);
    });

    it('should not augment source entities', async () => {
        const sources = openAlex.getSource();
        const result = await sources.get();
        expect(Array.isArray(result)).toBe(true);
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).not.toHaveProperty('abstract');
        expect(result[0]).not.toHaveProperty('ngrams');
    });

    it('should handle API errors with invalid endpoint', async () => {
        const invalidConfig = { ...config, openalexUrl: 'https://invalid.openalex.org' };
        const invalidOpenAlex = OpenAlex.getInstance(invalidConfig);
        const sources = invalidOpenAlex.getSource();
        const result = await sources.get() as SourceResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toContain('getaddrinfo');
        invalidOpenAlex.close();
    });

    it('should retry on retryable HTTP codes', async () => {
        const retryConfig = { ...config, maxRetries: 2 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const sources = retryOpenAlex.getSource();
        (sources as any).axiosInstance.get = jest.fn()
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockRejectedValueOnce({ response: { status: 429, data: { error: 'Rate limit' } } })
            .mockResolvedValue({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await sources.get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect((sources as any).axiosInstance.get).toHaveBeenCalledTimes(2);
        retryOpenAlex.close();
    });

    it('should handle max retries reached', async () => {
        const retryConfig = { ...config, maxRetries: 0 };
        const retryOpenAlex = OpenAlex.getInstance(retryConfig);
        const sources = retryOpenAlex.getSource();
        (sources as any).axiosInstance.get = jest.fn().mockRejectedValue({
            response: { status: 429 },
        });
        const result = await sources.get() as SourceResponse[];
        expect('message' in result[0]).toBe(true);
        expect((result[0] as any).message).toBe('Max retries reached.');
        expect((result[0] as any).status).toBe(0);
        retryOpenAlex.close();
    });

    it('should handle session health check success', async () => {
        const sources = new Source(config, axiosInstance);
        (sources as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 200 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await sources.get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/', expect.any(Object));
    });

    it('should handle session health check failure with reinitialization', async () => {
        const sources = new Source(config, axiosInstance);
        (sources as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockResolvedValueOnce({ status: 404 })
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await sources.get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.info).toHaveBeenCalledWith(`Reinitializing headers for sources.`);
    });

    it('should handle session health check exception', async () => {
        const sources = new Source(config, axiosInstance);
        (sources as any).lastActivity = 0;
        (axiosInstance.get as jest.Mock)
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ status: 200, data: { results: [], meta: { count: 0 } } });
        const result = await sources.get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(console.error).toHaveBeenCalledWith(`Health check exception: Error: Network error`);
    });

    it('should handle complex filter with logical expressions', async () => {
        const sources = new Source(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await sources.filterOr({
            issn_l: or_(['1234-5678', '9876-5432']),
        }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/sources', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('issn_l:1234-5678|9876-5432'),
            }),
        }));
    });

    it('should handle non-object filter in filterOr', async () => {
        const sources = new Source(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await sources.filterOr({
            works_count: 100,
        }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/sources', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('works_count:100'),
            }),
        }));
    });

    it('should handle nested filter with array values', async () => {
        const sources = new Source(config, axiosInstance);
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            status: 200,
            data: { results: [], meta: { count: 0 } },
        });
        const result = await sources.filter({
            country_code: [Iso3166Alpha2CountryCode.UnitedStates, Iso3166Alpha2CountryCode.UnitedKingdom],
        }).get() as SourceResponse[];
        expect(Array.isArray(result)).toBe(true);
        expect(axiosInstance.get).toHaveBeenCalledWith('/sources', expect.objectContaining({
            params: expect.objectContaining({
                filter: expect.stringContaining('country_code:US|GB'),
            }),
        }));
    });

    it('should throw on unsupported nested filter objects', async () => {
        const sources = openAlex.getSource();
        await expect(
            sources.filter({ invalid: { nested: { deep: 1 } } }).get()
        ).rejects.toThrow('Unsupported nested object in filter');
    });
});