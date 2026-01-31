import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { UserListQuery } from "@workspace/types";

interface SearchFilterControlsProps {
  filters: UserListQuery;
  onFiltersChange: (filters: Partial<UserListQuery>) => void;
}

export function SearchFilterControls({
  filters,
  onFiltersChange,
}: SearchFilterControlsProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");

  // Sync local state when URL/filters change externally (back button, direct URL edit)
  useEffect(() => {
    setSearchValue(filters.search || "");
  }, [filters.search]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ search: searchValue || undefined, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters.search, onFiltersChange]);

  const handleRoleChange = (value: string) => {
    onFiltersChange({
      role: value === "ALL" ? undefined : (value as UserListQuery["role"]),
      page: 1,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      status: value === "ALL" ? undefined : (value as UserListQuery["status"]),
      page: 1,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={filters.role || "ALL"}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "ALL"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SUSPENDED">Deactivated</SelectItem>
            <SelectItem value="INVITED">Invited</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
