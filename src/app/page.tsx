import { redirect } from 'next/navigation';

import { MarketingHome } from '../components/marketing/MarketingHome';
import { getServerAuthSession } from '../lib/auth/session';

export default async function Home() {
  const session = await getServerAuthSession();

  if (session?.user?.id) {
    redirect('/today');
  }

  return <MarketingHome />;
}
