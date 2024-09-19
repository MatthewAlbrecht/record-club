"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  QuestionCategory,
  SelectAnswer,
  SelectClubQuestion,
  SelectQuestion,
  SelectUserClubAlbumProgress,
} from "~/server/db/schema";
import { DataTable } from "./data-table";

export function TableClubAlbumStats({
  clubQuestions,
  userProgressions,
}: {
  clubQuestions: (SelectClubQuestion & { question: SelectQuestion })[];
  userProgressions: (SelectUserClubAlbumProgress & {
    answers: SelectAnswer[];
  })[];
}) {
  const questionIdToCategoryMap = clubQuestions.reduce(
    (acc, question) => {
      acc[question.questionId] = question.question.category;
      return acc;
    },
    {} as Record<number, QuestionCategory>,
  );

  let columns: ColumnDef<
    SelectUserClubAlbumProgress & { answers: SelectAnswer[] }
  >[] = clubQuestions.map((question) => ({
    accessorKey: question.questionId.toString(),
    header: question.question.text,
    cell: ({ row }) => {
      if (question.question.category === "color-picker") {
        return (
          <div
            className="flex h-10 w-10"
            style={{
              backgroundColor: row.getValue(question.questionId.toString()),
            }}
          />
        );
      }

      return row.getValue(question.questionId.toString());
    },
  }));

  columns.unshift({
    accessorKey: "userId",
    header: "User",
  });

  console.log("columns", columns);

  const normalizedData = userProgressions.map((userProgression) => {
    return {
      ...userProgression,
      ...createAnswerMap(userProgression.answers),
    };
  });

  function createAnswerMap(answers: SelectAnswer[]) {
    return answers.reduce(
      (acc, answer) => {
        acc[answer.questionId] = getValue(answer);
        return acc;
      },
      {} as Record<number, string>,
    );
  }

  function getValue(answer: SelectAnswer) {
    const category = questionIdToCategoryMap[answer.questionId];

    switch (category) {
      case "short-answer":
        return answer.answerShortText!;
      case "long-answer":
        return answer.answerLongText!;
      case "true-false":
        return answer.answerBoolean!.toString();
      case "number":
        return answer.answerNumber!.toString();
      case "color-picker":
        return answer.answerColor!;
      default:
        return "";
    }
  }

  console.log("normalizedData", normalizedData);
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={normalizedData} />
    </div>
  );
}
