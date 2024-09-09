"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

export function FormRecordClubCreateSchedule({
  setStep,
  clubId,
}: {
  setStep: (step: number) => void;
  clubId: number | null;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  function handleSelect(date?: Date) {
    setSelectedDate(date);
  }

  return (
    <div>
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Add albums to the schedule</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          <Calendar
            mode="single"
            // today={undefined}
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={{ before: new Date() }}
          />
          <Separator />
          {selectedDate && (
            <div>
              <div className="space-y-2">
                <Label htmlFor="name">Add Album</Label>
                <Input required />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {selectedDate && (
            <Button type="submit" className="w-full">
              Create Club
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
