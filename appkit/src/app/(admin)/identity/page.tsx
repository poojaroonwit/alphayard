import { redirect } from 'next/navigation';

export default function IdentityRootPage() {
    redirect('/identity/users');
}
