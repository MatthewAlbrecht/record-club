import { CalendarIcon, ChevronDown, ChevronDownIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { DayPicker } from "react-day-picker";

export function DatePicker({
  triggerLabel,
  value,
  onSelect,
  calendarProps,
}: {
  triggerLabel: string;
  value: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  calendarProps?: Omit<React.ComponentProps<typeof DayPicker>, "mode">;
}) {
  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {triggerLabel}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          initialFocus
          fromDate={new Date()}
          showOutsideDays={false}
          onSelect={onSelect}
          {...calendarProps}
          selected={value}
        />
      </PopoverContent>
    </Popover>
  );
}
