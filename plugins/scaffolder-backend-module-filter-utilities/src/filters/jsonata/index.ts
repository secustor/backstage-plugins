import { createTemplateFilter } from '@backstage/plugin-scaffolder-node/alpha';
import jsonata from 'jsonata';

export function createJSONATAFilter() {
  return createTemplateFilter({
    id: 'jsonata',
    description:
      'Takes a jsonata expression and evaluates it and returns the result',
    schema: z =>
      z
        .function()
        .args(
          z.unknown().describe('input'),
          z.string().describe('jsonata expression'),
        )
        .returns(z.unknown()),
    filter: async (input: unknown, expression: string): Promise<unknown> => {
      const compiled = jsonata(expression);
      return compiled.evaluate(input);
    },
    examples: [
      {
        example: 'jsonata(myObject, "$.a")',
        description:
          "extract the value of the key 'a' from the object 'myObject'",
      },
      {
        example: 'jsonata(myArray, "a")',
        description:
          "extract the values of the key 'a' from the array 'myArray'",
      },
      {
        example: 'jsonata(myArray, "$sum($.a)")',
        description: "sum the values of the key 'a' from the array 'myArray'",
      },
      {
        example: 'jsonata(myArray, "$sort($.a)")',
        description: "sort the array 'myArray' by the values of the key 'a'",
      },
    ],
  });
}
