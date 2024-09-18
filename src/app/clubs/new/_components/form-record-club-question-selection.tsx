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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Separator } from "~/components/ui/separator";
import { useZodForm } from "~/lib/hooks/useZodForm";
import { selectClubQuestions } from "~/server/api/clubs-actions";
import { SelectQuestion } from "~/server/db/schema";
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
  clubId,
}: {
  questions: SelectQuestion[];
  clubId: number;
}) {
  const router = useRouter();

  const { execute } = useAction(selectClubQuestions, {
    onSuccess: () => {
      toast.success("Club activated");
      router.push(`/clubs/${clubId}`);
    },
  });

  const form = useZodForm<RecordClubQuestionSelectionForm>({
    schema: recordClubQuestionSelectionSchema,
    defaultValues: {
      questionIds: questions.map((q) => q.id),
    },
  });

  const onSubmit = (data: RecordClubQuestionSelectionForm) => {
    execute({
      questionIds: data.questionIds,
      clubId: clubId,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="mx-auto w-full max-w-3xl">
          <CardHeader>
            <CardTitle>Create a record club</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="questionIds"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">
                      Select questions
                    </FormLabel>
                  </div>
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
                            <FormLabel className="font-normal">
                              {question.text}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Activate club
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
