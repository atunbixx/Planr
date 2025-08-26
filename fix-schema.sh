#!/bin/bash

echo "🔧 Fixing Prisma schema for PostgreSQL..."

# Add @db.Uuid to all UUID fields
sed -i.bak 's/@id @default(uuid())/@id @default(uuid()) @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/String.*@db.Uuid/String        @db.Uuid/g' prisma/schema.prisma

# Add @db.Uuid to foreign key fields
sed -i.bak 's/userId       String/userId       String        @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/vendorId    String/vendorId    String   @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/adminUserId String/adminUserId String   @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/ownerUserId     String?/ownerUserId     String?  @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/duplicateOfId   String?/duplicateOfId   String?  @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/taskId      String/taskId      String     @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/assigneeId  String/assigneeId  String     @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/assignedBy  String/assignedBy  String     @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/tableId     String/tableId     String    @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/guestId     String?/guestId     String?   @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/inviteId   String/inviteId   String     @db.Uuid/g' prisma/schema.prisma
sed -i.bak 's/householdId    String?/householdId    String?   @db.Uuid/g' prisma/schema.prisma

# Add @db.Decimal to decimal fields
sed -i.bak 's/Decimal/Decimal      @db.Decimal(10, 2)/g' prisma/schema.prisma

# Add @db.SmallInt to rating fields
sed -i.bak 's/rating       Int?/rating       Int?          @db.SmallInt/g' prisma/schema.prisma
sed -i.bak 's/averageRating   Int?/averageRating   Int?     @db.SmallInt/g' prisma/schema.prisma

# Clean up backup file
rm -f prisma/schema.prisma.bak

echo "✅ Schema fixed for PostgreSQL compatibility"