"use client";

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
import { Check, Search } from "lucide-react";
import { cn } from "~/lib/utils";
import { useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { type SelectAlbum } from "~/server/db/schema";
import { useDebouncedState } from "~/lib/hooks/useDebouncedState";

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

  const { data } = useAlbumsQuery({ search });

  function handleInputChange(value: string) {
    setValue(value);
    setSearch(value);
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
            <CommandEmpty>No albums found.</CommandEmpty>
            {data?.albums.length && (
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
