import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import { UpdateTotalBudgetAction } from './components/documentActions'

export default defineConfig({
  name: 'default',
  title: 'ssapp',

  projectId: 'e63ldsc8',
  dataset: 'materials',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev, { schemaType }) => {
      if (schemaType === 'project') {
        return [...prev, UpdateTotalBudgetAction] // Add custom action to projects
      }
      return prev
    },
  },
})
