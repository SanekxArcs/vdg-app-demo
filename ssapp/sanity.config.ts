import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'ssapp',

  projectId: 'e63ldsc8',
  dataset: 'materials',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
