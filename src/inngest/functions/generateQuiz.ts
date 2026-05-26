import { prisma } from "../../config/db";
import { generateQuizWithAIService } from "../../services/quiz.service";
import { deleteCache, deleteManyCache, getKeys } from "../../utils/cache";
import { redisKeys } from "../../utils/redisKeys";
import { inngest } from "../client";

const generateQuiz = inngest.createFunction(
  {
    id: "generate-ai-quiz",
    triggers: { event: "quiz/generate.requested" },
    retries: 3,
  },

  async ({ event, step }) => {
    const { topic, difficulty, courseId, quizId, numberOfQuestions } =
      event.data;

    try {
      const aiQuiz = await step.run("generate-quiz-ai-content", async () => {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
        });

        return await generateQuizWithAIService({
          topic,
          difficulty,
          title: course?.title as string,
          description: course?.description as string,
          numberOfQuestions,
        });
      });

      await step.run("save-quiz-content", async () => {
        const quiz = await prisma.quiz.update({
          where: { id: quizId },
          data: {
            courseId,
            title: aiQuiz.title,
            description: aiQuiz.description,
            difficulty,
            visibility: "private",
            status: "completed",
            aiGenerated: true,
            passingScore: aiQuiz.passingScore,
          },
        });

        for (const question of aiQuiz.questions) {
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

        await prisma.quiz.update({
          where: { id: quiz.id },
          data: { status: "completed" },
        });
      });

      const keys = await getKeys(`courses:all:${courseId}:*`);
      if (keys?.length) {
        await deleteManyCache(keys);
      }

      await deleteCache(redisKeys.course(courseId));
      await deleteCache(redisKeys.lesson(quizId));

      return {
        success: true,
        quizId,
      };
    } catch (error) {
      await step.run("mark-quiz-failed", async () => {
        await prisma.quiz.update({
          where: { id: quizId },

          data: { status: "failed" },
        });
      });

      throw error;
    }
  }
);

export default generateQuiz;
