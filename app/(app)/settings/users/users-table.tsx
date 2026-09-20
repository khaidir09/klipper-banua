"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InternalRole } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format/date";
import { setUserActiveAction, updateUserRoleAction } from "../actions";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: InternalRole;
  is_active: boolean;
  created_at: string;
};

export function UsersTable({
  profiles,
  currentUserId,
  timezone,
}: {
  profiles: UserRow[];
  currentUserId: string;
  timezone: string;
}) {
  const [isPending, startTransition] = useTransition();

  function changeRole(userId: string, role: InternalRole) {
    startTransition(async () => {
      const result = await updateUserRoleAction({ user_id: userId, role });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function toggleActive(userId: string, isActive: boolean) {
    startTransition(async () => {
      const result = await setUserActiveAction({ user_id: userId, is_active: isActive });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Peran</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Bergabung</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => {
            const isSelf = profile.id === currentUserId;
            return (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">
                  {profile.full_name || <span className="text-muted-foreground">Belum diisi</span>}
                  {isSelf ? (
                    <span className="ml-1 text-xs text-muted-foreground">(Anda)</span>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">{profile.email}</TableCell>
                <TableCell>
                  {isSelf ? (
                    <Badge variant="secondary">
                      {profile.role === "owner" ? "Owner" : "Manager"}
                    </Badge>
                  ) : (
                    <NativeSelect
                      size="sm"
                      aria-label={`Peran ${profile.email}`}
                      value={profile.role}
                      disabled={isPending}
                      onChange={(event) =>
                        changeRole(profile.id, event.target.value as InternalRole)
                      }
                    >
                      <NativeSelectOption value="manager">Manager</NativeSelectOption>
                      <NativeSelectOption value="owner">Owner</NativeSelectOption>
                    </NativeSelect>
                  )}
                </TableCell>
                <TableCell>
                  {profile.is_active ? (
                    <Badge>Aktif</Badge>
                  ) : (
                    <Badge variant="outline">Nonaktif</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDate(profile.created_at, timezone)}
                </TableCell>
                <TableCell className="text-right">
                  {isSelf ? null : (
                    <Button
                      size="sm"
                      variant={profile.is_active ? "outline" : "default"}
                      disabled={isPending}
                      onClick={() => toggleActive(profile.id, !profile.is_active)}
                    >
                      {profile.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
