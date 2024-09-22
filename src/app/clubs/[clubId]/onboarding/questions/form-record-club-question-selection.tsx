"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { useZodForm } from "~/lib/hooks/useZodForm";
import { selectClubQuestions } from "~/server/api/clubs-actions";
import { SelectClub, SelectQuestion } from "~/server/db/schema";
import { toast } from "sonner";

const recordClubQuestionSelectionSchema = z.object({
  questionIds: z.array(z.number()).refine((value) => value.length > 0, {
    message: "You have to select at least one question.",
  }),
});

type RecordClubQuestionSelectionForm = z.infer<
  typeof recordClubQuestionSelectionSchema
>;

export function FormRecordClubQuestionSelection({
  questions,
  club,
}: {
  questions: SelectQuestion[];
  club: SelectClub;
}) {
  const router = useRouter();

  const { execute } = useAction(selectClubQuestions, {
    onSuccess: () => {
      toast.success("Club activated");
      router.push(`/clubs/${club.id}`);
    },
  });

  const form = useZodForm<RecordClubQuestionSelectionForm>({
    schema: recordClubQuestionSelectionSchema,
    defaultValues: {
      questionIds: questions.map((q) => q.id),
    },
  });

  function onSubmit(data: RecordClubQuestionSelectionForm) {
    execute({
      questionIds: data.questionIds,
      clubId: club.id,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <h1 className="text-base font-semibold leading-7 text-slate-900">
          Select questions
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          These questions will be asked to the club members after each album
          they listen to, and their answers will be public to all club members.
        </p>

        <FormField
          control={form.control}
          name="questionIds"
          render={() => (
            <FormItem>
              <div className="mt-12 flex flex-col gap-y-6">
                {questions.map((question) => (
                  <FormField
                    key={question.id}
                    control={form.control}
                    name="questionIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={question.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(question.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([
                                      ...field.value,
                                      question.id,
                                    ])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== question.id,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <div className="relative top-[2px] flex flex-col items-start gap-y-1.5">
                            <FormLabel className="font-semibold">
                              {question.label}
                            </FormLabel>
                            <FormDescription className="block">
                              {question.text}
                            </FormDescription>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator className="my-12 border-slate-900/10" />
        <div className="flex items-center justify-end gap-x-6">
          <Button type="submit">Activate club</Button>
        </div>
      </form>
    </Form>
  );
}
