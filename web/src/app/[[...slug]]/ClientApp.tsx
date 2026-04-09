'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('../../App'), {
  ssr: false,
  loading: () => <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>Loading...</div>,
});

export default function ClientApp() {
  return <App />;
}
