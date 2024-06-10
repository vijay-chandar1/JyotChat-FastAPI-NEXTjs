"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import axios from "axios";
import { cn } from "./lib/utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

const frameworks = [
  {
    value: "cohere",
    label: "cohere",
  },
  {
    value: "openai",
    label: "openai",
  },
  {
    value: "llama",
    label: "llama",
  },
  {
    value: "gemini",
    label: "gemini",
  },
]

export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("cohere")
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select Model"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search Model..." />
          <CommandList>
            <CommandEmpty>No Model found.</CommandEmpty>
            <CommandGroup>
              {frameworks.map((framework) => (
                <CommandItem
                  key={framework.value}
                  value={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)

                    // Send the selected model to the backend
                    axios.post(`${BASE_URL}/select_model`, {
                      model: currentValue
                    })
                    .then(response => {
                      console.log('Model updated in the backend successfully!');
                    })
                    .catch((error) => {
                      console.error('Error updating model in the backend:', error);
                    });
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === framework.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {framework.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
