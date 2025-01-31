import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'ekipa',
  title: 'Ekipa',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
  ],
})