import { getDirectoryFromPath } from './path';

describe('getDirectoryFromPath', () => {
  it.each`
    filepath                    | expected
    ${undefined}                | ${undefined}
    ${''}                       | ${undefined}
    ${'catalog.yaml'}           | ${undefined}
    ${'file.txt'}               | ${undefined}
    ${'subdir/catalog.yaml'}    | ${'subdir'}
    ${'a/b/file.yaml'}          | ${'a/b'}
    ${'a/b/c/d/file.yaml'}      | ${'a/b/c/d'}
    ${'path/to/deep/file.json'} | ${'path/to/deep'}
  `(
    'should return $expected for filepath "$filepath"',
    ({ filepath, expected }) => {
      expect(getDirectoryFromPath(filepath)).toBe(expected);
    },
  );
});
