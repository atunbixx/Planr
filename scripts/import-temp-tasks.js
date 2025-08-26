#!/usr/bin/env node
/*
  Import tasks from temp-data/tasks.json into the database using Prisma.
  Usage: node scripts/import-temp-tasks.js
*/

const fs = require('fs')
const path = require('path')

async function main() {
  const { PrismaClient } = require('@prisma/client')
  const prisma = new PrismaClient()
  const file = path.join(process.cwd(), 'temp-data', 'tasks.json')

  if (!fs.existsSync(file)) {
    console.error('No temp-data/tasks.json found. Nothing to import.')
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw) || raw.length === 0) {
    console.log('No tasks to import.')
    process.exit(0)
  }

  let imported = 0
  for (const t of raw) {
    try {
      const mapped = {
        userId: t.userId,
        title: t.title,
        description: t.description || null,
        category: t.category || null,
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
        assignedTo: t.assignedTo || null,
        isTemplate: !!t.isTemplate,
        templateId: t.templateId || null,
        timeline: t.timeline || null,
        order: typeof t.order === 'number' ? t.order : null,
        // tags is String? in schema; store JSON string if array
        tags: Array.isArray(t.tags) ? JSON.stringify(t.tags) : (t.tags ?? null),
        notes: t.notes || null,
      }

      await prisma.task.upsert({
        where: { id: t.id || 'missing_id' },
        update: mapped,
        create: { id: t.id, ...mapped },
      })
      imported++
    } catch (e) {
      console.error('Failed to import task', t.id, e.message)
    }
  }

  await prisma.$disconnect()
  console.log(`Imported ${imported} task(s) from temp-data.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

