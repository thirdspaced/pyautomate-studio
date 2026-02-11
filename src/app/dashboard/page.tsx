// src/app/dashboard/page.tsx
import { getCurriculum, getAllLessonIds } from '@/lib/curriculum-loader';
import { ModuleCard } from '@/components/progress/ModuleCard';

export default async function DashboardPage() {
  const curriculum = await getCurriculum();
  const availableIds = new Set(await getAllLessonIds());

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {curriculum.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Learn Python by building real automation projects. Pick a module to start.
        </p>
      </div>

      {/* Module Grid */}
      <div className="grid gap-5">
        {curriculum.modules.map((mod) => {
          const allIds = [...mod.lessons, ...mod.portfolioProjects];
          const available = allIds.filter((id) => availableIds.has(id));

          return (
            <ModuleCard
              key={mod.id}
              moduleId={mod.id}
              title={mod.title}
              description={mod.description}
              order={mod.order}
              lessonIds={mod.lessons}
              portfolioIds={mod.portfolioProjects}
              availableCount={available.length}
              totalCount={allIds.length}
            />
          );
        })}
      </div>
    </div>
  );
}
