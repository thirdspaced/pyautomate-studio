// src/app/lesson/[lessonId]/page.tsx
import { notFound } from 'next/navigation';
import { getLesson, getLessonNavigation, getCurriculum, getAllLessonIds } from '@/lib/curriculum-loader';
import { LessonView } from '@/components/lesson/LessonView';

interface Props {
  params: Promise<{ lessonId: string }>;
}

// Pre-build every lesson route at export time
export async function generateStaticParams() {
  const ids = await getAllLessonIds();
  return ids.map((lessonId) => ({ lessonId }));
}

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);

  if (!lesson) notFound();

  const nav = await getLessonNavigation(lessonId);
  const curriculum = await getCurriculum();
  const mod = curriculum.modules.find((m) => m.id === lesson.moduleId);

  return (
    <LessonView
      lesson={lesson}
      moduleTitle={mod?.title ?? ''}
      prevLessonId={nav.prev}
      nextLessonId={nav.next}
    />
  );
}
