import { createGraphQLError } from '@graphql-tools/utils';

interface GraphQLParams {
  operationName?: string;
  query?: string;
}

export function rootLevelQueryLimit({ maxRootLevelFields }: { maxRootLevelFields: number }) {
  return {
    onParams({ params }: unknown) {
      const { query, operationName } = params as GraphQLParams;

      if (operationName?.includes('IntrospectionQuery')) return true;

      const newQuery = formatQuery(query || '');
      const linesArray = newQuery.split('\n');

      let countLeadingSpacesTwo = 0;

      for (const line of linesArray) {
        const leadingSpaces = line?.match(/^\s*/)?.[0]?.length || 0;

        if (leadingSpaces === 4 && line[leadingSpaces] !== ')') {
          countLeadingSpacesTwo++;

          if (countLeadingSpacesTwo > maxRootLevelFields * 2) {
            throw createGraphQLError('Query is too complex.', {
              extensions: {
                http: {
                  spec: false,
                  status: 400,
                  headers: {
                    Allow: 'POST',
                  },
                },
              },
            });
          }
        }
      }

      return true;
    },
  };
}

function formatQuery(queryString: string) {
  queryString = queryString.replace(/^\s+/gm, '');

  let indentLevel = 0;
  let formattedString = '';

  for (let i = 0; i < queryString.length; i++) {
    const char = queryString[i];

    if (char === '{' || char === '(') {
      formattedString += char;
      indentLevel++;
      // formattedString += ' '.repeat(indentLevel * 4);
    } else if (char === '}' || char === ')') {
      indentLevel--;

      if (formattedString[formattedString.length - 1] !== '\n')
        formattedString = formattedString.trim().replace(/\n$/, '');

      if (char === ')') formattedString += char;

      if (char === '}') formattedString += '\n' + ' '.repeat(indentLevel * 4) + char;
    } else if (char === '\n') {
      if (queryString[i + 1] !== '\n' && queryString[i + 1] !== undefined) {
        formattedString += char + ' '.repeat(indentLevel * 4);
      }
    } else {
      formattedString += char;
    }
  }

  return formattedString;
}
