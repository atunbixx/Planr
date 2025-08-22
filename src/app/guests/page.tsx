'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react"

const guests = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    rsvp: "Accepted",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    rsvp: "Pending",
  },
  {
    id: 3,
    name: "Peter Jones",
    email: "peter.jones@example.com",
    rsvp: "Declined",
  },
];

export default function GuestsPage() {
  const [guestList, setGuestList] = useState(guests);

  return (
    <div className="p-4 md:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Guest List</CardTitle>
                <CardDescription>Manage your wedding guests.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Button>Add Guest</Button>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>RSVP</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guestList.map((guest) => (
                            <TableRow key={guest.id}>
                                <TableCell>{guest.name}</TableCell>
                                <TableCell>{guest.email}</TableCell>
                                <TableCell>{guest.rsvp}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
