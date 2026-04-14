import { createJSONATAFilter } from './index.ts';

describe('filters/jsonata', () => {
  const filter = createJSONATAFilter();

  it.each([
    {
      input: { a: 1, b: 2 },
      expression: '$',
      expected: { a: 1, b: 2 },
    },
    {
      input: { a: 1, b: 2 },
      expression: '$.a',
      expected: 1,
    },
    {
      input: { a: 1, b: 2 },
      expression: '$.c',
      expected: undefined,
    },
    {
      input: { a: 1, b: 2 },
      expression: '$.a + $.b',
      expected: 3,
    },
  ])(
    'should evaluate jsonata expression with primitives expected',
    async ({ input, expression, expected }) => {
      await expect(filter.filter(input, expression)).resolves.toEqual(expected);
    },
  );

  it.each([
    {
      input: [{ a: 1 }, { a: 2 }],
      expression: 'a',
      expected: [1, 2],
    },
    {
      input: [
        { metadata: { annotations: { 'github.com/project-slug': 'foo' } } },
        { metadata: { annotations: { 'github.com/project-slug': 'bar' } } },
      ],
      expression: 'metadata.annotations."github.com/project-slug"',
      expected: ['foo', 'bar'],
    },
    {
      input: [
        { metadata: { annotations: { 'github.com/project-slug': 'foo' } } },
        { metadata: { annotations: { 'github.com/project-slug': 'bar' } } },
      ],
      expression: '$sort(metadata.annotations."github.com/project-slug")',
      expected: ['bar', 'foo'],
    },
  ])(
    'should evaluate jsonata expression with arrays',
    async ({ input, expression, expected }) => {
      // fixing test error `Received: serializes to the same string`
      const result = await filter.filter(input, expression);
      const normalized = Array.isArray(result) ? [...result] : result;
      expect(normalized).toEqual(expected);
    },
  );
});
