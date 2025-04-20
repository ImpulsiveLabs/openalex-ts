# openalex-ts

![npm](https://img.shields.io/npm/v/openalex-ts) ![License](https://github.com/ImpulsiveLabs/openalex-ts/blob/main/LICENSE)

**openalex-ts** is a modern, type-safe TypeScript client for the [OpenAlex API](https://docs.openalex.org/), an open catalog of over 250 million interconnected scholarly entities—papers, authors, institutions, and more. Designed for developers seeking precision and reliability, `openalex-ts` offers a fluent, chainable API, robust session management, and seamless TypeScript integration to simplify complex scholarly data queries. From citation network analysis to institutional research trends, `openalex-ts` empowers you to unlock the full potential of OpenAlex with ease and elegance.

## Why openalex-ts?

- **Type-Safe Queries**: Benefit from TypeScript's type inference for error-free queries and IntelliSense support in your IDE.
- **Fluent API**: Chain methods like `filter`, `sort`, and `paginate` for expressive, declarative queries. See [Examples](#examples).
- **Reliable Session Management**: Automatic health checks and retries ensure stable connections to the OpenAlex API ([Rate Limits and Authentication](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication)).
- **Plaintext Abstracts**: Reconstruct human-readable abstracts from OpenAlex's inverted index on the fly ([Work Object: abstract_inverted_index](https://docs.openalex.org/api-entities/works/work-object#abstract_inverted_index)).
- **Comprehensive API Coverage**: Supports all OpenAlex entities and endpoints, from filtering to N-grams ([API Overview](https://docs.openalex.org/)).
- **Open and Free**: Licensed under MIT, with OpenAlex data under [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

## Supported Features

- **Entities**: Works, Authors, Sources, Institutions, Topics, Publishers, Funders ([Entities Overview](https://docs.openalex.org/api-entities/entities-overview))
- **Operations**: Filter, Search, Sort, Select, Sample, Group, Paginate, Autocomplete, N-grams ([API Endpoints](https://docs.openalex.org/))
- **Advanced Filtering**: Logical expressions (AND, OR, NOT, >, <) for precise queries ([Logical Expressions](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists#logical-expressions))
- **Session Management**: Automatic health checks and connection reinitialization for uninterrupted queries
- **Serialization**: Save and load results as JSON for caching or analysis

## Installation

Requires Node.js 16+ and TypeScript 4.7+.

```bash
npm install openalex-ts
```

## Getting Started

Import the main client and entity classes:

```typescript
import { OpenAlex, Works, Authors, Sources, Institutions, Topics, Publishers, Funders } from 'openalex-ts';
```

### Configuration

Initialize the client with your email to access the [polite pool](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication#the-polite-pool) for faster responses:

```typescript
const openAlex = OpenAlex.getInstance({
  openalexUrl: 'https://api.openalex.org',
  email: 'your-email@example.com',
  userAgent: 'openalex-ts/1.0.0',
});
```

Enable retries for transient errors:

```typescript
const config = {
  openalexUrl: 'https://api.openalex.org',
  email: 'your-email@example.com',
  maxRetries: 3,
  retryBackoffFactor: 0.2,
  retryHttpCodes: [429, 500, 503],
};
const openAlex = OpenAlex.getInstance(config);
```

For experimental authenticated requests, add an API key:

```typescript
const openAlex = OpenAlex.getInstance({
  email: 'your-email@example.com',
  apiKey: 'your-api-key',
});
```

### Session Management

`openalex-ts` ensures robust API interactions through an advanced session management system:

- **Health Checks**: The `isSessionHealthy` method periodically pings the OpenAlex root endpoint (`/`) to verify connection status. If the session is stale (inactive for 30 minutes) or disconnected, it attempts to reconnect.
- **Connection Reinitialization**: The `ensureActiveConnection` method refreshes headers and resets the session, guaranteeing uninterrupted queries.
- **Timeout**: A 30-minute `sessionTimeout` (1800 seconds) triggers health checks, ideal for long-running tasks like pagination.
- **Benefits**: Prevents connection drops during large queries, handles transient network issues transparently, and logs session status for debugging.

Explicitly terminate the session with:

```typescript
openAlex.close(); // Resets query state and closes connection
```

## Examples

Below are examples for every public method in the `Entity` class, showcasing practical use cases with links to the [OpenAlex API documentation](https://docs.openalex.org/).

### Initialize an Entity

Create a `Works` instance to query scholarly papers ([Works](https://docs.openalex.org/api-entities/works)):

```typescript
const works = openAlex.getWork();
```

### filter

Narrow results with filters ([Filter Works](https://docs.openalex.org/api-entities/works/filter-works)):

```typescript
const filteredWorks = await works
  .filter({ publication_year: 2023, is_oa: true })
  .get();
console.log(filteredWorks.length); // Open-access works from 2023
```

### filterAnd

Combine filters with AND logic (same as `filter`) ([Logical Expressions](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists#logical-expressions)):

```typescript
const works = await Works()
  .filterAnd({ publication_year: 2023 })
  .filterAnd({ type: 'article' })
  .get();
console.log(works.map(w => w.title));
```

### filterOr

Use OR logic for flexible filtering ([Logical Expressions](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists#logical-expressions)):

```typescript
const works = await Works()
  .filter({ 'title_and_abstract.search': 'machine learning' })
  .filterOr({ 'title_and_abstract.search': 'deep learning' })
  .get();
console.log(works.length); // Works mentioning either term
```

### filterNot

Exclude specific values ([Logical Expressions](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists#logical-expressions)):

```typescript
const institutions = await Institutions()
  .filterNot({ country_code: 'us' })
  .get();
console.log(institutions.map(i => i.display_name)); // Non-US institutions
```

### filterGt

Filter values greater than a threshold ([Logical Expressions](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists#logical-expressions)):

```typescript
const sources = await Sources()
  .filterGt({ works_count: 1000 })
  .get();
console.log(sources.length); // Sources with >1000 works
```

### filterLt

Filter values less than a threshold ([Logical Expressions](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/filter-entity-lists#logical-expressions)):

```typescript
const works = await Works()
  .filterLt({ cited_by_count: 10 })
  .get();
console.log(works.length); // Less-cited works
```

### search

Search across entity fields ([Search Works](https://docs.openalex.org/api-entities/works/search-works)):

```typescript
const works = await Works()
  .search('machine learning')
  .get();
console.log(works.map(w => w.title));
```

### searchFilter

Search a specific field ([Search a Specific Field](https://docs.openalex.org/api-entities/works/search-works#search-a-specific-field)):

```typescript
const authors = await Authors()
  .searchFilter('display_name', 'einstein')
  .get();
console.log(authors.map(a => a.display_name));
```

### sort

Sort results by a field ([Sort Entity Lists](https://docs.openalex.org/api-entities/works/get-lists-of-works#page-and-sort-works)):

```typescript
const works = await Works()
  .sort('cited_by_count', 'desc')
  .get();
console.log(works[0].title); // Most-cited work
```

### select

Retrieve specific fields to optimize responses ([Select Fields](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/select-fields)):

```typescript
const works = await Works()
  .filter({ publication_year: 2023 })
  .select(['id', 'title', 'doi'])
  .get();
console.log(works[0]); // { id: '...', title: '...', doi: '...' }
```

### sample

Sample random entities ([Sample Entity Lists](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/sample-entity-lists)):

```typescript
const works = await Works()
  .sample(50, 123)
  .get();
console.log(works.length); // 50 random works
```

### groupBy

Group results by a field ([Group Works](https://docs.openalex.org/api-entities/works/group-works)):

```typescript
const groups = await Works()
  .filter({ type: 'dataset' })
  .groupBy('institutions.country_code')
  .get();
console.log(groups); // Dataset counts by country
```

### get

Fetch results without metadata ([Get Lists of Entities](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities)):

```typescript
const works = await Works()
  .filter({ is_oa: true })
  .get();
console.log(works.length);
```

### getWithMeta

Fetch results with metadata ([Get Lists of Entities](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities)):

```typescript
const { results, meta } = await Works()
  .filter({ publication_year: 2023 })
  .getWithMeta();
console.log(meta.count); // Total matching works
```

### count

Count matching entities without fetching results ([Get Lists of Entities](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities)):

```typescript
const count = await Works()
  .filter({ publication_year: 2023 })
  .count();
console.log(count); // e.g., 10338153
```

### random

Get a random entity ([Random Result](https://docs.openalex.org/how-to-use-the-api/get-single-entities/random-result)):

```typescript
const work = await Works().random();
console.log(work.title);
```

### fetchById

Retrieve an entity by ID or list of IDs ([Get Single Entities](https://docs.openalex.org/how-to-use-the-api/get-single-entities)):

```typescript
const work = await Works().fetchById('W2741809807');
console.log(work.title);

const multipleWorks = await Works().fetchById(['W2741809807', 'W3128349626']);
console.log(multipleWorks.length); // 2 works
```

### paginate

Paginate results using cursor or page-based methods ([Paging](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/paging)):

```typescript
const pager = Works()
  .filter({ 'title_and_abstract.search': 'machine learning' })
  .paginate('cursor', 100, null);

for await (const page of pager) {
  console.log(`Fetched ${page.length} works`);
}
```

### autocomplete

Autocomplete entity names ([Autocomplete Entities](https://docs.openalex.org/how-to-use-the-api/get-lists-of-entities/autocomplete-entities)):

```typescript
const results = await Institutions().autocomplete('stockholm resilience');
console.log(results.results); // [{ id: '...', display_name: 'Stockholm Resilience Centre' }, ...]
```

### serialize

Save results to JSON ([Serialization](#)):

```typescript
import { writeFileSync } from 'fs';

const works = await Works().get();
const json = Works().serialize(works);
writeFileSync('works.json', json);
```

### deserialize

Load results from JSON ([Serialization](#)):

```typescript
import { readFileSync } from 'fs';

const json = readFileSync('works.json', 'utf-8');
const works = Works().deserialize(json);
console.log(works.length);
```

### resetQuery

Clear the query state for a fresh query ([Query State Management](#)):

```typescript
const works = openAlex.getWork();
await works.filter({ publication_year: 2023 }).get();
works.resetQuery(); // Clears filters
const newWorks = await works.get(); // No filters applied
```

### close

Close the connection and reset state ([Session Management](#session-management)):

```typescript
works.close(); // Terminates session and clears query state
```

## Advanced Use Case: Citation Network Analysis

Analyze the citation network of a work:

```typescript
const work = await Works().fetchById('W2741809807');

// Get cited works (outgoing citations)
const referencedWorks = await Works().fetchById(work.referenced_works);
console.log('Cited Works:', referencedWorks.map(w => w.title));

// Get citing works (incoming citations)
const citingWorks = await Works()
  .filter({ cites: 'W2741809807' })
  .sort('publication_year', 'desc')
  .get();
console.log('Citing Works:', citingWorks.map(w => w.title));
```

## Contributing

We welcome contributions to enhance `openalex-ts`! 
Report bugs, request features, or ask questions via the [Issue Tracker](https://github.com/ImpulsiveLabs/openalex-ts/issues).

## License

[MIT](https://github.com/ImpulsiveLabs/openalex-ts/blob/main/LICENSE)

## Contact

`openalex-ts` is a community-driven project, not affiliated with OpenAlex. For support or collaboration, reach out via the [Issue Tracker](https://github.com/ImpulsiveLabs/openalex-ts/issues) or email [vladimir.nitu.business@outlook.com](mailto:vladimir.nitu.business@outlook.com).

A special thank you to the [PyAlex](https://github.com/J535D165/pyalex) team, [J535D165](https://github.com/J535D165) and all the individual contributors, for their inspiring work on a Python client for OpenAlex, which provided valuable ideas for some features in `openalex-ts`.

Maintained by [Vladimir Nitu](https://www.linkedin.com/in/vladimir-nitu-antonie-763b45172/).