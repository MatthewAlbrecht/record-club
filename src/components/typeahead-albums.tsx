import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon, Check, PlusIcon, Search } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { InsertAlbum, type SelectAlbum } from "~/server/db/schema";
import { useDebouncedState } from "~/lib/hooks/useDebouncedState";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { useZodForm } from "~/lib/hooks/useZodForm";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Calendar } from "./ui/calendar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { useAction } from "next-safe-action/hooks";
import { createAlbum } from "~/server/api/album-actions";
import { toast } from "sonner";

export function TypeaheadAlbums({
  selected,
  setSelected,
}: {
  selected?: SelectAlbum;
  setSelected: (album: SelectAlbum) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useDebouncedState("", 300);
  const [addedAlbums, setAddedAlbums] = useState<SelectAlbum[]>([]);

  const { data } = useAlbumsQuery({ search });

  function handleInputChange(value: string) {
    setValue(value);
    setSearch(value);
  }

  function handleAlbumAdd(album: SelectAlbum) {
    setSearch(album.title);
    setValue(album.title);
    setSelected(album);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[300px] justify-between"
        >
          {selected ? selected.title : "Select album..."}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search framework..."
            value={value}
            onValueChange={handleInputChange}
          />
          <CommandList key={JSON.stringify(data)}>
            <EmptyCommandList onAlbumAdd={handleAlbumAdd} />
            {data?.albums && data.albums.length > 0 && (
              <CommandGroup>
                {data?.albums.map((album) => (
                  <CommandItem
                    key={album.id}
                    value={album.id.toString()}
                    onSelect={(currentValue) => {
                      setSelected(album);
                      setValue(currentValue === value ? "" : album.title);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === album.title ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {album.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const createAlbumSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  releaseDate: z.string().optional(),
});

type CreateAlbumForm = z.infer<typeof createAlbumSchema>;

function EmptyCommandList({
  onAlbumAdd,
}: {
  onAlbumAdd?: (album: SelectAlbum) => void;
}) {
  const [open, setOpen] = useState(false);

  const form = useZodForm<CreateAlbumForm>({
    schema: createAlbumSchema,
    defaultValues: {
      title: "",
      artist: "",
    },
  });

  const { execute } = useAction(createAlbum, {
    onSuccess: ({ data }) => {
      toast.success(`${data?.album.title} added`);
      setOpen(false);
      onAlbumAdd?.(data!.album);
    },
    onError: ({ error }) => {
      if (typeof error.serverError === "string") {
        toast.error(error.serverError);
      } else {
        toast.error("Error adding album");
      }
    },
  });

  function onSubmit(data: CreateAlbumForm) {
    execute({
      title: data.title,
      artist: data.artist,
      releaseDate: data.releaseDate,
    });
  }

  return (
    <CommandEmpty className="p-0">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div className="flex w-full cursor-pointer items-center justify-center p-6">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create new album
          </div>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create new album</SheetTitle>
            <SheetDescription>
              Create a new album to add to your club.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                id="create-album-form"
              >
                <FormField
                  name="title"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="artist"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="releaseDate"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="date"
                            {...field}
                            className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:p-3 [&::-webkit-calendar-picker-indicator]:opacity-0"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <CalendarIcon className="h-5 w-5 text-foreground" />
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
          <SheetFooter className="flex flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline" className="w-[min-content]">
                Cancel
              </Button>
            </SheetClose>
            <Button
              className="w-[min-content]"
              type="submit"
              form="create-album-form"
            >
              Submit
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </CommandEmpty>
  );
}

type AlbumsQueryVariables = {
  search?: string;
};

function useAlbumsQuery(
  { search }: AlbumsQueryVariables,
  options?: Omit<
    UseQueryOptions<{ albums: SelectAlbum[] }>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: ["albums", search],
    queryFn: () => {
      return fetch(`/api/albums?search=${search}`).then((res) => res.json());
    },
    ...options,
  });
}