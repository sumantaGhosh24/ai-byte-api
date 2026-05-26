import { prisma } from "../../config/db";
import { generateCourseWithAIService } from "../../services/course.service";
import { deleteCache, deleteManyCache, getKeys } from "../../utils/cache";
import { redisKeys } from "../../utils/redisKeys";
import { inngest } from "../client";

const generateCourse = inngest.createFunction(
  {
    id: "generate-ai-course",
    triggers: { event: "course/generate.requested" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { topic, difficulty, lessonCount, courseId } = event.data;

    try {
      const aiCourse = await step.run(
        "generate-course-ai-content",
        async () => {
          return await generateCourseWithAIService({
            topic,
            difficulty,
            lessonCount,
          });
        }
      );

      await step.run("save-course-content", async () => {
        const course = await prisma.course.update({
          where: { id: courseId },
          data: {
            title: aiCourse.title,
            description: aiCourse.description,
            duration: `${lessonCount * 10} mins`,
            difficulty,
            status: "processing",
          },
        });

        await prisma.lesson.createMany({
          data: aiCourse.lessons.map((lesson, index) => ({
            courseId: course.id,
            title: lesson.title,
            content: `# Summary ${lesson.summary} # Content ${lesson.content}`,
            duration: lesson.duration,
            difficulty,
            visibility: "private",
            status: "completed",
            orderIndex: index + 1,
            aiGenerated: true,
          })),
        });

        const quiz = await prisma.quiz.create({
          data: {
            courseId: course.id,
            title: aiCourse.quiz.title,
            description: aiCourse.quiz.description,
            difficulty,
            visibility: "private",
            status: "completed",
            aiGenerated: true,
            passingScore: 70,
          },
        });

        for (const question of aiCourse.quiz.questions) {
          const correctAnswer =
            question.options.find(o => o.isCorrect)?.text || "";

          const createdQuestion = await prisma.question.create({
            data: {
              quizId: quiz.id,
              question: question.question,
              explanation: question.explanation,
              correctAnswer,
              difficulty,
              visibility: "private",
              status: "completed",
              aiGenerated: true,
            },
          });

          await prisma.questionOption.createMany({
            data: question.options.map(option => ({
              questionId: createdQuestion.id,
              text: option.text,
              isCorrect: option.isCorrect,
            })),
          });
        }

        await prisma.course.update({
          where: { id: course.id },
          data: { status: "completed" },
        });
      });

      const keys = await getKeys("courses:all:*");
      if (keys?.length) {
        await deleteManyCache(keys);
      }

      await deleteCache(redisKeys.course(courseId));

      return {
        success: true,
        courseId,
      };
    } catch (error) {
      await step.run("mark-course-failed", async () => {
        await prisma.course.update({
          where: { id: courseId },
          data: { status: "failed" },
        });
      });

      throw error;
    }
  }
);

export default generateCourse;
