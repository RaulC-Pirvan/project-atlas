import { getServerSession } from 'next-auth/next';

import { authOptions } from './nextauth';

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
