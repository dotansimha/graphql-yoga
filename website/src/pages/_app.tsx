import type { AppProps } from 'next/app';
import '@theguild/components/style.css';

// eslint-disable-next-line import/no-default-export
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
