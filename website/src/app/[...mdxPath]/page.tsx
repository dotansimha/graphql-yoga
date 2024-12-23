import { NextPageProps } from '@theguild/components';
import { generateStaticParamsFor, importPage } from '@theguild/components/pages';
import { useMDXComponents } from '../../mdx-components.js';

export const generateStaticParams = generateStaticParamsFor('mdxPath');

export async function generateMetadata(props: NextPageProps<'...mdxPath'>) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = useMDXComponents().wrapper;

// eslint-disable-next-line import/no-default-export
export default async function Page(props: NextPageProps<'...mdxPath'>) {
  const params = await props.params;
  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;
  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
