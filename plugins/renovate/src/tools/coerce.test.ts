import { coerceFilter } from './coerce';

describe('coerce', () => {
  describe('coerceFilter', () => {
    it.each`
      input                   | expected                | description
      ${'single-string'}      | ${['single-string']}    | ${'string to array'}
      ${['already', 'array']} | ${['already', 'array']} | ${'array unchanged'}
      ${undefined}            | ${undefined}            | ${'undefined unchanged'}
      ${''}                   | ${['']}                 | ${'empty string to array'}
      ${[]}                   | ${[]}                   | ${'empty array unchanged'}
      ${['single-item']}      | ${['single-item']}      | ${'single item array unchanged'}
    `(
      'should coerce $description: $input -> $expected',
      ({ input, expected }) => {
        expect(coerceFilter(input)).toEqual(expected);
      },
    );
  });
});
