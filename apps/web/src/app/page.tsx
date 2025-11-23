import { TopNavbar } from '@/components/TopNavbar';
import { ProjectsList } from '@/components/ProjectsList';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNavbar />
      <ProjectsList />
    </div>
  );
}
