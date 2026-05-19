import { db } from "../../db";
import { courses, lessons, quizzes } from "../../db/schema";
import { generateCourseWithAI } from "../../services/course.service";
import { inngest } from "../client";

const generateCourse = inngest.createFunction(
  {
    id: "generate-ai-course",
    triggers: { event: "course/generate.requested" },
  },

  async ({ event, step }) => {
    const { topic, difficulty, lessonCount } = event.data;

    const aiCourse = await step.run("generate-course-content", async () => {
      return await generateCourseWithAI({
        topic,
        difficulty,
        lessonCount,
      });
    });

    const insertedCourse = await step.run("save-course", async () => {
      const created = await db
        .insert(courses)
        .values({
          title: aiCourse.title,
          difficulty,
          duration: `${lessonCount * 600}`,
          xpReward: lessonCount * 50,
          categoryId: "",
          description: "",
          status: "processing",
          visibility: "private",
        })
        .returning();

      return created[0];
    });

    for (let i = 0; i < aiCourse.lessons.length; i++) {
      const lesson = aiCourse.lessons[i];

      await db
        .insert(lessons)
        .values({
          courseId: insertedCourse.id,
          title: lesson.title,
          orderIndex: i + 1,
          content: "",
          status: "pending",
          visibility: "public",
          xpReward: 50,
          duration: "600",
        })
        .returning();

      await db.insert(quizzes).values({
        courseId: insertedCourse.id,
        // question: lesson.quizQuestion,
        // options: lesson.options,
        // correctAnswer: lesson.correctAnswer,
        // explanation: lesson.explanation,
        description: "",
        difficulty: "intermediate",
        title: "something",
      });
    }

    return {
      success: true,
    };
  }
);

export default generateCourse;
