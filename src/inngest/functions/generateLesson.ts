import { prisma } from "../../config/db";
import { generateLessonWithAIService } from "../../services/lesson.service";
import { deleteCache, deleteManyCache, getKeys } from "../../utils/cache";
import { redisKeys } from "../../utils/redisKeys";
import { inngest } from "../client";

const generateLesson = inngest.createFunction(
  {
    id: "generate-ai-lesson",
    triggers: { event: "lesson/generate.requested" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { topic, difficulty, courseId, lessonId } = event.data;

    try {
      const aiLesson = await step.run(
        "generate-lesson-ai-content",
        async () => {
          const course = await prisma.course.findUnique({
            where: { id: courseId },
          });

          return await generateLessonWithAIService({
            topic,
            difficulty,
            title: course?.title as string,
            description: course?.description as string,
          });
        }
      );

      await step.run("save-lesson-content", async () => {
        const lesson = await prisma.lesson.update({
          where: { id: lessonId },
          data: {
            courseId,
            title: aiLesson.title,
            content: `# Summary 
            ${aiLesson.summary} 
            # Content 
            ${aiLesson.content}`,
            duration: aiLesson.duration,
            difficulty,
            visibility: "private",
            status: "completed",
            orderIndex: 1,
            aiGenerated: true,
          },
        });

        await prisma.lesson.update({
          where: { id: lesson.id },
          data: { status: "completed" },
        });
      });

      const keys = await getKeys(`lessons:all:${courseId}:*`);
      if (keys?.length) {
        await deleteManyCache(keys);
      }

      await deleteCache(redisKeys.course(courseId));
      await deleteCache(redisKeys.lesson(lessonId));

      return {
        success: true,
        lessonId,
      };
    } catch (error) {
      await step.run("mark-lesson-failed", async () => {
        await prisma.lesson.update({
          where: { id: lessonId },

          data: { status: "failed" },
        });
      });

      throw error;
    }
  }
);

export default generateLesson;
