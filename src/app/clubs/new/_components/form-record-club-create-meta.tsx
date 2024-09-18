"use client";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { createClub } from "~/server/api/clubs-actions";
import { toast } from "sonner";
import { parseAsInteger, useQueryState } from "nuqs";

export const createClubSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),
});

export type CreateClubForm = z.infer<typeof createClubSchema>;

export function FormRecordClubCreateMeta() {
  const [, setStep] = useQueryState("step", parseAsInteger.withDefault(1));
  const [, setClubId] = useQueryState("clubId", parseAsInteger);

  const form = useForm({
    defaultValues: {
      name: "",
      shortDescription: "",
      longDescription: "",
    },
    resolver: zodResolver(createClubSchema),
  });

  const { execute } = useAction(createClub, {
    onSuccess({ data }) {
      if (!data) {
        return;
      }
      toast.success("Club created successfully");
      void setClubId(data.club.id);
      void setStep(2);
    },
  });

  function onSubmit(data: CreateClubForm) {
    execute(data);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create a record club</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Club Details Group */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Club Details</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Club Name</Label>
              <Input required {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Textarea
                id="shortDescription"
                {...form.register("shortDescription")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longDescription">Long Description</Label>
              <Textarea
                id="longDescription"
                {...form.register("longDescription")}
              />
            </div>
          </div>
          <Separator />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Create Club
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
