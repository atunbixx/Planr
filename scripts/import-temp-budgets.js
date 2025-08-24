#!/usr/bin/env node
/*
  Import budget items from temp-data/budgets.json into the database using Prisma.
  Usage: node scripts/import-temp-budgets.js
*/

const fs = require('fs')
const path = require('path')

async function main() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const file = path.join(process.cwd(), 'temp-data', 'budgets.json')

  if (!fs.existsSync(file)) {
    console.error('No temp-data/budgets.json found. Nothing to import.')
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw) || raw.length === 0) {
    console.log('No budget items to import.')
    process.exit(0)
  }

  let imported = 0
  for (const item of raw) {
    try {
      // Upsert by id if exists, else create new
      await prisma.budgetItem.upsert({
        where: { id: item.id || 'missing_id' },
        update: {
          userId: item.userId,
          category: item.category,
          name: item.name || item.category,
          description: null,
          budgetedAmount: Number(item.allocated ?? item.amount ?? 0),
          actualAmount: Number(item.actual ?? 0),
          currency: 'NGN',
          priority: 'MEDIUM',
          vendorId: null,
          dueDate: null,
          isPaid: item.status === 'paid',
          paymentDate: null,
          notes: null,
        },
        create: {
          id: item.id, // preserve id if present
          userId: item.userId,
          category: item.category,
          name: item.name || item.category,
          description: null,
          budgetedAmount: Number(item.allocated ?? item.amount ?? 0),
          actualAmount: Number(item.actual ?? 0),
          currency: 'NGN',
          priority: 'MEDIUM',
          vendorId: null,
          dueDate: null,
          isPaid: item.status === 'paid',
          paymentDate: null,
          notes: null,
        }
      })
      imported++
    } catch (e) {
      console.error('Failed to import item', item.id, e.message)
    }
  }

  await prisma.$disconnect()
  console.log(`Imported ${imported} budget item(s) from temp-data.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

