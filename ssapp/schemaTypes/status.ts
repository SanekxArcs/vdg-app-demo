import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'status',
  title: 'Status',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'string' }),
  ],
})